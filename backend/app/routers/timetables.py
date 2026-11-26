"""Timetable master schedules router with CP-SAT generation, validation, and department scoping."""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, status, HTTPException
from app.models.entities import Timetable, TimetableStatus, SemesterType, UserRole, Subject, TimetableSlot
from app.schemas.entities import (
    TimetableCreate,
    TimetableUpdate,
    TimetableDraftSaveRequest,
    TimetableDraftSaveResponse,
    TimetableGenerationRequest,
    TimetableGenerationResponse,
    TimetableValidationResponse,
)
from app.repositories import (
    timetable_repository,
    timetable_slot_repository,
    subject_repository,
    allotment_repository,
    room_repository,
    lab_repository,
    faculty_repository,
    subject_preference_repository,
    fixed_classroom_repository,
)
from app.services.solver import timetable_solver
from app.services.validator import schedule_validator
from app.core.realtime import realtime_broadcaster
from app.core.dependencies import (
    require_coordinator_or_admin,
    get_optional_user_context,
    get_current_user_context,
    check_department_access,
    AuthContext,
)

router = APIRouter(prefix="/api/v1/timetables", tags=["Timetables"])


@router.post("/", response_model=Timetable, status_code=status.HTTP_201_CREATED)
async def create_timetable(
    payload: TimetableCreate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Initializes a master timetable container. Department optional for First Year."""
    if payload.department_id:
        check_department_access(auth_ctx, payload.department_id)
    created = await timetable_repository.create(payload.id, payload.model_dump())
    return created


@router.post("/draft", response_model=TimetableDraftSaveResponse)
@router.post("/{timetable_id}/draft", response_model=TimetableDraftSaveResponse)
async def save_timetable_draft(
    payload: TimetableDraftSaveRequest,
    timetable_id: Optional[str] = None,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """
    Saves a timetable container and its draft slot placements atomically to Firestore.
    Replaces any existing draft slots for this timetable to prevent orphaned placements.
    Enforces First Year rule (department_id = None).
    """
    if timetable_id and payload.timetable_id and timetable_id != payload.timetable_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Path timetable_id does not match request body timetable_id.",
        )

    effective_id = timetable_id or payload.timetable_id
    if not effective_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="timetable_id is required in path or request body",
        )

    # Enforce First Year rule: semesters 1-2 or cycle timetables must not carry an engineering department
    if payload.cycle and payload.semester not in (1, 2):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Cycle timetables are only valid for First Year (semesters 1 and 2).",
        )
    is_first_year = payload.semester in (1, 2) or bool(payload.cycle)
    if is_first_year and payload.department_id and str(payload.department_id).lower() not in (
        "dept_basic_science", "dept_firstyear", "firstyear", "first year", "none"
    ):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="First Year timetables must have department_id = null and cannot be assigned an engineering department.",
        )

    # Check department access if department_id is set
    if not is_first_year and payload.department_id:
        check_department_access(auth_ctx, payload.department_id)

    draft_data = {
        "academic_year": payload.academic_year,
        "semester": payload.semester,
        "semester_type": payload.semester_type,
        "department_id": None if is_first_year else payload.department_id,
        "section": payload.section,
        "status": payload.status,
    }

    placements_data = [p.model_dump() for p in payload.placements]

    result = await timetable_repository.save_draft_placements(
        timetable_id=effective_id,
        timetable_data=draft_data,
        placements=placements_data,
    )
    return result


@router.post("/generate", response_model=TimetableGenerationResponse)
async def generate_timetable(
    request: TimetableGenerationRequest,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """
    Automatic Timetable Generation using Google OR-Tools CP-SAT.

    1. Retrieves department subjects, active allotments, classrooms, and laboratories.
    2. Decomposes IPCC subjects into theory lectures and practical laboratory blocks.
    3. Divides practical subjects into two batches (B1, B2) if section strength exceeds lab capacity.
    4. Enforces hard constraints: no faculty double-booking, no room/lab collision, 2 consecutive lab periods.
    5. Preserves Dean-locked institutional assignments.
    6. Optimizes soft constraints: honors faculty ranked subject preferences (Rank 1 > 2 > 3).
    7. Saves generated timetable and slots to Firestore repositories.
    """
    if request.department_id:
        check_department_access(auth_ctx, request.department_id)

    clean_sec = request.section.replace("Section", "").strip()

    # 1. Fetch active allotments scoped strictly to this specific class
    allot_filters = {
        "academic_year": request.academic_year,
        "semester": request.semester,
    }
    all_allots = await allotment_repository.list_all(filters=allot_filters)
    # Match section and department
    allotments = [
        a for a in all_allots
        if a.get("section", "").replace("Section", "").strip().upper() == clean_sec.upper()
        and (not request.department_id or a.get("department_id") == request.department_id)
    ]

    # 2. Scope subjects strictly to those allocated or requested for this specific class
    subject_models = []
    if request.subject_ids:
        for s_id in request.subject_ids:
            s_data = await subject_repository.get_by_id(s_id)
            if s_data:
                subject_models.append(Subject(**s_data) if isinstance(s_data, dict) else s_data)
    elif allotments:
        allocated_sub_ids = list({a["subject_id"] for a in allotments if a.get("subject_id")})
        for s_id in allocated_sub_ids:
            s_data = await subject_repository.get_by_id(s_id)
            if s_data:
                subject_models.append(Subject(**s_data) if isinstance(s_data, dict) else s_data)

    # If no subjects are allocated to this class, reject rather than importing all unallocated catalog subjects
    if not subject_models:
        dept_str = f" in department '{request.department_id}'" if request.department_id else ""
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"No subjects have been allocated to class {request.academic_year} Sem {request.semester} Section {clean_sec}{dept_str}. "
                "Automatic timetable generation only includes subjects allocated to this class. "
                "Please allocate faculty to subjects for this section first."
            ),
        )

    # 3. Fetch rooms and labs
    raw_rooms = await room_repository.list_all(limit=100)
    raw_labs = await lab_repository.list_all(limit=100)
    from app.models.entities import Room, Lab
    rooms_list = [Room(**r) for r in raw_rooms] if raw_rooms else []
    labs_list = [Lab(**l) for l in raw_labs] if raw_labs else []

    # 4. Fetch finalized preferences for soft constraint optimization
    prefs = await subject_preference_repository.get_finalized_preferences_for_coordinator(
        department_id=request.department_id,
        academic_year=request.academic_year,
        semester=request.semester,
    )

    # 5. Fetch locked Dean institutional allotments
    locked_allotments = await allotment_repository.list_all(
        filters={"academic_year": request.academic_year, "is_locked": True}
    )
    locked_slots = []
    for l_alt in locked_allotments:
        locked_slots.append({
            "name": l_alt.get("lock_reason", "Dean Institutional Slot"),
            "day": "FRIDAY",
            "startPeriod": 6,
            "assignedFaculty": l_alt.get("faculty_id", "Institutional Faculty"),
            "venue": "Auditorium",
        })

    # 6. Fetch or provision fixed classroom for section theory courses
    fixed_clr = await fixed_classroom_repository.get_or_create_fixed_classroom(
        department_id=request.department_id,
        academic_year=request.academic_year,
        semester=request.semester,
        section=clean_sec,
    )
    fixed_room = Room(
        id=fixed_clr["classroom_id"],
        name=fixed_clr["classroom_name"],
        capacity=fixed_clr.get("capacity", 60),
        building_or_block="Main Academic Block",
        is_available=True,
        availability_status="AVAILABLE",
    )

    # 7. Run Google OR-Tools CP-SAT Solver
    response = timetable_solver.solve(
        request=request,
        subjects=subject_models,
        allotments=allotments,
        faculty_profiles={},
        rooms=rooms_list,
        labs=labs_list,
        institutional_locked_slots=locked_slots,
        faculty_preferences=prefs,
        fixed_classroom=fixed_room,
    )

    # 8. Persist timetable container and slots if solve succeeded
    if response.status in ("OPTIMAL", "FEASIBLE"):
        tt_id = response.timetable_id

        # Delete prior slots for this class timetable to prevent duplicate slots during regeneration
        old_slots = await timetable_slot_repository.list_all(filters={"timetable_id": tt_id})
        for os in old_slots:
            if os.get("id"):
                await timetable_slot_repository.delete(os["id"])

        await timetable_repository.create(
            doc_id=tt_id,
            data={
                "id": tt_id,
                "academic_year": request.academic_year,
                "semester_type": SemesterType.ODD.value if request.semester % 2 != 0 else SemesterType.EVEN.value,
                "department_id": request.department_id,
                "semester": request.semester,
                "section": clean_sec,
                "status": TimetableStatus.DRAFT.value,
                "generation_status": "GENERATED",
                "fixed_classroom_id": fixed_clr["classroom_id"],
                "solver_diagnostics": response.diagnostics,
            },
        )
        # Save slots
        for s in response.slots:
            slot_id = s.get("id")
            if slot_id:
                await timetable_slot_repository.create(doc_id=slot_id, data=s)

        realtime_broadcaster.broadcast(
            "TIMETABLE_SAVED",
            tt_id,
            {"timetable_id": tt_id, "department_id": request.department_id},
        )

    return response


@router.post("/{timetable_id}/validate", response_model=TimetableValidationResponse)
async def validate_timetable(
    timetable_id: str,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Runs complete constraint and clash validation on an existing timetable schedule."""
    tt = await timetable_repository.get_or_raise(timetable_id)
    check_department_access(auth_ctx, tt.get("department_id"))

    # Fetch slots for this timetable
    slots_data = await timetable_slot_repository.list_all(filters={"timetable_id": timetable_id})
    slots = [TimetableSlot(**s) for s in slots_data]

    # Fetch maps
    raw_subs = await subject_repository.list_all(limit=200)
    subs_map = {s["id"]: Subject(**s) for s in raw_subs}

    raw_rooms = await room_repository.list_all(limit=100)
    from app.models.entities import Room, Lab, FacultyProfile
    rooms_map = {r["id"]: Room(**r) for r in raw_rooms}

    raw_labs = await lab_repository.list_all(limit=100)
    labs_map = {l["id"]: Lab(**l) for l in raw_labs}

    raw_fac = await faculty_repository.list_all(limit=200)
    fac_map = {f["id"]: FacultyProfile(**f) for f in raw_fac}

    return schedule_validator.validate_slots(
        slots=slots,
        subjects_map=subs_map,
        faculty_map=fac_map,
        rooms_map=rooms_map,
        labs_map=labs_map,
    )


@router.get("/faculty/{faculty_id}", response_model=List[TimetableSlot])
async def get_faculty_master_timetable(
    faculty_id: str,
    auth_ctx: AuthContext = Depends(get_optional_user_context),
):
    """
    Retrieves complete schedule for an individual faculty member across all departments,
    sections, and semesters (e.g. Basic Science faculty teaching across Engineering sections).
    Non-coordinators only receive slots belonging to PUBLISHED timetables.
    """
    slots = await timetable_slot_repository.list_all(filters={"faculty_id": faculty_id})
    if not auth_ctx.is_coordinator:
        published_tts = await timetable_repository.list_all(
            filters={"status": TimetableStatus.PUBLISHED.value}, limit=500
        )
        published_ids = {t["id"] for t in published_tts if t.get("id")}
        return [s for s in slots if s.get("timetable_id") in published_ids]
    return slots


@router.get("/department/{department_id}", response_model=List[Timetable])
async def get_department_timetables(
    department_id: str,
    academic_year: Optional[str] = None,
    auth_ctx: AuthContext = Depends(get_optional_user_context),
):
    """Retrieves timetable schedules for a specific academic department with draft protection."""
    filters: Dict[str, Any] = {"department_id": department_id}
    if not auth_ctx.is_coordinator:
        filters["status"] = TimetableStatus.PUBLISHED.value
    elif not auth_ctx.is_admin:
        check_department_access(auth_ctx, department_id)
    if academic_year:
        filters["academic_year"] = academic_year
    return await timetable_repository.list_all(filters=filters)


@router.get("", response_model=List[Timetable], include_in_schema=False)
@router.get("/", response_model=List[Timetable])
async def list_timetables(
    academic_year: Optional[str] = None,
    department_id: Optional[str] = None,
    semester: Optional[int] = Query(default=None, ge=1, le=8),
    semester_type: Optional[SemesterType] = None,
    section: Optional[str] = None,
    status_filter: Optional[TimetableStatus] = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    auth_ctx: AuthContext = Depends(get_optional_user_context),
):
    """Lists timetable schedules with role-based draft filtering."""
    filters = {}
    if not auth_ctx.is_coordinator:
        filters["status"] = TimetableStatus.PUBLISHED.value
    elif status_filter:
        filters["status"] = status_filter.value

    if auth_ctx.is_coordinator and not auth_ctx.is_admin:
        target_dept = department_id or auth_ctx.department_id
        check_department_access(auth_ctx, target_dept)
        filters["department_id"] = auth_ctx.department_id
    elif department_id:
        filters["department_id"] = department_id

    if academic_year:
        filters["academic_year"] = academic_year
    if semester:
        filters["semester"] = semester
    if semester_type:
        filters["semester_type"] = semester_type.value
    if section:
        filters["section"] = section

    return await timetable_repository.list_all(filters=filters, limit=limit, offset=offset)


@router.get("/{timetable_id}", response_model=Timetable)
async def get_timetable(
    timetable_id: str,
    auth_ctx: AuthContext = Depends(get_optional_user_context),
):
    """Fetches a timetable by ID."""
    tt = await timetable_repository.get_or_raise(timetable_id)
    if not auth_ctx.is_coordinator and tt.get("status") != TimetableStatus.PUBLISHED.value:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Timetable '{timetable_id}' was not found or is currently in draft.",
        )
    if auth_ctx.is_coordinator:
        check_department_access(auth_ctx, tt.get("department_id"))
    return tt


@router.put("/{timetable_id}", response_model=Timetable)
async def update_timetable(
    timetable_id: str,
    payload: TimetableUpdate,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Updates timetable status (e.g. DRAFT -> PUBLISHED)."""
    existing = await timetable_repository.get_or_raise(timetable_id)
    check_department_access(auth_ctx, existing.get("department_id"))
    return await timetable_repository.update(timetable_id, payload.model_dump(exclude_unset=True))


@router.delete("/{timetable_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timetable(
    timetable_id: str,
    auth_ctx: AuthContext = Depends(require_coordinator_or_admin),
):
    """Deletes a draft timetable and cascades removal of child slots."""
    existing = await timetable_repository.get_or_raise(timetable_id)
    check_department_access(auth_ctx, existing.get("department_id"))
    await timetable_repository.delete(timetable_id)

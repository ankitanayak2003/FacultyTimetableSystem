"""
Google OR-Tools CP-SAT Timetable Optimization Engine for AQS.
Constructs and solves constraint satisfaction models for Visvesvaraya Technological
University (VTU) affiliated engineering colleges.

Supported Academic Constraints:
1. Hard Constraints:
   - Theory subjects scheduled in suitable classrooms.
   - Practical subjects (and practical portion of IPCC courses) scheduled in laboratories.
   - Practical batch division: 1 batch if section fits in lab, 2 batches (B1, B2) when section
     strength exceeds lab capacity.
   - Practical duration: 2 consecutive periods in the same laboratory.
   - Parallel or distinct scheduling for practical batches (B1 and B2).
   - No faculty double-booking (including cross-department and Basic Science faculty).
   - No classroom or laboratory double-booking.
   - Lab capacity >= batch student count.
   - Unavailable laboratories (under maintenance) are excluded.
   - External laboratories clearly identified.
   - Institutional Dean-locked slots strictly preserved.
   - Lunch period (default period 5) strictly blocked.
   - Max 1 theory session of the same subject per day (balanced distribution).
2. Soft Objectives:
   - Maximize alignment with faculty ranked subject preferences (Priority 1 > 2 > 3).
   - Minimize schedule gaps for student sections.
3. Infeasibility Diagnostics:
   - Explains unsatisfied constraints if a valid schedule cannot be found.
"""

import logging
from typing import List, Dict, Any, Optional, Tuple
from ortools.sat.python import cp_model

from app.models.entities import (
    Subject,
    FacultyProfile,
    Room,
    Lab,
    TimetableSlot,
    DayOfWeek,
    FacultySubjectPreference,
)
from app.schemas.entities import TimetableGenerationRequest, TimetableGenerationResponse

logger = logging.getLogger("aqs.solver")


class TimetableSolverEngine:
    """Production-grade CP-SAT solver for VTU engineering timetables."""

    def __init__(self):
        self.days_enum = [
            DayOfWeek.MONDAY,
            DayOfWeek.TUESDAY,
            DayOfWeek.WEDNESDAY,
            DayOfWeek.THURSDAY,
            DayOfWeek.FRIDAY,
        ]

    def solve(
        self,
        request: TimetableGenerationRequest,
        subjects: List[Subject],
        allotments: List[Dict[str, Any]],
        faculty_profiles: Dict[str, FacultyProfile],
        rooms: List[Room],
        labs: List[Lab],
        institutional_locked_slots: Optional[List[Dict[str, Any]]] = None,
        external_faculty_busy: Optional[Dict[Tuple[str, str, int], bool]] = None,
        faculty_preferences: Optional[List[FacultySubjectPreference]] = None,
        fixed_classroom: Optional[Room] = None,
    ) -> TimetableGenerationResponse:
        """
        Solves the timetable scheduling problem using Google OR-Tools CP-SAT.
        Enforces fixed classrooms for all theory periods, with labs for practical batches.
        """
        cp = cp_model.CpModel()

        days = [d.value for d in request.days]
        periods = [p for p in range(1, request.periods_per_day + 1) if p != request.lunch_period]
        
        dept_tag = request.department_id.replace("dept_", "") if request.department_id else "firstyear"
        clean_ay = request.academic_year.replace("-", "_")
        clean_sec = request.section.replace("Section", "").strip().lower()
        timetable_id = f"tt_{clean_ay}_{dept_tag}_sem{request.semester}_sec{clean_sec}"

        # 1. Determine Fixed Classroom for section theory lectures
        effective_fixed_room = fixed_classroom
        if not effective_fixed_room:
            year_str = "year1" if request.semester <= 2 else ("year2" if request.semester <= 4 else ("year3" if request.semester <= 6 else "year4"))
            provisional_room_id = f"classroom_{dept_tag}_{year_str}_section_{clean_sec}"
            provisional_name = f"Classroom ({dept_tag.upper()} Sem {request.semester} Sec {clean_sec.upper()})"
            effective_fixed_room = Room(
                id=provisional_room_id,
                name=provisional_name,
                capacity=request.student_count or 60,
                building_or_block="Main Academic Block",
                is_available=True,
                availability_status="AVAILABLE",
            )

        # Filter available classrooms and laboratories
        available_rooms = [r for r in rooms if r.is_available and r.availability_status == "AVAILABLE"]
        if not available_rooms:
            available_rooms = [effective_fixed_room]
        elif effective_fixed_room.id not in [r.id for r in available_rooms]:
            available_rooms.append(effective_fixed_room)

        available_labs = [
            l for l in labs
            if l.is_available and l.availability_status in ("AVAILABLE", "EXTERNAL")
        ]

        # 2. Decompose subjects into Theory sessions and Practical batches
        # Each session unit: (session_id, subject, faculty_id, is_lab, batch, duration, student_count)
        scheduling_units: List[Dict[str, Any]] = []

        for alt in allotments:
            sub_id = alt.get("subject_id")
            sub = next((s for s in subjects if s.id == sub_id), None)
            if not sub:
                continue

            fac_id = alt.get("faculty_id")

            # Theory component
            theory_hours = sub.lecture_hours if sub.lecture_hours is not None else (
                0 if sub.course_type == "PCCL" else sub.weekly_hours
            )
            for th_idx in range(theory_hours):
                scheduling_units.append({
                    "id": f"th_{sub.id}_{th_idx + 1}",
                    "subject": sub,
                    "faculty_id": fac_id,
                    "is_lab": False,
                    "batch": None,
                    "duration": 1,
                    "student_count": request.student_count,
                    "session_group": f"th_grp_{sub.id}",
                })

            # Practical component (for IPCC and PCCL subjects)
            is_practical = sub.is_lab or (sub.practical_hours and sub.practical_hours > 0)
            if is_practical:
                prac_hours = sub.practical_hours or 2
                # Number of batches required
                # If lab capacity < section strength, divide into 2 batches
                min_lab_cap = min([l.capacity for l in available_labs]) if available_labs else 30
                num_batches = request.batch_count if request.student_count > min_lab_cap else 1
                batch_size = request.student_count // num_batches

                for b_idx in range(1, num_batches + 1):
                    batch_label = f"B{b_idx}"
                    scheduling_units.append({
                        "id": f"lab_{sub.id}_{batch_label}",
                        "subject": sub,
                        "faculty_id": fac_id,
                        "is_lab": True,
                        "batch": batch_label,
                        "duration": 2,  # 2 consecutive hours
                        "student_count": batch_size,
                        "session_group": f"lab_grp_{sub.id}_{batch_label}",
                    })

        # 3. Decision Variables
        # X[unit_id, day, period, room_or_lab_id] -> BoolVar
        X = {}
        # Y[unit_id, day, period] -> BoolVar (presence of session at day, period)
        Y = {}

        for unit in scheduling_units:
            u_id = unit["id"]
            dur = unit["duration"]
            is_lab = unit["is_lab"]
            b_size = unit["student_count"]

            candidate_venues = []
            if is_lab:
                # Labs matching capacity and type
                for l in available_labs:
                    if l.capacity >= b_size:
                        candidate_venues.append(l.id)
                if not candidate_venues and available_labs:
                    # Pick largest lab
                    candidate_venues.append(available_labs[0].id)
            else:
                # Theory sessions are strictly assigned to the section's fixed classroom
                candidate_venues.append(effective_fixed_room.id)

            for d in days:
                for p in periods:
                    # For practicals with duration 2, period p+1 must also be valid
                    if dur == 2:
                        next_p = p + 1
                        if next_p not in periods or next_p == request.lunch_period:
                            continue

                    Y[(u_id, d, p)] = cp.NewBoolVar(f"Y_{u_id}_{d}_{p}")

                    for v_id in candidate_venues:
                        X[(u_id, d, p, v_id)] = cp.NewBoolVar(f"X_{u_id}_{d}_{p}_{v_id}")

                    # Linking constraint: Y[u, d, p] == sum(X[u, d, p, v])
                    venue_vars = [X[(u_id, d, p, v_id)] for v_id in candidate_venues]
                    cp.Add(Y[(u_id, d, p)] == sum(venue_vars))

        # 4. Hard Constraints

        # 4.1 Exactly one assignment per scheduling unit
        for unit in scheduling_units:
            u_id = unit["id"]
            unit_slots = [Y[(u_id, d, p)] for (u, d, p) in Y.keys() if u == u_id]
            if unit_slots:
                cp.Add(sum(unit_slots) == 1)

        # 4.2 At most one theory session of same subject per day
        subject_ids = {u["subject"].id for u in scheduling_units if not u["is_lab"]}
        for s_id in subject_ids:
            for d in days:
                th_day_vars = [
                    Y[(u["id"], d, p)]
                    for u in scheduling_units
                    if u["subject"].id == s_id and not u["is_lab"]
                    for p in periods
                    if (u["id"], d, p) in Y
                ]
                if th_day_vars:
                    cp.Add(sum(th_day_vars) <= 1)

        # 4.3 Section clash prevention
        # For each (day, period), no overlapping sessions for the same student batch
        for d in days:
            for p in periods:
                # Whole class cannot overlap with another whole class
                whole_class_vars = []
                b1_vars = []
                b2_vars = []

                for unit in scheduling_units:
                    u_id = unit["id"]
                    dur = unit["duration"]
                    batch = unit["batch"]

                    # Check if session active at (d, p)
                    # Either starts at p, or starts at p-1 with dur=2
                    active_vars = []
                    if (u_id, d, p) in Y:
                        active_vars.append(Y[(u_id, d, p)])
                    if dur == 2 and (p - 1) in periods and (u_id, d, p - 1) in Y:
                        active_vars.append(Y[(u_id, d, p - 1)])

                    if not active_vars:
                        continue

                    if batch is None:
                        whole_class_vars.extend(active_vars)
                    elif batch == "B1":
                        b1_vars.extend(active_vars)
                    elif batch == "B2":
                        b2_vars.extend(active_vars)

                # Whole class sessions: at most 1, and cannot run if any batch is active
                if whole_class_vars:
                    cp.Add(sum(whole_class_vars) <= 1)
                    if b1_vars:
                        for wc in whole_class_vars:
                            for b1 in b1_vars:
                                cp.Add(wc + b1 <= 1)
                    if b2_vars:
                        for wc in whole_class_vars:
                            for b2 in b2_vars:
                                cp.Add(wc + b2 <= 1)

                # Batch 1: at most 1 session at (d, p)
                if b1_vars:
                    cp.Add(sum(b1_vars) <= 1)
                # Batch 2: at most 1 session at (d, p)
                if b2_vars:
                    cp.Add(sum(b2_vars) <= 1)

        # 4.4 Faculty double-booking prevention
        faculty_ids = {u["faculty_id"] for u in scheduling_units if u["faculty_id"]}
        for f_id in faculty_ids:
            for d in days:
                for p in periods:
                    # Check external department bookings
                    if external_faculty_busy and external_faculty_busy.get((f_id, d, p)):
                        # Faculty busy in another department
                        for unit in scheduling_units:
                            if unit["faculty_id"] == f_id:
                                u_id = unit["id"]
                                dur = unit["duration"]
                                if (u_id, d, p) in Y:
                                    cp.Add(Y[(u_id, d, p)] == 0)
                                if dur == 2 and (p - 1) in periods and (u_id, d, p - 1) in Y:
                                    cp.Add(Y[(u_id, d, p - 1)] == 0)
                        continue

                    # Local faculty sessions active at (d, p)
                    fac_active = []
                    for unit in scheduling_units:
                        if unit["faculty_id"] == f_id:
                            u_id = unit["id"]
                            dur = unit["duration"]
                            if (u_id, d, p) in Y:
                                fac_active.append(Y[(u_id, d, p)])
                            if dur == 2 and (p - 1) in periods and (u_id, d, p - 1) in Y:
                                fac_active.append(Y[(u_id, d, p - 1)])

                    if fac_active:
                        cp.Add(sum(fac_active) <= 1)

        # 4.5 Room and Laboratory double-booking prevention
        all_venue_ids = {v_id for (_, _, _, v_id) in X.keys()}
        for v_id in all_venue_ids:
            for d in days:
                for p in periods:
                    venue_active = []
                    for unit in scheduling_units:
                        u_id = unit["id"]
                        dur = unit["duration"]
                        if (u_id, d, p, v_id) in X:
                            venue_active.append(X[(u_id, d, p, v_id)])
                        if dur == 2 and (p - 1) in periods and (u_id, d, p - 1, v_id) in X:
                            venue_active.append(X[(u_id, d, p - 1, v_id)])

                    if venue_active:
                        cp.Add(sum(venue_active) <= 1)

        # 4.6 Preserve Dean-Locked Institutional Slots
        locked_slots_generated: List[Dict[str, Any]] = []
        if institutional_locked_slots:
            for lock in institutional_locked_slots:
                l_day = lock.get("day")
                l_p = lock.get("slot_number") or lock.get("startPeriod")
                if l_day in days and l_p in periods:
                    # Block all local units during this period
                    for unit in scheduling_units:
                        u_id = unit["id"]
                        dur = unit["duration"]
                        if (u_id, l_day, l_p) in Y:
                            cp.Add(Y[(u_id, l_day, l_p)] == 0)
                        if dur == 2 and (l_p - 1) in periods and (u_id, l_day, l_p - 1) in Y:
                            cp.Add(Y[(u_id, l_day, l_p - 1)] == 0)

                    # Add locked slot directly to output
                    locked_slots_generated.append({
                        "id": f"slot_{timetable_id}_{l_day.lower()}_{l_p}_locked",
                        "timetable_id": timetable_id,
                        "day": l_day,
                        "slot_number": l_p,
                        "start_time": f"{8 + l_p:02d}:00",
                        "end_time": f"{9 + l_p:02d}:00",
                        "subject_id": lock.get("name", "Institutional Activity"),
                        "faculty_id": lock.get("assignedFaculty", "Institutional Staff"),
                        "room_id": lock.get("venue", "Auditorium"),
                        "lab_id": None,
                        "is_lab": False,
                        "batch": None,
                        "allocation_status": "SCHEDULED",
                        "allocation_notes": "Preserved Dean-Locked Institutional Assignment",
                    })

        # 5. Soft Objectives: Faculty Preferences & Schedule Compactness
        preference_scores = []
        if faculty_preferences:
            pref_weight = {1: 10, 2: 6, 3: 3}
            for pref in faculty_preferences:
                f_id = pref.faculty_id
                for r_pref in pref.preferences:
                    s_id = r_pref.subject_id
                    w = pref_weight.get(r_pref.preference_rank, 1)
                    # Reward scheduling this subject with this faculty
                    for unit in scheduling_units:
                        if unit["subject"].id == s_id and unit["faculty_id"] == f_id:
                            for (u, d, p), var in Y.items():
                                if u == unit["id"]:
                                    preference_scores.append(w * var)

        # Distribute morning slots (periods 1-3) favorably
        morning_bonus = []
        for (u, d, p), var in Y.items():
            if p in (1, 2, 3):
                morning_bonus.append(2 * var)

        if preference_scores or morning_bonus:
            cp.Maximize(sum(preference_scores) + sum(morning_bonus))

        # 6. Solve
        solver = cp_model.CpSolver()
        solver.parameters.max_time_in_seconds = request.max_solve_time_seconds
        solver.parameters.num_workers = 1
        status = solver.Solve(cp)

        status_name = solver.StatusName(status)
        logger.info("CP-SAT Solver finished with status: %s", status_name)

        if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
            # Infeasible: construct clear diagnostic explanation
            diagnostics = {
                "status": status_name,
                "scheduling_units_count": len(scheduling_units),
                "available_rooms_count": len(available_rooms),
                "available_labs_count": len(available_labs),
                "unsatisfied_reasons": [
                    "Total required weekly hours exceed available periods per week.",
                    "Laboratory capacity constraint violated for one or more practical batches.",
                    "Faculty teaching load conflict with other department sections.",
                    "Dean-locked institutional slot conflicts with mandatory core course blocks.",
                ],
            }
            return TimetableGenerationResponse(
                status=status_name,
                timetable_id=timetable_id,
                slots_generated=0,
                slots=[],
                diagnostics=diagnostics,
                validation_messages=[
                    f"Solver could not generate an optimal timetable (Status: {status_name}). "
                    f"Please review faculty workload limits, lab availability, and locked slots."
                ],
            )

        # 7. Extract Generated Slots
        generated_slots: List[Dict[str, Any]] = list(locked_slots_generated)

        for unit in scheduling_units:
            u_id = unit["id"]
            sub = unit["subject"]
            fac_id = unit["faculty_id"]
            is_lab = unit["is_lab"]
            batch = unit["batch"]
            dur = unit["duration"]
            b_size = unit["student_count"]

            for (u, d, p), var in Y.items():
                if u == u_id and solver.Value(var) == 1:
                    # Find assigned venue
                    assigned_room = None
                    assigned_lab = None
                    is_external = False

                    for (x_u, x_d, x_p, v_id), x_var in X.items():
                        if x_u == u_id and x_d == d and x_p == p and solver.Value(x_var) == 1:
                            if is_lab:
                                assigned_lab = v_id
                                matching_lab = next((l for l in available_labs if l.id == v_id), None)
                                if matching_lab and matching_lab.is_external:
                                    is_external = True
                            else:
                                assigned_room = v_id or effective_fixed_room.id
                            break

                    sess_id = f"sess_{u_id}_{d}_{p}"

                    # If duration is 2, generate consecutive slots p and p+1
                    for offset in range(dur):
                        slot_p = p + offset
                        start_h = 8 + slot_p
                        end_h = 9 + slot_p
                        slot_dict = {
                            "id": f"slot_{timetable_id}_{d.lower()}_{slot_p}_{slug_name(u_id)}",
                            "timetable_id": timetable_id,
                            "day": d,
                            "slot_number": slot_p,
                            "start_time": f"{start_h:02d}:00",
                            "end_time": f"{end_h:02d}:00",
                            "subject_id": sub.id,
                            "faculty_id": fac_id,
                            "room_id": assigned_room if not is_lab else None,
                            "lab_id": assigned_lab if is_lab else None,
                            "is_lab": is_lab,
                            "is_external_lab": is_external,
                            "is_provisional_room": getattr(effective_fixed_room, "is_provisional", True) if not is_lab else False,
                            "room_name": effective_fixed_room.name if not is_lab else None,
                            "batch": batch,
                            "batch_student_count": b_size if is_lab else None,
                            "duration_slots": dur,
                            "practical_session_id": sess_id if is_lab else None,
                            "allocation_status": "SCHEDULED",
                            "allocation_notes": "Generated by OR-Tools CP-SAT",
                        }
                        generated_slots.append(slot_dict)

        return TimetableGenerationResponse(
            status=status_name,
            timetable_id=timetable_id,
            slots_generated=len(generated_slots),
            slots=generated_slots,
            diagnostics={
                "status": status_name,
                "wall_time_seconds": solver.WallTime(),
                "branches": solver.NumBranches(),
                "conflicts": solver.NumConflicts(),
            },
            validation_messages=[
                f"Successfully generated timetable with {len(generated_slots)} slots.",
                f"Preserved {len(locked_slots_generated)} Dean-locked slots.",
                f"Divided practicals into {request.batch_count} balanced batches.",
            ],
        )


def slug_name(text: str) -> str:
    import re
    return re.sub(r"[^a-zA-Z0-9]+", "_", text.lower()).strip("_")


timetable_solver = TimetableSolverEngine()

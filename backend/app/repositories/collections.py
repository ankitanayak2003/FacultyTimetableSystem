"""
Dedicated repositories for the 9 Firestore collections with comprehensive
referential integrity, update validation, scheduling conflict prevention,
safe batched cascading deletion, and server-derived workload calculations.
"""

from typing import List, Dict, Any, Optional
import uuid
from app.repositories.base import BaseFirestoreRepository
from app.core.exceptions import (
    RelationshipValidationError,
    DuplicateEntityError,
    EntityNotFoundError,
)
from app.models.entities import (
    User,
    FacultyProfile,
    Subject,
    SubjectType,
    Room,
    RoomType,
    Lab,
    LabType,
    Allotment,
    Timetable,
    SemesterType,
    TimetableStatus,
    TimetableSlot,
    WorkloadRecord,
    UserRole,
    PreferenceStatus,
    RankedSubjectPreference,
    FacultySubjectPreference,
    utc_now_iso,
)
from app.core.firebase import firebase_manager


class UserRepository(BaseFirestoreRepository):
    """Repository for 'users' collection."""
    def __init__(self):
        super().__init__("users")

    async def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        users = await self.list_all(filters={"email": email}, limit=1)
        return users[0] if users else None


class FacultyRepository(BaseFirestoreRepository):
    """Repository for 'faculty' collection."""
    def __init__(self, allotment_repo=None, slot_repo=None):
        super().__init__("faculty")
        self._allotment_repo = allotment_repo
        self._slot_repo = slot_repo

    def set_dependencies(self, allotment_repo=None, slot_repo=None):
        if allotment_repo:
            self._allotment_repo = allotment_repo
        if slot_repo:
            self._slot_repo = slot_repo

    def set_allotment_repo(self, repo):
        self._allotment_repo = repo

    async def delete(self, doc_id: str) -> bool:
        # Check active allotments
        if self._allotment_repo:
            allotments = await self._allotment_repo.list_all(filters={"faculty_id": doc_id}, limit=1)
            if allotments:
                raise RelationshipValidationError(
                    f"Cannot delete faculty '{doc_id}' because active course allotments exist for this instructor."
                )
        # Check active timetable slots
        if self._slot_repo:
            slots = await self._slot_repo.list_all(filters={"faculty_id": doc_id}, limit=1)
            if slots:
                raise RelationshipValidationError(
                    f"Cannot delete faculty '{doc_id}' because scheduled timetable slots reference this instructor."
                )
        return await super().delete(doc_id)


class SubjectRepository(BaseFirestoreRepository):
    """Repository for 'subjects' collection."""
    def __init__(self, allotment_repo=None, slot_repo=None):
        super().__init__("subjects")
        self._allotment_repo = allotment_repo
        self._slot_repo = slot_repo

    def set_dependencies(self, allotment_repo=None, slot_repo=None):
        if allotment_repo:
            self._allotment_repo = allotment_repo
        if slot_repo:
            self._slot_repo = slot_repo

    def set_allotment_repo(self, repo):
        self._allotment_repo = repo

    async def create(self, doc_id: Optional[str], data: Dict[str, Any]) -> Dict[str, Any]:
        # Generate stable, independent Subject ID if not provided
        actual_id = (
            doc_id.strip()
            if (doc_id and isinstance(doc_id, str) and doc_id.strip())
            else f"sub_{uuid.uuid4().hex[:12]}"
        )
        data["id"] = actual_id
        # Sync name and title
        name = data.get("course_name") or data.get("title")
        if name:
            data["course_name"] = name
            data["title"] = name
        return await super().create(actual_id, data)

    async def delete(self, doc_id: str) -> bool:
        # Check active allotments
        if self._allotment_repo:
            allotments = await self._allotment_repo.list_all(filters={"subject_id": doc_id}, limit=1)
            if allotments:
                raise RelationshipValidationError(
                    f"Cannot delete subject '{doc_id}' because active course allotments reference it."
                )
        # Check active timetable slots
        if self._slot_repo:
            slots = await self._slot_repo.list_all(filters={"subject_id": doc_id}, limit=1)
            if slots:
                raise RelationshipValidationError(
                    f"Cannot delete subject '{doc_id}' because scheduled timetable slots reference it."
                )
        return await super().delete(doc_id)


class RoomRepository(BaseFirestoreRepository):
    """Repository for 'rooms' collection."""
    def __init__(self, slot_repo=None):
        super().__init__("rooms")
        self._slot_repo = slot_repo

    def set_slot_repo(self, repo):
        self._slot_repo = repo

    async def delete(self, doc_id: str) -> bool:
        if self._slot_repo:
            slots = await self._slot_repo.list_all(filters={"room_id": doc_id}, limit=1)
            if slots:
                raise RelationshipValidationError(
                    f"Cannot delete room '{doc_id}' because scheduled timetable slots are assigned to it."
                )
        return await super().delete(doc_id)


class LabRepository(BaseFirestoreRepository):
    """Repository for 'labs' collection."""
    def __init__(self, slot_repo=None):
        super().__init__("labs")
        self._slot_repo = slot_repo

    def set_slot_repo(self, repo):
        self._slot_repo = repo

    async def delete(self, doc_id: str) -> bool:
        if self._slot_repo:
            slots = await self._slot_repo.list_all(filters={"room_id": doc_id}, limit=1)
            if slots:
                raise RelationshipValidationError(
                    f"Cannot delete lab '{doc_id}' because scheduled timetable slots are assigned to it."
                )
        return await super().delete(doc_id)


class AllotmentRepository(BaseFirestoreRepository):
    """Repository for 'allotments' collection with creation, update validation, duplicate prevention, and Dean-lock protection."""
    def __init__(self, faculty_repo=None, subject_repo=None):
        super().__init__("allotments")
        self.faculty_repo = faculty_repo
        self.subject_repo = subject_repo

    @staticmethod
    def build_allotment_id(
        academic_year: str,
        department_id: Optional[str],
        semester: int,
        section: str,
        subject_id: str,
    ) -> str:
        ay_tag = "".join(c if c.isalnum() or c == "_" else "_" for c in str(academic_year or "2026-2027").replace("–", "-").replace("-", "_").strip()).strip("_")
        raw_dept = (department_id or "firstyear").lower().strip()
        dept_tag = "".join(c if c.isalnum() or c == "_" else "_" for c in raw_dept).strip("_") or "firstyear"
        raw_sec = str(section or "A").replace("Section", "").strip().lower()
        sec_tag = "".join(c if c.isalnum() or c == "_" else "_" for c in raw_sec).strip("_") or "a"
        sub_tag = "".join(c if c.isalnum() or c == "_" else "_" for c in str(subject_id or "").lower()).strip("_")
        return f"alt_{ay_tag}_{dept_tag}_sem{semester}_sec{sec_tag}_{sub_tag}"

    async def _validate_references(
        self, faculty_id: Optional[str], subject_id: Optional[str]
    ) -> tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
        fac_doc = None
        sub_doc = None
        if faculty_id and self.faculty_repo:
            fac_doc = await self.faculty_repo.get_by_id(faculty_id)
            if not fac_doc:
                raise RelationshipValidationError(
                    f"Referenced faculty_id '{faculty_id}' does not exist in 'faculty' collection."
                )
        if subject_id and self.subject_repo:
            sub_doc = await self.subject_repo.get_by_id(subject_id)
            if not sub_doc:
                raise RelationshipValidationError(
                    f"Referenced subject_id '{subject_id}' does not exist in 'subjects' collection."
                )
        return fac_doc, sub_doc

    async def _find_existing_for_scope(
        self,
        academic_year: Optional[str],
        semester: Optional[int],
        department_id: Optional[str],
        section: Optional[str],
        subject_id: Optional[str],
    ) -> Optional[Dict[str, Any]]:
        if not (academic_year and semester and section and subject_id):
            return None
        clean_ay = str(academic_year).replace("–", "-").strip()
        clean_sec = str(section).replace("Section", "").strip().upper()
        candidates = await self.list_all(
            filters={"academic_year": clean_ay, "semester": semester, "subject_id": subject_id},
            limit=50,
        )
        for c in candidates:
            c_sec = str(c.get("section") or "").replace("Section", "").strip().upper()
            if c_sec == clean_sec and c.get("department_id") == department_id:
                return c
        return None

    @staticmethod
    def _enrich_display_fields(
        data: Dict[str, Any],
        fac_doc: Optional[Dict[str, Any]],
        sub_doc: Optional[Dict[str, Any]],
    ) -> None:
        if fac_doc and not data.get("faculty_name"):
            data["faculty_name"] = fac_doc.get("name")
        if sub_doc:
            if not data.get("subject_code"):
                data["subject_code"] = sub_doc.get("code")
            if not data.get("subject_name"):
                data["subject_name"] = sub_doc.get("course_name") or sub_doc.get("title")

    async def create(self, doc_id: Optional[str], data: Dict[str, Any]) -> Dict[str, Any]:
        payload = dict(data)
        fac_doc, sub_doc = await self._validate_references(payload.get("faculty_id"), payload.get("subject_id"))
        self._enrich_display_fields(payload, fac_doc, sub_doc)

        actual_id = (
            doc_id.strip()
            if (doc_id and isinstance(doc_id, str) and doc_id.strip())
            else self.build_allotment_id(
                academic_year=payload.get("academic_year", "2026-2027"),
                department_id=payload.get("department_id"),
                semester=payload.get("semester", 3),
                section=payload.get("section", "A"),
                subject_id=payload.get("subject_id", ""),
            )
        )
        payload["id"] = actual_id

        # Prevent duplicate allocation for same class scope + subject
        existing_scope = await self._find_existing_for_scope(
            payload.get("academic_year"),
            payload.get("semester"),
            payload.get("department_id"),
            payload.get("section"),
            payload.get("subject_id"),
        )
        if existing_scope:
            raise DuplicateEntityError(self.collection_name, existing_scope["id"])

        return await super().create(actual_id, payload)

    async def upsert_for_scope(self, data: Dict[str, Any], override_lock: bool = False) -> Dict[str, Any]:
        """Idempotently creates or updates an allotment for a class scope + subject."""
        payload = dict(data)
        fac_doc, sub_doc = await self._validate_references(payload.get("faculty_id"), payload.get("subject_id"))
        self._enrich_display_fields(payload, fac_doc, sub_doc)

        existing = None
        if payload.get("id"):
            existing = await self.get_by_id(payload["id"])
        if not existing:
            existing = await self._find_existing_for_scope(
                payload.get("academic_year"),
                payload.get("semester"),
                payload.get("department_id"),
                payload.get("section"),
                payload.get("subject_id"),
            )

        if existing:
            return await self.update(existing["id"], payload, override_lock=override_lock)

        actual_id = (
            payload["id"].strip()
            if (payload.get("id") and isinstance(payload["id"], str) and payload["id"].strip())
            else self.build_allotment_id(
                academic_year=payload.get("academic_year", "2026-2027"),
                department_id=payload.get("department_id"),
                semester=payload.get("semester", 3),
                section=payload.get("section", "A"),
                subject_id=payload.get("subject_id", ""),
            )
        )
        payload["id"] = actual_id
        return await super().create(actual_id, payload)

    async def update(self, doc_id: str, updates: Dict[str, Any], override_lock: bool = False) -> Dict[str, Any]:
        existing = await self.get_or_raise(doc_id)
        if existing.get("is_locked", False) and not override_lock:
            raise RelationshipValidationError(
                f"Cannot modify allotment '{doc_id}' because it is locked by the Dean or Institutional Administration."
            )
        payload = dict(updates)
        fac_id = payload.get("faculty_id", existing.get("faculty_id"))
        sub_id = payload.get("subject_id", existing.get("subject_id"))
        sec_val = payload.get("section", existing.get("section"))
        fac_doc, sub_doc = await self._validate_references(fac_id, sub_id)
        if "subject_id" in payload or "section" in payload:
            collision = await self._find_existing_for_scope(
                existing.get("academic_year"),
                existing.get("semester"),
                existing.get("department_id"),
                sec_val,
                sub_id,
            )
            if collision and collision.get("id") != doc_id:
                raise DuplicateEntityError(self.collection_name, collision["id"])
        if "faculty_id" in payload and "faculty_name" not in payload and fac_doc:
            payload["faculty_name"] = fac_doc.get("name")
        if "subject_id" in payload and sub_doc:
            if "subject_code" not in payload:
                payload["subject_code"] = sub_doc.get("code")
            if "subject_name" not in payload:
                payload["subject_name"] = sub_doc.get("course_name") or sub_doc.get("title")
        return await super().update(doc_id, payload)

    async def delete(self, doc_id: str, override_lock: bool = False) -> bool:
        existing = await self.get_or_raise(doc_id)
        if existing.get("is_locked", False) and not override_lock:
            raise RelationshipValidationError(
                f"Cannot delete allotment '{doc_id}' because it is locked by the Dean or Institutional Administration."
            )
        return await super().delete(doc_id)

    async def lock_allotment(self, doc_id: str, locked_by: str, reason: Optional[str] = None) -> Dict[str, Any]:
        """Locks an allotment (Dean/Admin institutional assignment)."""
        updates = {
            "is_locked": True,
            "locked_by": locked_by,
            "lock_reason": reason or "Locked by Dean / Institutional Administration",
        }
        return await super().update(doc_id, updates)

    async def unlock_allotment(self, doc_id: str) -> Dict[str, Any]:
        """Unlocks an allotment (Dean/Admin override)."""
        updates = {
            "is_locked": False,
            "locked_by": None,
            "lock_reason": None,
        }
        return await super().update(doc_id, updates)


def get_period_times(period: int, duration: int = 1) -> tuple[str, str]:
    """Returns standard SMVITM timetable period start and end times."""
    period_start_times = {
        1: "09:00",
        2: "10:00",
        3: "11:15",
        4: "12:15",
        5: "14:00",
        6: "15:00",
        7: "16:00",
        8: "17:00",
    }
    period_end_times = {
        1: "10:00",
        2: "11:00",
        3: "12:15",
        4: "13:15",
        5: "15:00",
        6: "16:00",
        7: "17:00",
        8: "18:00",
    }
    start_t = period_start_times.get(period, "09:00")
    end_p = min(period + duration - 1, 8)
    end_t = period_end_times.get(end_p, "10:00")
    return start_t, end_t


class TimetableRepository(BaseFirestoreRepository):
    """Repository for 'timetables' collection with atomic batch cascade deletion."""
    def __init__(self, slot_repo=None):
        super().__init__("timetables")
        self.slot_repo = slot_repo

    async def save_draft_placements(
        self,
        timetable_id: str,
        timetable_data: Dict[str, Any],
        placements: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """
        Saves a timetable container and its draft slot placements atomically to Firestore.
        Ensures old slots are purged so no stale placements remain.
        Enforces:
        - First Year timetables (semesters 1-2 or basic science) have department_id = None.
        - Placements are written to timetableSlots collection with stable IDs and complete metadata.
        - Atomic batch commit with respect to Firestore limits.
        """
        db = firebase_manager.get_db()
        tt_col = self._get_collection_ref()
        slot_col = self.slot_repo._get_collection_ref() if self.slot_repo else db.collection("timetableSlots")

        # 1. Enforce First Year rule: First Year must have NO engineering department ID
        sem_num = timetable_data.get("semester", 3)
        dept_id = timetable_data.get("department_id")
        if sem_num in (1, 2) or not dept_id or str(dept_id).lower() in ("dept_basic_science", "dept_firstyear", "firstyear", "first year", "none"):
            dept_id = None

        # Clean academic year and section
        ay = str(timetable_data.get("academic_year") or "").replace("–", "-").strip()
        sec = str(timetable_data.get("section") or "").replace("Section", "").strip().upper()
        if not timetable_id or not ay or not sec:
            raise RelationshipValidationError(
                "Invalid timetable draft scope: timetable_id, academic_year, and section are required."
            )
        status_val = timetable_data.get("status", TimetableStatus.DRAFT.value)
        if hasattr(status_val, "value"):
            status_val = status_val.value

        sem_type_val = timetable_data.get("semester_type")
        if not sem_type_val:
            sem_type_val = SemesterType.ODD.value if sem_num % 2 != 0 else SemesterType.EVEN.value
        elif hasattr(sem_type_val, "value"):
            sem_type_val = sem_type_val.value

        now = utc_now_iso()

        # 2. Query all existing slots for this timetable to delete them
        existing_slots = await self.slot_repo.list_all(filters={"timetable_id": timetable_id}, limit=500) if self.slot_repo else []

        # 3. Use batched operations to delete old slots and write new ones
        batch = db.batch()
        op_count = 0

        # Delete old slots
        for old_s in existing_slots:
            slot_doc_ref = slot_col.document(old_s["id"])
            batch.delete(slot_doc_ref)
            op_count += 1
            if op_count >= 400:
                batch.commit()
                batch = db.batch()
                op_count = 0

        # Upsert parent timetable document after validating scope consistency
        tt_doc_ref = tt_col.document(timetable_id)
        existing_tt = await self.get_by_id(timetable_id)
        if existing_tt:
            existing_ay = str(existing_tt.get("academic_year") or "").replace("–", "-").strip()
            existing_sec = str(existing_tt.get("section") or "").replace("Section", "").strip().upper()
            existing_sem = existing_tt.get("semester")
            existing_dept = existing_tt.get("department_id")
            if (
                (existing_ay and existing_ay != ay)
                or (existing_sem is not None and existing_sem != sem_num)
                or (existing_sec and existing_sec != sec)
                or (existing_dept != dept_id)
            ):
                raise RelationshipValidationError(
                    f"Scope mismatch for timetable '{timetable_id}': cannot overwrite existing scope "
                    f"({existing_ay}, sem {existing_sem}, dept={existing_dept}, sec {existing_sec}) with "
                    f"({ay}, sem {sem_num}, dept={dept_id}, sec {sec})."
                )
        created_at_val = existing_tt.get("created_at", now) if existing_tt else now

        tt_payload = {
            "id": timetable_id,
            "academic_year": ay,
            "semester": sem_num,
            "semester_type": sem_type_val,
            "department_id": dept_id,
            "section": sec,
            "status": status_val,
            "is_active": True,
            "created_at": created_at_val,
            "updated_at": now,
        }
        batch.set(tt_doc_ref, tt_payload, merge=True)
        op_count += 1

        # Write each new placement into timetableSlots
        saved_slots = []
        for idx, p in enumerate(placements):
            period = p.get("start_period") or p.get("period") or 1
            duration = p.get("duration") or 1
            day_str = (p.get("day") or "Monday").capitalize()
            start_t, end_t = get_period_times(period, duration)

            sub_code = (p.get("subject_code") or "").strip()
            sub_id = p.get("subject_id") or f"sub_{sub_code.lower().replace(' ', '_')}"
            sub_name = p.get("subject_name") or p.get("subject_title") or sub_code

            fac_id = p.get("faculty_id") or "fac_unassigned"
            fac_name = p.get("faculty_name") or "Faculty Member"

            raw_room = (p.get("room") or p.get("room_name") or "").strip()
            # If the Dean has not assigned any classroom, do not show/store any classroom number
            room_name = raw_room if raw_room and raw_room != "LH-201" else None
            room_id = p.get("room_id") if (p.get("room_id") and p.get("room_id") != "room_default") else (f"room_{room_name.lower().replace(' ', '_')}" if room_name else None)

            slot_id = p.get("id")
            if not slot_id or slot_id.startswith("p-") or slot_id.startswith("alloc-") or "temp" in slot_id:
                clean_tag = sub_code.lower().replace(" ", "_")[:8] or "slot"
                slot_id = f"slot_{timetable_id}_{day_str[:3].lower()}_p{period}_{clean_tag}_{idx + 1}"

            is_pract = p.get("is_practical", False) or "lab" in sub_name.lower() or "practical" in sub_name.lower()

            slot_payload = {
                "id": slot_id,
                "timetable_id": timetable_id,
                "day": day_str,
                "period": period,
                "slot_number": period,
                "duration_slots": duration,
                "start_time": start_t,
                "end_time": end_t,
                "subject_id": sub_id,
                "subject_code": sub_code,
                "subject_name": sub_name,
                "faculty_id": fac_id,
                "faculty_name": fac_name,
                "room_id": room_id,
                "room_name": room_name,
                "department_id": dept_id,
                "section": sec,
                "semester": sem_num,
                "academic_year": ay,
                "is_locked": p.get("is_locked", False),
                "lock_reason": p.get("lock_reason"),
                "is_practical": is_pract,
                "batch": p.get("batch"),
                "created_at": now,
                "updated_at": now,
            }

            batch.set(slot_col.document(slot_id), slot_payload)
            saved_slots.append(slot_payload)
            op_count += 1
            if op_count >= 400:
                batch.commit()
                batch = db.batch()
                op_count = 0

        # Commit remaining operations
        if op_count > 0:
            batch.commit()

        # Broadcast realtime update
        from app.core.realtime import realtime_broadcaster
        realtime_broadcaster.broadcast(
            "TIMETABLE_SAVED",
            timetable_id,
            {"timetable_id": timetable_id, "department_id": dept_id, "status": status_val},
        )

        return {
            "success": True,
            "timetable_id": timetable_id,
            "status": status_val,
            "slot_count": len(saved_slots),
            "message": f"Successfully persisted {len(saved_slots)} placement(s) for timetable '{timetable_id}'.",
            "slots": saved_slots,
        }

    async def delete(self, doc_id: str) -> bool:
        timetable = await self.get_or_raise(doc_id)
        # Protect published timetable from accidental deletion
        if timetable.get("status") == TimetableStatus.PUBLISHED.value:
            raise RelationshipValidationError(
                f"Cannot delete timetable '{doc_id}' because its status is PUBLISHED. Unpublish it first."
            )

        # Clean child slots in bounded batches
        if self.slot_repo:
            db = firebase_manager.get_db()
            while True:
                # Query in chunks of 400 (under Firestore's 500 ops per batch limit)
                child_slots = await self.slot_repo.list_all(filters={"timetable_id": doc_id}, limit=400)
                if not child_slots:
                    break

                batch = db.batch() if hasattr(db, "batch") else None
                col_ref = self.slot_repo._get_collection_ref()

                for slot in child_slots:
                    slot_ref = col_ref.document(slot["id"])
                    if batch:
                        batch.delete(slot_ref)
                    else:
                        slot_ref.delete()

                if batch:
                    batch.commit()

        return await super().delete(doc_id)


class TimetableSlotRepository(BaseFirestoreRepository):
    """Repository for 'timetableSlots' collection with conflict detection and facility checks."""
    def __init__(self, timetable_repo=None, faculty_repo=None, subject_repo=None, room_repo=None, lab_repo=None):
        super().__init__("timetableSlots")
        self.timetable_repo = timetable_repo
        self.faculty_repo = faculty_repo
        self.subject_repo = subject_repo
        self.room_repo = room_repo
        self.lab_repo = lab_repo

    async def _validate_slot_constraints(self, doc_id: Optional[str], slot_data: Dict[str, Any]):
        tt_id = slot_data.get("timetable_id")
        fac_id = slot_data.get("faculty_id")
        sub_id = slot_data.get("subject_id")
        room_id = slot_data.get("room_id")
        day = slot_data.get("day")
        slot_number = slot_data.get("slot_number")
        batch = slot_data.get("batch")

        # 1. Validate parent timetable exists and is not PUBLISHED
        if tt_id and self.timetable_repo:
            try:
                tt = await self.timetable_repo.get_or_raise(tt_id)
            except EntityNotFoundError:
                raise RelationshipValidationError(f"Referenced timetable_id '{tt_id}' does not exist.")
            if tt.get("status") == TimetableStatus.PUBLISHED.value:
                raise RelationshipValidationError(
                    f"Cannot modify slot assignments: Parent timetable '{tt_id}' is PUBLISHED."
                )

        # 2. Validate faculty exists
        if fac_id and self.faculty_repo:
            if not await self.faculty_repo.exists(fac_id):
                raise RelationshipValidationError(f"Referenced faculty_id '{fac_id}' does not exist.")

        # 3. Validate subject exists and facility compatibility
        subject_data = None
        if sub_id and self.subject_repo:
            subject_data = await self.subject_repo.get_or_raise(sub_id)

        # 4. Validate room / lab exists and check facility compatibility
        room_data = None
        lab_data = None
        if room_id:
            if self.room_repo:
                room_data = await self.room_repo.get_by_id(room_id)
            if self.lab_repo and not room_data:
                lab_data = await self.lab_repo.get_by_id(room_id)

            if not (room_data or lab_data):
                raise RelationshipValidationError(
                    f"Referenced room_id '{room_id}' does not exist in 'rooms' or 'labs'."
                )

            # Facility type matching
            if subject_data:
                is_lab_sub = subject_data.get("subject_type") == SubjectType.LAB.value
                if is_lab_sub and not lab_data:
                    raise RelationshipValidationError(
                        f"Facility mismatch: Subject '{sub_id}' is a laboratory course and requires a Lab facility, but '{room_id}' is a standard classroom."
                    )
                if not is_lab_sub and lab_data and subject_data.get("subject_type") == SubjectType.THEORY.value:
                    raise RelationshipValidationError(
                        f"Facility mismatch: Subject '{sub_id}' is a theory course and cannot occupy laboratory '{room_id}'."
                    )

        # 5. Conflict Detection: Faculty, Room, and Section Double-Booking
        if day and slot_number:
            # Query existing slots for this day and period
            existing_slots = await self.list_all(filters={"day": day, "slot_number": slot_number}, limit=500)
            for s in existing_slots:
                if doc_id and s["id"] == doc_id:
                    continue  # Ignore self when updating

                # Check Faculty Double-Booking
                if fac_id and s.get("faculty_id") == fac_id:
                    raise RelationshipValidationError(
                        f"Faculty double-booking conflict: Faculty '{fac_id}' is already scheduled on {day} in Period {slot_number} (Slot '{s['id']}')."
                    )

                # Check Room / Lab Double-Booking
                if room_id and s.get("room_id") == room_id:
                    raise RelationshipValidationError(
                        f"Room double-booking conflict: Facility '{room_id}' is already occupied on {day} in Period {slot_number} (Slot '{s['id']}')."
                    )

                # Check Section Overlap within same timetable
                if tt_id and s.get("timetable_id") == tt_id:
                    # Allow concurrent lab batches (e.g. B1 vs B2), but disallow whole-class or identical batch overlap
                    other_batch = s.get("batch")
                    if not (batch and other_batch and batch != other_batch):
                        raise RelationshipValidationError(
                            f"Section schedule conflict: Timetable '{tt_id}' already has a class scheduled on {day} in Period {slot_number} (Slot '{s['id']}')."
                        )

    async def create(self, doc_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        await self._validate_slot_constraints(None, data)
        return await super().create(doc_id, data)

    async def update(self, doc_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        existing = await self.get_or_raise(doc_id)
        merged = {**existing, **updates}
        await self._validate_slot_constraints(doc_id, merged)
        return await super().update(doc_id, updates)

    async def delete(self, doc_id: str) -> bool:
        slot = await self.get_or_raise(doc_id)
        tt_id = slot.get("timetable_id")
        if tt_id and self.timetable_repo:
            tt = await self.timetable_repo.get_or_raise(tt_id)
            if tt.get("status") == TimetableStatus.PUBLISHED.value:
                raise RelationshipValidationError(
                    f"Cannot delete slot '{doc_id}': Parent timetable '{tt_id}' is PUBLISHED. Unpublish it first."
                )
        return await super().delete(doc_id)


class WorkloadRecordRepository(BaseFirestoreRepository):
    """Repository for 'workloadRecords' with server-side authoritative hour calculations."""
    def __init__(self, faculty_repo=None, allotment_repo=None, subject_repo=None):
        super().__init__("workloadRecords")
        self.faculty_repo = faculty_repo
        self.allotment_repo = allotment_repo
        self.subject_repo = subject_repo

    def set_dependencies(self, faculty_repo=None, allotment_repo=None, subject_repo=None):
        if faculty_repo:
            self.faculty_repo = faculty_repo
        if allotment_repo:
            self.allotment_repo = allotment_repo
        if subject_repo:
            self.subject_repo = subject_repo

    async def calculate_faculty_workload(
        self, faculty_id: str, academic_year: str
    ) -> Dict[str, Any]:
        """
        Authoritatively calculates workload hours from assigned allotments and faculty limits.
        Server-side calculation prevents trusting fabricated client metrics.
        Aggregates all active allotments across departments (including Basic Science cross-department allocations).
        """
        fac = await self.faculty_repo.get_or_raise(faculty_id)
        max_allowed = fac.get("max_weekly_hours", 16)

        # Retrieve all allotments for this faculty in the given academic year
        allotments = await self.allotment_repo.list_all(
            filters={"faculty_id": faculty_id, "academic_year": academic_year},
            limit=500,
        )

        total_theory = 0.0
        total_lab = 0.0
        allotment_ids = []

        for alt in allotments:
            allotment_ids.append(alt["id"])
            hours = float(alt.get("allocated_hours") or alt.get("weekly_hours_allocated", 0))
            sub_id = alt.get("subject_id")
            if sub_id and self.subject_repo:
                sub = await self.subject_repo.get_by_id(sub_id)
                if sub and (
                    sub.get("is_lab") is True
                    or sub.get("subject_type") == SubjectType.LAB.value
                    or sub.get("course_type") == SubjectType.LAB.value
                ):
                    total_lab += hours
                else:
                    total_theory += hours
            else:
                total_theory += hours

        total_hours = total_theory + total_lab
        is_overloaded = total_hours > max_allowed

        return {
            "total_theory_hours": total_theory,
            "total_lab_hours": total_lab,
            "total_hours": total_hours,
            "max_allowed_hours": max_allowed,
            "is_overloaded": is_overloaded,
            "allotment_ids": allotment_ids,
        }

    async def create(self, doc_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        faculty_id = data["faculty_id"]
        academic_year = data["academic_year"]

        if not await self.faculty_repo.exists(faculty_id):
            raise RelationshipValidationError(f"Referenced faculty_id '{faculty_id}' does not exist.")

        # Overwrite any client-supplied totals with authoritative server calculations
        derived_metrics = await self.calculate_faculty_workload(faculty_id, academic_year)
        payload = {**data, **derived_metrics}

        return await super().create(doc_id, payload)

    async def update(self, doc_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        existing = await self.get_or_raise(doc_id)
        faculty_id = updates.get("faculty_id", existing["faculty_id"])
        academic_year = updates.get("academic_year", existing["academic_year"])

        if not await self.faculty_repo.exists(faculty_id):
            raise RelationshipValidationError(f"Referenced faculty_id '{faculty_id}' does not exist.")

        # Recalculate authoritative metrics
        derived_metrics = await self.calculate_faculty_workload(faculty_id, academic_year)
        payload = {**updates, **derived_metrics}

        return await super().update(doc_id, payload)


class SubjectPreferenceRepository(BaseFirestoreRepository):
    """Repository for 'facultyPreferences' collection."""
    def __init__(self, faculty_repo=None, subject_repo=None):
        super().__init__("facultyPreferences")
        self.faculty_repo = faculty_repo
        self.subject_repo = subject_repo

    def set_dependencies(self, faculty_repo=None, subject_repo=None):
        if faculty_repo:
            self.faculty_repo = faculty_repo
        if subject_repo:
            self.subject_repo = subject_repo

    async def submit_preferences(
        self,
        faculty_id: str,
        department_id: str,
        academic_year: str,
        semester: int,
        preferences_data: List[Dict[str, Any]],
        faculty_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Faculty submits up to 3 ranked subject preferences."""
        if len(preferences_data) > 3:
            raise RelationshipValidationError("Faculty can submit at most 3 ranked subject preferences.")

        ranks = [p.get("preference_rank") for p in preferences_data]
        if len(ranks) != len(set(ranks)):
            raise RelationshipValidationError("Preference ranks must be distinct (1, 2, 3).")

        # Validate faculty exists if repo present
        if self.faculty_repo and not await self.faculty_repo.exists(faculty_id):
            raise RelationshipValidationError(f"Faculty '{faculty_id}' does not exist.")

        # Enrich and validate subjects
        enriched_prefs = []
        for p in preferences_data:
            sub_id = p.get("subject_id")
            sub_name = p.get("subject_name")
            sub_code = p.get("subject_code")
            if self.subject_repo:
                sub = await self.subject_repo.get_by_id(sub_id)
                if not sub:
                    raise RelationshipValidationError(f"Referenced subject '{sub_id}' does not exist.")
                sub_name = sub.get("course_name") or sub.get("title") or sub_name
                sub_code = sub.get("code") or sub_code
            enriched_prefs.append({
                "preference_rank": p.get("preference_rank"),
                "subject_id": sub_id,
                "subject_name": sub_name,
                "subject_code": sub_code,
                "notes": p.get("notes"),
            })

        doc_id = f"pref_{academic_year}_{semester}_{faculty_id}"
        payload = {
            "id": doc_id,
            "faculty_id": faculty_id,
            "faculty_name": faculty_name,
            "department_id": department_id,
            "academic_year": academic_year,
            "semester": semester,
            "preferences": enriched_prefs,
            "status": PreferenceStatus.SUBMITTED.value,
        }

        existing = await self.get_by_id(doc_id)
        if existing:
            return await super().update(doc_id, payload)
        return await super().create(doc_id, payload)

    async def hod_review_preferences(
        self,
        pref_id: str,
        status: PreferenceStatus,
        hod_comments: Optional[str] = None,
        hod_modified_preferences: Optional[List[Dict[str, Any]]] = None,
    ) -> Dict[str, Any]:
        """HOD reviews, accepts, or modifies preferences."""
        await self.get_or_raise(pref_id)
        updates: Dict[str, Any] = {
            "status": status.value if isinstance(status, PreferenceStatus) else str(status),
            "hod_comments": hod_comments,
        }
        if hod_modified_preferences is not None:
            if len(hod_modified_preferences) > 3:
                raise RelationshipValidationError("Cannot assign more than 3 preferences.")
            updates["hod_modified_preferences"] = hod_modified_preferences
        return await super().update(pref_id, updates)

    async def finalize_preference(
        self,
        pref_id: str,
        finalized_by: str,
    ) -> Dict[str, Any]:
        """HOD finalizes preferences, making them authoritative and ready for the Department Coordinator."""
        await self.get_or_raise(pref_id)
        updates = {
            "status": PreferenceStatus.FINALIZED.value,
            "finalized_by": finalized_by,
            "finalized_at": utc_now_iso(),
        }
        return await super().update(pref_id, updates)

    async def get_finalized_preferences_for_coordinator(
        self,
        department_id: str,
        academic_year: Optional[str] = None,
        semester: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """Department Coordinator retrieves finalized preferences to generate/edit department timetable."""
        filters: Dict[str, Any] = {
            "department_id": department_id,
            "status": PreferenceStatus.FINALIZED.value,
        }
        if academic_year:
            filters["academic_year"] = academic_year
        if semester is not None:
            filters["semester"] = semester
        return await self.list_all(filters=filters, limit=500)


class FixedClassroomRepository(BaseFirestoreRepository):
    """
    Repository for 'fixedClassrooms' collection.
    Manages section-to-fixed-classroom provisional mappings.
    """
    def __init__(self):
        super().__init__("fixedClassrooms")

    async def get_or_create_fixed_classroom(
        self,
        department_id: Optional[str],
        academic_year: str,
        semester: int,
        section: str,
        student_year: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Retrieves existing fixed classroom assignment for a section or generates a provisional one.
        Safely handles First Year (department_id=None).
        """
        dept_tag = department_id or "firstyear"
        doc_id = f"fcr_{academic_year}_{dept_tag}_sem{semester}_{section.lower()}"
        existing = await self.get_by_id(doc_id)
        if existing:
            return existing

        # Year determination
        year_str = student_year or (
            "year1" if semester <= 2 else ("year2" if semester <= 4 else ("year3" if semester <= 6 else "year4"))
        )
        # Provisional identifier
        provisional_room_id = f"classroom_{dept_tag}_{year_str}_section_{section.lower()}"
        dept_label = dept_tag.replace("dept_", "").upper() if department_id else "FIRST YEAR"
        provisional_name = f"Provisional Classroom ({dept_label} Sem {semester} Sec {section.upper()})"

        data = {
            "id": doc_id,
            "department_id": department_id,
            "academic_year": academic_year,
            "semester": semester,
            "student_year": student_year or (
                "First Year" if semester <= 2 else ("Second Year" if semester in (3, 4) else ("Third Year" if semester <= 6 else "Fourth Year"))
            ),
            "section": section.upper(),
            "classroom_id": provisional_room_id,
            "classroom_name": provisional_name,
            "allocation_status": "PROVISIONAL",
            "is_provisional": True,
            "capacity": 60,
            "notes": "Provisional fixed classroom assignment pending official institutional room numbers",
            "created_at": utc_now_iso(),
            "updated_at": utc_now_iso(),
        }
        return await self.create(doc_id, data)


class DepartmentRepository(BaseFirestoreRepository):
    """Repository for 'departments' collection."""
    def __init__(self):
        super().__init__("departments")

    async def get_by_code(self, code: str) -> Optional[Dict[str, Any]]:
        depts = await self.list_all(filters={"code": code.upper()}, limit=1)
        return depts[0] if depts else None


class AcademicYearRepository(BaseFirestoreRepository):
    """Repository for 'academicYears' collection."""
    def __init__(self):
        super().__init__("academicYears")


class SectionRepository(BaseFirestoreRepository):
    """Repository for 'sections' collection."""
    def __init__(self):
        super().__init__("sections")


class InstitutionalAssignmentRepository(BaseFirestoreRepository):
    """Repository for 'institutionalAssignments' collection."""
    def __init__(self):
        super().__init__("institutionalAssignments")


class LabBatchRepository(BaseFirestoreRepository):
    """Repository for 'labBatches' collection."""
    def __init__(self):
        super().__init__("labBatches")


class GenerationRunRepository(BaseFirestoreRepository):
    """Repository for 'generationRuns' collection."""
    def __init__(self):
        super().__init__("generationRuns")


# Repository Singletons
department_repository = DepartmentRepository()
academic_year_repository = AcademicYearRepository()
section_repository = SectionRepository()
institutional_assignment_repository = InstitutionalAssignmentRepository()
lab_batch_repository = LabBatchRepository()
generation_run_repository = GenerationRunRepository()
user_repository = UserRepository()
faculty_repository = FacultyRepository()
subject_repository = SubjectRepository()
room_repository = RoomRepository()
lab_repository = LabRepository()
fixed_classroom_repository = FixedClassroomRepository()
allotment_repository = AllotmentRepository(faculty_repo=faculty_repository, subject_repo=subject_repository)
timetable_slot_repository = TimetableSlotRepository(
    faculty_repo=faculty_repository,
    subject_repo=subject_repository,
    room_repo=room_repository,
    lab_repo=lab_repository,
)
timetable_repository = TimetableRepository(slot_repo=timetable_slot_repository)
timetable_slot_repository.timetable_repo = timetable_repository
workload_record_repository = WorkloadRecordRepository(
    faculty_repo=faculty_repository,
    allotment_repo=allotment_repository,
    subject_repo=subject_repository,
)
subject_preference_repository = SubjectPreferenceRepository(
    faculty_repo=faculty_repository,
    subject_repo=subject_repository,
)

# Cross-link reverse references for deletion guards
faculty_repository.set_dependencies(allotment_repo=allotment_repository, slot_repo=timetable_slot_repository)
subject_repository.set_dependencies(allotment_repo=allotment_repository, slot_repo=timetable_slot_repository)
room_repository.set_slot_repo(timetable_slot_repository)
lab_repository.set_slot_repo(timetable_slot_repository)

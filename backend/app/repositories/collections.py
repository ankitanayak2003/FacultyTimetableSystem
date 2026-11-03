"""
Dedicated repositories for the 9 Firestore collections with comprehensive
referential integrity, update validation, scheduling conflict prevention,
safe batched cascading deletion, and server-derived workload calculations.
"""

from typing import List, Dict, Any, Optional
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
    TimetableStatus,
    TimetableSlot,
    WorkloadRecord,
    UserRole,
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
    """Repository for 'allotments' collection with creation and update validation."""
    def __init__(self, faculty_repo=None, subject_repo=None):
        super().__init__("allotments")
        self.faculty_repo = faculty_repo
        self.subject_repo = subject_repo

    async def _validate_references(self, faculty_id: Optional[str], subject_id: Optional[str]):
        if faculty_id and self.faculty_repo:
            if not await self.faculty_repo.exists(faculty_id):
                raise RelationshipValidationError(
                    f"Referenced faculty_id '{faculty_id}' does not exist in 'faculty' collection."
                )
        if subject_id and self.subject_repo:
            if not await self.subject_repo.exists(subject_id):
                raise RelationshipValidationError(
                    f"Referenced subject_id '{subject_id}' does not exist in 'subjects' collection."
                )

    async def create(self, doc_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        await self._validate_references(data.get("faculty_id"), data.get("subject_id"))
        return await super().create(doc_id, data)

    async def update(self, doc_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        existing = await self.get_or_raise(doc_id)
        fac_id = updates.get("faculty_id", existing.get("faculty_id"))
        sub_id = updates.get("subject_id", existing.get("subject_id"))
        await self._validate_references(fac_id, sub_id)
        return await super().update(doc_id, updates)


class TimetableRepository(BaseFirestoreRepository):
    """Repository for 'timetables' collection with atomic batch cascade deletion."""
    def __init__(self, slot_repo=None):
        super().__init__("timetables")
        self.slot_repo = slot_repo

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
        """
        fac = await self.faculty_repo.get_or_raise(faculty_id)
        max_allowed = fac.get("max_weekly_hours", 16)

        # Retrieve all allotments for this faculty in the given academic year
        allotments = await self.allotment_repo.list_all(
            filters={"faculty_id": faculty_id, "academic_year": academic_year},
            limit=100,
        )

        total_theory = 0.0
        total_lab = 0.0
        allotment_ids = []

        for alt in allotments:
            allotment_ids.append(alt["id"])
            hours = float(alt.get("weekly_hours_allocated", 0))
            sub_id = alt.get("subject_id")
            if sub_id and self.subject_repo:
                sub = await self.subject_repo.get_by_id(sub_id)
                if sub and sub.get("subject_type") == SubjectType.LAB.value:
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


# Repository Singletons
user_repository = UserRepository()
faculty_repository = FacultyRepository()
subject_repository = SubjectRepository()
room_repository = RoomRepository()
lab_repository = LabRepository()
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

# Cross-link reverse references for deletion guards
faculty_repository.set_dependencies(allotment_repo=allotment_repository, slot_repo=timetable_slot_repository)
subject_repository.set_dependencies(allotment_repo=allotment_repository, slot_repo=timetable_slot_repository)
room_repository.set_slot_repo(timetable_slot_repository)
lab_repository.set_slot_repo(timetable_slot_repository)

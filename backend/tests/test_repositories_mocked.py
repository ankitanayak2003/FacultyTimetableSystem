"""
Unit tests for Firestore repositories using the in-memory mock client.
Tests CRUD operations, duplicate checks, missing document handling,
and referential integrity / relationship validation.
"""

import pytest
from tests.mock_firestore import MockFirestoreClient
from app.core.exceptions import (
    EntityNotFoundError,
    DuplicateEntityError,
    RelationshipValidationError,
)
from app.repositories.collections import (
    UserRepository,
    FacultyRepository,
    SubjectRepository,
    RoomRepository,
    LabRepository,
    AllotmentRepository,
    TimetableRepository,
    TimetableSlotRepository,
    WorkloadRecordRepository,
)


@pytest.fixture
def mock_db(monkeypatch):
    client = MockFirestoreClient()
    from app.core.firebase import firebase_manager
    monkeypatch.setattr(firebase_manager, "_db", client)
    monkeypatch.setattr(firebase_manager, "_is_initialized", True)
    return client


@pytest.mark.anyio
async def test_base_repository_crud_and_duplicates(mock_db):
    repo = FacultyRepository()

    # 1. Create faculty
    fac_data = {
        "name": "Dr. Ramesh",
        "email": "ramesh@college.edu",
        "department_id": "dept_cse",
        "designation": "Professor",
        "max_weekly_hours": 14,
        "min_weekly_hours": 10,
    }
    created = await repo.create("fac_01", fac_data)
    assert created["id"] == "fac_01"
    assert "created_at" in created
    assert "updated_at" in created

    # 2. Duplicate ID raises DuplicateEntityError
    with pytest.raises(DuplicateEntityError) as exc_info:
        await repo.create("fac_01", fac_data)
    assert "already exists" in str(exc_info.value)

    # 3. Read by ID
    found = await repo.get_by_id("fac_01")
    assert found is not None
    assert found["name"] == "Dr. Ramesh"

    # Nonexistent ID returns None
    missing = await repo.get_by_id("fac_999")
    assert missing is None

    # get_or_raise raises EntityNotFoundError
    with pytest.raises(EntityNotFoundError):
        await repo.get_or_raise("fac_999")

    # 4. Update
    updated = await repo.update("fac_01", {"name": "Dr. Ramesh Kumar", "max_weekly_hours": 12})
    assert updated["name"] == "Dr. Ramesh Kumar"
    assert updated["max_weekly_hours"] == 12

    # Update nonexistent raises EntityNotFoundError
    with pytest.raises(EntityNotFoundError):
        await repo.update("fac_999", {"name": "Ghost"})

    # 5. List with filters
    all_fac = await repo.list_all(filters={"department_id": "dept_cse"})
    assert len(all_fac) == 1

    # 6. Delete
    deleted = await repo.delete("fac_01")
    assert deleted is True

    # Delete nonexistent raises EntityNotFoundError
    with pytest.raises(EntityNotFoundError):
        await repo.delete("fac_01")


@pytest.mark.anyio
async def test_allotment_referential_validation(mock_db):
    fac_repo = FacultyRepository()
    sub_repo = SubjectRepository()
    alt_repo = AllotmentRepository(faculty_repo=fac_repo, subject_repo=sub_repo)
    fac_repo.set_allotment_repo(alt_repo)

    # Attempt allotment when neither faculty nor subject exists
    alt_data = {
        "academic_year": "2026-2027",
        "semester": 5,
        "department_id": "dept_cse",
        "subject_id": "21CS51",
        "faculty_id": "fac_cse_01",
        "section": "A",
        "weekly_hours_allocated": 4,
    }

    # 1. Missing faculty fails
    with pytest.raises(RelationshipValidationError) as exc:
        await alt_repo.create("alt_01", alt_data)
    assert "faculty_id 'fac_cse_01' does not exist" in str(exc.value)

    # 2. Add faculty, but subject still missing
    await fac_repo.create("fac_cse_01", {
        "name": "Dr. Ananya",
        "email": "ananya@college.edu",
        "department_id": "dept_cse",
        "designation": "Associate Professor",
    })
    with pytest.raises(RelationshipValidationError) as exc:
        await alt_repo.create("alt_01", alt_data)
    assert "subject_id '21CS51' does not exist" in str(exc.value)

    # 3. Add subject -> creation succeeds
    await sub_repo.create("21CS51", {
        "code": "21CS51",
        "title": "Automata Theory",
        "department_id": "dept_cse",
        "semester": 5,
        "credits": 3,
        "subject_type": "THEORY",
        "weekly_hours": 4,
    })
    created_alt = await alt_repo.create("alt_01", alt_data)
    assert created_alt["id"] == "alt_01"

    # 4. Deleting referenced faculty is blocked by safe relationship check
    with pytest.raises(RelationshipValidationError) as exc:
        await fac_repo.delete("fac_cse_01")
    assert "active course allotments exist" in str(exc.value)


@pytest.mark.anyio
async def test_timetable_slot_relationship_checks(mock_db):
    tt_repo = TimetableRepository()
    fac_repo = FacultyRepository()
    sub_repo = SubjectRepository()
    room_repo = RoomRepository()
    lab_repo = LabRepository()
    slot_repo = TimetableSlotRepository(
        timetable_repo=tt_repo,
        faculty_repo=fac_repo,
        subject_repo=sub_repo,
        room_repo=room_repo,
        lab_repo=lab_repo,
    )

    slot_data = {
        "timetable_id": "tt_5a",
        "day": "MONDAY",
        "slot_number": 1,
        "start_time": "09:00",
        "end_time": "10:00",
        "subject_id": "21CS51",
        "faculty_id": "fac_01",
        "room_id": "room_301",
    }

    # Fails because timetable does not exist
    with pytest.raises(RelationshipValidationError) as exc:
        await slot_repo.create("s1", slot_data)
    assert "timetable_id 'tt_5a' does not exist" in str(exc.value)

    # Setup timetable, faculty, subject
    await tt_repo.create("tt_5a", {
        "academic_year": "2026-2027",
        "department_id": "dept_cse",
        "semester": 5,
        "section": "A",
    })
    await fac_repo.create("fac_01", {"name": "Prof A", "email": "a@vtu.edu", "department_id": "dept_cse", "designation": "Professor"})
    await sub_repo.create("21CS51", {"code": "21CS51", "title": "Automata", "department_id": "dept_cse", "semester": 5, "credits": 3, "weekly_hours": 4})

    # Fails because room does not exist
    with pytest.raises(RelationshipValidationError) as exc:
        await slot_repo.create("s1", slot_data)
    assert "room_id 'room_301' does not exist" in str(exc.value)

    # Create room -> succeeds
    await room_repo.create("room_301", {"name": "LH 301", "room_type": "CLASSROOM", "capacity": 60})
    created = await slot_repo.create("s1", slot_data)
    assert created["id"] == "s1"

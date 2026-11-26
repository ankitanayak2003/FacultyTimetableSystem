"""
Timetable Constraint Validation Engine for AQS.
Validates proposed schedules against all institutional, VTU, facility,
batch, and cross-department conflict rules.
"""

from typing import List, Dict, Any, Optional
from collections import defaultdict
from app.models.entities import (
    TimetableSlot,
    DayOfWeek,
    Subject,
    FacultyProfile,
    Room,
    Lab,
    Timetable,
)
from app.schemas.entities import TimetableValidationResponse


class ScheduleValidationEngine:
    """Rigorous constraint validator for timetable grids."""

    def validate_slots(
        self,
        slots: List[TimetableSlot],
        subjects_map: Dict[str, Subject],
        faculty_map: Dict[str, FacultyProfile],
        rooms_map: Dict[str, Room],
        labs_map: Dict[str, Lab],
        institutional_locked_slots: Optional[List[Dict[str, Any]]] = None,
        external_department_slots: Optional[List[TimetableSlot]] = None,
        lunch_period: int = 5,
    ) -> TimetableValidationResponse:
        """
        Validates a collection of timetable slots.
        Returns detailed list of clashes, warnings, and error messages.
        """
        clashes: List[Dict[str, Any]] = []
        messages: List[str] = []

        # Index structures for duplicate detection
        faculty_schedule = defaultdict(list)  # (faculty_id, day, slot_number) -> [slot]
        room_schedule = defaultdict(list)     # (room_id, day, slot_number) -> [slot]
        lab_schedule = defaultdict(list)      # (lab_id, day, slot_number) -> [slot]
        section_schedule = defaultdict(list)  # (day, slot_number, batch) -> [slot]
        practical_sessions = defaultdict(list)  # practical_session_id -> [slots]
        faculty_hours = defaultdict(int)

        # 1. Index external department slots (e.g. Basic Science faculty teaching in other branches)
        if external_department_slots:
            for ex_slot in external_department_slots:
                faculty_schedule[(ex_slot.faculty_id, ex_slot.day, ex_slot.slot_number)].append(ex_slot)
                faculty_hours[ex_slot.faculty_id] += 1
                if ex_slot.room_id:
                    room_schedule[(ex_slot.room_id, ex_slot.day, ex_slot.slot_number)].append(ex_slot)
                if ex_slot.lab_id:
                    lab_schedule[(ex_slot.lab_id, ex_slot.day, ex_slot.slot_number)].append(ex_slot)

        # 2. Process all current timetable slots
        for slot in slots:
            sub = subjects_map.get(slot.subject_id)
            fac = faculty_map.get(slot.faculty_id)
            rm = rooms_map.get(slot.room_id) if slot.room_id else None
            lb = labs_map.get(slot.lab_id) if slot.lab_id else None

            sub_title = sub.course_name if sub else slot.subject_id
            fac_name = fac.name if fac else slot.faculty_id

            # Lunch Period Check
            if slot.slot_number == lunch_period:
                clashes.append({
                    "type": "LUNCH_PERIOD_VIOLATION",
                    "severity": "ERROR",
                    "slot_id": slot.id,
                    "message": f"Session for '{sub_title}' scheduled during institutional lunch break (Period {lunch_period}).",
                })

            # Check Faculty Double-Booking
            f_key = (slot.faculty_id, slot.day, slot.slot_number)
            existing_f = faculty_schedule[f_key]
            if existing_f:
                clashes.append({
                    "type": "FACULTY_DOUBLE_BOOKING",
                    "severity": "ERROR",
                    "faculty_id": slot.faculty_id,
                    "day": slot.day.value,
                    "slot_number": slot.slot_number,
                    "message": (
                        f"Faculty '{fac_name}' is double-booked on {slot.day.value} at Period {slot.slot_number} "
                        f"across sessions or departments."
                    ),
                })
            faculty_schedule[f_key].append(slot)
            faculty_hours[slot.faculty_id] += 1

            # Check Classroom Double-Booking
            if slot.room_id:
                r_key = (slot.room_id, slot.day, slot.slot_number)
                existing_r = room_schedule[r_key]
                if existing_r:
                    rm_name = rm.name if rm else slot.room_id
                    clashes.append({
                        "type": "ROOM_DOUBLE_BOOKING",
                        "severity": "ERROR",
                        "room_id": slot.room_id,
                        "day": slot.day.value,
                        "slot_number": slot.slot_number,
                        "message": f"Classroom '{rm_name}' is double-booked on {slot.day.value} at Period {slot.slot_number}.",
                    })
                room_schedule[r_key].append(slot)

            # Check Laboratory Double-Booking & Suitability
            if slot.lab_id:
                l_key = (slot.lab_id, slot.day, slot.slot_number)
                existing_l = lab_schedule[l_key]
                if existing_l:
                    lb_name = lb.name if lb else slot.lab_id
                    clashes.append({
                        "type": "LAB_DOUBLE_BOOKING",
                        "severity": "ERROR",
                        "lab_id": slot.lab_id,
                        "day": slot.day.value,
                        "slot_number": slot.slot_number,
                        "message": f"Laboratory '{lb_name}' is assigned to multiple batches or sessions on {slot.day.value} Period {slot.slot_number}.",
                    })
                lab_schedule[l_key].append(slot)

                # Validate Lab Availability
                if lb:
                    if lb.availability_status in ("MAINTENANCE", "UNAVAILABLE") or not lb.is_available:
                        clashes.append({
                            "type": "LAB_UNAVAILABLE",
                            "severity": "ERROR",
                            "lab_id": slot.lab_id,
                            "message": f"Laboratory '{lb.name}' is under maintenance/unavailable and cannot be assigned.",
                        })

                    # Validate Lab Capacity against Batch Size
                    batch_size = slot.batch_student_count or 30
                    if batch_size > lb.capacity:
                        clashes.append({
                            "type": "LAB_CAPACITY_EXCEEDED",
                            "severity": "ERROR",
                            "lab_id": slot.lab_id,
                            "batch": slot.batch,
                            "message": f"Batch size ({batch_size}) exceeds laboratory '{lb.name}' capacity ({lb.capacity}).",
                        })

            # Check Student Batch Conflicts
            batch_id = slot.batch or "WHOLE_SECTION"
            s_key = (slot.day, slot.slot_number, batch_id)
            existing_s = section_schedule[s_key]
            if existing_s:
                clashes.append({
                    "type": "BATCH_OVERLAP",
                    "severity": "ERROR",
                    "day": slot.day.value,
                    "slot_number": slot.slot_number,
                    "batch": batch_id,
                    "message": f"Student batch '{batch_id}' has overlapping sessions on {slot.day.value} Period {slot.slot_number}.",
                })
            section_schedule[s_key].append(slot)

            # If slot is whole class, check clash with any active sub-batch
            if batch_id == "WHOLE_SECTION":
                for b_name in ("B1", "B2", "B3", "B4"):
                    sub_key = (slot.day, slot.slot_number, b_name)
                    if sub_key in section_schedule:
                        clashes.append({
                            "type": "SECTION_BATCH_COLLISION",
                            "severity": "ERROR",
                            "day": slot.day.value,
                            "slot_number": slot.slot_number,
                            "message": f"Whole class lecture collides with parallel practical batch '{b_name}'.",
                        })

            # Track practical sessions for consecutive period checks
            if slot.is_lab and slot.practical_session_id:
                practical_sessions[slot.practical_session_id].append(slot)

            # Unresolved Laboratory Allocation Check
            if slot.allocation_status == "PENDING_LAB_ALLOCATION":
                clashes.append({
                    "type": "PENDING_LAB_ALLOCATION",
                    "severity": "WARNING",
                    "slot_id": slot.id,
                    "message": f"Practical session for '{sub_title}' is pending laboratory assignment.",
                })

        # 3. Check Consecutive Periods for Practical Sessions
        for sess_id, sess_slots in practical_sessions.items():
            if len(sess_slots) < 2:
                clashes.append({
                    "type": "NON_CONSECUTIVE_PRACTICAL",
                    "severity": "ERROR",
                    "practical_session_id": sess_id,
                    "message": f"Practical session '{sess_id}' requires consecutive periods but has only {len(sess_slots)} slot.",
                })
            else:
                sorted_slots = sorted(sess_slots, key=lambda s: s.slot_number)
                for i in range(len(sorted_slots) - 1):
                    s1, s2 = sorted_slots[i], sorted_slots[i + 1]
                    if s2.slot_number != s1.slot_number + 1:
                        clashes.append({
                            "type": "NON_CONSECUTIVE_PRACTICAL",
                            "severity": "ERROR",
                            "practical_session_id": sess_id,
                            "message": (
                                f"Practical session '{sess_id}' is split non-consecutively "
                                f"between Period {s1.slot_number} and Period {s2.slot_number}."
                            ),
                        })
                    if s1.lab_id != s2.lab_id:
                        clashes.append({
                            "type": "LAB_CHANGE_DURING_SESSION",
                            "severity": "ERROR",
                            "practical_session_id": sess_id,
                            "message": f"Practical session '{sess_id}' changes labs mid-session ({s1.lab_id} -> {s2.lab_id}).",
                        })

        # 4. Check Faculty Workload Limits
        for fac_id, total_h in faculty_hours.items():
            fac = faculty_map.get(fac_id)
            if fac and total_h > fac.max_weekly_hours:
                clashes.append({
                    "type": "FACULTY_OVERLOAD",
                    "severity": "WARNING",
                    "faculty_id": fac_id,
                    "total_hours": total_h,
                    "max_hours": fac.max_weekly_hours,
                    "message": f"Faculty '{fac.name}' is assigned {total_h} hours, exceeding maximum workload limit ({fac.max_weekly_hours}h).",
                })

        # 5. Check Dean-Locked Slots Preservation
        if institutional_locked_slots:
            for locked in institutional_locked_slots:
                l_day = locked.get("day")
                l_period = locked.get("slot_number") or locked.get("startPeriod")
                matching = [s for s in slots if s.day.value == l_day and s.slot_number == l_period]
                if not matching:
                    clashes.append({
                        "type": "DEAN_LOCK_VIOLATION",
                        "severity": "ERROR",
                        "message": f"Dean-locked institutional slot '{locked.get('name')}' is missing on {l_day} Period {l_period}.",
                    })

        error_count = sum(1 for c in clashes if c.get("severity") == "ERROR")
        warning_count = sum(1 for c in clashes if c.get("severity") == "WARNING")
        is_valid = error_count == 0

        if is_valid:
            messages.append("Schedule passed all conflict and facility validation rules without errors.")
        else:
            messages.append(f"Validation failed with {error_count} hard conflict errors and {warning_count} warnings.")

        return TimetableValidationResponse(
            is_valid=is_valid,
            error_count=error_count,
            warning_count=warning_count,
            clashes=clashes,
            messages=messages,
        )


schedule_validator = ScheduleValidationEngine()

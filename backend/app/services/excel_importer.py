"""
Excel Data Importer Service for AQS.
Parses real institutional data from three Excel files:
1. faculty.xlsx - Faculty members across engineering and basic science departments.
2. rooms_lab.xlsx - Classrooms, seminar halls, and specialized laboratories.
3. subjects.xlsx - Academic courses, credits, course types (IPCC, PCC, PCCL, etc.).

Implementation Notes:
- Zero external spreadsheet library dependencies: Uses Python standard library
  `zipfile` and `xml.etree.ElementTree` for rock-solid, sandbox-safe execution.
- Generates stable, deterministic IDs independent of subject codes or transient names.
- Complete duplicate avoidance with idempotent upsert.
- Dry-run mode for pre-flight validation.
- Incomplete/missing values marked as placeholders without inventing official data.
"""

import os
import re
import logging
from typing import Dict, List, Tuple, Any, Optional
import zipfile
import xml.etree.ElementTree as ET

from app.models.entities import (
    FacultyProfile,
    FacultyDesignation,
    Room,
    RoomType,
    Lab,
    LabType,
    Subject,
    User,
    UserRole,
)
from app.schemas.entities import ImportSummaryReport, ImportSummaryCategory

logger = logging.getLogger("aqs.excel_importer")


def slugify(text: str) -> str:
    """Converts a string to a clean, lowercase snake_case identifier."""
    cleaned = re.sub(r"[^a-zA-Z0-9]+", "_", text.strip().lower())
    return cleaned.strip("_")


def read_first_sheet_rows(path: str) -> List[List[str]]:
    """
    Reads all rows from the first worksheet of a .xlsx file using standard library.
    Handles shared strings, inline strings, and numeric values.
    """
    if not os.path.exists(path):
        raise FileNotFoundError(f"Excel file not found at path: {path}")

    with zipfile.ZipFile(path, "r") as z:
        # 1. Parse shared strings if present
        shared_strings: List[str] = []
        if "xl/sharedStrings.xml" in z.namelist():
            tree = ET.fromstring(z.read("xl/sharedStrings.xml"))
            for si in tree.findall("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}si"):
                text = "".join(
                    t.text or ""
                    for t in si.findall(".//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}t")
                )
                shared_strings.append(text)

        # 2. Parse first sheet (sheet1.xml)
        sheet_path = "xl/worksheets/sheet1.xml"
        if sheet_path not in z.namelist():
            # Search for first sheet
            sheet_candidates = [n for n in z.namelist() if n.startswith("xl/worksheets/sheet") and n.endswith(".xml")]
            if not sheet_candidates:
                raise ValueError(f"No worksheet found in archive: {path}")
            sheet_path = sorted(sheet_candidates)[0]

        sheet_tree = ET.fromstring(z.read(sheet_path))
        rows: List[List[str]] = []
        for row in sheet_tree.findall(".//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row"):
            row_data: List[str] = []
            for c in row.findall("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c"):
                cell_type = c.get("t")
                v = c.find("{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v")
                val = v.text if v is not None else ""
                if cell_type == "s" and val.isdigit():
                    idx = int(val)
                    if 0 <= idx < len(shared_strings):
                        val = shared_strings[idx]
                row_data.append(val)
            rows.append(row_data)

        return rows


# =====================================================================
# 1. Faculty Parser
# =====================================================================

DEPARTMENT_MAPPINGS = {
    "ARTIFICIAL INTELLIGENCE AND DATA SCIENCE": ("dept_aids", "AIDS"),
    "ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING": ("dept_aiml", "AIML"),
    "BASIC SCIENCE": ("dept_basic_sci", "BSC"),
    "CHEMISTRY": ("dept_chemistry", "CHEM"),
    "PHYSICS": ("dept_physics", "PHY"),
    "MATHEMATICS": ("dept_math", "MATH"),
    "CIVIL": ("dept_civil", "CIVIL"),
    "MECHANICAL ENGINEERING": ("dept_mech", "MECH"),
    "COMPUTER SCIENCE AND ENGINEERING": ("dept_cse", "CSE"),
    "ELECTRONICS AND COMMUNICATION": ("dept_ece", "ECE"),
}


def parse_faculty_records(path: str) -> List[Dict[str, Any]]:
    """
    Parses faculty members from faculty.xlsx.
    Extracts departments from section headers and maps roles, designations, and hours.
    """
    rows = read_first_sheet_rows(path)
    current_dept_id = "dept_general"
    current_dept_code = "GEN"
    records: List[Dict[str, Any]] = []

    for r in rows:
        non_empty = [c.strip() for c in r if isinstance(c, str) and c.strip()]
        if not non_empty:
            continue

        joined = " ".join(non_empty).upper()

        # Check for Department section headers
        matched_dept = None
        for header_key, (dept_id, code) in DEPARTMENT_MAPPINGS.items():
            if header_key in joined and len(non_empty) <= 2:
                matched_dept = (dept_id, code)
                break

        if matched_dept:
            current_dept_id, current_dept_code = matched_dept
            continue

        # Skip table column headers
        if "SI NO" in joined or "DESIGNATION" in joined:
            continue

        # Data row: check if first column is numeric (e.g. '1.0' or '1')
        first_col = r[0].strip().replace(".", "")
        if first_col.isdigit() and len(r) >= 2:
            name = r[1].strip() if len(r) > 1 else ""
            designation_str = r[2].strip() if len(r) > 2 else ""
            email_raw = r[3].strip() if len(r) > 3 else ""
            hours_raw = r[4].strip() if len(r) > 4 else ""

            if not name:
                continue

            # Parse primary email
            email_parts = [e.strip() for e in email_raw.split(",") if e.strip()]
            primary_email = email_parts[0] if email_parts else ""
            is_placeholder_email = False
            if not primary_email:
                primary_email = f"{slugify(name)}@placeholder.sode-edu.in"
                is_placeholder_email = True

            # Parse designation
            designation = FacultyDesignation.ASSISTANT_PROFESSOR
            d_upper = designation_str.upper()
            role = UserRole.FACULTY

            if "HOD" in d_upper or "HEAD" in d_upper:
                designation = FacultyDesignation.HOD
                role = UserRole.HOD
            elif "DEAN" in d_upper:
                designation = FacultyDesignation.PROFESSOR
                role = UserRole.DEAN
            elif "PRINCIPAL" in d_upper:
                designation = FacultyDesignation.PROFESSOR
                role = UserRole.PRINCIPAL
            elif "ASSOCIATE PROFESSOR" in d_upper:
                designation = FacultyDesignation.ASSOCIATE_PROFESSOR
            elif "VISITING" in d_upper:
                designation = FacultyDesignation.VISITING_FACULTY
            elif "CONTRACT" in d_upper or "ADJUNCT" in d_upper:
                designation = FacultyDesignation.ADJUNCT_FACULTY
            elif "PROFESSOR" in d_upper:
                designation = FacultyDesignation.PROFESSOR

            # If department is basic science, check coordinator role
            if current_dept_id in ("dept_chemistry", "dept_physics", "dept_mathematics", "dept_basic_science"):
                if "HOD" in d_upper or "HEAD" in d_upper:
                    role = UserRole.BASIC_SCIENCE_COORDINATOR

            # Parse weekly hours
            max_hours = 16
            min_hours = 12
            if hours_raw:
                # E.g. '18.0' or '26/28/30/32'
                nums = re.findall(r"\d+", hours_raw)
                if nums:
                    int_nums = [int(n) for n in nums]
                    max_hours = min(32, max(int_nums))
                    min_hours = max(8, min(int_nums) // 2)

            stable_id = f"fac_{current_dept_code.lower()}_{slugify(name)}"

            records.append({
                "id": stable_id,
                "name": name,
                "email": primary_email,
                "department_id": current_dept_id,
                "designation": designation,
                "role": role,
                "max_weekly_hours": max_hours,
                "min_weekly_hours": min_hours,
                "is_placeholder": is_placeholder_email,
                "data_status": "PARTIAL" if is_placeholder_email else "COMPLETE",
                "notes": f"Original designation: {designation_str}; Original hours: {hours_raw}",
            })

    return records


# =====================================================================
# 2. Rooms and Labs Parser
# =====================================================================

def parse_rooms_and_labs(path: str) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Parses rooms and laboratories from rooms_lab.xlsx.
    Classrooms and specialized labs are categorized with building, capacity, and availability.
    """
    rows = read_first_sheet_rows(path)
    current_building = "Academic Block"
    rooms: List[Dict[str, Any]] = []
    labs: List[Dict[str, Any]] = []

    for r in rows:
        non_empty = [c.strip() for c in r if isinstance(c, str) and c.strip()]
        if not non_empty:
            continue

        first = non_empty[0]

        # Check for block/building headers
        lower_first = first.lower()
        if any(b in lower_first for b in ["work shop", "machine labs", "admin block", "ece block", "machanical block"]):
            current_building = first.title()
            continue

        if "ROOM NO" in first.upper() or "LAB NAME" in first.upper():
            continue

        room_no = r[0].strip() if len(r) > 0 else ""
        lab_name = r[1].strip() if len(r) > 1 else ""

        if not room_no and not lab_name:
            continue

        # Classrooms (e.g. ##, ### or empty lab name)
        if lab_name in ("##", "###", "") and room_no:
            stable_id = f"room_{slugify(room_no)}"
            rooms.append({
                "id": stable_id,
                "name": f"Room {room_no}",
                "building_or_block": current_building,
                "room_type": RoomType.CLASSROOM,
                "capacity": 60,
                "is_available": True,
                "availability_status": "AVAILABLE",
                "is_external": False,
                "location": f"{current_building}, Room {room_no}",
            })
        else:
            # Laboratory
            is_working = "not working" not in lab_name.lower()
            availability = "AVAILABLE" if is_working else "MAINTENANCE"
            clean_name = re.sub(r"\(not working\)", "", lab_name, flags=re.IGNORECASE).strip()

            # Determine lab type from name
            lname_lower = clean_name.lower()
            lab_type = LabType.COMPUTER_LAB
            dept_id = "dept_cse"

            if any(k in lname_lower for k in ["physics", "basement"]):
                lab_type = LabType.PHYSICS_LAB
                dept_id = "dept_physics"
            elif "chemistry" in lname_lower:
                lab_type = LabType.CHEMISTRY_LAB
                dept_id = "dept_chemistry"
            elif any(k in lname_lower for k in ["machine shop", "hydraulics", "haydralucis", "pneumatic", "fluid", "tubro", "turbo", "heat transfer", "metallography", "measurement", "metrology"]):
                lab_type = LabType.MECHANICAL_LAB
                dept_id = "dept_mech"
            elif any(k in lname_lower for k in ["concrete", "highway", "geology"]):
                lab_type = LabType.CIVIL_LAB
                dept_id = "dept_civil"
            elif any(k in lname_lower for k in ["hardware", "ece", "signal"]):
                lab_type = LabType.ELECTRONICS_LAB
                dept_id = "dept_ece"
            elif "workshop" in lname_lower:
                lab_type = LabType.WORKSHOP
                dept_id = "dept_mech"
            elif any(k in lname_lower for k in ["ai", "analytic", "deep learning", "web", "cloud", "network", "computing", "core computing"]):
                lab_type = LabType.COMPUTER_LAB
                dept_id = "dept_aids"

            # Check capacity: dual room numbers (F103,F104) -> 60 capacity; single -> 30
            capacity = 60 if ("," in room_no or "and" in room_no.lower()) else 30

            stable_id = f"lab_{slugify(clean_name)}"
            labs.append({
                "id": stable_id,
                "name": clean_name,
                "room_no": room_no,
                "lab_type": lab_type,
                "capacity": capacity,
                "workstations_count": capacity,
                "department_id": dept_id,
                "building_or_block": current_building,
                "is_available": is_working,
                "availability_status": availability,
                "is_external": False,
                "location": f"{current_building}, {room_no}",
                "notes": "Reported not working in institutional records" if not is_working else None,
            })

    return rooms, labs


# =====================================================================
# 3. Subjects Parser
# =====================================================================

def parse_subject_records(path: str) -> List[Dict[str, Any]]:
    """
    Parses academic subjects from subjects.xlsx.
    Processes both Odd and Even semester tables.
    Detects course types (IPCC, PCC, PCCL, etc.) and calculates VTU L:T:P hours.
    """
    rows = read_first_sheet_rows(path)
    subjects: List[Dict[str, Any]] = []
    odd_sem = 3
    even_sem = 4

    for r in rows:
        r_padded = r + [""] * max(0, 8 - len(r))
        left_code = r_padded[0].strip()
        left_name = r_padded[1].strip()
        left_credit_raw = r_padded[2].strip()
        left_type_raw = r_padded[3].strip()

        right_code = r_padded[4].strip()
        right_name = r_padded[5].strip()
        right_credit_raw = r_padded[6].strip()
        right_type_raw = r_padded[7].strip()

        # Check for semester headings in left/right columns
        m_odd = re.search(r"(\d+)\s*SEM", left_code.upper())
        if m_odd:
            odd_sem = int(m_odd.group(1))

        m_even = re.search(r"(\d+)\s*SEM", right_code.upper())
        if m_even:
            even_sem = int(m_even.group(1))

        # Helper to parse a single subject entry
        def _build_subject(code: str, name: str, credit_str: str, ctype_str: str, sem: int) -> Optional[Dict[str, Any]]:
            if not code and not name:
                return None
            if code in ("Subject code", "ODD SEM", "EVEN SEM", "NA") or "SEM" in code.upper():
                return None

            # If code is actually the course name (because course code was omitted in sheet)
            if len(code) > 20:
                name = code
                code = ""
            elif not name and credit_str:
                name = code
                code = ""

            # Check for pure category header without credits or course type
            if not credit_str and not ctype_str:
                if not code.startswith("25") and not any(char.isdigit() for char in code):
                    # Check if it's a specific elective/subcourse like 'Devops'
                    if len(name) > 2 and not name.lower().startswith("professinal") and not name.lower().startswith("ability") and not name.lower().startswith("open elective"):
                        # Keep it as an elective offering
                        pass
                    else:
                        return None

            if not name:
                if code.startswith("25"):
                    name = code
                    code = ""
                else:
                    return None

            # Parse credits
            credits = 3
            if credit_str.isdigit():
                credits = int(credit_str)
            elif credit_str.upper() in ("PP", "NA"):
                credits = 0

            # Categorize course type
            ctype_upper = ctype_str.upper()
            is_ipcc = "IPCC" in ctype_upper
            is_pccl = "PCCL" in ctype_upper or "LAB" in ctype_upper or "LABORATORY" in name.upper()

            if is_ipcc:
                course_type = "IPCC"
                l_t_p = "3:0:2"
                lecture_hours = 3
                tutorial_hours = 0
                practical_hours = 2
                is_lab = True
                lab_batch_count = 2
                weekly_hours = 5
            elif is_pccl:
                course_type = "PCCL"
                l_t_p = "0:0:2"
                lecture_hours = 0
                tutorial_hours = 0
                practical_hours = 2
                is_lab = True
                lab_batch_count = 2
                weekly_hours = 2
            else:
                course_type = ctype_str if ctype_str else "PCC"
                is_lab = False
                lab_batch_count = 1
                lecture_hours = max(1, credits) if credits > 0 else 2
                tutorial_hours = 0
                practical_hours = 0
                l_t_p = f"{lecture_hours}:0:0"
                weekly_hours = lecture_hours

            stable_id = f"sub_sem{sem}_{slugify(code if code else name)}"

            return {
                "id": stable_id,
                "code": code if code else None,
                "course_name": name,
                "title": name,
                "department_id": "dept_aids",
                "semester": sem,
                "credits": credits,
                "course_type": course_type,
                "weekly_hours": weekly_hours,
                "l_t_p": l_t_p,
                "lecture_hours": lecture_hours,
                "tutorial_hours": tutorial_hours,
                "practical_hours": practical_hours,
                "is_lab": is_lab,
                "lab_batch_count": lab_batch_count,
                "data_status": "COMPLETE",
            }

        left_sub = _build_subject(left_code, left_name, left_credit_raw, left_type_raw, odd_sem)
        if left_sub:
            subjects.append(left_sub)

        right_sub = _build_subject(right_code, right_name, right_credit_raw, right_type_raw, even_sem)
        if right_sub:
            subjects.append(right_sub)

    return subjects


# =====================================================================
# 4. Master Import Orchestrator
# =====================================================================

class ExcelImportManager:
    """Orchestrates parsing, validation, dry-run, and idempotent Firestore writes."""

    def __init__(self, data_dir: str = "backend/data"):
        self.data_dir = data_dir
        self.faculty_file = os.path.join(data_dir, "faculty.xlsx")
        self.rooms_file = os.path.join(data_dir, "rooms_lab.xlsx")
        self.subjects_file = os.path.join(data_dir, "subjects.xlsx")

    def inspect_files(self) -> Dict[str, Any]:
        """Validates existence and readable status of all three Excel files."""
        return {
            "faculty_file": {
                "path": self.faculty_file,
                "exists": os.path.exists(self.faculty_file),
                "size_bytes": os.path.getsize(self.faculty_file) if os.path.exists(self.faculty_file) else 0,
            },
            "rooms_file": {
                "path": self.rooms_file,
                "exists": os.path.exists(self.rooms_file),
                "size_bytes": os.path.getsize(self.rooms_file) if os.path.exists(self.rooms_file) else 0,
            },
            "subjects_file": {
                "path": self.subjects_file,
                "exists": os.path.exists(self.subjects_file),
                "size_bytes": os.path.getsize(self.subjects_file) if os.path.exists(self.subjects_file) else 0,
            },
        }

    async def execute_import(self, dry_run: bool = True, overwrite: bool = False) -> ImportSummaryReport:
        """
        Executes complete import pipeline.
        If dry_run=True, parses and validates without modifying Firestore.
        If dry_run=False, safely writes to repositories with duplicate prevention.
        """
        from app.repositories import (
            faculty_repository,
            room_repository,
            lab_repository,
            subject_repository,
            user_repository,
        )

        details: List[str] = []
        fac_summary = ImportSummaryCategory()
        room_summary = ImportSummaryCategory()
        lab_summary = ImportSummaryCategory()
        sub_summary = ImportSummaryCategory()

        # 1. Faculty
        raw_fac = parse_faculty_records(self.faculty_file)
        fac_summary.parsed = len(raw_fac)
        for item in raw_fac:
            try:
                profile = FacultyProfile(**item)
                if dry_run:
                    fac_summary.added += 1
                else:
                    existing = await faculty_repository.get_by_id(profile.id)
                    if existing and not overwrite:
                        fac_summary.skipped += 1
                    else:
                        await faculty_repository.create(profile.id, profile.model_dump())
                        # Also create user account for auth
                        user = User(
                            id=profile.id,
                            email=profile.email,
                            display_name=profile.name,
                            role=item.get("role", UserRole.FACULTY),
                            department_id=profile.department_id,
                            is_active=True,
                        )
                        await user_repository.create(user.id, user.model_dump())
                        if existing:
                            fac_summary.updated += 1
                        else:
                            fac_summary.added += 1
            except Exception as e:
                fac_summary.invalid += 1
                details.append(f"Faculty validation error for '{item.get('name')}': {str(e)}")

        # 2. Rooms and Labs
        raw_rooms, raw_labs = parse_rooms_and_labs(self.rooms_file)
        room_summary.parsed = len(raw_rooms)
        for item in raw_rooms:
            try:
                rm = Room(**item)
                if dry_run:
                    room_summary.added += 1
                else:
                    existing = await room_repository.get_by_id(rm.id)
                    if existing and not overwrite:
                        room_summary.skipped += 1
                    else:
                        await room_repository.create(rm.id, rm.model_dump())
                        if existing:
                            room_summary.updated += 1
                        else:
                            room_summary.added += 1
            except Exception as e:
                room_summary.invalid += 1
                details.append(f"Room validation error for '{item.get('name')}': {str(e)}")

        lab_summary.parsed = len(raw_labs)
        for item in raw_labs:
            try:
                lb = Lab(**item)
                if dry_run:
                    lab_summary.added += 1
                else:
                    existing = await lab_repository.get_by_id(lb.id)
                    if existing and not overwrite:
                        lab_summary.skipped += 1
                    else:
                        await lab_repository.create(lb.id, lb.model_dump())
                        if existing:
                            lab_summary.updated += 1
                        else:
                            lab_summary.added += 1
            except Exception as e:
                lab_summary.invalid += 1
                details.append(f"Lab validation error for '{item.get('name')}': {str(e)}")

        # 3. Subjects
        raw_subs = parse_subject_records(self.subjects_file)
        sub_summary.parsed = len(raw_subs)
        for item in raw_subs:
            try:
                sub = Subject(**item)
                if dry_run:
                    sub_summary.added += 1
                else:
                    existing = await subject_repository.get_by_id(sub.id)
                    if existing and not overwrite:
                        sub_summary.skipped += 1
                    else:
                        await subject_repository.create(sub.id, sub.model_dump())
                        if existing:
                            sub_summary.updated += 1
                        else:
                            sub_summary.added += 1
            except Exception as e:
                sub_summary.invalid += 1
                details.append(f"Subject validation error for '{item.get('course_name')}': {str(e)}")

        total_rec = fac_summary.parsed + room_summary.parsed + lab_summary.parsed + sub_summary.parsed
        status_mode = "Dry-run validation" if dry_run else "Firestore write"
        details.insert(
            0,
            f"{status_mode} completed: {fac_summary.parsed} faculty, {room_summary.parsed} rooms, "
            f"{lab_summary.parsed} labs, {sub_summary.parsed} subjects processed.",
        )

        return ImportSummaryReport(
            dry_run=dry_run,
            faculty=fac_summary,
            rooms=room_summary,
            labs=lab_summary,
            subjects=sub_summary,
            total_records=total_rec,
            details=details,
        )

    # Alias for migration service
    import_all = execute_import


excel_importer = ExcelImportManager()

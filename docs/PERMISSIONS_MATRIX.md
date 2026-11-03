# Role-Based Access Control (RBAC) & Authorization Matrix

This document defines the server-enforced access control policies, department scoping rules, and permissions matrix for the VTU Faculty Workload & Timetable Management System.

---

## 1. User Roles Overview

The system defines six hierarchical user roles:

| Role | Role Level | Scope | Description |
| :--- | :---: | :--- | :--- |
| **`ADMIN`** | System | Cross-Department | Full administrative access. Provisions coordinator/admin accounts, manages global facilities, monitors overall system health. |
| **`CHIEF_COORDINATOR`** | College | Cross-Department | Academic Dean / Chief Timetable Officer. Manages scheduling policies across all departments, reviews drafts, and approves final timetable publication. |
| **`HOD`** | Department | Own Department | Head of Department. Approves faculty allotments, validates department curriculum, oversees departmental timetable creation. |
| **`DEPARTMENT_COORDINATOR`** | Department | Own Department | Department Timetable Coordinator. Enters faculty profiles, subjects, allotments, creates draft timetables, and schedules slots. |
| **`FACULTY`** | Department / Personal | Own Department | Teaching faculty. Views department curriculum, subject allotments, own workload analysis, and published schedules. |
| **`STUDENT_VIEWER`** | Public / Student | Global (Published Only) | Students and unauthenticated viewers. Read-only access strictly restricted to finalized **`PUBLISHED`** timetables. |

---

## 2. Authentication & Identity Resolution Pipeline

1. **Bearer Token Verification**:
   - HTTP clients must supply a valid Firebase ID token in the `Authorization: Bearer <token>` header.
   - Verified cryptographically by the Firebase Admin SDK (`auth.verify_id_token`).
   - Missing, malformed, or expired tokens immediately return **HTTP 401 Unauthorized**.

2. **Server-Managed Profile Lookup**:
   - The token's verified `uid` is queried against the authoritative Firestore `users` collection.
   - If the user record is missing, returns **HTTP 401 Unauthorized** (Unknown user profile).
   - If the user record has `is_active == False`, returns **HTTP 403 Forbidden** (Inactive account).

3. **Trust No Client Claims**:
   - Caller-supplied headers (e.g. `X-Actor-Role`), request body fields, or query parameters claiming roles or elevated identity are completely ignored.
   - Role and department assignment are strictly extracted from the trusted Firestore user profile.

---

## 3. Department Scoping Enforcement

- **Department Scoping**: For non-administrative roles (`HOD`, `DEPARTMENT_COORDINATOR`, `FACULTY`), every API operation is scoped to `auth_ctx.department_id`.
- **Cross-Department Denial**: Any request attempting to query, create, update, or delete a resource belonging to another department is rejected with **HTTP 403 Forbidden**.
- **Resource Ownership Validation**: On updates and deletions, the system verifies the *existing stored document's* department ownership, preventing attackers from modifying resources merely by altering payload fields.

---

## 4. Permissions Matrix by Collection

| Collection / Resource | Action | ADMIN / CHIEF | HOD / DEPT_COORD | FACULTY | STUDENT_VIEWER | Notes & Integrity Checks |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **`users`** | Create Coordinator/Admin | ✅ | ❌ | ❌ | ❌ | HTTP 403 if non-admin attempts elevation. |
| | Create Faculty/Student | ✅ | ✅ (Own Dept) | ❌ | ❌ | Public self-registration cannot create privileged roles. |
| | Read / List Users | ✅ | ✅ (Own Dept) | ❌ | ❌ | Scoped to own department for coordinators. |
| | Update User | ✅ | ✅ (Own Dept) | ❌ | ❌ | Users cannot elevate their own role or status. |
| | Delete User | ✅ | ❌ | ❌ | ❌ | Only administrators can delete user accounts. |
| **`faculty`** | Create Profile | ✅ | ✅ (Own Dept) | ❌ | ❌ | Validates department assignment. |
| | Read / List Profile | ✅ | ✅ (Own Dept) | ✅ (Own Dept) | ❌ | Private faculty data hidden from students. |
| | Update Profile | ✅ | ✅ (Own Dept) | ❌ | ❌ | Validates department ownership. |
| | Delete Profile | ✅ | ✅ (Own Dept) | ❌ | ❌ | Blocked (409) if referenced in allotments or timetable slots. |
| **`subjects`** | Create Subject | ✅ | ✅ (Own Dept) | ❌ | ❌ | Validates department assignment. |
| | Read / List Subjects | ✅ | ✅ | ✅ | ❌ | Authenticated read for faculty/coordinators. |
| | Update Subject | ✅ | ✅ (Own Dept) | ❌ | ❌ | Department scoped. |
| | Delete Subject | ✅ | ✅ (Own Dept) | ❌ | ❌ | Blocked (409) if referenced in allotments or timetable slots. |
| **`rooms`** | Create Room | ✅ | ✅ | ❌ | ❌ | Validates capacity and room type. |
| | Read / List Rooms | ✅ | ✅ | ✅ | ❌ | Authenticated read. |
| | Update / Delete Room | ✅ | ✅ | ❌ | ❌ | Blocked if active slots are scheduled. |
| **`labs`** | Create Lab | ✅ | ✅ (Own Dept) | ❌ | ❌ | Validates department ownership. |
| | Read / List Labs | ✅ | ✅ | ✅ | ❌ | Authenticated read. |
| | Update / Delete Lab | ✅ | ✅ (Own Dept) | ❌ | ❌ | Blocked if active slots are scheduled. |
| **`allotments`** | Create Allotment | ✅ | ✅ (Own Dept) | ❌ | ❌ | Validates foreign references: `faculty_id` and `subject_id`. |
| | Read / List Allotments | ✅ | ✅ (Own Dept) | ✅ (Own Dept) | ❌ | Read-only for faculty. |
| | Update Allotment | ✅ | ✅ (Own Dept) | ❌ | ❌ | Re-validates changed `faculty_id` and `subject_id`. |
| | Delete Allotment | ✅ | ✅ (Own Dept) | ❌ | ❌ | Department scoped. |
| **`timetables`** | Create Timetable | ✅ | ✅ (Own Dept) | ❌ | ❌ | Initial status: `DRAFT`. |
| | Read Published | ✅ | ✅ | ✅ | ✅ | Students and anonymous users can view published timetables. |
| | Read Draft / In-Review | ✅ | ✅ (Own Dept) | ❌ | ❌ | **HTTP 404** returned to students (draft secrecy). |
| | Update Status / Publish | ✅ | ✅ (Own Dept) | ❌ | ❌ | Status transitions: `DRAFT` ➔ `REVIEW` ➔ `PUBLISHED`. |
| | Delete Timetable | ✅ | ✅ (Own Dept) | ❌ | ❌ | Blocked (409) if `PUBLISHED`. Cascade deletes child slots in chunks. |
| **`timetableSlots`** | Create Slot | ✅ | ✅ (Own Dept) | ❌ | ❌ | Validates FKs, facility compatibility, and room/faculty/section clashes. |
| | Read Slots | ✅ | ✅ (Own Dept) | ✅ (Own Dept) | ✅ (Published) | Slots hidden from students if parent timetable is not `PUBLISHED`. |
| | Update Slot | ✅ | ✅ (Own Dept) | ❌ | ❌ | Re-validates all references and scheduling conflicts. |
| | Delete Slot | ✅ | ✅ (Own Dept) | ❌ | ❌ | **Blocked (422)** if parent timetable is `PUBLISHED` (immutability). |
| **`workloadRecords`** | Create Record | ✅ | ✅ (Own Dept) | ❌ | ❌ | Total hours and overload flags are **server-derived** from allotments. |
| | Read / List Records | ✅ | ✅ (Own Dept) | ✅ (Own Dept) | ❌ | Student access strictly forbidden (HTTP 401/403). |
| | Update Record | ✅ | ✅ (Own Dept) | ❌ | ❌ | Overwrites client-supplied hours with authoritative calculations. |
| | Delete Record | ✅ | ✅ (Own Dept) | ❌ | ❌ | Department scoped. |

---

## 5. Timetable Slot Conflict & Facility Rules

Server-side validation enforces the following invariant checks before committing a slot write:

1. **Faculty Overlap**: A faculty member cannot be assigned to more than one slot in the same `(academic_year, day_of_week, period_number)`.
2. **Room / Lab Overlap**: A room or lab facility cannot be double-booked for the same `(day_of_week, period_number)`.
3. **Section Overlap**: A student section (e.g., CSE 5th Sem, Section A) cannot attend multiple sessions simultaneously unless split into distinct lab batches.
4. **Facility Type Compatibility**:
   - `LAB` subjects must be scheduled in a registered `Lab` facility (`lab_id`). Scheduling a lab course in a lecture room is rejected.
   - `THEORY` subjects must be scheduled in a lecture room (`room_id`). Scheduling theory in a lab is rejected unless explicitly configured.
5. **Published Immutability**:
   - Once a timetable's status is set to `PUBLISHED`, no slots can be added, modified, or deleted without explicitly reverting the timetable to `DRAFT`.

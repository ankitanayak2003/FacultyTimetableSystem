# System Architecture & Design Specification

## Project Title
**Faculty Workload & Timetable Management System** (VTU Engineering College)

## 1. Executive Summary
The Faculty Workload & Timetable Management System is designed specifically to address the academic scheduling and faculty workload distribution requirements of an engineering college affiliated with **Visvesvaraya Technological University (VTU)**.

The system handles complex constraints including:
- VTU credit system (Theory: 3-4 credits / 3-4 hours per week, Labs: 1-1.5 credits / 2-3 hours batch sessions).
- Faculty workload capping based on designation (Professor, Associate Professor, Assistant Professor, HOD).
- Room & laboratory allocation avoiding double-booking.
- Multi-section semester scheduling (e.g., 3rd, 5th, 7th semester batches, A/B/C sections).
- Faculty availability preferences and consecutive hour constraints.

---

## 2. Technology Stack & Architectural Layers

### Frontend (User Interface)
- **Framework**: React 18+ (bundled with Vite for high-speed HMR)
- **Styling**: Vanilla CSS with modern CSS custom properties (design tokens), flexbox/grid, glassmorphism, responsive administration layout.
- **Client Auth**: Firebase Web SDK for secure token retrieval (JWT).
- **Icons**: Lucide React for consistent, lightweight SVG iconography.

### Backend (API & Processing Engine)
- **Framework**: FastAPI (Python 3.10+)
- **Validation & Serialization**: Pydantic v2
- **Admin Authentication & DB Driver**: `firebase-admin` (Cloud Firestore & Firebase Auth token verification)
- **Scheduling Solver**: Google OR-Tools CP-SAT (Constraint Programming - Satisfiability)
- **Optional AI Integration**: Google Gemini API (Natural language timetable queries & schedule conflict explanations)

### Database & Security
- **Database**: Firebase Cloud Firestore (NoSQL Document Store)
- **Security Rules**: Strictly role-based access control (RBAC: Admin/Coordinator, Faculty, Student viewer).

---

## 3. High-Level Architecture Diagram

```
+-------------------------------------------------------------+
|                 React Client (Frontend)                     |
|  - College Admin Portal                                     |
|  - Faculty Workload Dashboard                               |
|  - Timetable Grid Viewer & PDF Export                       |
|  - Firebase Auth Client (Sign-In / Token Refresh)           |
+------------------------------+------------------------------+
                               |
                   HTTPS / JSON (Bearer JWT)
                               |
                               v
+-------------------------------------------------------------+
|                 FastAPI Application (Backend)               |
|                                                             |
|  +-------------------------------------------------------+  |
|  | Routers (Health, Auth, Faculty, Subjects, Schedules)   |  |
|  +-------------------------------------------------------+  |
|  | Core (Config, Safe Firebase Admin Init, Middleware)   |  |
|  +-------------------------------------------------------+  |
|  | Repositories (Firestore Data Access Layer)            |  |
|  +-------------------------------------------------------+  |
|  | Scheduling Engine (Google OR-Tools CP-SAT)            |  |
|  | - Hard Constraints: No room overlap, no faculty      |  |
|  |   clash, lab block hours, credit compliance           |  |
|  | - Soft Constraints: Workload balance, preferred slots |  |
|  +-------------------------------------------------------+  |
|  | AI Service (Google Gemini API - Optional)             |  |
+------------------------------+------------------------------+
                               |
               gRPC / Google Cloud Firestore API
                               |
                               v
+-------------------------------------------------------------+
|              Google Cloud Firestore (Database)              |
|  Collections:                                               |
|  - colleges / departments                                   |
|  - faculty_profiles                                         |
|  - subjects (VTU syllabus codes, theory/lab, credits)       |
|  - classrooms_and_labs                                      |
|  - academic_years / semesters                               |
|  - generated_timetables                                     |
+-------------------------------------------------------------+
```

---

## 4. Firestore Document Model Design

### `departments`
- `id`: string (e.g., `dept_cse`, `dept_ise`, `dept_ece`)
- `name`: string ("Computer Science and Engineering")
- `code`: string ("CSE")
- `hod_faculty_id`: string

### `faculty_profiles`
- `id`: string (UUID or Auth UID)
- `name`: string ("Dr. Ramesh Kumar")
- `email`: string ("ramesh.cse@vtu-college.edu")
- `designation`: string ("Professor" | "Associate Professor" | "Assistant Professor" | "HOD")
- `department_id`: string ("dept_cse")
- `max_weekly_hours`: number (e.g., Assistant Professor: 16-18 hrs, Associate: 14 hrs, Professor/HOD: 8-12 hrs)
- `specialization_tags`: array of strings (["Algorithms", "Data Science", "Machine Learning"])

### `subjects`
- `id`: string (e.g., `21CS51`, `21CSL56`)
- `code`: string ("21CS51")
- `title`: string ("Automata Theory and Computability")
- `department_id`: string ("dept_cse")
- `semester`: number (5)
- `credits`: number (3)
- `type`: string ("THEORY" | "LAB" | "PROJECT" | "SEMINAR")
- `weekly_hours_required`: number (e.g., 4 hours for theory, 3 hours continuous for lab)

### `classrooms_and_labs`
- `id`: string ("room_lh301", "lab_cse_01")
- `name`: string ("Lecture Hall 301")
- `type`: string ("CLASSROOM" | "COMPUTER_LAB" | "HARDWARE_LAB")
- `capacity`: number (60)
- `department_id`: string ("dept_cse")

### `timetables`
- `id`: string ("tt_2026_odd_cse_sem5_A")
- `academic_year`: string ("2026-2027")
- `semester`: number (5)
- `section`: string ("A")
- `department_id`: string ("dept_cse")
- `status`: string ("DRAFT" | "PUBLISHED" | "ARCHIVED")
- `grid`: array of timeslot assignments:
  - `day`: string ("MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY")
  - `slot_number`: number (1 to 7)
  - `start_time`: string ("09:00")
  - `end_time`: string ("10:00")
  - `subject_id`: string
  - `faculty_id`: string
  - `room_id`: string

---

## 5. Constraint Programming Strategy (Google OR-Tools CP-SAT)

The scheduler translates VTU academic guidelines into a constraint satisfaction problem (CSP):

### Hard Constraints (Must NEVER be violated):
1. **No Faculty Clash**: A faculty member cannot be scheduled to teach two different classes in the same timeslot.
2. **No Room Clash**: A classroom or lab cannot be occupied by two different sections or subjects in the same timeslot.
3. **No Section Clash**: A student batch/section cannot have two sessions scheduled at the exact same time.
4. **Lab Continuity**: Laboratory sessions require continuous block slots (e.g., 2 or 3 hours unbroken) in an eligible lab facility.
5. **Exact Weekly Quota**: Every subject must meet its VTU mandated weekly hours (e.g., 4 hours/week for 4-credit courses).

### Soft Constraints (Optimized with weights):
1. **Workload Distribution**: Spread faculty teaching hours evenly across days (avoiding 5 hours in one day and 0 on another).
2. **Faculty Slot Preferences**: Morning vs. afternoon slot preferences where applicable.
3. **Gap Minimization**: Minimize idle waiting hours between classes for students and faculty.

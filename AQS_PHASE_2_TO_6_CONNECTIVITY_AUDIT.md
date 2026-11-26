# AQS — Comprehensive Frontend, Backend & Firestore Connectivity Audit (Phases 2–6)

**Date**: November 25, 2026  
**Scope**: Strictly Read-Only Code-Level Audit of Phases 2–6 (Post-Phase 1 Timetable Draft Persistence)  
**Target Stack**: React + TypeScript (`frontend/src/`) → `aqsApi` / `RealtimeStreamManager` → FastAPI (`backend/app/`) → Firestore (`mini-project-24d7b`)  
**Method**: Code-path tracing across all UI components, `WorkflowContext.tsx`, `api.ts`, `realtime.ts`, FastAPI routers, Pydantic schemas, repositories, and `backend/tests/`. No source files or Firestore documents were modified during this audit.

---

## A. Executive Summary

While **Phase 1 (Timetable Draft Persistence)** successfully connected manual grid draft saving (`POST /api/v1/timetables/draft`) for Dean, Department Coordinator, and Basic Science editors, **Phases 2–6 remain largely disconnected or backed by local React state and hardcoded dummy data**.

### Connectivity Summary Counts (Across 29 Audited Features)

| Status Category | Count | Summary |
|---|---:|---|
| **Fully Connected** | **3** | Phase 1 Draft Save (`POST /timetables/draft`), Faculty Roster CRUD (`create`/`update`/`delete`), Fixed Classroom Assignment (`POST`/`PUT /fixed-classrooms`) |
| **Partially Connected** | **9** | Subject CRUD (un-awaited, `get()` bug on create, mismatched dept/cycle filtering), Timetable Lock (`FINALIZED` persists, unlock is local-only), Faculty Preferences (submit/review exist on backend, HOD finalize & coordinator sync broken), Department/Workload Reads (reads work, UI overwrites with hardcoded fields), Timetable Publish (hardcoded ID), SSE Realtime (connects, missing broadcasts & clobbers unsaved edits) |
| **Disconnected (Local-State Only / Not Implemented)** | **17** | Class-level Subject/Faculty Allocation (`updateDeptSubjectAllocation`, `autoAllocateDeptSubjects`), Workload Auto-Recalculation in UI, Dean Institutional Slot Definitions, Global Lock/Reopen, Audit Logs, HOD Timetable Approval/Return, HOD Duty Adjustments, Basic Science Cycle/Section Management, Firebase Auth & User Identity Resolution, Student Profile & Section Scoping, Faculty Leave & Availability, Clash Validation Diagnostics, Institutional Calendar/Leadership Config, Global Loading/Error UI |
| **Features Still Using Dummy or Hardcoded Institutional Data** | **22** | 55 distinct hardcoded/fallback findings cataloged in Section D (demo files, `WorkflowContext` initial/fallback state, hardcoded user names/departments, fake clash checks, mock leave impact detection) |

---

## B. Feature Connectivity Matrix

| Feature | Frontend | API (`aqsApi`) | Backend Route | Firestore Collection | Refresh Restoration | Status |
|---|---|---|---|---|---|---|
| **Timetable Draft Save (Phase 1)** | `DeanTimetableEditor`, `DeptTimetableEditor`, `CycleTimetableEditor` | `saveTimetableDraft` (`POST /timetables/draft`) | `timetables.py:save_draft_placements` | `timetables`, `timetableSlots` | Yes (awaited) | **Fully Connected** |
| **Subject Master CRUD** | `SubjectFacultyAllocation`, `DeptSubjectAllocationView`, `BasicScienceSubjectAllocation` | `createSubject`, `updateSubject`, `deleteSubject` | `subjects.py` (`POST/PUT/DELETE /subjects`) | `subjects` | Partial (`deanSubjects` not synced; `POST` calls missing `.get()`; BS math subjects dropped on filter) | **Partially Connected** |
| **Class-Specific Subject Allocation** | `DeptSubjectAllocationView` (section selector) | None | None (no section field on `Subject`) | Master `subjects` used instead | No | **Disconnected** |
| **Faculty-to-Subject Allocation** | `DeptSubjectAllocationView` (`handleFacultyChange`, `handleRunAutoAllocation`) | None (legacy `createAllotment` unused by view) | `allotments.py` exists (`POST/PUT/DELETE /allotments`) | `allotments` (unused by editor view) | No | **Disconnected** |
| **Faculty Roster CRUD** | `FacultyAllocationView` | `createFaculty`, `updateFaculty`, `deleteFaculty` | `faculty.py` (`POST/PUT/DELETE /faculty`) | `faculty` | Partial (un-awaited; `POST` calls missing `.get()`; login toggle local-only) | **Partially Connected** |
| **Faculty Workload Calculation** | `FacultyWorkloadPreferencesView`, `HODWorkloadPreferencesView`, `BasicScienceWorkloadView`, `PrincipalFacultyManagementView` | `getWorkloadRecords` (read into `facultyWorkload`, unused by those 4 views) | `workload_records.py` (`WorkloadRecordRepository.calculate_faculty_workload`) | `workloadRecords` | No (UI uses hardcoded `theoryHours: 8, labHours: 4`) | **Partially Connected** |
| **Dean Fixed Institutional Slots** | `FixedSlotConfiguration` | None | None (`institutional_assignments` has no router) | `institutionalAssignments` (unwired) | No | **Disconnected** |
| **Dean Global Lock / Reopen** | `LockReopenSchedule` (`lockDeanSchedule`, `reopenDeanSchedule`) | None | None | None | No | **Disconnected** |
| **Dean / BS Section Lock & Unlock** | `DeanTimetableEditor`, `CycleTimetableEditor` | Lock calls `saveTimetableDraft(FINALIZED)`; Unlock calls **none** | `timetables.py` | `timetables` | Lock persists; Unlock reverts on refresh | **Partially Connected** |
| **Governance Audit History** | `DeanVersionHistory`, `pushAudit` | None | None (no `auditLogs` router/repo) | None | No | **Disconnected** |
| **Department Timetable Publish** | `DeptTimetableEditor` (`publishDeptSectionTimetable`) | `updateTimetable` + hardcoded `publishTimetable('tt_2026_odd_aids_sem3_a')` | `timetables.py` (`PUT /{id}`, `POST /{id}/publish` missing) | `timetables` | Partial (wrong hardcoded ID, un-awaited) | **Partially Connected** |
| **HOD Section Approval / Return** | `HODTimetableProgressView` | None | None | None | No | **Disconnected** |
| **HOD Preference Review & Finalize** | `HODWorkloadPreferencesView` (local), `FacultyPreferencesReview` (`reviewPreference`) | `reviewPreference` (`PUT /preferences/{id}/hod-review`); `finalizePreference` unused | `preferences.py` | `facultyPreferences` | `HODWorkloadPreferencesView` lost on refresh | **Partially Connected** |
| **HOD Faculty Duties Adjustment** | `HODWorkloadPreferencesView` (`updateFacultyDuties`) | None | None | None | No | **Disconnected** |
| **Basic Science Section / Cycle Mgmt** | `CycleAllocationManager`, `CycleTimetableEditor` (`addCycleSection`, `updateFirstYearSection`) | None (`getSections` read-only, unused for BS sections) | `sections.py` (`POST/GET` only) | `sections` (unused by BS) | No | **Disconnected** |
| **Institutional Config & Leadership** | `InstitutionalManagementView` | None | None | None | No | **Disconnected** |
| **Academic Monitoring & Clash Validation** | `AcademicMonitoringView`, `CoordinatorClashValidation`, `BasicScienceClashValidation`, `DeptTimetableEditor` | None (`validateTimetable` unused) | `timetables.py:/validate` exists | N/A | No (hardcoded arrays / rules) | **Disconnected** |
| **Authentication & UID Identity** | `LoginForm`, `RoleSelector`, `App.tsx` | `dev-token-<role>` fallback | `dependencies.py` (`DEBUG=True` bypasses Firebase Auth) | `users` (skipped in dev mode) | No (session not persisted) | **Disconnected** |
| **Faculty Profile & Timetable** | `FacultyDashboard`, `MyTimetablePage`, `SubjectPreferencesAndWorkloadPage` | `getFacultyTimetable` unused; `submitPreferences` un-awaited | `faculty.py`, `preferences.py`, `timetables.py` | `faculty`, `facultyPreferences` | Fallback to hardcoded `Ananya Rao` / `FACULTY_PROFILE` | **Partially Connected** |
| **Faculty Leave & Availability** | `LeaveRequestsPage`, `LeaveRequests` | None | None | None | No | **Disconnected** |
| **Student Profile & Timetable** | `StudentDashboard`, `StudentProfile`, `StudentWelcome`, `StudentTimetable`, `TimetableStatus` | `getTimetableSlots({ limit: 500 })` (`role: 'admin'`) | `timetable_slots.py` | `timetableSlots` (unfiltered drafts!) | Profile static; timetable unfiltered | **Disconnected** |
| **Realtime Multi-User Sync** | `realtime.ts`, `WorkflowContext.tsx` | SSE `GET /realtime/stream` | `realtime.py` | Broadcasts only `faculty`, `fixedClassrooms`, `draft`/`generate` | Partial (payload mismatch, clobbers unsaved edits) | **Partially Connected** |

---

## C. Detailed Findings (Phases 2–6)

### Phase 2 — Subject and Faculty Allocation Connectivity

1. **Subject Master CRUD vs. Class-Specific Allocation**:
   - **Dean (`frontend/src/components/dean/SubjectFacultyAllocation.tsx`)**: `handleSubmit` (L113–163) and `handleDeleteClick` (L165–170) call `WorkflowContext` (`addDeanSubject` L897–920, `updateDeanSubject` L922–943, `deleteDeanSubject` L945–950) → `aqsApi.createSubject` / `updateSubject` / `deleteSubject` (`frontend/src/services/api.ts:132–148`).
     - *Defects*: Calls are un-awaited (`.catch()` only); `addDeanSubject` hardcodes `department_id: 'dept_aids'` (L911) and `semNumber` defaults to `3` (L898); `syncBackendData` (`WorkflowContext.tsx:450–510`) **never calls `setDeanSubjects`**, so `deanSubjects` resets to `INITIAL_DEAN_SUBJECTS` on refresh.
   - **Department Coordinator (`frontend/src/components/department-coordinator/DeptSubjectAllocationView.tsx`)**: `handleSaveSubject` (L115–190) and `handleDeleteSubject` (L219–228) call `addDeptSubject` / `updateDeptSubject` / `deleteDeptSubject` (`WorkflowContext.tsx:1473–1531`).
     - *Defects*: Un-awaited; `DeptSubjectAllocationView` has a `selectedSection` selector and local `+ Add Section` modal (L48, L80–90), but `filteredSubjects` (L93–97) and `addDeptSubject` do not store or filter by `section` or `academicYear`. Master `subjects` are treated as class allocations.
   - **Basic Science (`frontend/src/components/basic-science/BasicScienceSubjectAllocation.tsx`)**: `handleSubmit` / `handleDelete` (L135–194) call `addBasicScienceSubject` / `updateBasicScienceSubject` / `deleteBasicScienceSubject` (`WorkflowContext.tsx:1097–1161`).
     - *Defects*: Un-awaited; `addBasicScienceSubject` sends `department_id: 'dept_basic_science'` (L1116), whereas `syncBackendData` (L477–509) filters `physicsSubjects` / `chemistrySubjects` by `department_id === 'dept_physics'` / `'dept_chemistry'` or course name containing `"physics"` / `"chemistry"`. Consequently, Mathematics or other 1st-year subjects saved with `dept_basic_science` vanish from both lists on refresh.
   - **Backend `POST /api/v1/subjects/` Bug (`backend/app/routers/subjects.py:39`)**: Calls `await subject_repository.get(doc_id)`, but `BaseFirestoreRepository` (`backend/app/repositories/base.py`) defines `get_by_id`, not `get` (causes `AttributeError` on create).
   - **First Year `department_id: null` Handling**:
     - `SubjectCreate` (`backend/app/schemas/entities.py:96`) requires non-null `department_id: str`.
     - `WorkflowContext.tsx:452–454` filters `deptSubjects` with `!s.department_id || s.department_id === 'dept_aids'`, causing any First Year subject with `department_id: null` to leak into the AIDS department subject list.
     - On the backend, `TimetableRepository.save_draft_placements` (`backend/app/repositories/collections.py:289–292`) properly forces `department_id = None` for `semester in (1, 2)` or First Year tags. However, `timetables.py:generate_timetable` (L183) passes `request.department_id` (`None` for First Year) to `fixed_classroom_repository.get_or_create_fixed_classroom`, which executes `department_id.replace(...)` (`collections.py:826`) and raises `AttributeError`.

2. **Faculty Allocation & Workload**:
   - **Assigning/Changing/Removing Faculty on Subjects**: `DeptSubjectAllocationView.tsx` (`handleFacultyChange` L241–253 → `updateDeptSubjectAllocation` L1533–1537; `handleRunAutoAllocation` L231–238 → `autoAllocateDeptSubjects` L1539–1590) mutates **only React state** (`setDeptSubjects`). No `aqsApi.createAllotment` / `updateAllotment` call is made, and `addDeptSubject`/`addDeanSubject`/`addBasicScienceSubject` do not write `allotments`. Legacy `addSubjectAllocation` (`WorkflowContext.tsx:1298–1316`) hardcodes `faculty_id: 'fac_dept_aids_dr_ananya_rao'` and is unused.
   - **Faculty Roster (`frontend/src/components/department-coordinator/FacultyAllocationView.tsx`)**: Calls `addDepartmentFaculty` / `updateDepartmentFaculty` / `deleteDepartmentFaculty` / `toggleFacultyAccountStatus` (`WorkflowContext.tsx:1392–1459`) → `aqsApi.createFaculty` / `updateFaculty` / `deleteFaculty` (`api.ts:106–122`). Un-awaited; `toggleFacultyLoginAccess` (`WorkflowContext.tsx:1461–1465`) is local-state-only; `backend/app/routers/faculty.py:45` calls non-existent `faculty_repository.get(doc_id)`.
   - **Workload Calculation**: Backend `WorkloadRecordRepository.calculate_faculty_workload` (`collections.py:596–644`) computes real hours from `allotments`, and `syncBackendData` loads `/workload-records` into `facultyWorkload` (`WorkflowContext.tsx:513–531`). However, `FacultyWorkloadPreferencesView.tsx`, `HODWorkloadPreferencesView.tsx`, `BasicScienceWorkloadView.tsx`, and `PrincipalFacultyManagementView.tsx` read `departmentFaculty` / `basicScienceFaculty`, where `syncBackendData` (L408–410, L434–436) hardcodes `theoryHours: 8, labHours: 4, basicScienceHours: 0` (or `12` for BS).
   - **Department Isolation**: Backend `faculty.py:61–129` enforces `auth_ctx.department_id` on reads, while `subjects.py:53–80` and `allotments.py:43–90` do not filter reads by `auth_ctx.department_id`. Frontend hardcodes `'dept_aids'` in `WorkflowContext.tsx` and coordinator views.

---

### Phase 4 — Dean Locks, Institutional Assignments & Approval Workflows

1. **Dean**:
   - **Fixed Institutional Assignments (`FixedSlotConfiguration.tsx`)**: `addInstitutionalSlot` / `updateInstitutionalSlot` / `removeInstitutionalSlot` (`WorkflowContext.tsx:839–856`) are local-state-only. Backend defines `InstitutionalAssignmentRepository` (`collections.py:869`, collection `institutionalAssignments`), but **no router is registered** in `backend/app/main.py`.
   - **Global Schedule Lock/Reopen (`LockReopenSchedule.tsx`)**: `lockDeanSchedule` / `reopenDeanSchedule` (`WorkflowContext.tsx:858–894`) are local-state-only.
   - **Section Lock/Unlock (`DeanTimetableEditor.tsx`)**: `handleLockTimetable` (L407–437) calls `await saveDeanSectionTimetable(..., { isLocked: true })` which persists `status: 'FINALIZED'` via `POST /timetables/draft` and restores on refresh (`WorkflowContext.tsx:716`). However, `handleUnlockTimetable` (L440–449) calls `unlockDeanSectionTimetable` (`WorkflowContext.tsx:1032–1052`), which is **local-state-only** and reverts on refresh. Furthermore, `saveDeanSectionTimetable` (L992) hardcodes `is_locked: false` on individual slot payloads.
   - **Audit History (`DeanVersionHistory.tsx`)**: `pushAudit` (`WorkflowContext.tsx:811–836`) stores logs in React memory only; no `auditLogs` collection, model, or router exists.
   - **Coordinator Visibility & Protection**: `DeptTimetableEditor.tsx` (L260–262, L290–293), `CycleTimetableEditor.tsx` (L260–404), and `TimetableBuilder.tsx` (L51–54) block editing placements marked `isLockedSlot` / `isDeanLocked`. On the backend, `timetables.py` allows any `require_coordinator_or_admin` user (not exclusively Dean) to mutate timetable `status` via `PUT /timetables/{id}`.

2. **Department Coordinator**:
   - `DeptTimetableEditor.tsx` saves manual draft placements via `POST /timetables/draft` (`Fully Connected` in Phase 1).
   - `handlePublishTimetable` → `publishDeptSectionTimetable` (`WorkflowContext.tsx:1635–1677`) fires `aqsApi.updateTimetable(ttId, { status: 'FINALIZED' }).catch(() => {})` (L1659) and `aqsApi.publishTimetable('tt_2026_odd_aids_sem3_a').catch(...)` (hardcoded ID, L1666) without awaiting, and `POST /api/v1/timetables/{id}/publish` does not exist in `timetables.py` (404).

3. **HOD**:
   - **Preferences Review (`HODWorkloadPreferencesView.tsx`)**: `handleFinalizePreferences` (L91–108), `handleReopenPreferences` (L111–117), and `handleSaveDuties` (L83–88) call `updateDepartmentFacultyFinalizedPreferences` / `updateFacultyDuties` (`WorkflowContext.tsx:1467–1471, 1815–1833`), which are **local-state-only**. Meanwhile, `aqsApi.finalizePreference` (`POST /preferences/{id}/finalize`) and `aqsApi.getFinalizedPreferences` (`GET /preferences/coordinator/finalized`) exist in `api.ts:224–233` and `preferences.py:132–165` but are **never called**. Only `FacultyPreferencesReview.tsx` (Coordinator) calls `aqsApi.reviewPreference` (`PUT /preferences/{id}/hod-review`, un-awaited).
   - **Section Approval / Return (`HODTimetableProgressView.tsx`)**: `approveSectionTimetable` / `returnSectionTimetableForCorrection` (`WorkflowContext.tsx:1739–1813`) are local-state-only.

4. **Basic Science Coordinator**:
   - **Cycle & Section Management (`CycleAllocationManager.tsx`, `CycleTimetableEditor.tsx`)**: `updateFirstYearSection`, `addCycleSection`, `removeCycleSection`, `lockBasicScienceSchedule`, and `reopenBasicScienceSchedule` (`WorkflowContext.tsx:1055–1094, 1163–1179`) are local-state-only.
   - **Cycle Separation**: Only Physics and Chemistry cycles exist in UI (`BasicScienceSubjectAllocation.tsx:598–621`, `CycleTimetableEditor.tsx:47–49`); Mathematics has no separate cycle. `syncBackendData` separates Physics vs. Chemistry timetables by checking `timetable_id.includes('chem')`, `subject_code.includes('CHE')`, or `cleanSec === 'C' || 'D'` (`WorkflowContext.tsx:607–618, 737–742`).
   - **Cycle Draft & Lock**: `CycleTimetableEditor.tsx` `handleSaveDraft` and `handleLockTimetable` persist to Firestore with `department_id: null` (`WorkflowContext.tsx:1199`); `handleUnlockTimetable` is local-state-only; `handleGenerateTimetable` runs a client-side heuristic (does not call `/timetables/generate`) and calls `saveCycleTimetable` without `await` (L640).

---

### Phase 5 — Authentication, Identity, Faculty & Student Data Connectivity

1. **Authentication & UID Resolution**:
   - `frontend/package.json` has **no Firebase client SDK**.
   - `LoginForm.tsx:100–121` and `StudentRegistration.tsx:127–138` use `setTimeout` mocks, never write `aqs_auth_token` to `localStorage`, and pass `formData.role` from `RoleSelector.tsx` directly to `App.tsx:27–53` (`handleLoginSuccess`). Unauthenticated users can also click `onNavigateToClassSchedule` (`App.tsx:90`) to enter `StudentDashboard`.
   - `frontend/src/services/api.ts:24–28` and `realtime.ts:32` fall back to `` `dev-token-${role}` ``, and `aqsApi` hardcodes `role: 'admin'` on almost all read endpoints (`getFaculty`, `getSubjects`, `getTimetables`, `getTimetableSlots`, etc.).
   - Backend `dependencies.py:120–153` (`get_current_user_context`) skips Firebase Admin `verify_id_token` and Firestore `users/{uid}` lookup whenever `settings.DEBUG` is `True` (default `True` in `config.py:24`) and `token.startswith("dev-token-")` or Firebase is uninitialized.
   - `WorkflowContext.tsx` never queries `GET /api/v1/users/{id}` and holds no authenticated user profile.

2. **Faculty Data Connectivity**:
   - `FacultyDashboard.tsx:27–39`, `MyTimetablePage.tsx:38–43`, `SubjectPreferencesAndWorkloadPage.tsx:23–28`, and `LeaveRequestsPage.tsx:43–48` resolve `currentFaculty` by searching `departmentFaculty` for `'Ananya Rao'` / `'FAC102'`, falling back to `departmentFaculty[0]` or `FACULTY_PROFILE` (`facultyDemoData.ts:16–31`).
   - **Preferences**: `submitFacultyPreferences` (`WorkflowContext.tsx:1720–1736`) sends `POST /preferences/submit` with `role: 'faculty'` and hardcoded `academic_year: '2026-2027'`, `semester: 3`, `department_id: 'dept_aids'`. Backend saves under `auth_ctx.uid` (`dev_user_faculty`), which does not match real `faculty` doc IDs.
   - **Timetable**: `MyTimetablePage.tsx:47–128` aggregates client-side `deptTimetables`, `cycleTimetables`, and `deanTimetables` by matching `p.facultyName.includes(currentFaculty.name)`. `aqsApi.getFacultyTimetable` (`GET /timetables/faculty/{id}`) is unused.
   - **Leaves / Availability**: `LeaveRequestsPage.tsx` and `WorkflowContext.tsx:1695–1718` are local-state-only with mock affected-period detection (`21AIL37` / `21AI32`).

3. **Student Data Connectivity**:
   - `StudentDashboard.tsx` uses static `STUDENT_PROFILE` (`studentDemoData.ts:15–32`: `'4MW23AI001'`, `'AIDS'`, `'Semester 4'`, `'Section A'`). No `students` collection or router exists.
   - `StudentTimetable.tsx` and `StudentWelcome.tsx` display `WorkflowContext.timetableEntries`, which is populated from `aqsApi.getTimetableSlots({ limit: 500 })` (`role: 'admin'`) **without filtering by `status === 'PUBLISHED'`, `department_id`, `semester`, `academic_year`, or `section`**. `StudentHeader.tsx:78–100` toggles `isPublished` locally as a demo switch.
   - Backend leakage: `GET /api/v1/timetables/department/{dept_id}` (`timetables.py:299–309`) and `GET /api/v1/timetable-slots` without `timetable_id` (`timetable_slots.py:55–61`) do **not** filter out non-`PUBLISHED` timetables for anonymous/student callers.

---

### Phase 6 — Loading, Offline, Error Handling & Realtime Sync

- **Global Loading / Error**: `WorkflowProvider` initializes all state with `INITIAL_*` demo arrays (`WorkflowContext.tsx:213–264`). `isBackendConnected`, `backendSyncError`, `isUsingFallbackData`, and `refreshBackendData` are exposed on context but **consumed by zero components**.
- **Silent Fallback / Masked Empty States**: `syncBackendData` (`WorkflowContext.tsx:314–757`) only calls `set*` when `Array.isArray(res.value) && res.value.length > 0`. An empty Firestore collection (`[]`) leaves demo arrays intact, and if *any* 1 of 12 endpoints returns non-empty data, `liveLoaded` becomes `true` and `backendSyncError` is cleared even if critical endpoints rejected (L773–775). `isUsingFallbackData` is hardcoded `false` (L277, L776, L779, L786).
- **Optimistic Mutations & Swallowed Errors**: All subject, faculty, allotment, and preference mutations update React state synchronously and ignore backend errors via `.catch(console.warn)` or `.catch(() => {})` (L1659). `SubjectPreferencesAndWorkloadPage.tsx:100–108` and `SubjectFacultyAllocation.tsx` display success messages before backend confirmation.
- **Overwrite Risk After Failed Load**: Because `INITIAL_*` demo timetables remain in state when `syncBackendData()` fails and `isBackendConnected` is never checked before saving, clicking **Save Draft** or **Lock** in an editor overwrites live Firestore `timetableSlots` with demo data.
- **Double-Submit Protection**: `Save Draft` disables during `isSaving` in all 3 editors, but `Lock Timetable` (`DeanTimetableEditor.tsx:637`, `CycleTimetableEditor.tsx:849`), `Publish Timetable` (`DeptTimetableEditor.tsx:662`), `Generate Timetable` (`DeptTimetableEditor.tsx:611`), and `Submit Preferences` (`SubjectPreferencesAndWorkloadPage.tsx:100`) are **not** disabled while in-flight.
- **Realtime SSE (`realtime.ts`, `realtime.py`)**: Backend broadcasts only `FACULTY_*`, `FIXED_CLASSROOM_UPDATED`, and `TIMETABLE_SAVED` (missing `subjects`, `allotments`, `preferences`, `timetables` status/delete). Frontend `RealtimeEventPayload` (`realtime.ts:12–17`) expects `{ type, id }` while backend sends `{ event, entity_id }` (`realtime.py:38–43`). `WorkflowContext.tsx:797–807` triggers `syncBackendData()` on every event (including `CONNECTED`), does not call `realtimeStream.disconnect()` on unmount, and overwrites open editor `placements` via editor `useEffect` hooks when an incoming SSE sync arrives.

---

## D. Dummy Data Inventory

| # | File Path & Line(s) | Symbol / Component | Hardcoded / Fallback Data | Visible in UI? | Source Type | Recommended Replacement |
|---|---|---|---|---|---|---|
| 1 | `frontend/src/data/facultyDemoData.ts:16–31` | `FACULTY_PROFILE` | `FAC001`, `faculty@sode-edu.in`, `AIDS`, `assignedWeeklyHours: 12` | Yes | Fallback / Base | `/users/me` + `/faculty/{id}` |
| 2 | `frontend/src/data/facultyDemoData.ts:36–52` | `FACULTY_WORKLOAD_BREAKDOWN` | Static `maxHours: 16` breakdown object | No | Unused export | Remove; use `/workload-records` |
| 3 | `frontend/src/data/studentDemoData.ts:15–32` | `STUDENT_PROFILE` | `Student Viewer`, `4MW23AI001`, `AIDS`, `Semester 4`, `Section A`, `8.5` CGPA | Yes | Primary | `/users/me` or section selector |
| 4 | `frontend/src/data/studentDemoData.ts:37–48` | `TIMETABLE_METADATA` | `Semester 4`, `Section A`, `Published`, `v1.0 (Live)`, `32 Hours` | Yes | Primary | Query `/timetables` |
| 5 | `frontend/src/data/workflowDemoData.ts:31–39` | `DEAN_DEPARTMENTS` | Static 7-dept array (`DS`, `ML`, `CSE`, `EC`, `MECH`, `CIVIL`, `First Year`) | Yes | Primary | Derive from `departments` API |
| 6 | `WorkflowContext.tsx:197–206` | `institutionalConfig` | `2026–2027`, `Odd Semester`, `2026-09-01`..`2027-01-15`, `isLocked: true` | Yes | Primary (local) | Persist via `/academic-years` or `/system` |
| 7 | `WorkflowContext.tsx:209–212, 220–222, 240` | Stage lock statuses | `deanStatus='LOCKED'`, `basicScienceManualStatus='LOCKED'`, `departmentManualStatus='PUBLISHED'`, hardcoded timestamps/actors | Yes | Primary (local) | Derive from Firestore governance/timetables |
| 8 | `WorkflowContext.tsx:230–231` | `physicsSections`, `chemistrySections` | `['Section A', 'Section B']`, `['Section C', 'Section D']` | Yes | Primary (local) | `aqsApi.getSections()` |
| 9 | `WorkflowContext.tsx:317–327` | `syncBackendData` (allotments) | `hoursPerWeek || 4`, `venue: 'Lecture Hall AB04'` | Yes | Fallback | `0` / `''` |
| 10 | `WorkflowContext.tsx:336–349` | `syncBackendData` (preferences) | `'25CSCC310'`, `'Core Course'`, `'Core teaching preference'`, `'2026-11-23'`, `dept_aids` label | Yes | Fallback | Real subject/dept lookup or `''` |
| 11 | `WorkflowContext.tsx:356–367` | `syncBackendData` (departments) | `'Dr. Tejaswini H'`, `'Dr. Nagaraj Rao'`, `facultyCount: 18/6`, `studentCount: 240/120`, `oddSemCompletion: 100` | Yes | Primary/Fallback | Aggregate from `/faculty`, `/sections`, `/timetables` |
| 12 | `WorkflowContext.tsx:398–443` | `syncBackendData` (faculty) | Synthesized `EMP001`/`BS001`, `theoryHours: 8`, `labHours: 4`, `basicScienceHours: 0/12`, `maxHours: 16` | Yes | Override | Join `/workload-records` / `/allotments`; default `0` |
| 13 | `WorkflowContext.tsx:452–509` | `syncBackendData` (subjects) | `dept_aids` filter, `venue: 'AI Computing Lab 1'/'Lecture Hall AB04'`, `preferenceMatch: 'Priority 1'`, `'Dr. Ravindra K'`, `'Dr. Subrahmanya Bhat'` | Yes | Fallback/Override | Auth dept filter; `/allotments` faculty; `''` venue |
| 14 | `WorkflowContext.tsx:520–528` | `syncBackendData` (workload) | `designation: 'Faculty Member'`, `maxHours || 16`, `preferenceStatus: 'Reviewed'` | Yes | Fallback | Join `/faculty` & `/preferences` |
| 15 | `WorkflowContext.tsx:839–1859` | Mutation handlers | Hardcoded actors (`Dr. Sudarshan Rao`, `Dr. Ravindra`, `Prof. Rajesh Shetty`, `Dr. Vasudeva`, `Dr. Thirumaleshwara Bhat`), `dept_aids`, `fac_dept_aids_dr_ananya_rao`, `tt_2026_odd_aids_sem3_a` | Yes | Primary | Auth user context + dynamic IDs |
| 16 | `pages/FacultyDashboard.tsx:27–39` | `FacultyDashboard` | Lookup `'Ananya Rao'` / `'Artificial Intelligence'` fallback to `FACULTY_PROFILE` | Yes | Primary/Fallback | Auth UID / email match |
| 17 | `pages/StudentDashboard.tsx:7–66` | `StudentDashboard` | `STUDENT_PROFILE`, `useState(true)` for `isPublished` | Yes | Primary | `/users/me` + `/timetables` status |
| 18 | `pages/RoleDashboardPlaceholder.tsx:81, 97–108` | `RoleDashboardPlaceholder` | `'Academic Year 2026–2027'`, `'Frontend Demonstration Active'` | Conditional | Primary | Bind to config / remove |
| 19 | `basic-science/BasicScienceHeader.tsx:37`, `BasicScienceSidebar.tsx:159, 171` | Header/Sidebar | `'Dr. Ravindra Shenoy'` | Yes | Primary | Auth user display name |
| 20 | `basic-science/BasicScienceFinalTimetables.tsx:24–30, 544–552` | Signatories & selectors | `'2026–2027'`, `'Dr. Ravindra Shenoy'`, `'Dr. Sudarshan Rao'`, `'Dr. Thirumaleshwara Bhat'` | Yes | Primary | Config + leadership records |
| 21 | `basic-science/BasicScienceWorkloadView.tsx:37–42, 127, 845` | Workload norms/approver | Hardcoded `norms`, `approvedBy: 'Dr. Ravindra Shenoy'` | Yes | Primary | Backend norms + auth user |
| 22 | `basic-science/BasicScienceClashValidation.tsx:13–53` | Clash checks | 4 hardcoded `'Passed'` items & `'0 Clashes Detected'` | No | Primary | `/timetables/{id}/validate` |
| 23 | `basic-science/BasicScienceOverview.tsx:147` | Overview card | Hardcoded `'0 Conflicts'` | No | Primary | Real clash validator |
| 24 | `basic-science/CycleAllocationManager.tsx:265, 278` | Sample preview cards | `'Calculus & Linear Algebra (Dr. Subrahmanya)'`, `'Engineering Physics Lecture (Dr. Ravindra)'` | No | Primary | `cycleTimetables` state |
| 25 | `dean/DeanHeader.tsx:33`, `DeanSidebar.tsx:155, 167` | Header/Sidebar | `'Dr. Sudarshan Rao'` | Yes | Primary | Auth user display name |
| 26 | `dean/DeanOverview.tsx:23, 110, 128, 131` | Overview metrics | `85`/`100%`, `8 Facilitators`, `'Zero conflicts flagged'` | No | Primary | Derive from `deanTimetables` |
| 27 | `dean/DeanTimetableEditor.tsx:61–65`, `FinalTimetablesView.tsx:21–25, 559` | Selectors & signatory | `'2026–2027'`, `'AIDS'`, `'Dr. Sudarshan Rao'` | Yes | Primary | Config + leadership records |
| 28 | `department-coordinator/DeptCoordinatorHeader.tsx:37` | Header | `'Prof. Rajesh Shetty'` | Yes | Primary | Auth user display name |
| 29 | `department-coordinator/DeptCoordinatorOverview.tsx:135, 150, 223` | Overview cards | `'Dr. Ananya Rao + Department Staff'`, `'0 Clashes'`, `'Prof. Sneha Kamath'` | No | Primary | Dynamic faculty & validator |
| 30 | `department-coordinator/CoordinatorClashValidation.tsx:13–103` | Clash checks | Static `'Clean (0 Conflicts)'` array | No | Primary | `/timetables/{id}/validate` |
| 31 | `department-coordinator/DeptTimetableEditor.tsx:237, 369–397` | Drop fallback & clash rules | Fallback `'Prof. Rajesh Shetty'`; hardcoded clash check for `'Sneha Kamath'` & `'Rajesh Shetty'` on Tuesday P6 | Yes | Fallback + Logic | `''` + live `cycleTimetables` clash check |
| 32 | `department-coordinator/DeptTimetableViewer.tsx:551–559` | Signatories | `'Prof. Rajesh Shetty'`, `'Dr. Vasudeva'`, `'Dr. Thirumaleshwara Bhat'` | Yes | Primary | Leadership records |
| 33 | `department-coordinator/FacultyAllocationView.tsx:45` | Department state | `'Artificial Intelligence & Data Science'` | Yes | Primary | Auth user department |
| 34 | `department-coordinator/FacultyWorkloadPreferencesView.tsx:27–32, 51, 675` | Norms & approver | Hardcoded `norms`, `approvedBy: 'Prof. Rajesh Shetty'` | Yes | Primary | Backend norms + auth user |
| 35 | `department-coordinator/TimetableBuilder.tsx:23–32, 331–334` | Legacy builder | `'AIDS - 3A'`, `'21AI32'`, `'Dr. Ananya Rao'`, hardcoded faculty `<select>` | No | Primary | Remove or bind to `departmentFaculty` |
| 36 | `hod/HODHeader.tsx:40`, `HODSidebar.tsx:196, 208` | Header/Sidebar | `'Dr. Vasudeva'` | Yes | Primary | Auth user display name |
| 37 | `hod/HODDepartmentTimetableView.tsx:80–108, 679` | Advisors & fallback | `'Dr. Ananya Rao'`, `'Prof. Sneha Kamath'`, `'Prof. Rajesh Shetty'`, `'Dr. Vasudeva'`, `'AIDS'` | Yes | Primary/Fallback | `/sections` advisors; `'Unassigned'` |
| 38 | `hod/HODTimetableProgressView.tsx:242` | Coordinator label | `'Coordinator: Prof. Rajesh Shetty'` | Yes | Primary | `departments` coordinator |
| 39 | `hod/HODWorkloadPreferencesView.tsx:100` | Approver | `approvedBy: 'Dr. Vasudeva (HOD)'` | Yes | Primary | Auth user display name |
| 40 | `principal/PrincipalHeader.tsx:39`, `PrincipalSidebar.tsx:199, 211` | Header/Sidebar | `'Dr. Thirumaleshwara Bhat'` | Yes | Primary | Auth user display name |
| 41 | `principal/AcademicMonitoringView.tsx:19–81` | Cycles & approvals | Hardcoded `basicScienceCycles` (`Dr. Ravindra Shenoy`, `124` students, `100%`) & 3 mock `pendingApprovals` | Yes | Primary | Derive from `cycleTimetables` & `timetables` |
| 42 | `principal/PrincipalFacultyManagementView.tsx:34–86` | Depts & cross-dept | Hardcoded `departmentsList` & 5 `crossDepartmentAssignments` rows | Yes | Primary | Derive from `departments` & `allotments` |
| 43 | `principal/InstitutionalTimetableView.tsx:51–53, 245` | Defaults & banner | `'3rd Sem, 5th Sem, 7th Sem'`, `'Placement Officer'`, `'Auditorium'`, `'Zero Cross-Department Clashes Verified'` | Yes | Primary | Clear defaults; live validator |
| 44 | `faculty/FacultyHeader.tsx:39` | Header | Fallback `'Dr. Ananya Rao'` | Yes | Fallback | `'Faculty Member'` / auth email |
| 45 | `faculty/MyTimetablePage.tsx:37–43`, `SubjectPreferencesAndWorkloadPage.tsx:22–28` | Faculty lookup | Hardcoded `'Ananya Rao'` / `'FAC102'` lookup | Yes | Primary | Auth UID / email |
| 46 | `faculty/LeaveRequestsPage.tsx:42–48, 53–54, 104–168, 358` | Mock impact & defaults | Hardcoded dates, mock `21AIL37`/`21AI32` affected slots, `'Dr. Ananya Rao'`, `'Prof. Rajesh Shetty'` | Yes | Primary | Filter live timetables; backend leaves |
| 47 | `faculty/WorkloadOverview.tsx:29–31, 74` | Fallback & subtitle | `maxHours || 16`, `'Odd Semester 2026–27'` | No | Fallback/Primary | `institutionalConfig` |
| 48 | `faculty/ClassTimetableView.tsx:20–102` | `DS_3RD_SEM_COURSES` | 9 hardcoded courses & faculty | No | Primary | Remove or `/subjects` + `/allotments` |
| 49 | `student/StudentTimetable.tsx:168–172` | PDF export metadata | Hardcoded `'AIDS'`, `'Second Year'`, `'3rd sem'`, `'A'` | Yes | Primary | Student section metadata |
| 50 | `student/TimetableStatus.tsx:10, 52–90` | Status banner | `TIMETABLE_METADATA` + `"Demo: Switch to Unpublished View"` toggle | Yes | Primary | Live `/timetables` status |
| 51 | `login/LoginForm.tsx:40–53` | Placeholder | `'ananya.22ai@sode-edu.in'` | Yes | Placeholder | Generic placeholder |
| 52 | `login/SchedulePreview.tsx:32–95` | Unused preview | `'CS302'`, `'Dr. Radhika Shenoy'`, `'Room L-302'` | No | Primary | Remove unused file |
| 53 | `backend/app/models/entities.py:582`, `schemas/entities.py:699` | `InstitutionalAssignment` | Default `locked_by="Dr. Sudarshan Rao (Dean Academics)"` | Conditional | Default | `None` (set from `AuthContext`) |
| 54 | `backend/app/core/dependencies.py:120–153` | `get_current_user_context` | `dev-token-*` synthetic users (`dept_aids`, `dept_chemistry`, `dev_admin`) when `DEBUG=True` | Dev only | Dev fallback | Enforce `DEBUG=False` in prod |
| 55 | `backend/app/repositories/collections.py:295` | `save_draft_placements` | Default `academic_year="2026-2027"` | No | Fallback | Require `academic_year` |

*(Excluded legitimate static UI config: college name/address, Mon–Sat day names, period timings, and generic form hints.)*

---

## E. Cross-Role Consistency

| Shared Data Domain | Intended Source of Truth | Current Read/Write Behavior Across Roles | Inconsistencies / Breaks |
|---|---|---|---|
| **Subjects Catalog** | Firestore `subjects` | Dean (`deanSubjects`), Dept Coord (`deptSubjects`), and Basic Science (`physicsSubjects`, `chemistrySubjects`) maintain **3 separate React state arrays** in `WorkflowContext`. | `deanSubjects` is never populated from Firestore; `deptSubjects` filters `!s.department_id \|\| 'dept_aids'` (capturing 1st-year `null` subjects); `BasicScienceSubjectAllocation` writes `dept_basic_science` while `syncBackendData` reads `dept_physics`/`dept_chemistry`. |
| **Faculty Allocations & Workload** | Firestore `allotments` & `workloadRecords` | `DeptSubjectAllocationView` writes `deptSubjects` in local state; `WorkloadRecordRepository` computes real hours into `facultyWorkload`; UI workload views read `departmentFaculty` instead. | Assigning faculty in `DeptSubjectAllocationView` does **not** update `allotments`, `workloadRecords`, `PrincipalFacultyManagementView`, or `SubjectPreferencesAndWorkloadPage`. |
| **Timetable Drafts & Locks** | Firestore `timetables` & `timetableSlots` | Dean, Dept Coord, and Basic Science editors write via `POST /timetables/draft` and restore on refresh. | Unlock (`unlockDeanSectionTimetable`, `unlockCycleTimetable`) and HOD Approve/Return (`HODTimetableProgressView`) are local-only; Student/Faculty views do not filter by `PUBLISHED` or section; `saveDeanSectionTimetable` writes `is_locked: false` on slots. |
| **Faculty Preferences** | Firestore `facultyPreferences` | Faculty `SubjectPreferencesAndWorkloadPage` writes via `POST /preferences/submit` (`faculty_id = auth_ctx.uid` = `dev_user_faculty`). Coordinator `FacultyPreferencesReview` calls `PUT /preferences/{id}/hod-review`. | `HODWorkloadPreferencesView` writes `departmentFaculty.finalizedPreferences` locally without calling `POST /preferences/{id}/finalize`; `dev_user_faculty` UID does not match real `faculty` doc IDs. |
| **Departments & Leadership** | Firestore `departments` | `Principal` `InstitutionalManagementView` updates `departments` locally; `syncBackendData` overwrites HOD/Coordinator/counts with hardcoded `'Dr. Tejaswini H'` / `'18'` / `'100%'`. | Principal changes never reach HOD, Coordinator, or Dean PDF signatories. |
| **Academic Calendar / Stage Locks** | None (missing backend collection/router) | `WorkflowContext` holds `institutionalConfig`, `deanStatus`, `basicScienceManualStatus`, `departmentManualStatus` in local memory. | Each browser session starts with hardcoded `'LOCKED'` / `'PUBLISHED'` statuses regardless of real database state. |

---

## F. Loading and Error Handling (By Component)

| Component / Layer | Initial Loading State | Empty State | Error State | Offline / Failure & Save Safety Issues |
|---|---|---|---|---|
| **`WorkflowContext.tsx`** | None (renders `INITIAL_*` demo data immediately) | Masked (`res.value.length > 0` guard leaves demo data) | `backendSyncError` set, never rendered | `Promise.allSettled` clears error if *any* 1 endpoint returns non-empty; `isUsingFallbackData` hardcoded `false`; `.catch(console.warn)` / `.catch(() => {})` swallows mutation errors; no `isBackendConnected` guard before saves. |
| **All 7 Role Dashboards (`*Dashboard.tsx`)** | None | Delegated | None | All render demo/partial data on mount before `syncBackendData` finishes. |
| **`DeanTimetableEditor.tsx`** | None | Yes (subjects & generator) | Yes (`toastMsg` on save/lock) | `Save Draft` disabled during `isSaving`; **`Lock Timetable` NOT disabled** during `isSaving`; `Unlock` ignores backend; incoming SSE sync overwrites unsaved `placements`. |
| **`CycleTimetableEditor.tsx`** | None | Yes (subjects & generator) | Yes (`toastMsg` on save/lock) | `Save Draft` disabled during `isSaving`; **`Lock & Finalize` NOT disabled** during `isSaving`; `handleGenerateTimetable` does not `await` save; incoming SSE sync overwrites unsaved `placements`. |
| **`DeptTimetableEditor.tsx`** | None | Yes (subjects & generator) | Yes (`toastMsg` on save/generate) | `Save Draft` disabled during `isSaving`; **`Publish` and `Generate` NOT disabled** during in-flight requests; `handlePublishTimetable` un-awaited with `.catch(() => {})`. |
| **`SubjectFacultyAllocation.tsx` / `DeptSubjectAllocationView.tsx` / `BasicScienceSubjectAllocation.tsx`** | None | Yes (`Dept` & `BS`) | None (un-awaited) | Success banner shown immediately before backend confirms; failed `POST/PUT/DELETE` silently reverts on refresh. |
| **`FacultyAllocationView.tsx`** | None | Yes | None (un-awaited) | Roster CRUD un-awaited; login toggle local-only. |
| **`SubjectPreferencesAndWorkloadPage.tsx`** | None | Partial | None (un-awaited) | Shows `"successfully submitted!"` before `POST /preferences/submit` completes; no `isSubmitting` disable state. |
| **`HODTimetableProgressView.tsx` / `HODWorkloadPreferencesView.tsx`** | None | No | None | All mutations local-only; no error feedback possible. |
| **`StudentTimetable.tsx` / `StudentWelcome.tsx` / `StudentProfile.tsx`** | None | Agenda only (Grid shows empty cells) | None | No error/offline state; displays static `STUDENT_PROFILE` and unfiltered slots. |

---

## G. Critical Issues (Prioritized)

### Critical (Data Loss, Incorrect Persistence, Security / Unauthorized Modification)
1. **Auth & RBAC Bypass in Frontend & Backend Default Config**: `LoginForm` mocks login without Firebase Auth (`frontend/package.json` lacks `firebase`), `api.ts` sends `dev-token-admin` on reads, and `backend/app/core/config.py:24` defaults `DEBUG=True`, bypassing `verify_id_token` and Firestore `users` checks in `dependencies.py:120–153`.
2. **Draft Overwrite Risk on Failed Load**: `WorkflowContext` seeds `INITIAL_*` demo timetables and never blocks saves when `isBackendConnected === false`, allowing a user whose initial sync failed to overwrite live Firestore `timetableSlots` with demo data.
3. **Anonymous Draft Leakage in Backend**: `GET /api/v1/timetables/department/{dept_id}` (`timetables.py:299–309`) and `GET /api/v1/timetable-slots` without `timetable_id` (`timetable_slots.py:55–61`) return unpublished draft timetables/slots to unauthenticated callers.
4. **Backend `AttributeError` Bugs in Create & Generate Routes**:
   - `subjects.py:39` and `faculty.py:45` call `repository.get(doc_id)` instead of `get_by_id(doc_id)`.
   - `timetables.py:132, 138` calls `subject_repository.get(s_id)`, and `timetables.py:183` passes `department_id=None` for First Year into `get_or_create_fixed_classroom`, which calls `None.replace(...)` (`collections.py:826`).
   - `departments.py:54` calls non-existent `department_repository.update_or_raise`.

### High (Important Workflows Disconnected)
5. **Class-Specific Subject & Faculty Allocation Disconnected**: `DeptSubjectAllocationView` (`updateDeptSubjectAllocation`, `autoAllocateDeptSubjects`) only updates local state and never writes to `allotments`; `syncBackendData` leaks `department_id: null` subjects into `deptSubjects` and drops `dept_basic_science` non-physics/chemistry subjects on refresh.
6. **Workload Views Ignore Real Allocations**: UI workload views display hardcoded `theoryHours: 8, labHours: 4` from `WorkflowContext.tsx:408–410` instead of `workloadRecords` / `allotments`.
7. **Dean Institutional Slots, Global Locks & Audit Logs Local-Only**: `FixedSlotConfiguration`, `LockReopenSchedule`, `DeanVersionHistory`, and `unlockDeanSectionTimetable` / `unlockCycleTimetable` do not persist to Firestore (`institutionalAssignments` and `auditLogs` have no routers).
8. **HOD Approvals, Preference Finalization & Duties Local-Only**: `HODTimetableProgressView` and `HODWorkloadPreferencesView` do not persist approvals, returns, duties, or `/preferences/{id}/finalize`.
9. **Student & Faculty Identity/Scoping Disconnected**: Students see static `STUDENT_PROFILE` and unfiltered `timetableSlots` across all sections/drafts; Faculty falls back to `'Dr. Ananya Rao'` and local-only `facultyLeaves`.

### Medium (Inconsistent Data or Incomplete Restoration)
10. **Un-awaited Optimistic Mutations**: Subject, faculty, preference, and `publishDeptSectionTimetable` (`tt_2026_odd_aids_sem3_a` hardcoded) mutations show success before backend confirmation and swallow errors.
11. **Hardcoded Clash Validation & Principal Monitoring**: `DeptTimetableEditor` (Tuesday P6 rule), `CoordinatorClashValidation`, `BasicScienceClashValidation`, `AcademicMonitoringView`, and `PrincipalFacultyManagementView` display fabricated statuses/assignments.
12. **SSE Realtime Sync Gaps**: Missing broadcasts for subjects, allotments, preferences, and timetable status changes; `{ event, entity_id }` vs `{ type, id }` payload mismatch; SSE refresh overwrites open editor `placements`; `disconnect()` not called on unmount.

### Low (Loading, Error Messaging & Minor Fallbacks)
13. **Missing Global Loading/Error UI & Empty State Masking**: `isBackendConnected` / `backendSyncError` are unused; `res.value.length > 0` prevents clearing demo arrays on empty DB.
14. **Double-Submit Gaps on Lock / Publish / Generate / Submit Buttons**: Buttons lack `disabled={isSaving}` / `isSubmitting` states.
15. **Hardcoded Actor Names & Selectors**: Component headers/sidebars/signatories hardcode individual names (`Dr. Sudarshan Rao`, `Prof. Rajesh Shetty`, `Dr. Vasudeva`, `Dr. Ravindra Shenoy`, `Dr. Thirumaleshwara Bhat`).

---

## H. Recommended Implementation Order

*(Note on Existing Tests: `backend/tests/` contains unit/API tests backed primarily by `mock_firestore.py`, plus `test_live_firestore_opt_in.py`. Phase 1 draft persistence was verified in an earlier step; Phases 2–6 findings above are established by code-path inspection.)*

1. **Step 1 — Critical Backend Bug Fixes & Security Hardening (Zero Breaking Risk)**
   - Fix `.get()` → `.get_by_id()`, `.update_or_raise()` → `.update()`, and First Year `department_id=None` guard in `get_or_create_fixed_classroom`.
   - Enforce `PUBLISHED`-only filtering on `GET /timetables/department/{dept_id}` and `GET /timetable-slots` for non-coordinators; add `check_department_access` to `preferences.py:list_all_preferences` and `subjects.py`/`allotments.py` reads.
   - *Files*: `backend/app/routers/subjects.py`, `faculty.py`, `departments.py`, `timetables.py`, `timetable_slots.py`, `preferences.py`, `allotments.py`, `backend/app/repositories/collections.py`.

2. **Step 2 — Phase 3 & 6 Foundation: Remove Demo Seed Fallbacks & Add Loading/Error/Safe-Save Guards**
   - Initialize `WorkflowContext` arrays as empty `[]`, add `isLoading` state, remove `res.value.length > 0` masking, fix `Promise.allSettled` error detection, block saves when `!isBackendConnected`, and disable `Lock`/`Publish`/`Generate`/`Submit` buttons while in-flight.
   - Await subject/faculty/preference mutations in `WorkflowContext` and show real error toasts.
   - *Files*: `frontend/src/context/WorkflowContext.tsx`, `frontend/src/data/*.ts`, `frontend/src/components/dean/DeanTimetableEditor.tsx`, `SubjectFacultyAllocation.tsx`, `frontend/src/components/department-coordinator/DeptTimetableEditor.tsx`, `DeptSubjectAllocationView.tsx`, `FacultyAllocationView.tsx`, `frontend/src/components/basic-science/CycleTimetableEditor.tsx`, `BasicScienceSubjectAllocation.tsx`.

3. **Step 3 — Phase 2: Subject, Allotment & Workload Persistence**
   - Connect `DeptSubjectAllocationView` (`handleFacultyChange`, `handleRunAutoAllocation`) to `POST/PUT/DELETE /api/v1/allotments`; fix `syncBackendData` scoping for `deanSubjects`, `deptSubjects` (exclude `department_id: null`), and `physicsSubjects`/`chemistrySubjects` (`dept_basic_science`).
   - Bind all 4 workload views to `facultyWorkload` (`/workload-records`) instead of hardcoded `8`/`4` hours.
   - *Files*: `frontend/src/context/WorkflowContext.tsx`, `frontend/src/components/department-coordinator/DeptSubjectAllocationView.tsx`, `FacultyWorkloadPreferencesView.tsx`, `frontend/src/components/hod/HODWorkloadPreferencesView.tsx`, `frontend/src/components/basic-science/BasicScienceWorkloadView.tsx`, `frontend/src/components/principal/PrincipalFacultyManagementView.tsx`.

4. **Step 4 — Phase 4: Dean Institutional Slots, Locks, Audit Logs, HOD Approvals & Basic Science Sections**
   - Add FastAPI routers for `institutionalAssignments` and `auditLogs` (and `POST /timetables/{id}/publish` or dedicated lock/unlock/approve/return status endpoints).
   - Wire `FixedSlotConfiguration`, `LockReopenSchedule`, `DeanVersionHistory`, `unlockDeanSectionTimetable`, `unlockCycleTimetable`, `HODTimetableProgressView`, `HODWorkloadPreferencesView` (`finalizePreference`), `CycleAllocationManager`, and `InstitutionalManagementView` to backend endpoints.
   - *Files*: `backend/app/main.py`, new routers (`institutional_assignments.py`, `audit_logs.py`), `backend/app/routers/timetables.py`, `sections.py`, `frontend/src/services/api.ts`, `WorkflowContext.tsx`, and respective Dean/HOD/Basic Science/Principal components.

5. **Step 5 — Phase 5: Real Firebase Auth, User Identity, Faculty & Student Scoping**
   - Integrate Firebase Client SDK in `frontend`, replace mock `LoginForm` / `StudentRegistration`, store real ID tokens, resolve user profile/role/department from `users/{uid}`, and remove hardcoded `'Dr. Ananya Rao'` / `STUDENT_PROFILE` / `'dept_aids'` defaults.
   - Bind `MyTimetablePage` to `GET /timetables/faculty/{id}` and `StudentTimetable` to published section-filtered timetables; add backend router for faculty leaves if retained.
   - *Files*: `frontend/package.json`, `frontend/src/services/api.ts`, `frontend/src/components/login/LoginForm.tsx`, `StudentRegistration.tsx`, `frontend/src/App.tsx`, `WorkflowContext.tsx`, `frontend/src/pages/FacultyDashboard.tsx`, `StudentDashboard.tsx`, `frontend/src/components/faculty/*`, `frontend/src/components/student/*`.

6. **Step 6 — Phase 6 Completion: Realtime SSE Consistency & Live Clash Validation**
   - Add missing `realtime_broadcaster.broadcast` calls in `subjects.py`, `allotments.py`, `preferences.py`, `timetables.py`; align `{ event, entity_id }` payload types in `realtime.ts`; prevent SSE sync from clobbering dirty editor `placements`; replace hardcoded clash checks with `/timetables/{id}/validate`.
   - *Files*: `backend/app/routers/subjects.py`, `allotments.py`, `preferences.py`, `timetables.py`, `frontend/src/services/realtime.ts`, `WorkflowContext.tsx`, `DeptTimetableEditor.tsx`, `AcademicMonitoringView.tsx`, `CoordinatorClashValidation.tsx`, `BasicScienceClashValidation.tsx`.

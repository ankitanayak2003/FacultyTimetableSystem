import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DraftSaveCoordinator,
  SyncRequestTracker,
  buildCycleTimetableId,
  buildDeanTimetableId,
  buildDeptTimetableId,
  evaluateSyncOutcome,
  shouldApplyRemotePlacements,
} from '../src/utils/syncIntegrity.ts';

test('1. Successful initial synchronization marks backend connected', () => {
  const outcome = evaluateSyncOutcome({
    timetablesOk: true,
    slotsOk: true,
    departmentsOk: true,
    facultyOk: true,
    subjectsOk: true,
  });
  assert.equal(outcome.syncStatus, 'connected');
  assert.equal(outcome.isBackendConnected, true);
  assert.equal(outcome.backendSyncError, null);
  assert.equal(outcome.isUsingFallbackData, false);
});

test('2. Successfully loaded empty timetable collections are treated as connected', () => {
  // Even when all arrays are [], fulfilled responses must yield connected state
  const outcome = evaluateSyncOutcome({
    timetablesOk: true,
    slotsOk: true,
    departmentsOk: true,
    facultyOk: true,
    subjectsOk: true,
    firstError: null,
  });
  assert.equal(outcome.syncStatus, 'connected');
  assert.equal(outcome.isBackendConnected, true);
});

test('3. Failed initial synchronization marks error even if other endpoints succeeded', () => {
  const outcome = evaluateSyncOutcome({
    timetablesOk: true,
    slotsOk: false,
    departmentsOk: true,
    facultyOk: true,
    subjectsOk: true,
    firstError: 'Network timeout on timetable-slots',
  });
  assert.equal(outcome.syncStatus, 'error');
  assert.equal(outcome.isBackendConnected, false);
  assert.match(outcome.backendSyncError ?? '', /Network timeout/);
});

test('4. Save is blocked when initial sync is loading, failed, or using fallback data', () => {
  const coordinator = new DraftSaveCoordinator();

  assert.throws(
    () =>
      coordinator.assertCanSave({
        syncStatus: 'loading',
        isBackendConnected: null,
        isUsingFallbackData: false,
        timetableId: 'tt_2026_2027_aids_sem3_seca',
        scopeKey: 'k1',
        academicYear: '2026-2027',
        semester: 3,
        section: 'A',
      }),
    /still loading/
  );

  assert.throws(
    () =>
      coordinator.assertCanSave({
        syncStatus: 'error',
        isBackendConnected: false,
        isUsingFallbackData: false,
        timetableId: 'tt_2026_2027_aids_sem3_seca',
        scopeKey: 'k1',
        academicYear: '2026-2027',
        semester: 3,
        section: 'A',
      }),
    /synchronization failed/
  );

  assert.throws(
    () =>
      coordinator.assertCanSave({
        syncStatus: 'connected',
        isBackendConnected: true,
        isUsingFallbackData: true,
        timetableId: 'tt_2026_2027_aids_sem3_seca',
        scopeKey: 'k1',
        academicYear: '2026-2027',
        semester: 3,
        section: 'A',
      }),
    /fallback or demo data/
  );
});

test('5. Save is allowed after successful synchronization', () => {
  const coordinator = new DraftSaveCoordinator();
  assert.doesNotThrow(() =>
    coordinator.assertCanSave({
      syncStatus: 'connected',
      isBackendConnected: true,
      isUsingFallbackData: false,
      timetableId: 'tt_2026_2027_aids_sem3_seca',
      scopeKey: 'k1',
      activeScopeKey: 'k1',
      academicYear: '2026-2027',
      semester: 3,
      section: 'A',
    })
  );
});

test('6 & 7. Scope changes and unsaved dirty edits are protected from stale responses', () => {
  const tracker = new SyncRequestTracker();
  const req1 = tracker.nextRequestId();
  const req2 = tracker.nextRequestId();
  assert.equal(tracker.isLatest(req1), false);
  assert.equal(tracker.isLatest(req2), true);

  // Scope changed while response was in flight
  assert.equal(
    shouldApplyRemotePlacements({
      currentScopeKey: '2026–2027_Second Year_Odd Semester_AIDS_Section B',
      targetScopeKey: '2026–2027_Second Year_Odd Semester_AIDS_Section A',
      isDirty: false,
    }),
    false
  );

  // Unsaved local edits exist for current scope (e.g. after save failure)
  assert.equal(
    shouldApplyRemotePlacements({
      currentScopeKey: '2026–2027_Second Year_Odd Semester_AIDS_Section A',
      targetScopeKey: '2026–2027_Second Year_Odd Semester_AIDS_Section A',
      isDirty: true,
    }),
    false
  );

  // Clean current scope accepts remote update
  assert.equal(
    shouldApplyRemotePlacements({
      currentScopeKey: '2026–2027_Second Year_Odd Semester_AIDS_Section A',
      targetScopeKey: '2026–2027_Second Year_Odd Semester_AIDS_Section A',
      isDirty: false,
    }),
    true
  );

  // Scope changed before save start
  const coordinator = new DraftSaveCoordinator();
  assert.throws(
    () =>
      coordinator.assertCanSave({
        syncStatus: 'connected',
        isBackendConnected: true,
        isUsingFallbackData: false,
        timetableId: 'tt_2026_2027_aids_sem3_seca',
        scopeKey: 'scope_A',
        activeScopeKey: 'scope_B',
        academicYear: '2026-2027',
        semester: 3,
        section: 'A',
      }),
    /scope changed/
  );
});

test('8. Concurrent/duplicate save protection blocks same timetable but allows different scopes', () => {
  const coordinator = new DraftSaveCoordinator();
  const ttIdA = 'tt_2026_2027_aids_sem3_seca';
  const ttIdB = 'tt_2026_2027_aids_sem3_secb';
  coordinator.beginSave(ttIdA);
  assert.equal(coordinator.isSaving(ttIdA), true);
  assert.equal(coordinator.isSaving(ttIdB), false);

  assert.throws(
    () =>
      coordinator.assertCanSave({
        syncStatus: 'connected',
        isBackendConnected: true,
        isUsingFallbackData: false,
        timetableId: ttIdA,
        scopeKey: 'k1',
        academicYear: '2026-2027',
        semester: 3,
        section: 'A',
      }),
    /already in progress/
  );

  // Different timetable scope is NOT blocked while ttIdA is saving
  assert.doesNotThrow(() =>
    coordinator.assertCanSave({
      syncStatus: 'connected',
      isBackendConnected: true,
      isUsingFallbackData: false,
      timetableId: ttIdB,
      scopeKey: 'k2',
      academicYear: '2026-2027',
      semester: 3,
      section: 'B',
    })
  );

  coordinator.endSave(ttIdA);
  assert.equal(coordinator.isSaving(ttIdA), false);
});

test('9. Dean, Dept, and Basic Science timetable ID builders enforce First Year department_id=null', () => {
  const deanFY = buildDeanTimetableId({
    academicYear: '2026–2027',
    studentYear: 'First Year',
    semester: 'Odd Semester',
    department: 'AIDS', // Even if passed, First Year must yield null
    section: 'Section A',
  });
  assert.equal(deanFY.ttId, 'tt_2026_2027_firstyear_sem1_seca');
  assert.equal(deanFY.departmentId, null);
  assert.equal(deanFY.semesterNum, 1);

  const cycleFY = buildCycleTimetableId({
    cycle: 'Physics',
    academicYear: '2026–2027',
    semester: 'Even Semester',
    section: 'Section B',
  });
  assert.equal(cycleFY.ttId, 'tt_2026_2027_physics_sem2_secb');
  assert.equal(cycleFY.departmentId, null);
  assert.equal(cycleFY.semesterNum, 2);

  const deptTT = buildDeptTimetableId({
    academicYear: '2026–2027',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
    department: 'AIDS',
    section: 'Section A',
  });
  assert.equal(deptTT.ttId, 'tt_2026_2027_aids_sem3_seca');
  assert.equal(deptTT.departmentId, 'dept_aids');
  assert.equal(deptTT.semesterNum, 3);
});

/**
 * Pure synchronization, draft-protection, and race-condition guards for AQS.
 * Keeps backend sync state, scope identity, and save safety deterministic and testable.
 */

export type BackendSyncStatus = 'loading' | 'connected' | 'error';

export interface SyncEndpointOutcome {
  timetablesOk: boolean;
  slotsOk: boolean;
  departmentsOk?: boolean;
  facultyOk?: boolean;
  subjectsOk?: boolean;
  firstError?: string | null;
}

export interface EvaluatedSyncState {
  syncStatus: 'connected' | 'error';
  isBackendConnected: boolean;
  backendSyncError: string | null;
  isUsingFallbackData: false;
}

/**
 * Evaluates whether backend synchronization succeeded.
 * - An empty array (`[]`) from a fulfilled endpoint is a valid connected state.
 * - Any failure in critical timetable/slot/catalog endpoints marks sync as 'error'.
 */
export function evaluateSyncOutcome(outcome: SyncEndpointOutcome): EvaluatedSyncState {
  const coreCatalogOk =
    (outcome.departmentsOk ?? true) &&
    (outcome.facultyOk ?? true) &&
    (outcome.subjectsOk ?? true);

  if (outcome.timetablesOk && outcome.slotsOk && coreCatalogOk) {
    return {
      syncStatus: 'connected',
      isBackendConnected: true,
      backendSyncError: null,
      isUsingFallbackData: false,
    };
  }

  const reason = outcome.firstError?.trim() || 'One or more critical backend endpoints failed to respond.';
  return {
    syncStatus: 'error',
    isBackendConnected: false,
    backendSyncError: `Backend synchronization failed: ${reason}`,
    isUsingFallbackData: false,
  };
}

/**
 * Monotonic request tracker so slower responses from earlier sync calls
 * cannot overwrite newer state.
 */
export class SyncRequestTracker {
  private currentId = 0;

  nextRequestId(): number {
    this.currentId += 1;
    return this.currentId;
  }

  isLatest(requestId: number): boolean {
    return requestId === this.currentId;
  }
}

export interface SaveGuardInput {
  syncStatus: BackendSyncStatus;
  isBackendConnected: boolean | null;
  isUsingFallbackData: boolean;
  timetableId: string;
  scopeKey: string;
  activeScopeKey?: string;
  academicYear: string;
  semester: number;
  section: string;
}

/**
 * Tracks in-flight draft saves per timetable ID to prevent duplicate or
 * concurrent overlapping writes and enforce synchronization preconditions.
 */
export class DraftSaveCoordinator {
  private inFlightIds = new Set<string>();

  isSaving(timetableId: string): boolean {
    return this.inFlightIds.has(timetableId);
  }

  assertCanSave(input: SaveGuardInput): void {
    if (input.syncStatus === 'loading' || input.isBackendConnected === null) {
      throw new Error('Cannot save draft while initial backend synchronization is still loading.');
    }
    if (input.syncStatus === 'error' || input.isBackendConnected === false) {
      throw new Error('Cannot save draft: backend synchronization failed. Retry sync first.');
    }
    if (input.isUsingFallbackData) {
      throw new Error('Cannot save fallback or demo data over Firestore timetable records.');
    }
    if (!input.timetableId?.trim() || !input.academicYear?.trim() || !input.section?.trim()) {
      throw new Error('Cannot save draft: invalid or incomplete timetable scope.');
    }
    if (!Number.isInteger(input.semester) || input.semester < 1 || input.semester > 8) {
      throw new Error('Cannot save draft: invalid semester.');
    }
    if (input.activeScopeKey !== undefined && input.scopeKey !== input.activeScopeKey) {
      throw new Error('Selected timetable scope changed before save could start.');
    }
    if (this.inFlightIds.has(input.timetableId)) {
      throw new Error(`A save operation is already in progress for ${input.timetableId}.`);
    }
  }

  beginSave(timetableId: string): void {
    this.inFlightIds.add(timetableId);
  }

  endSave(timetableId: string): void {
    this.inFlightIds.delete(timetableId);
  }
}

/**
 * Determines whether incoming remote placements should replace the editor's
 * current grid state. Prevents stale responses or SSE refreshes from overwriting
 * a different selected scope or unsaved local edits.
 */
export function shouldApplyRemotePlacements(params: {
  currentScopeKey: string;
  targetScopeKey: string;
  isDirty: boolean;
}): boolean {
  if (params.currentScopeKey !== params.targetScopeKey) {
    return false;
  }
  return !params.isDirty;
}

export function normalizeAcademicYearForId(academicYear: string): {
  cleanAy: string;
  ayUnderscore: string;
} {
  const cleanAy = academicYear.replace('–', '-').trim();
  return {
    cleanAy,
    ayUnderscore: cleanAy.replace('-', '_'),
  };
}

export function buildDeanTimetableId(params: {
  academicYear: string;
  studentYear: string;
  semester: string;
  department: string | null;
  section: string;
}): { ttId: string; semesterNum: number; departmentId: string | null; cleanAy: string; cleanSection: string } {
  const isFirstYear = params.studentYear === 'First Year';
  const isEven = params.semester.toLowerCase().includes('even');
  const semesterNum = isFirstYear
    ? (isEven ? 2 : 1)
    : params.studentYear === 'Second Year'
    ? (isEven ? 4 : 3)
    : params.studentYear === 'Third Year'
    ? (isEven ? 6 : 5)
    : (isEven ? 8 : 7);

  const cleanSection = params.section.replace(/Section\s*/i, '').trim().toUpperCase();
  const { cleanAy, ayUnderscore } = normalizeAcademicYearForId(params.academicYear);
  const deptTag = (params.department || '').trim().toLowerCase();

  const ttId = isFirstYear
    ? `tt_${ayUnderscore}_firstyear_sem${semesterNum}_sec${cleanSection.toLowerCase()}`
    : `tt_${ayUnderscore}_${deptTag}_sem${semesterNum}_sec${cleanSection.toLowerCase()}`;

  return {
    ttId,
    semesterNum,
    departmentId: isFirstYear ? null : (deptTag ? `dept_${deptTag}` : null),
    cleanAy,
    cleanSection,
  };
}

export function buildCycleTimetableId(params: {
  cycle: string;
  academicYear: string;
  semester: string;
  section: string;
}): { ttId: string; semesterNum: number; departmentId: null; cleanAy: string; cleanSection: string } {
  const semesterNum = params.semester.toLowerCase().includes('even') ? 2 : 1;
  const cleanSection = params.section.replace(/Section\s*/i, '').trim().toUpperCase();
  const { cleanAy, ayUnderscore } = normalizeAcademicYearForId(params.academicYear);
  const cycTag = params.cycle.trim().toLowerCase();

  return {
    ttId: `tt_${ayUnderscore}_${cycTag}_sem${semesterNum}_sec${cleanSection.toLowerCase()}`,
    semesterNum,
    departmentId: null,
    cleanAy,
    cleanSection,
  };
}

export function buildDeptTimetableId(params: {
  academicYear: string;
  studentYear: string;
  semester: string;
  department: string;
  section: string;
}): { ttId: string; semesterNum: number; departmentId: string; cleanAy: string; cleanSection: string } {
  const isEven = params.semester.toLowerCase().includes('even');
  const semesterNum = params.studentYear === 'Second Year'
    ? (isEven ? 4 : 3)
    : params.studentYear === 'Third Year'
    ? (isEven ? 6 : 5)
    : (isEven ? 8 : 7);

  const cleanSection = params.section.replace(/Section\s*/i, '').trim().toUpperCase();
  const { cleanAy, ayUnderscore } = normalizeAcademicYearForId(params.academicYear);
  const deptCode = (params.department || '').trim().toLowerCase();

  return {
    ttId: `tt_${ayUnderscore}_${deptCode}_sem${semesterNum}_sec${cleanSection.toLowerCase()}`,
    semesterNum,
    departmentId: `dept_${deptCode}`,
    cleanAy,
    cleanSection,
  };
}

export interface CoordinatorDepartmentScope {
  departmentId: string | null;
  departmentCode: string | null;
  departmentName: string | null;
}

/**
 * Resolves the active Department Coordinator scope from an explicit department ID
 * and the loaded institutional departments list. Never silently falls back to a
 * hardcoded department (such as dept_aids) when unresolved.
 */
export function resolveCoordinatorDepartment(params: {
  explicitDepartmentId?: string | null;
  departments: Array<{ id: string; code?: string | null; name?: string | null }>;
}): CoordinatorDepartmentScope {
  const raw = (params.explicitDepartmentId || '').trim();
  if (!raw) {
    return { departmentId: null, departmentCode: null, departmentName: null };
  }
  const normalizedRaw = raw.toLowerCase();
  const match = params.departments.find((d) => {
    const idMatch = d.id.trim().toLowerCase() === normalizedRaw;
    const codeMatch = (d.code || '').trim().toLowerCase() === normalizedRaw;
    const prefMatch = `dept_${(d.code || '').trim().toLowerCase()}` === normalizedRaw;
    return idMatch || codeMatch || prefMatch;
  });
  if (!match) {
    return { departmentId: null, departmentCode: null, departmentName: null };
  }
  return {
    departmentId: match.id,
    departmentCode: (match.code || match.id.replace(/^dept_/i, '')).toUpperCase(),
    departmentName: match.name || match.code || match.id,
  };
}

/**
 * Resolves the faculty name allocated to a subject for a specific
 * (academicYear, semester, section) scope. Returns '' when unassigned so
 * allocations never bleed across Section A / Section B or academic years.
 */
export function resolveSectionAllocation(
  allocations: Array<{
    subjectId?: string;
    courseCode?: string;
    academicYear?: string;
    semester?: string;
    section?: string;
    facultyNames?: string[];
  }>,
  subjectId: string,
  courseCode: string,
  academicYear: string,
  semester: string,
  section: string
): string {
  const cleanAy = academicYear.replace('–', '-').trim();
  const cleanSec = section.replace(/Section\s*/i, '').trim().toUpperCase();
  const cleanSem = semester.trim().toLowerCase();
  const cleanCode = courseCode.trim().toUpperCase();

  const match = allocations.find((a) => {
    const subMatch =
      (a.subjectId && a.subjectId === subjectId) ||
      (cleanCode && (a.courseCode || '').trim().toUpperCase() === cleanCode);
    if (!subMatch) return false;

    const aAy = (a.academicYear || '').replace('–', '-').trim();
    if (cleanAy && aAy && aAy !== cleanAy) return false;

    const aSem = (a.semester || '').trim().toLowerCase();
    if (cleanSem && aSem && aSem !== cleanSem) return false;

    const aSec = (a.section || '').replace(/Section\s*/i, '').trim().toUpperCase();
    if (cleanSec && aSec !== cleanSec) return false;

    return true;
  });

  return match?.facultyNames?.[0] || '';
}

/**
 * Checks whether a department belongs to the Basic Science category using the
 * loaded institutional departments collection and standard department identifiers.
 * Never guesses based on faculty names or test records.
 */
export function isBasicScienceDepartment(
  departmentId: string | undefined | null,
  departments: Array<{ id: string; code?: string | null; category?: string | null }> = []
): boolean {
  if (!departmentId) return false;
  const rawId = departmentId.trim().toLowerCase();

  // 1. Check loaded departments list for matching record with category 'BASIC_SCIENCE'
  const dept = departments.find((d) => {
    const dId = (d.id || '').trim().toLowerCase();
    const dCode = (d.code || '').trim().toLowerCase();
    return dId === rawId || dCode === rawId || `dept_${dCode}` === rawId;
  });

  if (dept && dept.category) {
    if (dept.category.toUpperCase() === 'BASIC_SCIENCE') {
      return true;
    }
  }

  // 2. Canonical Basic Science department IDs from database schema
  const knownBsDeptIds = [
    'dept_math',
    'dept_physics',
    'dept_chemistry',
    'dept_basic_science',
    'dept_mathematics',
    'math',
    'physics',
    'chemistry',
    'basic_science',
    'mathematics',
  ];
  return knownBsDeptIds.includes(rawId);
}

export interface CategorizedBasicScienceFaculty<T = { name: string; department?: string | null }> {
  basicScienceFaculty: T[];
  otherDepartmentFaculty: T[];
  basicScienceNames: string[];
  otherDepartmentNames: string[];
}

/**
 * Categorizes a faculty list into two distinct groups:
 * 1. Basic Science Faculty: Faculty whose actual department belongs to Basic Science.
 * 2. Faculty from Other Departments: Faculty whose actual department is not Basic Science.
 *
 * Uses actual department IDs and metadata; never uses name guesses or dummy records.
 */
export function categorizeBasicScienceFaculty<T extends { name: string; department?: string | null }>(params: {
  faculty: T[];
  departments?: Array<{ id: string; code?: string | null; category?: string | null }>;
}): CategorizedBasicScienceFaculty<T> {
  const departments = params.departments || [];
  const bsFac: T[] = [];
  const otherFac: T[] = [];
  const seenBs = new Set<string>();
  const seenOther = new Set<string>();

  for (const f of params.faculty) {
    const name = f.name?.trim();
    if (!name) continue;

    const isBs = isBasicScienceDepartment(f.department, departments);
    if (isBs) {
      if (!seenBs.has(name)) {
        seenBs.add(name);
        bsFac.push(f);
      }
    } else {
      if (!seenOther.has(name)) {
        seenOther.add(name);
        otherFac.push(f);
      }
    }
  }

  return {
    basicScienceFaculty: bsFac,
    otherDepartmentFaculty: otherFac,
    basicScienceNames: bsFac.map((f) => f.name),
    otherDepartmentNames: otherFac.map((f) => f.name),
  };
}

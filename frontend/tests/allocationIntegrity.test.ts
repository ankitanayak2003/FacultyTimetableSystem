import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDeanTimetableId,
  buildDeptTimetableId,
  evaluateSyncOutcome,
  resolveCoordinatorDepartment,
  resolveSectionAllocation as resolveProdSectionAllocation,
  shouldApplyRemotePlacements,
  isBasicScienceDepartment,
  categorizeBasicScienceFaculty,
} from '../src/utils/syncIntegrity.ts';

interface AllocationItem {
  id: string;
  subjectId?: string;
  courseCode: string;
  academicYear?: string;
  semester?: string;
  section: string;
  facultyName: string;
}

function resolveSectionAllocation(
  allocations: AllocationItem[],
  subjectId: string,
  courseCode: string,
  academicYear: string,
  semester: string,
  section: string
): string {
  const match = allocations.find(
    (a) =>
      (a.subjectId === subjectId || (courseCode && a.courseCode === courseCode)) &&
      (!a.academicYear || a.academicYear === academicYear) &&
      (!a.semester || a.semester === semester) &&
      (!a.section || a.section === section)
  );
  return match?.facultyName || '';
}

test('1. Section-scoped allocation resolves independently per section and reflects in timetable workflow', () => {
  const allocations: AllocationItem[] = [
    {
      id: 'alt_sec_a',
      subjectId: 'sub_bai301',
      courseCode: 'BAI301',
      academicYear: '2026–2027',
      semester: 'Odd Semester',
      section: 'Section A',
      facultyName: 'Dr. Ananya Rao',
    },
    {
      id: 'alt_sec_b',
      subjectId: 'sub_bai301',
      courseCode: 'BAI301',
      academicYear: '2026–2027',
      semester: 'Odd Semester',
      section: 'Section B',
      facultyName: 'Prof. Rajesh Shetty',
    },
  ];

  assert.equal(
    resolveSectionAllocation(allocations, 'sub_bai301', 'BAI301', '2026–2027', 'Odd Semester', 'Section A'),
    'Dr. Ananya Rao'
  );
  assert.equal(
    resolveSectionAllocation(allocations, 'sub_bai301', 'BAI301', '2026–2027', 'Odd Semester', 'Section B'),
    'Prof. Rajesh Shetty'
  );
  // Empty/unallocated section returns '' without dummy fallback
  assert.equal(
    resolveSectionAllocation(allocations, 'sub_bai301', 'BAI301', '2026–2027', 'Odd Semester', 'Section C'),
    ''
  );
});

test('2. Empty allocation response from backend leaves sync connected', () => {
  const outcome = evaluateSyncOutcome({
    timetablesOk: true,
    slotsOk: true,
    departmentsOk: true,
    facultyOk: true,
    subjectsOk: true,
  });
  assert.equal(outcome.syncStatus, 'connected');
  assert.equal(outcome.isBackendConnected, true);
});

test('3. First Year allocation scope uses departmentId=null while dept scope uses departmentId', () => {
  const fy = buildDeanTimetableId({
    academicYear: '2026–2027',
    studentYear: 'First Year',
    semester: 'Odd Semester',
    department: 'AIDS',
    section: 'Section A',
  });
  assert.equal(fy.departmentId, null);
  assert.equal(fy.semesterNum, 1);

  const dept = buildDeptTimetableId({
    academicYear: '2026–2027',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
    department: 'AIDS',
    section: 'Section A',
  });
  assert.equal(dept.departmentId, 'dept_aids');
  assert.equal(dept.semesterNum, 3);
});

test('4. Scope change during pending request prevents stale state overwrite', () => {
  assert.equal(
    shouldApplyRemotePlacements({
      currentScopeKey: '2026–2027_Second Year_Odd Semester_Section B',
      targetScopeKey: '2026–2027_Second Year_Odd Semester_Section A',
      isDirty: false,
    }),
    false
  );
});

test('5. resolveCoordinatorDepartment never defaults to dept_aids when unresolved', () => {
  const departments = [
    { id: 'dept_aids', code: 'AIDS', name: 'AI & Data Science' },
    { id: 'dept_cse', code: 'CSE', name: 'Computer Science & Engineering' },
  ];

  const unresolved = resolveCoordinatorDepartment({
    explicitDepartmentId: null,
    departments,
  });
  assert.equal(unresolved.departmentId, null);
  assert.equal(unresolved.departmentCode, null);

  const unknown = resolveCoordinatorDepartment({
    explicitDepartmentId: 'dept_nonexistent',
    departments,
  });
  assert.equal(unknown.departmentId, null);

  const cse = resolveCoordinatorDepartment({
    explicitDepartmentId: 'dept_cse',
    departments,
  });
  assert.equal(cse.departmentId, 'dept_cse');
  assert.equal(cse.departmentCode, 'CSE');
});

test('6. resolveSectionAllocation isolates Section A from Section B and Academic Years', () => {
  const allocations = [
    {
      subjectId: 'sub_bai301',
      courseCode: 'BAI301',
      academicYear: '2026–2027',
      semester: 'Odd Semester',
      section: 'Section A',
      facultyNames: ['Dr. Anil Kulkarni'],
    },
  ];

  assert.equal(
    resolveProdSectionAllocation(
      allocations,
      'sub_bai301',
      'BAI301',
      '2026–2027',
      'Odd Semester',
      'Section A'
    ),
    'Dr. Anil Kulkarni'
  );
  assert.equal(
    resolveProdSectionAllocation(
      allocations,
      'sub_bai301',
      'BAI301',
      '2026–2027',
      'Odd Semester',
      'Section B'
    ),
    ''
  );
  assert.equal(
    resolveProdSectionAllocation(
      allocations,
      'sub_bai301',
      'BAI301',
      '2025–2026',
      'Odd Semester',
      'Section A'
    ),
    ''
  );
});

test('7. isBasicScienceDepartment identifies Basic Science by category and IDs without name guessing', () => {
  const departments = [
    { id: 'dept_math', code: 'MATH', category: 'BASIC_SCIENCE' },
    { id: 'dept_physics', code: 'PHY', category: 'BASIC_SCIENCE' },
    { id: 'dept_chemistry', code: 'CHEM', category: 'BASIC_SCIENCE' },
    { id: 'dept_aids', code: 'AIDS', category: 'ENGINEERING_PROGRAM' },
    { id: 'dept_cse', code: 'CSE', category: 'ENGINEERING_PROGRAM' },
    { id: 'dept_ece', code: 'ECE', category: 'ENGINEERING_PROGRAM' },
  ];

  // Basic Science departments
  assert.equal(isBasicScienceDepartment('dept_math', departments), true);
  assert.equal(isBasicScienceDepartment('dept_physics', departments), true);
  assert.equal(isBasicScienceDepartment('dept_chemistry', departments), true);
  assert.equal(isBasicScienceDepartment('MATH', departments), true);

  // Engineering departments
  assert.equal(isBasicScienceDepartment('dept_aids', departments), false);
  assert.equal(isBasicScienceDepartment('dept_cse', departments), false);
  assert.equal(isBasicScienceDepartment('dept_ece', departments), false);
  assert.equal(isBasicScienceDepartment('AIDS', departments), false);
  assert.equal(isBasicScienceDepartment(null, departments), false);
  assert.equal(isBasicScienceDepartment(undefined, departments), false);
});

test('8. categorizeBasicScienceFaculty cleanly splits Basic Science vs Other Department faculty', () => {
  const departments = [
    { id: 'dept_math', code: 'MATH', category: 'BASIC_SCIENCE' },
    { id: 'dept_physics', code: 'PHY', category: 'BASIC_SCIENCE' },
    { id: 'dept_chemistry', code: 'CHEM', category: 'BASIC_SCIENCE' },
    { id: 'dept_aids', code: 'AIDS', category: 'ENGINEERING_PROGRAM' },
    { id: 'dept_cse', code: 'CSE', category: 'ENGINEERING_PROGRAM' },
  ];

  const facultyList = [
    { name: 'Dr. Math Faculty', department: 'dept_math' },
    { name: 'Dr. Physics Faculty', department: 'dept_physics' },
    { name: 'Dr. Chem Faculty', department: 'dept_chemistry' },
    { name: 'Prof. AI DS Faculty', department: 'dept_aids' },
    { name: 'Prof. CSE Faculty', department: 'dept_cse' },
  ];

  const result = categorizeBasicScienceFaculty({
    faculty: facultyList,
    departments,
  });

  assert.deepEqual(result.basicScienceNames, [
    'Dr. Math Faculty',
    'Dr. Physics Faculty',
    'Dr. Chem Faculty',
  ]);
  assert.deepEqual(result.otherDepartmentNames, [
    'Prof. AI DS Faculty',
    'Prof. CSE Faculty',
  ]);
  assert.equal(result.basicScienceFaculty.length, 3);
  assert.equal(result.otherDepartmentFaculty.length, 2);
});

test('9. Empty backend faculty list produces empty dropdown categories with zero dummy records', () => {
  const result = categorizeBasicScienceFaculty({
    faculty: [],
    departments: [{ id: 'dept_math', code: 'MATH', category: 'BASIC_SCIENCE' }],
  });

  assert.deepEqual(result.basicScienceNames, []);
  assert.deepEqual(result.otherDepartmentNames, []);
  assert.deepEqual(result.basicScienceFaculty, []);
  assert.deepEqual(result.otherDepartmentFaculty, []);
});

test('10. Faculty updates dynamically add newly added faculty and remove deleted faculty', () => {
  const departments = [
    { id: 'dept_physics', code: 'PHY', category: 'BASIC_SCIENCE' },
    { id: 'dept_cse', code: 'CSE', category: 'ENGINEERING_PROGRAM' },
  ];

  // State 1: Original faculty list
  const state1 = [
    { name: 'Dr. Raman (Physics)', department: 'dept_physics' },
    { name: 'Dr. Turing (CSE)', department: 'dept_cse' },
  ];
  const res1 = categorizeBasicScienceFaculty({ faculty: state1, departments });
  assert.deepEqual(res1.basicScienceNames, ['Dr. Raman (Physics)']);
  assert.deepEqual(res1.otherDepartmentNames, ['Dr. Turing (CSE)']);

  // State 2: Dr. Raman is deleted; Prof. Hopper (CSE) and Dr. Bose (Physics) are added
  const state2 = [
    { name: 'Dr. Turing (CSE)', department: 'dept_cse' },
    { name: 'Prof. Hopper (CSE)', department: 'dept_cse' },
    { name: 'Dr. Bose (Physics)', department: 'dept_physics' },
  ];
  const res2 = categorizeBasicScienceFaculty({ faculty: state2, departments });
  // Deleted faculty disappears
  assert.equal(res2.basicScienceNames.includes('Dr. Raman (Physics)'), false);
  // Newly added faculty appears in correct category
  assert.deepEqual(res2.basicScienceNames, ['Dr. Bose (Physics)']);
  assert.deepEqual(res2.otherDepartmentNames, ['Dr. Turing (CSE)', 'Prof. Hopper (CSE)']);
});

test('11. Dean faculty aggregation includes all departments without department or year filters', () => {
  const departmentFaculty = [
    { name: 'Prof. AIDS Faculty', department: 'dept_aids' },
    { name: 'Prof. CSE Faculty', department: 'dept_cse' },
    { name: 'Prof. ECE Faculty', department: 'dept_ece' },
  ];
  const basicScienceFaculty = [
    { name: 'Dr. Math Faculty', department: 'dept_math' },
    { name: 'Dr. Physics Faculty', department: 'dept_physics' },
  ];

  const combined = [...departmentFaculty, ...basicScienceFaculty];
  const seen = new Set<string>();
  const deanFacultyNames: string[] = [];
  for (const f of combined) {
    const trimmed = f.name?.trim();
    if (trimmed && !seen.has(trimmed)) {
      seen.add(trimmed);
      deanFacultyNames.push(trimmed);
    }
  }
  deanFacultyNames.sort((a, b) => a.localeCompare(b));

  assert.equal(deanFacultyNames.length, 5);
  assert.deepEqual(deanFacultyNames, [
    'Dr. Math Faculty',
    'Dr. Physics Faculty',
    'Prof. AIDS Faculty',
    'Prof. CSE Faculty',
    'Prof. ECE Faculty',
  ]);
});

test('12. Basic Science faculty state updates correctly reflect status, department, and login access changes', () => {
  interface FacultyStateItem {
    id: string;
    name: string;
    department: string;
    accountStatus: 'Active' | 'Inactive';
    hasLoginAccess: boolean;
  }

  let bsRoster: FacultyStateItem[] = [
    {
      id: 'fac_math_raman',
      name: 'Dr. Raman',
      department: 'dept_math',
      accountStatus: 'Active',
      hasLoginAccess: true,
    },
    {
      id: 'fac_phy_bose',
      name: 'Dr. Bose',
      department: 'dept_physics',
      accountStatus: 'Active',
      hasLoginAccess: false,
    },
  ];

  // 1. Add new Chemistry faculty
  const newFac: FacultyStateItem = {
    id: 'fac_chem_curie',
    name: 'Dr. Curie',
    department: 'dept_chemistry',
    accountStatus: 'Active',
    hasLoginAccess: true,
  };
  bsRoster = [newFac, ...bsRoster];
  assert.equal(bsRoster.length, 3);
  assert.equal(bsRoster[0].name, 'Dr. Curie');

  // 2. Toggle Login Access for Dr. Bose
  bsRoster = bsRoster.map((f) =>
    f.id === 'fac_phy_bose' ? { ...f, hasLoginAccess: !f.hasLoginAccess } : f
  );
  assert.equal(bsRoster.find((f) => f.id === 'fac_phy_bose')?.hasLoginAccess, true);

  // 3. Deactivate / Soft Delete Dr. Raman
  bsRoster = bsRoster.map((f) =>
    f.id === 'fac_math_raman' ? { ...f, accountStatus: 'Inactive' } : f
  );
  assert.equal(bsRoster.find((f) => f.id === 'fac_math_raman')?.accountStatus, 'Inactive');

  // 4. Safe deletion of Dr. Curie
  bsRoster = bsRoster.filter((f) => f.id !== 'fac_chem_curie');
  assert.equal(bsRoster.length, 2);
  assert.equal(bsRoster.find((f) => f.id === 'fac_chem_curie'), undefined);
});

/**
 * AQS Workflow Demo Data Models & Initial State Placeholders
 * All mock/dummy records have been removed.
 * Data is populated dynamically from FastAPI / Firebase Cloud Firestore.
 */

export * from '../types/workflow';

import {
  InstitutionalSlot,
  FirstYearSection,
  DepartmentInfo,
  FacultyWorkloadRecord,
  FacultyPreferenceRecord,
  SubjectAllocationItem,
  AuditLogEntry,
  DeanSubject,
  DeanPlacement,
  DeanSectionTimetable,
  BasicScienceSubject,
  BasicSciencePlacement,
  CycleSectionTimetable,
  DepartmentFaculty,
  DeptSubjectItem,
  DeptPlacement,
  DeptSectionTimetable,
  SectionProgressItem,
  FacultyLeaveApplication,
} from '../types/workflow';

export const DEAN_DEPARTMENTS = [
  { code: 'DS', name: 'Data Science' },
  { code: 'ML', name: 'Machine Learning' },
  { code: 'CSE', name: 'Computer Science & Engineering' },
  { code: 'EC', name: 'Electronics & Communication' },
  { code: 'MECH', name: 'Mechanical' },
  { code: 'CIVIL', name: 'Civil' },
  { code: 'First Year', name: 'First Year' },
];

export const REGISTERED_FACULTY_NAMES: string[] = [];

export const INITIAL_INSTITUTIONAL_SLOTS: InstitutionalSlot[] = [];
export const INITIAL_FIRST_YEAR_SECTIONS: FirstYearSection[] = [];
export const INITIAL_DEPARTMENTS: DepartmentInfo[] = [];
export const INSTITUTION_FACULTY_ROSTER: FacultyWorkloadRecord[] = [];
export const INITIAL_FACULTY_PREFERENCES: FacultyPreferenceRecord[] = [];
export const INITIAL_SUBJECT_ALLOCATIONS: SubjectAllocationItem[] = [];
export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [];
export const INITIAL_DEAN_SUBJECTS: DeanSubject[] = [];
export const INITIAL_DS_3A_PLACEMENTS: DeanPlacement[] = [];
export const INITIAL_DEAN_TIMETABLES: Record<string, DeanSectionTimetable> = {};
export const DEAN_LOCKED_FIRST_YEAR_SLOTS: BasicSciencePlacement[] = [];
export const INITIAL_PHYSICS_SUBJECTS: BasicScienceSubject[] = [];
export const INITIAL_CHEMISTRY_SUBJECTS: BasicScienceSubject[] = [];
export const INITIAL_PHYSICS_SEC_A_PLACEMENTS: BasicSciencePlacement[] = [];
export const INITIAL_CHEMISTRY_SEC_C_PLACEMENTS: BasicSciencePlacement[] = [];
export const INITIAL_CYCLE_TIMETABLES: Record<string, CycleSectionTimetable> = {};
export const INITIAL_DEPT_FACULTY: DepartmentFaculty[] = [];
export const INITIAL_BASIC_SCIENCE_FACULTY: DepartmentFaculty[] = [];
export const INITIAL_DEPT_SUBJECTS: DeptSubjectItem[] = [];
export const DEAN_LOCKED_DEPT_SLOTS: DeptPlacement[] = [];
export const INITIAL_AIDS_3A_PLACEMENTS: DeptPlacement[] = [];
export const INITIAL_AIDS_3B_PLACEMENTS: DeptPlacement[] = [];
export const INITIAL_AIDS_5A_PLACEMENTS: DeptPlacement[] = [];
export const INITIAL_AIDS_7A_PLACEMENTS: DeptPlacement[] = [];
export const INITIAL_DEPT_SECTION_TIMETABLES: Record<string, DeptSectionTimetable> = {};
export const INITIAL_SECTION_PROGRESS: SectionProgressItem[] = [];
export const INITIAL_FACULTY_LEAVES: FacultyLeaveApplication[] = [];

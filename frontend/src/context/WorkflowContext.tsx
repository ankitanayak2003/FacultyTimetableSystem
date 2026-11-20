import React, { createContext, useContext, useState } from 'react';
import {
  InstitutionalSlot,
  FirstYearSection,
  DepartmentInfo,
  FacultyWorkloadRecord,
  FacultyPreferenceRecord,
  SubjectAllocationItem,
  TimetableCellEntry,
  AuditLogEntry,
  DeanSubject,
  DeanSectionTimetable,
  BasicScienceSubject,
  CycleSectionTimetable,
  DepartmentFaculty,
  DeptSubjectItem,
  DeptSectionTimetable,
  FinalizedPreferenceItem,
  INITIAL_INSTITUTIONAL_SLOTS,
  INITIAL_FIRST_YEAR_SECTIONS,
  INITIAL_DEPARTMENTS,
  INSTITUTION_FACULTY_ROSTER,
  INITIAL_FACULTY_PREFERENCES,
  INITIAL_SUBJECT_ALLOCATIONS,
  INITIAL_AUDIT_LOGS,
  INITIAL_DEAN_SUBJECTS,
  INITIAL_DEAN_TIMETABLES,
  INITIAL_PHYSICS_SUBJECTS,
  INITIAL_CHEMISTRY_SUBJECTS,
  INITIAL_CYCLE_TIMETABLES,
  INITIAL_DEPT_FACULTY,
  INITIAL_DEPT_SUBJECTS,
  INITIAL_DEPT_SECTION_TIMETABLES,
} from '../data/workflowDemoData';

export type WorkflowStageStatus = 'BLOCKED' | 'DRAFT' | 'LOCKED' | 'FINALIZED' | 'PUBLISHED';

interface WorkflowContextType {
  // Dean Institutional Stage
  deanStatus: 'DRAFT' | 'LOCKED';
  deanVersion: string;
  deanLockedTimestamp: string;
  deanLockedBy: string;
  institutionalSlots: InstitutionalSlot[];
  addInstitutionalSlot: (slot: Omit<InstitutionalSlot, 'id' | 'locked'>) => void;
  updateInstitutionalSlot: (id: string, slot: Partial<InstitutionalSlot>) => void;
  removeInstitutionalSlot: (id: string) => void;
  lockDeanSchedule: (remarks: string) => void;
  reopenDeanSchedule: (reason: string) => void;

  // Dean Redesign: Subject & Timetable State
  deanSubjects: DeanSubject[];
  addDeanSubject: (sub: Omit<DeanSubject, 'id'>) => void;
  updateDeanSubject: (id: string, sub: Partial<DeanSubject>) => void;
  deleteDeanSubject: (id: string) => void;

  deanTimetables: Record<string, DeanSectionTimetable>;
  saveDeanSectionTimetable: (key: string, data: DeanSectionTimetable) => void;
  lockDeanSectionTimetable: (key: string) => void;
  unlockDeanSectionTimetable: (key: string) => void;

  // Basic Science Stage
  basicScienceStatus: WorkflowStageStatus;
  basicScienceVersion: string;
  basicScienceLockedTimestamp: string;
  firstYearSections: FirstYearSection[];
  updateFirstYearSection: (id: string, updates: Partial<FirstYearSection>) => void;
  lockBasicScienceSchedule: (remarks: string) => void;
  reopenBasicScienceSchedule: (reason: string) => void;

  // Basic Science Redesign: Subjects, Soft Constraints, Dynamic Sections & Cycle Timetables
  physicsSubjects: BasicScienceSubject[];
  chemistrySubjects: BasicScienceSubject[];
  addBasicScienceSubject: (sub: Omit<BasicScienceSubject, 'id'>) => void;
  updateBasicScienceSubject: (id: string, updates: Partial<BasicScienceSubject>) => void;
  deleteBasicScienceSubject: (id: string) => void;

  physicsSoftConstraints: string;
  setPhysicsSoftConstraints: (val: string) => void;
  chemistrySoftConstraints: string;
  setChemistrySoftConstraints: (val: string) => void;

  physicsSections: string[];
  chemistrySections: string[];
  addCycleSection: (cycle: 'Physics' | 'Chemistry', sectionName: string) => void;
  removeCycleSection: (cycle: 'Physics' | 'Chemistry', sectionName: string) => void;

  cycleTimetables: Record<string, CycleSectionTimetable>;
  saveCycleTimetable: (key: string, data: CycleSectionTimetable) => void;
  lockCycleTimetable: (key: string) => void;
  unlockCycleTimetable: (key: string) => void;

  // Department Stage
  departmentStatus: WorkflowStageStatus;
  departments: DepartmentInfo[];
  facultyWorkload: FacultyWorkloadRecord[];
  facultyPreferences: FacultyPreferenceRecord[];
  updatePreferenceStatus: (
    prefId: string,
    status: 'Reviewed' | 'Accepted' | 'Rejected',
    remarks?: string
  ) => void;
  subjectAllocations: SubjectAllocationItem[];
  addSubjectAllocation: (item: Omit<SubjectAllocationItem, 'id'>) => void;
  removeSubjectAllocation: (id: string) => void;
  timetableEntries: TimetableCellEntry[];
  addTimetableEntry: (entry: TimetableCellEntry) => void;
  removeTimetableEntry: (day: string, period: number, section: string) => void;
  finalizeDepartmentTimetable: (deptCode: string) => void;
  publishDepartmentTimetable: (deptCode: string) => void;
  reopenDepartmentTimetable: (deptCode: string, reason: string) => void;

  // Department Redesign State
  departmentFaculty: DepartmentFaculty[];
  addDepartmentFaculty: (fac: Omit<DepartmentFaculty, 'id'>) => void;
  updateDepartmentFaculty: (id: string, updates: Partial<DepartmentFaculty>) => void;
  deleteDepartmentFaculty: (id: string) => void;
  toggleFacultyAccountStatus: (id: string) => void;
  toggleFacultyLoginAccess: (id: string) => void;
  updateDepartmentFacultyFinalizedPreferences: (id: string, finalized: FinalizedPreferenceItem[]) => void;

  deptSubjects: DeptSubjectItem[];
  updateDeptSubjectAllocation: (id: string, assignedFaculty: string, matchType?: DeptSubjectItem['preferenceMatch']) => void;
  autoAllocateDeptSubjects: (academicYear: string, semester: string, studentYear: string) => void;

  deptTimetables: Record<string, DeptSectionTimetable>;
  saveDeptSectionTimetable: (key: string, data: DeptSectionTimetable) => void;
  publishDeptSectionTimetable: (key: string) => void;
  unpublishDeptSectionTimetable: (key: string) => void;

  // Downstream validation warnings & audit trail
  requiresRevalidation: boolean;
  auditLogs: AuditLogEntry[];
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

// Initial departmental timetable entries for AIDS 3A
const INITIAL_AIDS_TIMETABLE_ENTRIES: TimetableCellEntry[] = [
  { day: 'Monday', period: 1, courseCode: '21AI32', courseTitle: 'Data Structures & Applications', facultyName: 'Dr. Ananya Rao', room: 'LH-201', section: 'AIDS - 3A' },
  { day: 'Monday', period: 2, courseCode: '21AI33', courseTitle: 'Discrete Mathematical Structures', facultyName: 'Prof. Rajesh Shetty', room: 'LH-201', section: 'AIDS - 3A' },
  { day: 'Monday', period: 3, courseCode: '21AI34', courseTitle: 'OOP with Java', facultyName: 'Prof. Sneha Kamath', room: 'LH-201', section: 'AIDS - 3A' },
  { day: 'Tuesday', period: 1, courseCode: '21AI33', courseTitle: 'Discrete Mathematical Structures', facultyName: 'Prof. Rajesh Shetty', room: 'LH-201', section: 'AIDS - 3A' },
  { day: 'Tuesday', period: 2, courseCode: '21AI32', courseTitle: 'Data Structures & Applications', facultyName: 'Dr. Ananya Rao', room: 'LH-201', section: 'AIDS - 3A' },
  { day: 'Tuesday', period: 4, courseCode: '21AI34', courseTitle: 'OOP with Java', facultyName: 'Prof. Sneha Kamath', room: 'LH-201', section: 'AIDS - 3A' },
  { day: 'Wednesday', period: 1, courseCode: '21AI32', courseTitle: 'Data Structures & Applications', facultyName: 'Dr. Ananya Rao', room: 'LH-201', section: 'AIDS - 3A' },
  { day: 'Wednesday', period: 2, courseCode: '21AI34', courseTitle: 'OOP with Java', facultyName: 'Prof. Sneha Kamath', room: 'LH-201', section: 'AIDS - 3A' },
  { day: 'Wednesday', period: 4, courseCode: 'OPEN-EL', courseTitle: 'Open Elective Pool', facultyName: 'Designated Faculty', room: 'AB-201', section: 'AIDS - 3A', isLockedSlot: true, lockedStage: 'Institutional (Dean)', lockedReason: 'Institutional Open Elective pool locked by Dean' },
  { day: 'Wednesday', period: 5, courseCode: 'OPEN-EL', courseTitle: 'Open Elective Pool', facultyName: 'Designated Faculty', room: 'AB-201', section: 'AIDS - 3A', isLockedSlot: true, lockedStage: 'Institutional (Dean)', lockedReason: 'Institutional Open Elective pool locked by Dean' },
  { day: 'Thursday', period: 1, courseCode: '21AIL37', courseTitle: 'DSA Lab (Batch 1)', facultyName: 'Dr. Ananya Rao', room: 'AI Lab 1', section: 'AIDS - 3A' },
  { day: 'Thursday', period: 2, courseCode: '21AIL37', courseTitle: 'DSA Lab (Batch 1)', facultyName: 'Dr. Ananya Rao', room: 'AI Lab 1', section: 'AIDS - 3A' },
  { day: 'Thursday', period: 6, courseCode: 'NSS-YRC', courseTitle: 'NSS & Community Engagement', facultyName: 'Prof. Nagaraj Rao', room: 'Grounds', section: 'AIDS - 3A', isLockedSlot: true, lockedStage: 'Institutional (Dean)', lockedReason: 'Institutional NSS & Social Service slot locked by Dean' },
  { day: 'Thursday', period: 7, courseCode: 'NSS-YRC', courseTitle: 'NSS & Community Engagement', facultyName: 'Prof. Nagaraj Rao', room: 'Grounds', section: 'AIDS - 3A', isLockedSlot: true, lockedStage: 'Institutional (Dean)', lockedReason: 'Institutional NSS & Social Service slot locked by Dean' },
  { day: 'Friday', period: 1, courseCode: '21AI33', courseTitle: 'Discrete Mathematical Structures', facultyName: 'Prof. Rajesh Shetty', room: 'LH-201', section: 'AIDS - 3A' },
  { day: 'Friday', period: 2, courseCode: '21AI32', courseTitle: 'Data Structures & Applications', facultyName: 'Dr. Ananya Rao', room: 'LH-201', section: 'AIDS - 3A' },
  { day: 'Friday', period: 5, courseCode: 'TPO-TRN', courseTitle: 'Placement & Soft Skills Training', facultyName: 'Placement Officer', room: 'Auditorium', section: 'AIDS - 3A', isLockedSlot: true, lockedStage: 'Institutional (Dean)', lockedReason: 'Institutional Placement Training slot locked by Dean' },
  { day: 'Friday', period: 6, courseCode: 'TPO-TRN', courseTitle: 'Placement & Soft Skills Training', facultyName: 'Placement Officer', room: 'Auditorium', section: 'AIDS - 3A', isLockedSlot: true, lockedStage: 'Institutional (Dean)', lockedReason: 'Institutional Placement Training slot locked by Dean' },
  { day: 'Friday', period: 7, courseCode: 'TPO-TRN', courseTitle: 'Placement & Soft Skills Training', facultyName: 'Placement Officer', room: 'Auditorium', section: 'AIDS - 3A', isLockedSlot: true, lockedStage: 'Institutional (Dean)', lockedReason: 'Institutional Placement Training slot locked by Dean' },
];

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Dean Institutional State
  const [deanStatus, setDeanStatus] = useState<'DRAFT' | 'LOCKED'>('LOCKED');
  const [deanVersion, setDeanVersion] = useState<string>('v1.0');
  const [deanLockedTimestamp, setDeanLockedTimestamp] = useState<string>('2026-11-01 10:30 AM');
  const [deanLockedBy] = useState<string>('Dr. Sudarshan Rao (Dean Academics)');
  const [institutionalSlots, setInstitutionalSlots] = useState<InstitutionalSlot[]>(INITIAL_INSTITUTIONAL_SLOTS);

  // Dean Redesign State: Page 1 Subjects & Page 2 Timetables
  const [deanSubjects, setDeanSubjects] = useState<DeanSubject[]>(INITIAL_DEAN_SUBJECTS);
  const [deanTimetables, setDeanTimetables] = useState<Record<string, DeanSectionTimetable>>(INITIAL_DEAN_TIMETABLES);

  // 2. Basic Science State
  const [basicScienceManualStatus, setBasicScienceManualStatus] = useState<'DRAFT' | 'LOCKED'>('LOCKED');
  const [basicScienceVersion, setBasicScienceVersion] = useState<string>('v1.0');
  const [basicScienceLockedTimestamp, setBasicScienceLockedTimestamp] = useState<string>('2026-11-02 02:45 PM');
  const [firstYearSections, setFirstYearSections] = useState<FirstYearSection[]>(INITIAL_FIRST_YEAR_SECTIONS);

  // Basic Science Redesign State: Page 1 Subjects, Constraints, Dynamic Sections & Page 2/3 Timetables
  const [physicsSubjects, setPhysicsSubjects] = useState<BasicScienceSubject[]>(INITIAL_PHYSICS_SUBJECTS);
  const [chemistrySubjects, setChemistrySubjects] = useState<BasicScienceSubject[]>(INITIAL_CHEMISTRY_SUBJECTS);
  const [physicsSoftConstraints, setPhysicsSoftConstraints] = useState<string>('');
  const [chemistrySoftConstraints, setChemistrySoftConstraints] = useState<string>('');
  const [physicsSections, setPhysicsSections] = useState<string[]>(['Section A', 'Section B']);
  const [chemistrySections, setChemistrySections] = useState<string[]>(['Section C', 'Section D']);
  const [cycleTimetables, setCycleTimetables] = useState<Record<string, CycleSectionTimetable>>(INITIAL_CYCLE_TIMETABLES);

  // Computed status for Basic Science: if Dean is DRAFT, Basic Science is BLOCKED
  const basicScienceStatus: WorkflowStageStatus =
    deanStatus === 'DRAFT' ? 'BLOCKED' : basicScienceManualStatus;

  // 3. Department State
  const [departmentManualStatus, setDepartmentManualStatus] = useState<WorkflowStageStatus>('PUBLISHED');
  const [departments, setDepartments] = useState<DepartmentInfo[]>(INITIAL_DEPARTMENTS);
  const [facultyWorkload] = useState<FacultyWorkloadRecord[]>(INSTITUTION_FACULTY_ROSTER);
  const [facultyPreferences, setFacultyPreferences] = useState<FacultyPreferenceRecord[]>(INITIAL_FACULTY_PREFERENCES);
  const [subjectAllocations, setSubjectAllocations] = useState<SubjectAllocationItem[]>(INITIAL_SUBJECT_ALLOCATIONS);
  const [timetableEntries, setTimetableEntries] = useState<TimetableCellEntry[]>(INITIAL_AIDS_TIMETABLE_ENTRIES);

  // Department Redesign State
  const [departmentFaculty, setDepartmentFaculty] = useState<DepartmentFaculty[]>(INITIAL_DEPT_FACULTY);
  const [deptSubjects, setDeptSubjects] = useState<DeptSubjectItem[]>(INITIAL_DEPT_SUBJECTS);
  const [deptTimetables, setDeptTimetables] = useState<Record<string, DeptSectionTimetable>>(INITIAL_DEPT_SECTION_TIMETABLES);

  // Computed status for Department: if Basic Science is NOT LOCKED, Department is BLOCKED
  const departmentStatus: WorkflowStageStatus =
    basicScienceStatus !== 'LOCKED' ? 'BLOCKED' : departmentManualStatus;

  // Downstream revalidation flag & audit logs
  const [requiresRevalidation, setRequiresRevalidation] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);

  // Helper to add audit log
  const pushAudit = (
    role: string,
    user: string,
    action: string,
    stage: 'Institutional' | 'Basic Science' | 'Department' | 'Publication',
    version: string,
    remarks: string
  ) => {
    const newEntry: AuditLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      role,
      user,
      action,
      stage,
      version,
      remarks,
    };
    setAuditLogs((prev) => [newEntry, ...prev]);
  };

  // Institutional Handlers (Dean)
  const addInstitutionalSlot = (slot: Omit<InstitutionalSlot, 'id' | 'locked'>) => {
    const newSlot: InstitutionalSlot = {
      ...slot,
      id: `inst-${Date.now()}`,
      locked: deanStatus === 'LOCKED',
    };
    setInstitutionalSlots((prev) => [...prev, newSlot]);
  };

  const updateInstitutionalSlot = (id: string, updates: Partial<InstitutionalSlot>) => {
    setInstitutionalSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const removeInstitutionalSlot = (id: string) => {
    setInstitutionalSlots((prev) => prev.filter((s) => s.id !== id));
  };

  const lockDeanSchedule = (remarks: string) => {
    setDeanStatus('LOCKED');
    setDeanVersion('v1.0');
    const now = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    setDeanLockedTimestamp(now);
    setInstitutionalSlots((prev) => prev.map((s) => ({ ...s, locked: true })));
    setRequiresRevalidation(false);
    pushAudit(
      'Dean',
      'Dr. Sudarshan Rao',
      'LOCKED_INSTITUTIONAL_SCHEDULE',
      'Institutional',
      'v1.0-locked',
      remarks || 'Institutional fixed slots and activities locked.'
    );
  };

  const reopenDeanSchedule = (reason: string) => {
    setDeanStatus('DRAFT');
    setDeanVersion('v1.1-draft');
    setInstitutionalSlots((prev) => prev.map((s) => ({ ...s, locked: false })));
    setRequiresRevalidation(true);
    pushAudit(
      'Dean',
      'Dr. Sudarshan Rao',
      'REOPENED_INSTITUTIONAL_SCHEDULE',
      'Institutional',
      'v1.1-draft',
      reason || 'Reopened institutional slots for amendments. Downstream schedules require revalidation.'
    );
  };

  // Dean Redesign Subject Actions
  const addDeanSubject = (sub: Omit<DeanSubject, 'id'>) => {
    const newSubject: DeanSubject = {
      ...sub,
      id: `sub-${Date.now()}`,
    };
    setDeanSubjects((prev) => [newSubject, ...prev]);
  };

  const updateDeanSubject = (id: string, updates: Partial<DeanSubject>) => {
    setDeanSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const deleteDeanSubject = (id: string) => {
    setDeanSubjects((prev) => prev.filter((s) => s.id !== id));
  };

  // Dean Redesign Timetable Actions (Save Draft, Lock, Unlock)
  const saveDeanSectionTimetable = (key: string, data: DeanSectionTimetable) => {
    setDeanTimetables((prev) => ({
      ...prev,
      [key]: data,
    }));
  };

  const lockDeanSectionTimetable = (key: string) => {
    const now = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    setDeanTimetables((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      return {
        ...prev,
        [key]: {
          ...existing,
          isLocked: true,
          lockedAt: now,
          lockedBy: 'Dr. Sudarshan Rao (Dean Academics)',
        },
      };
    });
    setDeanStatus('LOCKED');
    pushAudit(
      'Dean',
      'Dr. Sudarshan Rao',
      'LOCKED_SECTION_TIMETABLE',
      'Institutional',
      deanVersion,
      `Finalized and locked institutional allocation for ${key}. Downstream coordinators granted view access.`
    );
  };

  const unlockDeanSectionTimetable = (key: string) => {
    setDeanTimetables((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      return {
        ...prev,
        [key]: {
          ...existing,
          isLocked: false,
        },
      };
    });
    pushAudit(
      'Dean',
      'Dr. Sudarshan Rao',
      'REOPENED_SECTION_TIMETABLE',
      'Institutional',
      deanVersion,
      `Reopened draft allocation for ${key} for administrative revisions.`
    );
  };

  // Basic Science Handlers
  const updateFirstYearSection = (id: string, updates: Partial<FirstYearSection>) => {
    setFirstYearSections((prev) =>
      prev.map((sec) => (sec.id === id ? { ...sec, ...updates } : sec))
    );
  };

  const lockBasicScienceSchedule = (remarks: string) => {
    setBasicScienceManualStatus('LOCKED');
    setBasicScienceVersion('v1.0');
    const now = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    setBasicScienceLockedTimestamp(now);
    pushAudit(
      'Basic Science Coordinator',
      'Dr. Ravindra',
      'LOCKED_BASIC_SCIENCE_SCHEDULE',
      'Basic Science',
      'v1.0-locked',
      remarks || 'First-year Physics and Chemistry cycle allocations locked.'
    );
  };

  const reopenBasicScienceSchedule = (reason: string) => {
    setBasicScienceManualStatus('DRAFT');
    setBasicScienceVersion('v1.1-draft');
    setRequiresRevalidation(true);
    pushAudit(
      'Basic Science Coordinator',
      'Dr. Ravindra',
      'REOPENED_BASIC_SCIENCE_SCHEDULE',
      'Basic Science',
      'v1.1-draft',
      reason || 'Reopened basic science schedule for revision.'
    );
  };

  // Basic Science Redesign Handlers
  const addBasicScienceSubject = (sub: Omit<BasicScienceSubject, 'id'>) => {
    const newSubject: BasicScienceSubject = {
      ...sub,
      id: `bs-sub-${Date.now()}`,
    };
    if (sub.cycle === 'Physics') {
      setPhysicsSubjects((prev) => [newSubject, ...prev]);
    } else {
      setChemistrySubjects((prev) => [newSubject, ...prev]);
    }
  };

  const updateBasicScienceSubject = (id: string, updates: Partial<BasicScienceSubject>) => {
    setPhysicsSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    setChemistrySubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  };

  const deleteBasicScienceSubject = (id: string) => {
    setPhysicsSubjects((prev) => prev.filter((s) => s.id !== id));
    setChemistrySubjects((prev) => prev.filter((s) => s.id !== id));
  };

  const addCycleSection = (cycle: 'Physics' | 'Chemistry', sectionName: string) => {
    const trimmed = sectionName.trim();
    if (!trimmed) return;
    if (cycle === 'Physics') {
      setPhysicsSections((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    } else {
      setChemistrySections((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
    }
  };

  const removeCycleSection = (cycle: 'Physics' | 'Chemistry', sectionName: string) => {
    if (cycle === 'Physics') {
      setPhysicsSections((prev) => (prev.length > 1 ? prev.filter((s) => s !== sectionName) : prev));
    } else {
      setChemistrySections((prev) => (prev.length > 1 ? prev.filter((s) => s !== sectionName) : prev));
    }
  };

  const saveCycleTimetable = (key: string, data: CycleSectionTimetable) => {
    setCycleTimetables((prev) => ({
      ...prev,
      [key]: data,
    }));
  };

  const lockCycleTimetable = (key: string) => {
    const now = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    setCycleTimetables((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      return {
        ...prev,
        [key]: {
          ...existing,
          isLocked: true,
          lockedAt: now,
          lockedBy: 'Dr. Ravindra (Basic Science Coordinator)',
        },
      };
    });
    pushAudit(
      'Basic Science Coordinator',
      'Dr. Ravindra',
      'LOCKED_CYCLE_TIMETABLE',
      'Basic Science',
      'v1.0-locked',
      `Locked and finalized allocation for ${key}. Certified for student publication.`
    );
  };

  const unlockCycleTimetable = (key: string) => {
    setCycleTimetables((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      return {
        ...prev,
        [key]: {
          ...existing,
          isLocked: false,
        },
      };
    });
    pushAudit(
      'Basic Science Coordinator',
      'Dr. Ravindra',
      'REOPENED_CYCLE_TIMETABLE',
      'Basic Science',
      'v1.1-draft',
      `Reopened draft allocation for ${key} for administrative revisions.`
    );
  };

  // Department Handlers
  const updatePreferenceStatus = (
    prefId: string,
    status: 'Reviewed' | 'Accepted' | 'Rejected',
    remarks?: string
  ) => {
    setFacultyPreferences((prev) =>
      prev.map((pref) =>
        pref.id === prefId ? { ...pref, status, remarks: remarks || pref.remarks } : pref
      )
    );
  };

  const addSubjectAllocation = (item: Omit<SubjectAllocationItem, 'id'>) => {
    const newItem: SubjectAllocationItem = {
      ...item,
      id: `alloc-${Date.now()}`,
    };
    setSubjectAllocations((prev) => [...prev, newItem]);
  };

  const removeSubjectAllocation = (id: string) => {
    setSubjectAllocations((prev) => prev.filter((a) => a.id !== id));
  };

  const addTimetableEntry = (entry: TimetableCellEntry) => {
    // Replace any existing entry on that section, day, period (except locked institutional slots)
    setTimetableEntries((prev) => [
      ...prev.filter(
        (e) =>
          !(e.day === entry.day && e.period === entry.period && e.section === entry.section)
      ),
      entry,
    ]);
  };

  const removeTimetableEntry = (day: string, period: number, section: string) => {
    setTimetableEntries((prev) =>
      prev.filter(
        (e) => !(e.day === day && e.period === period && e.section === section && !e.isLockedSlot)
      )
    );
  };

  const finalizeDepartmentTimetable = (deptCode: string) => {
    setDepartmentManualStatus('FINALIZED');
    setDepartments((prev) =>
      prev.map((d) => (d.code === deptCode ? { ...d, status: 'Finalized' } : d))
    );
    pushAudit(
      'Department Coordinator',
      'Prof. Rajesh Shetty',
      'FINALIZED_DEPARTMENT_TIMETABLE',
      'Department',
      'v1.0-final',
      `${deptCode} Department timetable finalized with zero clashes.`
    );
  };

  const publishDepartmentTimetable = (deptCode: string) => {
    setDepartmentManualStatus('PUBLISHED');
    setDepartments((prev) =>
      prev.map((d) => (d.code === deptCode ? { ...d, status: 'Published' } : d))
    );
    pushAudit(
      'Department Coordinator',
      'Prof. Rajesh Shetty',
      'PUBLISHED_DEPARTMENT_TIMETABLE',
      'Publication',
      'v1.0-official',
      `${deptCode} Timetable published officially for students and faculty.`
    );
  };

  const reopenDepartmentTimetable = (deptCode: string, reason: string) => {
    setDepartmentManualStatus('DRAFT');
    setDepartments((prev) =>
      prev.map((d) => (d.code === deptCode ? { ...d, status: 'In Progress' } : d))
    );
    pushAudit(
      'Department Coordinator',
      'Prof. Rajesh Shetty',
      'REOPENED_DEPARTMENT_TIMETABLE',
      'Department',
      'v1.1-draft',
      reason || 'Department timetable reopened for adjustment.'
    );
  };

  // Department Redesign Faculty Actions
  const addDepartmentFaculty = (fac: Omit<DepartmentFaculty, 'id'>) => {
    const newFaculty: DepartmentFaculty = {
      ...fac,
      id: `dept-fac-${Date.now()}`,
    };
    setDepartmentFaculty((prev) => [newFaculty, ...prev]);
  };

  const updateDepartmentFaculty = (id: string, updates: Partial<DepartmentFaculty>) => {
    setDepartmentFaculty((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const deleteDepartmentFaculty = (id: string) => {
    setDepartmentFaculty((prev) => prev.filter((f) => f.id !== id));
  };

  const toggleFacultyAccountStatus = (id: string) => {
    setDepartmentFaculty((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, accountStatus: f.accountStatus === 'Active' ? 'Inactive' : 'Active' } : f
      )
    );
  };

  const toggleFacultyLoginAccess = (id: string) => {
    setDepartmentFaculty((prev) =>
      prev.map((f) => (f.id === id ? { ...f, hasLoginAccess: !f.hasLoginAccess } : f))
    );
  };

  const updateDepartmentFacultyFinalizedPreferences = (id: string, finalized: FinalizedPreferenceItem[]) => {
    setDepartmentFaculty((prev) =>
      prev.map((f) => (f.id === id ? { ...f, finalizedPreferences: finalized } : f))
    );
  };

  const updateDeptSubjectAllocation = (id: string, assignedFaculty: string, matchType?: DeptSubjectItem['preferenceMatch']) => {
    setDeptSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, assignedFaculty, preferenceMatch: matchType || s.preferenceMatch } : s))
    );
  };

  const autoAllocateDeptSubjects = (_academicYear: string, semester: string, studentYear: string) => {
    setDeptSubjects((prev) => {
      return prev.map((sub) => {
        if (sub.studentYear !== studentYear || sub.semester !== semester) {
          return sub;
        }

        // Find best eligible faculty matching priority 1
        let candidate = departmentFaculty.find(
          (f) =>
            f.accountStatus === 'Active' &&
            f.eligibleYears.includes(studentYear) &&
            f.preferences.some((p) => p.priority === 1 && p.subjectCode === sub.courseCode)
        );
        let matchType: DeptSubjectItem['preferenceMatch'] = 'Priority 1';

        // Then Priority 2
        if (!candidate) {
          candidate = departmentFaculty.find(
            (f) =>
              f.accountStatus === 'Active' &&
              f.eligibleYears.includes(studentYear) &&
              f.preferences.some((p) => p.priority === 2 && p.subjectCode === sub.courseCode)
          );
          matchType = 'Priority 2';
        }

        // Then Priority 3
        if (!candidate) {
          candidate = departmentFaculty.find(
            (f) =>
              f.accountStatus === 'Active' &&
              f.eligibleYears.includes(studentYear) &&
              f.preferences.some((p) => p.priority === 3 && p.subjectCode === sub.courseCode)
          );
          matchType = 'Priority 3';
        }

        // Fallback: active faculty eligible with available capacity
        if (!candidate) {
          candidate = departmentFaculty.find(
            (f) => f.accountStatus === 'Active' && f.eligibleYears.includes(studentYear)
          );
          matchType = 'Administrative Allocation';
        }

        return candidate
          ? { ...sub, assignedFaculty: candidate.name, preferenceMatch: matchType }
          : sub;
      });
    });
  };

  const saveDeptSectionTimetable = (key: string, data: DeptSectionTimetable) => {
    setDeptTimetables((prev) => ({
      ...prev,
      [key]: data,
    }));
  };

  const publishDeptSectionTimetable = (key: string) => {
    const now = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    setDeptTimetables((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      return {
        ...prev,
        [key]: {
          ...existing,
          isDraft: false,
          isPublished: true,
          publishedAt: now,
          lastSaved: now,
        },
      };
    });
    pushAudit(
      'Department Coordinator',
      'Prof. Rajesh Shetty',
      'PUBLISHED_SECTION_TIMETABLE',
      'Department',
      'v1.0-official',
      `Published official section schedule for ${key}. Verified 0 clashes.`
    );
  };

  const unpublishDeptSectionTimetable = (key: string) => {
    setDeptTimetables((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      return {
        ...prev,
        [key]: {
          ...existing,
          isPublished: false,
          isDraft: true,
        },
      };
    });
  };

  return (
    <WorkflowContext.Provider
      value={{
        deanStatus,
        deanVersion,
        deanLockedTimestamp,
        deanLockedBy,
        institutionalSlots,
        addInstitutionalSlot,
        updateInstitutionalSlot,
        removeInstitutionalSlot,
        lockDeanSchedule,
        reopenDeanSchedule,

        deanSubjects,
        addDeanSubject,
        updateDeanSubject,
        deleteDeanSubject,

        deanTimetables,
        saveDeanSectionTimetable,
        lockDeanSectionTimetable,
        unlockDeanSectionTimetable,

        basicScienceStatus,
        basicScienceVersion,
        basicScienceLockedTimestamp,
        firstYearSections,
        updateFirstYearSection,
        lockBasicScienceSchedule,
        reopenBasicScienceSchedule,

        physicsSubjects,
        chemistrySubjects,
        addBasicScienceSubject,
        updateBasicScienceSubject,
        deleteBasicScienceSubject,

        physicsSoftConstraints,
        setPhysicsSoftConstraints,
        chemistrySoftConstraints,
        setChemistrySoftConstraints,

        physicsSections,
        chemistrySections,
        addCycleSection,
        removeCycleSection,

        cycleTimetables,
        saveCycleTimetable,
        lockCycleTimetable,
        unlockCycleTimetable,

        departmentStatus,
        departments,
        facultyWorkload,
        facultyPreferences,
        updatePreferenceStatus,
        subjectAllocations,
        addSubjectAllocation,
        removeSubjectAllocation,
        timetableEntries,
        addTimetableEntry,
        removeTimetableEntry,
        finalizeDepartmentTimetable,
        publishDepartmentTimetable,
        reopenDepartmentTimetable,

        departmentFaculty,
        addDepartmentFaculty,
        updateDepartmentFaculty,
        deleteDepartmentFaculty,
        toggleFacultyAccountStatus,
        toggleFacultyLoginAccess,
        updateDepartmentFacultyFinalizedPreferences,

        deptSubjects,
        updateDeptSubjectAllocation,
        autoAllocateDeptSubjects,

        deptTimetables,
        saveDeptSectionTimetable,
        publishDeptSectionTimetable,
        unpublishDeptSectionTimetable,

        requiresRevalidation,
        auditLogs,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};

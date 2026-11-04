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
  INITIAL_INSTITUTIONAL_SLOTS,
  INITIAL_FIRST_YEAR_SECTIONS,
  INITIAL_DEPARTMENTS,
  INSTITUTION_FACULTY_ROSTER,
  INITIAL_FACULTY_PREFERENCES,
  INITIAL_SUBJECT_ALLOCATIONS,
  INITIAL_AUDIT_LOGS,
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

  // Basic Science Stage
  basicScienceStatus: WorkflowStageStatus;
  basicScienceVersion: string;
  basicScienceLockedTimestamp: string;
  firstYearSections: FirstYearSection[];
  updateFirstYearSection: (id: string, updates: Partial<FirstYearSection>) => void;
  lockBasicScienceSchedule: (remarks: string) => void;
  reopenBasicScienceSchedule: (reason: string) => void;

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

  // 2. Basic Science State
  const [basicScienceManualStatus, setBasicScienceManualStatus] = useState<'DRAFT' | 'LOCKED'>('LOCKED');
  const [basicScienceVersion, setBasicScienceVersion] = useState<string>('v1.0');
  const [basicScienceLockedTimestamp, setBasicScienceLockedTimestamp] = useState<string>('2026-11-02 02:45 PM');
  const [firstYearSections, setFirstYearSections] = useState<FirstYearSection[]>(INITIAL_FIRST_YEAR_SECTIONS);

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

        basicScienceStatus,
        basicScienceVersion,
        basicScienceLockedTimestamp,
        firstYearSections,
        updateFirstYearSection,
        lockBasicScienceSchedule,
        reopenBasicScienceSchedule,

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

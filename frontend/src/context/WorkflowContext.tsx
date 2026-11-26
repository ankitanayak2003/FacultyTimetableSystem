import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { aqsApi, TimetableDraftPayload } from '../services/api';
import { realtimeStream } from '../services/realtime';
import { useAuth } from './AuthContext';
import {
  BackendSyncStatus,
  DraftSaveCoordinator,
  SyncRequestTracker,
  buildCycleTimetableId,
  buildDeanTimetableId,
  buildDeptTimetableId,
  evaluateSyncOutcome,
  resolveCoordinatorDepartment,
} from '../utils/syncIntegrity';
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
  DeanPlacement,
  DeanSectionTimetable,
  BasicScienceSubject,
  BasicSciencePlacement,
  CycleSectionTimetable,
  DepartmentFaculty,
  DeptSubjectItem,
  DeptPlacement,
  DeptSectionTimetable,
  FinalizedPreferenceItem,
  FacultyPreferenceItem,
  FacultyLeaveApplication,
  FacultyAdditionalDuty,
  SectionProgressItem,
} from '../types/workflow';

export type WorkflowStageStatus = 'BLOCKED' | 'DRAFT' | 'LOCKED' | 'FINALIZED' | 'PUBLISHED';

export interface InstitutionalAcademicConfig {
  academicYear: string;
  currentSemester: 'Odd Semester' | 'Even Semester';
  termStartDate: string;
  termEndDate: string;
  workingDaysPerWeek: number;
  periodsPerDay: number;
  vtuRegulation: string;
  isLocked: boolean;
}

interface WorkflowContextType {
  // Principal Institutional Management
  institutionalConfig: InstitutionalAcademicConfig;
  updateInstitutionalConfig: (updates: Partial<InstitutionalAcademicConfig>) => void;
  updateDepartmentLeadership: (deptId: string, updates: { hod?: string; coordinator?: string }) => void;

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
  addDeanSubject: (sub: Omit<DeanSubject, 'id'>) => Promise<void>;
  updateDeanSubject: (id: string, sub: Partial<DeanSubject>) => Promise<void>;
  deleteDeanSubject: (id: string) => Promise<void>;

  deanTimetables: Record<string, DeanSectionTimetable>;
  saveDeanSectionTimetable: (key: string, data: DeanSectionTimetable) => Promise<void>;
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
  saveCycleTimetable: (key: string, data: CycleSectionTimetable) => Promise<void>;
  lockCycleTimetable: (key: string) => void;
  unlockCycleTimetable: (key: string) => void;
  basicScienceFaculty: DepartmentFaculty[];
  addBasicScienceFaculty: (fac: Omit<DepartmentFaculty, 'id'>) => Promise<void>;
  updateBasicScienceFaculty: (id: string, updates: Partial<DepartmentFaculty>) => Promise<void>;
  deleteBasicScienceFaculty: (id: string) => Promise<void>;
  provisionFacultyLogin: (facultyId: string, enableLogin: boolean, password?: string) => Promise<any>;
  updateBasicScienceFacultyFinalizedPreferences: (id: string, finalized: FinalizedPreferenceItem[]) => void;

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

  activeDepartmentId: string | null;
  activeDepartmentCode: string | null;
  activeDepartmentName: string | null;

  deptSubjects: DeptSubjectItem[];
  addDeptSubject: (sub: Omit<DeptSubjectItem, 'id'>, scope?: { academicYear?: string; section?: string }) => Promise<void>;
  updateDeptSubject: (id: string, updates: Partial<DeptSubjectItem>, scope?: { academicYear?: string; section?: string }) => Promise<void>;
  deleteDeptSubject: (id: string) => Promise<void>;
  updateDeptSubjectAllocation: (
    id: string,
    assignedFaculty: string,
    matchType?: DeptSubjectItem['preferenceMatch'],
    scope?: { academicYear?: string; semester?: string; studentYear?: string; section?: string }
  ) => Promise<void>;
  autoAllocateDeptSubjects: (academicYear: string, semester: string, studentYear: string, section?: string) => Promise<void>;

  deptTimetables: Record<string, DeptSectionTimetable>;
  saveDeptSectionTimetable: (key: string, data: DeptSectionTimetable) => Promise<void>;
  publishDeptSectionTimetable: (key: string) => void;
  unpublishDeptSectionTimetable: (key: string) => void;

  // Faculty Module State
  facultyLeaves: FacultyLeaveApplication[];
  applyFacultyLeave: (leave: Omit<FacultyLeaveApplication, 'id' | 'status' | 'appliedDate'>) => void;
  cancelFacultyLeave: (id: string) => void;
  submitFacultyPreferences: (facultyId: string, prefs: FacultyPreferenceItem[]) => void;

  // HOD Module State
  sectionProgressList: SectionProgressItem[];
  approveSectionTimetable: (sectionKey: string, remarks?: string) => void;
  returnSectionTimetableForCorrection: (sectionKey: string, reason: string) => void;
  updateFacultyDuties: (facultyId: string, duties: FacultyAdditionalDuty[]) => void;

  // Downstream validation warnings & audit trail
  requiresRevalidation: boolean;
  auditLogs: AuditLogEntry[];

  // Live Backend & Synchronization Status
  syncStatus: BackendSyncStatus;
  isBackendLoading: boolean;
  isSavingDraft: boolean;
  isBackendConnected: boolean | null;
  backendSyncError: string | null;
  isUsingFallbackData: boolean;
  refreshBackendData: () => Promise<void>;
  fixedClassrooms: any[];
  labs: any[];
  rooms: any[];
  sections: any[];
  liveTimetables: any[];
  liveTimetableSlots: any[];
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const WorkflowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Principal Institutional Configuration State
  const [institutionalConfig, setInstitutionalConfig] = useState<InstitutionalAcademicConfig>({
    academicYear: '2026–2027',
    currentSemester: 'Odd Semester',
    termStartDate: '2026-09-01',
    termEndDate: '2027-01-15',
    workingDaysPerWeek: 6,
    periodsPerDay: 7,
    vtuRegulation: 'VTU 2021/2022 Scheme (Autonomous Regulations)',
    isLocked: true,
  });

  // 1. Dean Institutional State
  const [deanStatus, setDeanStatus] = useState<'DRAFT' | 'LOCKED'>('LOCKED');
  const [deanVersion, setDeanVersion] = useState<string>('v1.0');
  const [deanLockedTimestamp, setDeanLockedTimestamp] = useState<string>('2026-11-01 10:30 AM');
  const [deanLockedBy] = useState<string>('Dr. Sudarshan Rao (Dean Academics)');
  const [institutionalSlots, setInstitutionalSlots] = useState<InstitutionalSlot[]>([]);

  // Dean Redesign State: Page 1 Subjects & Page 2 Timetables
  const [deanSubjects, setDeanSubjects] = useState<DeanSubject[]>([]);
  const [deanTimetables, setDeanTimetables] = useState<Record<string, DeanSectionTimetable>>({});

  // 2. Basic Science State
  const [basicScienceManualStatus, setBasicScienceManualStatus] = useState<'DRAFT' | 'LOCKED'>('LOCKED');
  const [basicScienceVersion, setBasicScienceVersion] = useState<string>('v1.0');
  const [basicScienceLockedTimestamp, setBasicScienceLockedTimestamp] = useState<string>('2026-11-02 02:45 PM');
  const [firstYearSections, setFirstYearSections] = useState<FirstYearSection[]>([]);

  // Basic Science Redesign State: Page 1 Subjects, Constraints, Dynamic Sections & Page 2/3 Timetables
  const [physicsSubjects, setPhysicsSubjects] = useState<BasicScienceSubject[]>([]);
  const [chemistrySubjects, setChemistrySubjects] = useState<BasicScienceSubject[]>([]);
  const [physicsSoftConstraints, setPhysicsSoftConstraints] = useState<string>('');
  const [chemistrySoftConstraints, setChemistrySoftConstraints] = useState<string>('');
  const [physicsSections, setPhysicsSections] = useState<string[]>(['Section A', 'Section B']);
  const [chemistrySections, setChemistrySections] = useState<string[]>(['Section C', 'Section D']);
  const [cycleTimetables, setCycleTimetables] = useState<Record<string, CycleSectionTimetable>>({});
  const [basicScienceFaculty, setBasicScienceFaculty] = useState<DepartmentFaculty[]>([]);

  // Computed status for Basic Science: if Dean is DRAFT, Basic Science is BLOCKED
  const basicScienceStatus: WorkflowStageStatus =
    deanStatus === 'DRAFT' ? 'BLOCKED' : basicScienceManualStatus;

  // 3. Department State
  const { currentUser, isAuthenticated, isAuthLoading } = useAuth();
  const [departmentManualStatus, setDepartmentManualStatus] = useState<WorkflowStageStatus>('PUBLISHED');
  const [departments, setDepartments] = useState<DepartmentInfo[]>([]);

  const explicitCoordinatorDeptId =
    currentUser?.departmentId ??
    (typeof window !== 'undefined' ? window.localStorage.getItem('aqs_user_department_id') : null);
  const {
    departmentId: activeDepartmentId,
    departmentCode: activeDepartmentCode,
    departmentName: activeDepartmentName,
  } = resolveCoordinatorDepartment({
    explicitDepartmentId: explicitCoordinatorDeptId,
    departments,
  });
  const [facultyWorkload, setFacultyWorkload] = useState<FacultyWorkloadRecord[]>([]);
  const [facultyPreferences, setFacultyPreferences] = useState<FacultyPreferenceRecord[]>([]);
  const [subjectAllocations, setSubjectAllocations] = useState<SubjectAllocationItem[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<TimetableCellEntry[]>([]);

  // Department Redesign State
  const [departmentFaculty, setDepartmentFaculty] = useState<DepartmentFaculty[]>([]);
  const [deptSubjects, setDeptSubjects] = useState<DeptSubjectItem[]>([]);
  const [deptTimetables, setDeptTimetables] = useState<Record<string, DeptSectionTimetable>>({});

  // Live Collection State (Direct from Firestore)
  const [fixedClassrooms, setFixedClassrooms] = useState<any[]>([]);
  const [labs, setLabs] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [liveTimetables, setLiveTimetables] = useState<any[]>([]);
  const [liveTimetableSlots, setLiveTimetableSlots] = useState<any[]>([]);

  // Faculty Module State
  const [facultyLeaves, setFacultyLeaves] = useState<FacultyLeaveApplication[]>([]);

  // HOD Module State
  const [sectionProgressList, setSectionProgressList] = useState<SectionProgressItem[]>([]);

  // Computed status for Department: if Basic Science is NOT LOCKED, Department is BLOCKED
  const departmentStatus: WorkflowStageStatus =
    basicScienceStatus !== 'LOCKED' ? 'BLOCKED' : departmentManualStatus;

  // Downstream revalidation flag & audit logs
  const [requiresRevalidation, setRequiresRevalidation] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // Live Backend & Synchronization Status
  const [syncStatus, setSyncStatus] = useState<BackendSyncStatus>('loading');
  const [activeSaveCount, setActiveSaveCount] = useState<number>(0);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean | null>(null);
  const [backendSyncError, setBackendSyncError] = useState<string | null>(null);
  const [isUsingFallbackData, setIsUsingFallbackData] = useState<boolean>(false);

  const isMountedRef = useRef<boolean>(true);
  const syncTrackerRef = useRef(new SyncRequestTracker());
  const saveCoordinatorRef = useRef(new DraftSaveCoordinator());

  // Synchronize live backend data from FastAPI & Firestore on initialization
  const syncBackendData = async () => {
    const requestId = syncTrackerRef.current.nextRequestId();
    setSyncStatus('loading');
    try {
      const [
        facRes,
        subRes,
        deptRes,
        labRes,
        roomRes,
        fcrRes,
        secRes,
        altRes,
        prefRes,
        wlRes,
        ttRes,
        slotRes,
      ] = await Promise.allSettled([
        aqsApi.getFaculty(),
        aqsApi.getSubjects(),
        aqsApi.getDepartments(),
        aqsApi.getLabs(),
        aqsApi.getRooms(),
        aqsApi.getFixedClassrooms(),
        aqsApi.getSections(),
        aqsApi.getAllotments(),
        aqsApi.getPreferences(),
        aqsApi.getWorkloadRecords(),
        aqsApi.getTimetables(),
        aqsApi.getTimetableSlots({ limit: 500 }),
      ]);

      // Ignore stale responses if unmounted or a newer sync request was initiated
      if (!isMountedRef.current || !syncTrackerRef.current.isLatest(requestId)) {
        return;
      }

      const criticalResults = [ttRes, slotRes, deptRes, facRes, subRes];
      const firstRejected = criticalResults.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined;
      const syncOutcome = evaluateSyncOutcome({
        timetablesOk: ttRes.status === 'fulfilled' && Array.isArray(ttRes.value),
        slotsOk: slotRes.status === 'fulfilled' && Array.isArray(slotRes.value),
        departmentsOk: deptRes.status === 'fulfilled' && Array.isArray(deptRes.value),
        facultyOk: facRes.status === 'fulfilled' && Array.isArray(facRes.value),
        subjectsOk: subRes.status === 'fulfilled' && Array.isArray(subRes.value),
        firstError: firstRejected?.reason?.message || null,
      });

      // 1. Allotments (Institutional & Subject Allocations)
      let liveAllotments: any[] = [];
      if (altRes.status === 'fulfilled' && Array.isArray(altRes.value)) {
        liveAllotments = altRes.value;
        const liveAllocations: SubjectAllocationItem[] = altRes.value.map((a: any) => ({
          id: a.id,
          subjectId: a.subject_id,
          facultyId: a.faculty_id,
          departmentId: a.department_id ?? null,
          academicYear: (a.academic_year || '2026-2027').replace('-', '–'),
          studentYear:
            a.student_year ||
            (a.semester <= 2
              ? 'First Year'
              : a.semester <= 4
              ? 'Second Year'
              : a.semester <= 6
              ? 'Third Year'
              : 'Fourth Year'),
          semesterNum: a.semester,
          courseCode: a.subject_code || a.subject_id || '',
          courseTitle: a.subject_name || a.subject_id || '',
          semester: a.semester ? (a.semester % 2 !== 0 ? 'Odd Semester' : 'Even Semester') : '',
          section: a.section ? `Section ${String(a.section).replace(/Section\s*/i, '').trim().toUpperCase()}` : '',
          facultyName: a.faculty_name || a.faculty_id || '',
          hoursPerWeek: a.weekly_hours_allocated || a.allocated_hours || 0,
          type: a.is_practical ? 'Laboratory' : 'Theory',
          venue: '',
        }));
        setSubjectAllocations(liveAllocations);
      }

      // 2. Preferences (Faculty & HOD Review)
      let livePrefsList: any[] = [];
      if (prefRes.status === 'fulfilled' && Array.isArray(prefRes.value)) {
        livePrefsList = prefRes.value;
        const livePrefs: FacultyPreferenceRecord[] = prefRes.value.map((p: any) => ({
          id: p.id,
          facultyName: p.faculty_name || p.faculty_id || '',
          empId: p.faculty_id || '',
          department: p.department_id || '',
          subjectCode: p.preferences?.[0]?.subject_code || '',
          subjectTitle: p.preferences?.[0]?.subject_name || '',
          category: 'Department Core',
          priority: (p.preferences?.[0]?.preference_rank === 1 ? '1st Choice' : (p.preferences?.[0]?.preference_rank === 2 ? '2nd Choice' : '3rd Choice')) as any,
          justification: p.hod_comments || p.preferences?.[0]?.notes || '',
          status: p.status === 'FINALIZED' ? 'Accepted' : 'Pending',
          submittedDate: p.created_at ? p.created_at.substring(0, 10) : '',
          remarks: p.hod_comments,
        }));
        setFacultyPreferences(livePrefs);
      }

      // 3. Departments
      if (deptRes.status === 'fulfilled' && Array.isArray(deptRes.value)) {
        const liveDepts: DepartmentInfo[] = deptRes.value.map((d: any) => ({
          id: d.id,
          code: d.code,
          name: d.name,
          category: d.category || '',
          hod: d.hod_faculty_id || '',
          coordinator: d.coordinator_faculty_id || '',
          facultyCount: 0,
          studentCount: 0,
          status: 'Not Started',
          oddSemCompletion: 0,
          evenSemCompletion: 0,
        }));
        setDepartments(liveDepts);
      }

      // 4. Faculty (Department & Basic Science)
      if (facRes.status === 'fulfilled' && Array.isArray(facRes.value)) {
        const liveFaculty: DepartmentFaculty[] = facRes.value.map((f: any, i: number) => {
          const facultyPrefDoc = livePrefsList.find(
            (p: any) => p.faculty_id === f.id || p.faculty_name?.toLowerCase() === f.name?.toLowerCase()
          );
          const mappedPrefs: any[] = facultyPrefDoc?.preferences ? facultyPrefDoc.preferences.map((p: any) => ({
            id: `pref-${p.preference_rank || 1}`,
            priority: p.preference_rank || 1,
            subjectCode: p.subject_code,
            subjectTitle: p.subject_name,
            justification: p.notes || ''
          })) : [];
          const mappedFinalized: any[] = facultyPrefDoc?.status === 'FINALIZED' ? mappedPrefs.map((p: any) => ({
            subjectCode: p.subjectCode,
            subjectTitle: p.subjectTitle,
            status: 'Accepted'
          })) : [];

          const assigned = liveAllotments
            .filter((a: any) => a.faculty_id === f.id || a.faculty_name?.toLowerCase() === f.name?.toLowerCase())
            .map((a: any) => a.subject_code || a.subject_name);

          return {
            id: f.id,
            name: f.name,
            empId: f.emp_id || `EMP${String(i + 1).padStart(3, '0')}`,
            email: f.email || '',
            department: f.department_id || '',
            designation: (f.designation === 'HOD' ? 'Head of Department' : (f.designation || 'Assistant Professor')) as any,
            hasLoginAccess: f.has_login_access !== undefined ? Boolean(f.has_login_access) : (f.is_active ?? true),
            accountStatus: f.is_active ? 'Active' : 'Inactive',
            eligibleYears: ['Second Year', 'Third Year', 'Fourth Year'],
            normHours: f.max_weekly_hours || 16,
            minHours: f.min_weekly_hours || 12,
            maxHours: f.max_weekly_hours || 16,
            theoryHours: 0,
            labHours: 0,
            basicScienceHours: 0,
            additionalDuties: [],
            preferences: mappedPrefs,
            finalizedPreferences: mappedFinalized,
            assignedCourses: assigned,
          };
        });
        setDepartmentFaculty(liveFaculty);

        const bsDeptIds = new Set(
          (deptRes.status === 'fulfilled' && Array.isArray(deptRes.value) ? deptRes.value : [])
            .filter((d: any) => d.category?.toUpperCase() === 'BASIC_SCIENCE')
            .map((d: any) => d.id)
        );
        ['dept_math', 'dept_physics', 'dept_chemistry', 'dept_basic_science'].forEach((id) => bsDeptIds.add(id));

        const bsFaculty: DepartmentFaculty[] = facRes.value
          .filter((f: any) => bsDeptIds.has(f.department_id))
          .map((f: any, i: number) => ({
            id: f.id,
            name: f.name,
            empId: f.emp_id || `BS${String(i + 1).padStart(3, '0')}`,
            email: f.email || '',
            department: f.department_id === 'dept_math' ? 'Mathematics' : (f.department_id === 'dept_physics' ? 'Physics' : (f.department_id === 'dept_chemistry' ? 'Chemistry' : f.department_id)),
            designation: (f.designation === 'HOD' ? 'Head of Department' : (f.designation || 'Assistant Professor')) as any,
            hasLoginAccess: f.has_login_access !== undefined ? Boolean(f.has_login_access) : (f.is_active ?? true),
            accountStatus: f.is_active ? 'Active' : 'Inactive',
            eligibleYears: ['First Year'],
            normHours: f.max_weekly_hours || 16,
            minHours: f.min_weekly_hours || 12,
            maxHours: f.max_weekly_hours || 16,
            theoryHours: 0,
            labHours: 0,
            basicScienceHours: 0,
            additionalDuties: [],
            preferences: [],
            finalizedPreferences: [],
            assignedCourses: liveAllotments
              .filter((a: any) => a.faculty_id === f.id)
              .map((a: any) => a.subject_code || a.subject_name),
          }));
        setBasicScienceFaculty(bsFaculty);
      }

      // 5. Subjects (Department Courses & Basic Science Cycles)
      if (subRes.status === 'fulfilled' && Array.isArray(subRes.value)) {
        const explicitCoordinatorDeptId =
          currentUser?.departmentId ??
          (typeof window !== 'undefined' ? window.localStorage.getItem('aqs_user_department_id') : null);
        const syncDeptList =
          deptRes.status === 'fulfilled' && Array.isArray(deptRes.value)
            ? deptRes.value.map((d: any) => ({ id: d.id, code: d.code, name: d.name }))
            : departments;
        const resolvedDeptForSync = resolveCoordinatorDepartment({
          explicitDepartmentId: explicitCoordinatorDeptId,
          departments: syncDeptList,
        });
        const scopedDeptSubjects = resolvedDeptForSync.departmentId
          ? subRes.value.filter(
              (s: any) => s.department_id === resolvedDeptForSync.departmentId
            )
          : [];
        const liveSubjects: DeptSubjectItem[] = scopedDeptSubjects.map((s: any) => ({
          id: s.id,
          courseCode: s.code || '',
          courseTitle: s.course_name || s.title || '',
          ltp: s.l_t_p || '3:0:0',
          credits: s.credits || 3,
          studentYear: (s.semester <= 4 ? 'Second Year' : (s.semester <= 6 ? 'Third Year' : 'Fourth Year')) as any,
          semester: (s.semester % 2 !== 0 ? 'Odd Semester' : 'Even Semester') as any,
          semNumber: `${s.semester}th Sem`,
          type: s.course_type || (s.is_lab ? 'Laboratory' : 'Theory'),
          hoursPerWeek: s.weekly_hours || 3,
          venue: '',
          assignedFaculty: '',
          preferenceMatch: undefined,
        }));
        setDeptSubjects(liveSubjects);

        const liveDeanSubjects: DeanSubject[] = subRes.value.map((s: any) => {
          const semNum = s.semester || 3;
          const isFY = !s.department_id || semNum <= 2;
          const matchedAllots = liveAllotments.filter(
            (a: any) => a.subject_id === s.id || (s.code && a.subject_code === s.code)
          );
          const facultyNames = Array.from(
            new Set(matchedAllots.map((a: any) => a.faculty_name || a.faculty_id).filter(Boolean))
          );
          return {
            id: s.id,
            name: s.course_name || s.title || '',
            code: s.code || '',
            ltp: s.l_t_p || '3:0:0',
            type: s.course_type || (s.is_lab ? 'Laboratory (PCCL)' : 'Theory (PCC/BSC)'),
            credits: s.credits ?? 3,
            numFaculty: Math.max(1, facultyNames.length),
            facultyNames,
            academicYear: (matchedAllots[0]?.academic_year || '2026-2027').replace('-', '–'),
            studentYear: isFY
              ? 'First Year'
              : semNum <= 4
              ? 'Second Year'
              : semNum <= 6
              ? 'Third Year'
              : 'Fourth Year',
            semester: semNum % 2 !== 0 ? 'Odd Semester' : 'Even Semester',
            department: isFY ? null : (s.department_id ? s.department_id.replace('dept_', '').toUpperCase() : null),
            section: matchedAllots[0]?.section ? `Section ${matchedAllots[0].section}` : 'Section A',
          };
        });
        setDeanSubjects(liveDeanSubjects);

        const phySubs: BasicScienceSubject[] = subRes.value
          .filter(
            (s: any) =>
              s.department_id === 'dept_physics' ||
              s.course_name?.toLowerCase().includes('physics') ||
              (s.department_id === null && (s.semester === 1 || !s.semester))
          )
          .map((s: any) => {
            const matchedAllots = liveAllotments.filter(
              (a: any) => a.subject_id === s.id || (s.code && a.subject_code === s.code)
            );
            const facultyNames = Array.from(
              new Set(matchedAllots.map((a: any) => a.faculty_name || a.faculty_id).filter(Boolean))
            );
            return {
              id: s.id,
              cycle: 'Physics',
              name: s.course_name || s.title || '',
              code: s.code || '',
              ltp: s.l_t_p || '3:0:0',
              type: s.is_lab ? 'Practical' : 'Theory',
              credits: s.credits || 4,
              numFaculty: Math.max(1, facultyNames.length),
              facultyNames,
            };
          });
        setPhysicsSubjects(phySubs);

        const chemSubs: BasicScienceSubject[] = subRes.value
          .filter(
            (s: any) =>
              s.department_id === 'dept_chemistry' ||
              s.course_name?.toLowerCase().includes('chemistry') ||
              (s.department_id === null && s.semester === 2)
          )
          .map((s: any) => {
            const matchedAllots = liveAllotments.filter(
              (a: any) => a.subject_id === s.id || (s.code && a.subject_code === s.code)
            );
            const facultyNames = Array.from(
              new Set(matchedAllots.map((a: any) => a.faculty_name || a.faculty_id).filter(Boolean))
            );
            return {
              id: s.id,
              cycle: 'Chemistry',
              name: s.course_name || s.title || '',
              code: s.code || '',
              ltp: s.l_t_p || '3:0:0',
              type: s.is_lab ? 'Practical' : 'Theory',
              credits: s.credits || 4,
              numFaculty: Math.max(1, facultyNames.length),
              facultyNames,
            };
          });
        setChemistrySubjects(chemSubs);
      }

      // 6. Workload Records
      if (wlRes.status === 'fulfilled' && Array.isArray(wlRes.value)) {
        const liveWorkload: FacultyWorkloadRecord[] = wlRes.value.map((w: any) => ({
          id: w.id,
          name: w.faculty_name || w.faculty_id || '',
          empId: w.faculty_id || '',
          department: w.department_id || '',
          designation: w.designation || '',
          theoryHours: w.total_theory_hours || 0,
          labHours: w.total_lab_hours || 0,
          otherHours: 0,
          maxHours: w.max_allowed_hours || 16,
          assignedHours: w.total_hours || 0,
          status: w.is_overloaded ? 'Overallocated' : 'Normal',
          assignedCourses: w.allotment_ids || [],
          preferenceStatus: w.preference_status || '',
        }));
        setFacultyWorkload(liveWorkload);
      }

      // 7. Timetable Slots & Timetables - Scoped strictly per class/section
      // Only update timetable maps when BOTH timetables and slots succeeded so partial failures never corrupt state
      if (
        ttRes.status === 'fulfilled' &&
        Array.isArray(ttRes.value) &&
        slotRes.status === 'fulfilled' &&
        Array.isArray(slotRes.value)
      ) {
        const deptPlacementsMap: Record<string, DeptPlacement[]> = {};
        const deanPlacementsMap: Record<string, DeanPlacement[]> = {};
        const cyclePlacementsMap: Record<string, BasicSciencePlacement[]> = {};

        setLiveTimetableSlots(slotRes.value);
        const liveEntries: TimetableCellEntry[] = slotRes.value.map((s: any) => ({
          day: (s.day.charAt(0).toUpperCase() + s.day.slice(1).toLowerCase()) as any,
          period: s.period || s.slot_number || 1,
          courseCode: s.subject_code || s.subject_id,
          courseTitle: s.subject_name || s.subject_id,
          facultyName: s.faculty_name || s.faculty_id,
          room: (s.room_name && !s.room_name.toLowerCase().includes('provisional') && s.room_name !== 'Lecture Hall AB04' && s.room_name !== 'LH-201') ? s.room_name : '',
          section: s.section ? `Section ${s.section}` : 'Section A',
          isLockedSlot: s.is_locked || false,
          lockedStage: 'Institutional (Dean)',
          lockedReason: s.lock_reason,
        }));
        setTimetableEntries(liveEntries);

        slotRes.value.forEach((s: any) => {
          const semNum = s.semester || 3;
          const isFY = !s.department_id || semNum === 1 || semNum === 2;
          const sy = isFY ? 'First Year' : (semNum <= 4 ? 'Second Year' : (semNum <= 6 ? 'Third Year' : 'Fourth Year'));
          const sem = (semNum % 2 !== 0) ? 'Odd Semester' : 'Even Semester';
          const cleanSec = (s.section || 'A').replace(/Section\s*/i, '').trim().toUpperCase();
          const sec = `Section ${cleanSec}`;
          const dept = isFY ? null : (s.department_id ? s.department_id.replace('dept_', '').toUpperCase() : 'AIDS');
          const ay = (s.academic_year || '2026-2027').replace('-', '–');

          const deanKey = isFY
            ? `${ay}_First Year_${sem}_${sec}`
            : `${ay}_${sy}_${sem}_${dept || 'AIDS'}_${sec}`;
          const deptKey = `${ay}_${sy}_${sem}_${dept || 'AIDS'}_${sec}`;

          const day = (s.day.charAt(0).toUpperCase() + s.day.slice(1).toLowerCase()) as any;
          const startPeriod = s.period || s.slot_number || 1;
          const duration = s.duration_slots || 1;
          const subCode = s.subject_code || s.subject_id;
          const subTitle = s.subject_name || s.subject_id;
          const facName = s.faculty_name || s.faculty_id;
          const rawRoom = (s.room_name || s.room_id || '').trim();
          const isPlaceholder = !rawRoom || rawRoom === 'LH-201' || rawRoom === 'Lecture Hall AB04' || rawRoom === 'room_default' || rawRoom.toLowerCase().includes('provisional');
          const roomName = isPlaceholder ? '' : rawRoom;

          if (!deptPlacementsMap[deptKey]) deptPlacementsMap[deptKey] = [];
          deptPlacementsMap[deptKey].push({
            id: s.id,
            day,
            startPeriod,
            duration,
            subjectCode: subCode,
            subjectTitle: subTitle,
            facultyName: facName,
            room: roomName,
            isLockedSlot: s.is_locked || false,
          });

          if (!deanPlacementsMap[deanKey]) deanPlacementsMap[deanKey] = [];
          deanPlacementsMap[deanKey].push({
            id: s.id,
            day,
            startPeriod,
            duration,
            subjectCode: subCode,
            subjectName: subTitle,
            facultyName: facName,
            room: roomName || undefined,
            subjectId: s.subject_id,
          });

          // Map First Year Basic Science cycles
          if (isFY) {
            let cycName = 'Physics';
            if (s.timetable_id && s.timetable_id.includes('chem')) {
              cycName = 'Chemistry';
            } else if (s.timetable_id && s.timetable_id.includes('phys')) {
              cycName = 'Physics';
            } else if ((s.subject_code && s.subject_code.toUpperCase().includes('CHE')) || (subTitle && subTitle.toLowerCase().includes('chemistry'))) {
              cycName = 'Chemistry';
            } else if (cleanSec === 'C' || cleanSec === 'D') {
              cycName = 'Chemistry';
            }
            const cycKey = `${cycName}_${ay}_${sem}_${sec}`;

            if (!cyclePlacementsMap[cycKey]) cyclePlacementsMap[cycKey] = [];
            cyclePlacementsMap[cycKey].push({
              id: s.id,
              day,
              startPeriod,
              duration,
              subjectCode: subCode,
              subjectName: subTitle,
              facultyName: facName,
              room: roomName,
              isDeanLocked: s.is_locked || false,
              lockedReason: s.lock_reason,
            });
          }
        });

        const nextDeptTimetables: Record<string, DeptSectionTimetable> = {};
        const nextDeanTimetables: Record<string, DeanSectionTimetable> = {};
        const nextCycleTimetables: Record<string, CycleSectionTimetable> = {};

        Object.entries(deptPlacementsMap).forEach(([k, placements]) => {
          const parts = k.split('_');
          nextDeptTimetables[k] = {
            academicYear: parts[0] || '2026–2027',
            studentYear: (parts[1] as any) || 'Second Year',
            semester: (parts[2] as any) || 'Odd Semester',
            department: parts[3] || 'AIDS',
            section: parts[4] || 'Section A',
            isDraft: true,
            isPublished: false,
            lastSaved: new Date().toISOString(),
            placements,
          };
        });

        Object.entries(deanPlacementsMap).forEach(([k, placements]) => {
          const parts = k.split('_');
          const isFY = k.includes('First Year');
          nextDeanTimetables[k] = {
            academicYear: parts[0] || '2026–2027',
            studentYear: (parts[1] as any) || 'Second Year',
            semester: (parts[2] as any) || 'Odd Semester',
            department: isFY ? null : parts[3] || 'AIDS',
            section: parts[parts.length - 1] || 'Section A',
            isLocked: false,
            placements,
          };
        });

        Object.entries(cyclePlacementsMap).forEach(([k, placements]) => {
          const parts = k.split('_');
          nextCycleTimetables[k] = {
            cycle: (parts[0] as any) || 'Physics',
            academicYear: parts[1] || '2026–2027',
            studentYear: 'First Year',
            semester: (parts[2] as any) || 'Odd Semester',
            section: parts[3] || 'Section A',
            isLocked: false,
            placements,
          };
        });

        setLiveTimetables(ttRes.value);
        ttRes.value.forEach((t: any) => {
          const isFY = !t.department_id || t.semester === 1 || t.semester === 2;
          const sy = isFY ? 'First Year' : (t.semester === 3 || t.semester === 4 ? 'Second Year' : (t.semester === 5 || t.semester === 6 ? 'Third Year' : 'Fourth Year'));
          const sem = t.semester_type === 'EVEN' ? 'Even Semester' : 'Odd Semester';
          const cleanSec = (t.section || 'A').replace(/Section\s*/i, '').trim().toUpperCase();
          const sec = `Section ${cleanSec}`;
          const dept = isFY ? null : (t.department_id ? t.department_id.replace('dept_', '').toUpperCase() : 'AIDS');
          const ay = (t.academic_year || '2026-2027').replace('-', '–');
          const k = isFY
            ? `${ay}_First Year_${sem}_${sec}`
            : `${ay}_${sy}_${sem}_${dept}_${sec}`;

          nextDeanTimetables[k] = {
            academicYear: ay,
            studentYear: sy,
            semester: sem,
            department: dept,
            section: sec,
            isLocked: t.status === 'FINALIZED' || t.status === 'LOCKED',
            placements: deanPlacementsMap[k] || [],
          };

          const deptKey = `${ay}_${sy}_${sem}_${dept || 'AIDS'}_${sec}`;
          nextDeptTimetables[deptKey] = {
            academicYear: ay,
            studentYear: sy as any,
            semester: sem as any,
            department: dept || 'AIDS',
            section: sec,
            isDraft: t.status !== 'FINALIZED' && t.status !== 'PUBLISHED',
            isPublished: t.status === 'PUBLISHED',
            lastSaved: t.updated_at || new Date().toISOString(),
            placements: deptPlacementsMap[deptKey] || [],
          };

          if (isFY) {
            let cyc = 'Physics';
            if (t.id && t.id.includes('chem')) {
              cyc = 'Chemistry';
            }
            const cycKey = `${cyc}_${ay}_${sem}_${sec}`;
            nextCycleTimetables[cycKey] = {
              cycle: cyc as any,
              academicYear: ay,
              studentYear: 'First Year',
              semester: sem,
              section: sec,
              isLocked: t.status === 'FINALIZED' || t.status === 'LOCKED',
              placements: cyclePlacementsMap[cycKey] || [],
            };
          }
        });

        setDeptTimetables(nextDeptTimetables);
        setDeanTimetables(nextDeanTimetables);
        setCycleTimetables(nextCycleTimetables);
      }

      // 8. Fixed Classrooms, Labs, Rooms, Sections
      if (fcrRes.status === 'fulfilled' && Array.isArray(fcrRes.value)) {
        setFixedClassrooms(fcrRes.value);
      }
      if (labRes.status === 'fulfilled' && Array.isArray(labRes.value)) {
        setLabs(labRes.value);
      }
      if (roomRes.status === 'fulfilled' && Array.isArray(roomRes.value)) {
        setRooms(roomRes.value);
      }
      if (secRes.status === 'fulfilled' && Array.isArray(secRes.value)) {
        setSections(secRes.value);
      }

      setSyncStatus(syncOutcome.syncStatus);
      setIsBackendConnected(syncOutcome.isBackendConnected);
      setBackendSyncError(syncOutcome.backendSyncError);
      setIsUsingFallbackData(syncOutcome.isUsingFallbackData);
      if (!syncOutcome.isBackendConnected) {
        console.warn('[AQS Backend Warning] Synchronization failed:', syncOutcome.backendSyncError);
      }
    } catch (err: any) {
      if (!isMountedRef.current || !syncTrackerRef.current.isLatest(requestId)) {
        return;
      }
      setSyncStatus('error');
      setIsBackendConnected(false);
      setIsUsingFallbackData(false);
      setBackendSyncError(`FastAPI connection error: ${err?.message || err}`);
      console.warn('Live backend data fetch failed:', err);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    let active = true;
    if (isAuthLoading) {
      return () => {
        active = false;
      };
    }

    syncBackendData();

    // Subscribe to live backend mutation events via SSE when authenticated
    if (isAuthenticated) {
      realtimeStream.connect();
    }
    const unsubscribe = realtimeStream.subscribe((_event) => {
      if (active) {
        syncBackendData();
      }
    });

    return () => {
      active = false;
      isMountedRef.current = false;
      unsubscribe();
      realtimeStream.disconnect();
    };
  }, [isAuthLoading, isAuthenticated, currentUser?.uid]);

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

  const assertBackendConnectedForMutation = () => {
    if (!isBackendConnected || syncStatus === 'loading' || syncStatus === 'error') {
      throw new Error('Backend synchronization is not ready. Please wait or retry sync.');
    }
  };

  const resolveSemesterNumber = (studentYear?: string, semesterLabel?: string, fallback: number = 3): number => {
    const isEven = (semesterLabel || '').toLowerCase().includes('even');
    if (studentYear === 'First Year') return isEven ? 2 : 1;
    if (studentYear === 'Second Year') return isEven ? 4 : 3;
    if (studentYear === 'Third Year') return isEven ? 6 : 5;
    if (studentYear === 'Fourth Year') return isEven ? 8 : 7;
    return fallback;
  };

  const resolveFacultyRecord = (facultyNameOrId: string) => {
    const clean = (facultyNameOrId || '').trim().toLowerCase();
    const allFac = [...departmentFaculty, ...basicScienceFaculty];
    return allFac.find(
      (f) => f.id.toLowerCase() === clean || f.name.trim().toLowerCase() === clean
    );
  };

  const upsertAllocationRecord = async (params: {
    subjectId: string;
    subjectCode?: string;
    subjectName: string;
    facultyNameOrId: string;
    academicYear?: string;
    studentYear?: string;
    semesterNum: number;
    departmentId: string | null;
    section?: string;
    weeklyHours?: number;
    isPractical?: boolean;
    role?: string;
  }) => {
    const fac = resolveFacultyRecord(params.facultyNameOrId);
    if (!fac) {
      throw new Error(`Faculty "${params.facultyNameOrId}" was not found in backend faculty records.`);
    }
    const cleanAy = (params.academicYear || institutionalConfig.academicYear || '2026-2027').replace('–', '-').trim();
    const cleanSec = (params.section || 'A').replace(/Section\s*/i, '').trim().toUpperCase();
    const effectiveDept = params.semesterNum <= 2 ? null : params.departmentId;

    const saved = await aqsApi.upsertAllotment(
      {
        academic_year: cleanAy,
        semester: params.semesterNum,
        student_year: params.studentYear,
        department_id: effectiveDept,
        subject_id: params.subjectId,
        faculty_id: fac.id,
        subject_code: params.subjectCode,
        subject_name: params.subjectName,
        faculty_name: fac.name,
        section: cleanSec,
        weekly_hours_allocated: params.weeklyHours || 3,
        is_practical: Boolean(params.isPractical),
      },
      params.role || 'coordinator'
    );

    if (isMountedRef.current) {
      const mapped: SubjectAllocationItem = {
        id: saved.id,
        subjectId: saved.subject_id,
        facultyId: saved.faculty_id,
        departmentId: saved.department_id ?? null,
        academicYear: cleanAy.replace('-', '–'),
        studentYear: params.studentYear,
        semesterNum: params.semesterNum,
        courseCode: saved.subject_code || params.subjectCode || '',
        courseTitle: saved.subject_name || params.subjectName,
        semester: params.semesterNum % 2 !== 0 ? 'Odd Semester' : 'Even Semester',
        section: `Section ${cleanSec}`,
        facultyName: saved.faculty_name || fac.name,
        hoursPerWeek: saved.weekly_hours_allocated || params.weeklyHours || 3,
        type: saved.is_practical ? 'Laboratory' : 'Theory',
        venue: '',
      };
      setSubjectAllocations((prev) => {
        const idx = prev.findIndex((item) => item.id === mapped.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = mapped;
          return next;
        }
        return [mapped, ...prev];
      });
    }
    return saved;
  };

  // Dean Redesign Subject Actions
  const addDeanSubject = async (sub: Omit<DeanSubject, 'id'>): Promise<void> => {
    assertBackendConnectedForMutation();
    const semNumber = resolveSemesterNumber(sub.studentYear, sub.semester, 3);
    const isFirstYear = sub.studentYear === 'First Year' || semNumber <= 2;
    const deptId = isFirstYear
      ? null
      : sub.department
      ? `dept_${sub.department.toLowerCase()}`
      : 'dept_aids';

    const cleanCode = sub.code?.trim().toUpperCase() || '';
    const newId = cleanCode
      ? `sub_${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
      : `sub_dean_${Date.now()}`;

    const isLab = sub.type?.toLowerCase().includes('lab') || sub.type?.toLowerCase().includes('practical') || false;
    const created = await aqsApi.createSubject(
      {
        id: newId,
        code: cleanCode || undefined,
        course_name: sub.name,
        title: sub.name,
        department_id: deptId,
        semester: semNumber,
        credits: typeof sub.credits === 'number' ? sub.credits : (parseInt(String(sub.credits || '3'), 10) || 3),
        course_type: sub.type || 'Theory',
        l_t_p: sub.ltp || (isLab ? '0:0:2' : '3:0:0'),
        is_lab: isLab,
      },
      'dean'
    );

    const savedId = created?.id || newId;
    if (sub.facultyNames && sub.facultyNames.length > 0) {
      await upsertAllocationRecord({
        subjectId: savedId,
        subjectCode: cleanCode || undefined,
        subjectName: sub.name,
        facultyNameOrId: sub.facultyNames[0],
        academicYear: sub.academicYear,
        studentYear: sub.studentYear,
        semesterNum: semNumber,
        departmentId: deptId,
        section: sub.section || 'Section A',
        isPractical: isLab,
        role: 'dean',
      });
    }

    if (isMountedRef.current) {
      const newSubject: DeanSubject = {
        ...sub,
        id: savedId,
        department: isFirstYear ? null : sub.department,
      };
      setDeanSubjects((prev) => [newSubject, ...prev]);
    }
  };

  const updateDeanSubject = async (id: string, updates: Partial<DeanSubject>): Promise<void> => {
    assertBackendConnectedForMutation();
    const existingSub = deanSubjects.find((s) => s.id === id);
    const merged = { ...existingSub, ...updates } as DeanSubject;
    const semNumber = resolveSemesterNumber(merged.studentYear, merged.semester, 3);
    const isFirstYear = merged.studentYear === 'First Year' || semNumber <= 2;
    const deptId = isFirstYear
      ? null
      : merged.department
      ? `dept_${merged.department.toLowerCase()}`
      : 'dept_aids';
    const isLab = merged.type?.toLowerCase().includes('lab') || merged.type?.toLowerCase().includes('practical') || false;

    const payload: any = {};
    if (updates.name !== undefined) {
      payload.course_name = updates.name;
      payload.title = updates.name;
    }
    if (updates.code !== undefined) payload.code = updates.code || null;
    if (updates.credits !== undefined) {
      payload.credits = typeof updates.credits === 'number' ? updates.credits : (parseInt(String(updates.credits || '3'), 10) || 3);
    }
    if (updates.type !== undefined) payload.course_type = updates.type;
    if (updates.ltp !== undefined) payload.l_t_p = updates.ltp;

    if (Object.keys(payload).length > 0) {
      await aqsApi.updateSubject(id, payload, 'dean');
    }

    if (updates.facultyNames && updates.facultyNames.length > 0) {
      await upsertAllocationRecord({
        subjectId: id,
        subjectCode: merged.code,
        subjectName: merged.name,
        facultyNameOrId: updates.facultyNames[0],
        academicYear: merged.academicYear,
        studentYear: merged.studentYear,
        semesterNum: semNumber,
        departmentId: deptId,
        section: merged.section || 'Section A',
        isPractical: isLab,
        role: 'dean',
      });
    }

    if (isMountedRef.current) {
      setDeanSubjects((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updates, department: isFirstYear ? null : merged.department } : s))
      );
    }
  };

  const deleteDeanSubject = async (id: string): Promise<void> => {
    assertBackendConnectedForMutation();
    await aqsApi.deleteSubject(id, 'dean');
    if (isMountedRef.current) {
      setDeanSubjects((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Dean Redesign Timetable Actions (Save Draft, Lock, Unlock)
  const saveDeanSectionTimetable = async (key: string, data: DeanSectionTimetable): Promise<void> => {
    const { ttId, semesterNum, departmentId, cleanAy, cleanSection } = buildDeanTimetableId({
      academicYear: data.academicYear,
      studentYear: data.studentYear,
      semester: data.semester,
      department: data.department,
      section: data.section,
    });

    saveCoordinatorRef.current.assertCanSave({
      syncStatus,
      isBackendConnected,
      isUsingFallbackData,
      timetableId: ttId,
      scopeKey: key,
      academicYear: cleanAy,
      semester: semesterNum,
      section: cleanSection,
    });

    saveCoordinatorRef.current.beginSave(ttId);
    setActiveSaveCount((c) => c + 1);
    try {
      const draftPayload: TimetableDraftPayload = {
        timetable_id: ttId,
        academic_year: cleanAy,
        semester: semesterNum,
        semester_type: semesterNum % 2 !== 0 ? 'ODD' : 'EVEN',
        department_id: departmentId,
        section: cleanSection,
        status: data.isLocked ? 'FINALIZED' : 'DRAFT',
        placements: (data.placements || []).map((p) => ({
          day: p.day,
          start_period: p.startPeriod,
          duration: p.duration || 1,
          subject_code: p.subjectCode,
          subject_name: p.subjectName,
          faculty_name: p.facultyName,
          room: p.room,
          is_locked: false,
          is_practical: false,
        })),
      };

      await aqsApi.saveTimetableDraft(draftPayload);
      if (isMountedRef.current) {
        setDeanTimetables((prev) => ({
          ...prev,
          [key]: data,
        }));
      }
    } finally {
      saveCoordinatorRef.current.endSave(ttId);
      if (isMountedRef.current) {
        setActiveSaveCount((c) => Math.max(0, c - 1));
      }
    }
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
    const semNumber = sub.cycle === 'Physics' ? 1 : 2;
    const newId = `sub_${sub.code ? sub.code.toLowerCase().replace(/[^a-z0-9]/g, '_') : `bs_${Date.now()}`}`;
    const newSubject: BasicScienceSubject = {
      ...sub,
      id: newId,
    };
    if (sub.cycle === 'Physics') {
      setPhysicsSubjects((prev) => [newSubject, ...prev]);
    } else {
      setChemistrySubjects((prev) => [newSubject, ...prev]);
    }

    const parsedCredits = typeof sub.credits === 'number' ? sub.credits : (parseInt(String(sub.credits || '3'), 10) || 3);
    aqsApi.createSubject({
      id: newId,
      code: sub.code,
      course_name: sub.name,
      title: sub.name,
      department_id: 'dept_basic_science',
      semester: semNumber,
      credits: parsedCredits,
      l_t_p: sub.ltp || (sub.type?.toLowerCase().includes('lab') ? '0:0:2' : '3:0:0'),
      course_type: sub.type || 'Theory',
      weekly_hours: parsedCredits,
      is_lab: sub.type?.toLowerCase().includes('lab') || false,
    }).catch((err) => {
      console.warn('Basic Science subject creation offline / sync warning:', err);
    });
  };

  const updateBasicScienceSubject = (id: string, updates: Partial<BasicScienceSubject>) => {
    setPhysicsSubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
    setChemistrySubjects((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );

    const payload: any = {};
    if (updates.name) {
      payload.course_name = updates.name;
      payload.title = updates.name;
    }
    if (updates.code) payload.code = updates.code;
    if (updates.credits !== undefined) {
      payload.credits = typeof updates.credits === 'number' ? updates.credits : (parseInt(String(updates.credits || '3'), 10) || 3);
    }
    if (updates.ltp) payload.l_t_p = updates.ltp;
    if (updates.type) payload.course_type = updates.type;

    if (Object.keys(payload).length > 0) {
      aqsApi.updateSubject(id, payload).catch((err) => {
        console.warn('Basic Science subject update offline / sync warning:', err);
      });
    }
  };

  const deleteBasicScienceSubject = (id: string) => {
    setPhysicsSubjects((prev) => prev.filter((s) => s.id !== id));
    setChemistrySubjects((prev) => prev.filter((s) => s.id !== id));
    aqsApi.deleteSubject(id).catch((err) => {
      console.warn('Basic Science subject deletion offline / sync warning:', err);
    });
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

  const saveCycleTimetable = async (key: string, data: CycleSectionTimetable): Promise<void> => {
    const { ttId, semesterNum, departmentId, cleanAy, cleanSection } = buildCycleTimetableId({
      cycle: data.cycle,
      academicYear: data.academicYear,
      semester: data.semester,
      section: data.section,
    });

    saveCoordinatorRef.current.assertCanSave({
      syncStatus,
      isBackendConnected,
      isUsingFallbackData,
      timetableId: ttId,
      scopeKey: key,
      academicYear: cleanAy,
      semester: semesterNum,
      section: cleanSection,
    });

    saveCoordinatorRef.current.beginSave(ttId);
    setActiveSaveCount((c) => c + 1);
    try {
      const draftPayload: TimetableDraftPayload = {
        timetable_id: ttId,
        academic_year: cleanAy,
        semester: semesterNum,
        semester_type: semesterNum % 2 !== 0 ? 'ODD' : 'EVEN',
        department_id: departmentId, // null: First Year must NOT receive an engineering department ID
        section: cleanSection,
        cycle: data.cycle,
        status: data.isLocked ? 'FINALIZED' : 'DRAFT',
        placements: (data.placements || []).map((p) => ({
          day: p.day,
          start_period: p.startPeriod,
          duration: p.duration || 1,
          subject_code: p.subjectCode,
          subject_name: p.subjectName,
          faculty_name: p.facultyName,
          room: p.room,
          is_locked: p.isDeanLocked || false,
          lock_reason: p.lockedReason,
          is_practical: false,
        })),
      };

      await aqsApi.saveTimetableDraft(draftPayload);
      if (isMountedRef.current) {
        setCycleTimetables((prev) => ({
          ...prev,
          [key]: data,
        }));
      }
    } finally {
      saveCoordinatorRef.current.endSave(ttId);
      if (isMountedRef.current) {
        setActiveSaveCount((c) => Math.max(0, c - 1));
      }
    }
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

  const updateBasicScienceFacultyFinalizedPreferences = (
    id: string,
    finalized: FinalizedPreferenceItem[]
  ) => {
    setBasicScienceFaculty((prev) =>
      prev.map((f) => (f.id === id ? { ...f, finalizedPreferences: finalized } : f))
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
    const apiStatus = status === 'Accepted' ? 'ACCEPTED' : (status === 'Rejected' ? 'REJECTED' : 'UNDER_REVIEW');
    aqsApi.reviewPreference(prefId, { status: apiStatus, hod_comments: remarks }).catch((err) => {
      console.warn('Could not persist preference status to backend:', err);
    });
  };

  const addSubjectAllocation = (item: Omit<SubjectAllocationItem, 'id'>) => {
    const newItem: SubjectAllocationItem = {
      ...item,
      id: `alloc-${Date.now()}`,
    };
    setSubjectAllocations((prev) => [...prev, newItem]);
    aqsApi.createAllotment({
      academic_year: '2026-2027',
      semester: parseInt(item.semester.replace(/\D/g, '')) || 3,
      department_id: 'dept_aids',
      subject_id: item.courseCode.toLowerCase().startsWith('sub_') ? item.courseCode : `sub_${item.courseCode.toLowerCase()}`,
      faculty_id: 'fac_dept_aids_dr_ananya_rao',
      section: item.section.replace(/Section /i, '').trim(),
      weekly_hours_allocated: item.hoursPerWeek,
      is_practical: item.type === 'Laboratory',
    }).catch((err) => {
      console.warn('Could not persist allotment creation to backend:', err);
    });
  };

  const removeSubjectAllocation = (id: string) => {
    setSubjectAllocations((prev) => prev.filter((a) => a.id !== id));
    if (id && !id.startsWith('alloc-')) {
      aqsApi.deleteAllotment(id).catch((err) => {
        console.warn('Could not persist allotment deletion to backend:', err);
      });
    }
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
    const cleanName = fac.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '');
    const newId = `fac_dept_aids_${cleanName || Date.now()}`;
    const newFaculty: DepartmentFaculty = {
      ...fac,
      id: newId,
    };
    setDepartmentFaculty((prev) => [newFaculty, ...prev]);

    aqsApi
      .createFaculty({
        id: newId,
        name: fac.name,
        email: fac.email || `${cleanName || 'faculty'}@sode-edu.in`,
        department_id: fac.department ? `dept_${fac.department.toLowerCase().replace(/[^a-z0-9]/g, '_')}` : 'dept_aids',
        designation: fac.designation,
        max_weekly_hours: fac.maxHours || 16,
        min_weekly_hours: fac.minHours || 12,
        is_active: fac.accountStatus !== 'Inactive',
      })
      .catch((err) => {
        console.warn('Faculty creation offline / sync warning:', err);
      });
  };

  const updateDepartmentFaculty = (id: string, updates: Partial<DepartmentFaculty>) => {
    setDepartmentFaculty((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );

    const payload: any = {};
    if (updates.name) payload.name = updates.name;
    if (updates.email) payload.email = updates.email;
    if (updates.designation) payload.designation = updates.designation;
    if (updates.maxHours !== undefined) payload.max_weekly_hours = updates.maxHours;
    if (updates.minHours !== undefined) payload.min_weekly_hours = updates.minHours;
    if (updates.accountStatus !== undefined) payload.is_active = updates.accountStatus === 'Active';

    if (Object.keys(payload).length > 0) {
      aqsApi.updateFaculty(id, payload).catch((err) => {
        console.warn('Faculty update offline / sync warning:', err);
      });
    }
  };

  const deleteDepartmentFaculty = (id: string) => {
    setDepartmentFaculty((prev) => prev.filter((f) => f.id !== id));
    aqsApi.deleteFaculty(id).catch((err) => {
      console.warn('Faculty deletion offline / sync warning:', err);
    });
  };

  const toggleFacultyAccountStatus = (id: string) => {
    let nextStatus: 'Active' | 'Inactive' = 'Active';
    const updateFn = (prev: DepartmentFaculty[]) =>
      prev.map((f) => {
        if (f.id === id) {
          nextStatus = f.accountStatus === 'Active' ? 'Inactive' : 'Active';
          return { ...f, accountStatus: nextStatus };
        }
        return f;
      });

    setDepartmentFaculty(updateFn);
    setBasicScienceFaculty(updateFn);

    aqsApi.updateFaculty(id, { is_active: nextStatus === 'Active' }).catch((err) => {
      console.warn('Faculty account status toggle offline / sync warning:', err);
    });
  };

  const toggleFacultyLoginAccess = async (id: string) => {
    const target = departmentFaculty.find((f) => f.id === id) || basicScienceFaculty.find((f) => f.id === id);
    const nextAccess = target ? !target.hasLoginAccess : true;

    setDepartmentFaculty((prev) =>
      prev.map((f) => (f.id === id ? { ...f, hasLoginAccess: nextAccess } : f))
    );
    setBasicScienceFaculty((prev) =>
      prev.map((f) => (f.id === id ? { ...f, hasLoginAccess: nextAccess } : f))
    );

    try {
      await aqsApi.provisionFacultyLogin(id, nextAccess);
    } catch (err) {
      console.warn('Faculty login access toggle warning:', err);
    }
  };

  const provisionFacultyLogin = async (facultyId: string, enableLogin: boolean = true, password?: string) => {
    const res = await aqsApi.provisionFacultyLogin(facultyId, enableLogin, password);
    if (isMountedRef.current) {
      setDepartmentFaculty((prev) =>
        prev.map((f) => (f.id === facultyId ? { ...f, hasLoginAccess: enableLogin } : f))
      );
      setBasicScienceFaculty((prev) =>
        prev.map((f) => (f.id === facultyId ? { ...f, hasLoginAccess: enableLogin } : f))
      );
    }
    return res;
  };

  const addBasicScienceFaculty = async (fac: Omit<DepartmentFaculty, 'id'>) => {
    const rawDept = fac.department || 'dept_math';
    const deptId = rawDept.startsWith('dept_')
      ? rawDept
      : rawDept.toLowerCase().includes('phys')
      ? 'dept_physics'
      : rawDept.toLowerCase().includes('chem')
      ? 'dept_chemistry'
      : 'dept_math';
    const deptSlug = deptId.replace('dept_', '');
    const cleanName = fac.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_+|_+$/g, '');
    const newId = `fac_${deptSlug}_${cleanName || Date.now()}`;
    const newFaculty: DepartmentFaculty = {
      ...fac,
      id: newId,
      department: deptId === 'dept_math' ? 'Mathematics' : (deptId === 'dept_physics' ? 'Physics' : (deptId === 'dept_chemistry' ? 'Chemistry' : deptId)),
    };

    const created = await aqsApi.createFaculty({
      id: newId,
      name: fac.name,
      email: fac.email,
      department_id: deptId,
      designation: fac.designation,
      max_weekly_hours: fac.maxHours || 16,
      min_weekly_hours: fac.minHours || 12,
      is_active: fac.accountStatus !== 'Inactive',
      has_login_access: fac.hasLoginAccess ?? true,
    });

    const savedId = created?.id || newId;
    newFaculty.id = savedId;

    if (fac.hasLoginAccess) {
      try {
        await aqsApi.provisionFacultyLogin(savedId, true);
      } catch (provErr) {
        console.warn('Initial login provisioning error for new faculty:', provErr);
      }
    }

    if (isMountedRef.current) {
      setBasicScienceFaculty((prev) => [newFaculty, ...prev]);
      setDepartmentFaculty((prev) => [newFaculty, ...prev]);
    }
  };

  const updateBasicScienceFaculty = async (id: string, updates: Partial<DepartmentFaculty>) => {
    let targetDeptId: string | undefined = undefined;
    if (updates.department) {
      const rawDept = updates.department;
      targetDeptId = rawDept.startsWith('dept_')
        ? rawDept
        : rawDept.toLowerCase().includes('phys')
        ? 'dept_physics'
        : rawDept.toLowerCase().includes('chem')
        ? 'dept_chemistry'
        : 'dept_math';
    }

    const payload: any = {};
    if (updates.name) payload.name = updates.name;
    if (updates.email) payload.email = updates.email;
    if (targetDeptId) payload.department_id = targetDeptId;
    if (updates.designation) payload.designation = updates.designation;
    if (updates.maxHours !== undefined) payload.max_weekly_hours = updates.maxHours;
    if (updates.minHours !== undefined) payload.min_weekly_hours = updates.minHours;
    if (updates.accountStatus !== undefined) payload.is_active = updates.accountStatus === 'Active';
    if (updates.hasLoginAccess !== undefined) payload.has_login_access = updates.hasLoginAccess;

    if (Object.keys(payload).length > 0) {
      await aqsApi.updateFaculty(id, payload);
    }

    if (updates.hasLoginAccess !== undefined) {
      try {
        await aqsApi.provisionFacultyLogin(id, updates.hasLoginAccess);
      } catch (provErr) {
        console.warn('Login provisioning synchronization warning:', provErr);
      }
    }

    if (isMountedRef.current) {
      const displayDept = targetDeptId
        ? (targetDeptId === 'dept_math' ? 'Mathematics' : (targetDeptId === 'dept_physics' ? 'Physics' : (targetDeptId === 'dept_chemistry' ? 'Chemistry' : targetDeptId)))
        : updates.department;

      setBasicScienceFaculty((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates, ...(displayDept ? { department: displayDept } : {}) } : f))
      );
      setDepartmentFaculty((prev) =>
        prev.map((f) => (f.id === id ? { ...f, ...updates, ...(displayDept ? { department: displayDept } : {}) } : f))
      );
    }
  };

  const deleteBasicScienceFaculty = async (id: string) => {
    await aqsApi.deleteFaculty(id);
    if (isMountedRef.current) {
      setBasicScienceFaculty((prev) => prev.filter((f) => f.id !== id));
      setDepartmentFaculty((prev) => prev.filter((f) => f.id !== id));
    }
  };

  const updateDepartmentFacultyFinalizedPreferences = (id: string, finalized: FinalizedPreferenceItem[]) => {
    setDepartmentFaculty((prev) =>
      prev.map((f) => (f.id === id ? { ...f, finalizedPreferences: finalized } : f))
    );
  };

  const addDeptSubject = async (
    sub: Omit<DeptSubjectItem, 'id'>,
    scope?: { academicYear?: string; section?: string }
  ): Promise<void> => {
    assertBackendConnectedForMutation();
    if (!activeDepartmentId) {
      throw new Error('Active coordinator department is not resolved. Cannot add department subject.');
    }
    const semNumber = parseInt(sub.semNumber?.replace(/\D/g, '') || '3', 10);
    const newId = `sub_${sub.courseCode ? sub.courseCode.toLowerCase().replace(/[^a-z0-9]/g, '_') : `dsub_${Date.now()}`}`;
    const isLab = sub.type?.toLowerCase().includes('lab') || false;

    const created = await aqsApi.createSubject({
      id: newId,
      code: sub.courseCode,
      course_name: sub.courseTitle,
      title: sub.courseTitle,
      department_id: activeDepartmentId,
      semester: semNumber,
      credits: typeof sub.credits === 'number' ? sub.credits : parseInt(String(sub.credits || '3'), 10) || 3,
      l_t_p: sub.ltp || '3:0:0',
      course_type: sub.type || 'Theory',
      weekly_hours: sub.hoursPerWeek || 3,
      is_lab: isLab,
    });

    const savedId = created?.id || newId;
    if (sub.assignedFaculty) {
      await upsertAllocationRecord({
        subjectId: savedId,
        subjectCode: sub.courseCode,
        subjectName: sub.courseTitle,
        facultyNameOrId: sub.assignedFaculty,
        academicYear: scope?.academicYear,
        studentYear: sub.studentYear,
        semesterNum: semNumber,
        departmentId: activeDepartmentId,
        section: scope?.section || 'Section A',
        weeklyHours: sub.hoursPerWeek || 3,
        isPractical: isLab,
        role: 'coordinator',
      });
    }

    if (isMountedRef.current) {
      const newSub: DeptSubjectItem = {
        ...sub,
        assignedFaculty: '',
        id: savedId,
      };
      setDeptSubjects((prev) => [newSub, ...prev]);
    }
  };

  const updateDeptSubject = async (
    id: string,
    updates: Partial<DeptSubjectItem>,
    scope?: { academicYear?: string; section?: string }
  ): Promise<void> => {
    assertBackendConnectedForMutation();
    if (!activeDepartmentId) {
      throw new Error('Active coordinator department is not resolved. Cannot update department subject.');
    }
    const existingSub = deptSubjects.find((s) => s.id === id);
    const merged = { ...existingSub, ...updates } as DeptSubjectItem;
    const semNumber = parseInt(merged.semNumber?.replace(/\D/g, '') || '3', 10) || resolveSemesterNumber(merged.studentYear, merged.semester, 3);
    const isLab = merged.type?.toLowerCase().includes('lab') || false;

    const payload: any = {};
    if (updates.courseTitle) {
      payload.course_name = updates.courseTitle;
      payload.title = updates.courseTitle;
    }
    if (updates.courseCode !== undefined) payload.code = updates.courseCode || null;
    if (updates.credits !== undefined) {
      payload.credits = typeof updates.credits === 'number' ? updates.credits : parseInt(String(updates.credits || '3'), 10);
    }
    if (updates.ltp) payload.l_t_p = updates.ltp;
    if (updates.hoursPerWeek !== undefined) payload.weekly_hours = updates.hoursPerWeek;
    if (updates.type) payload.course_type = updates.type;

    if (Object.keys(payload).length > 0) {
      await aqsApi.updateSubject(id, payload);
    }

    if (updates.assignedFaculty) {
      await upsertAllocationRecord({
        subjectId: id,
        subjectCode: merged.courseCode,
        subjectName: merged.courseTitle,
        facultyNameOrId: updates.assignedFaculty,
        academicYear: scope?.academicYear,
        studentYear: merged.studentYear,
        semesterNum: semNumber,
        departmentId: activeDepartmentId,
        section: scope?.section || 'Section A',
        weeklyHours: merged.hoursPerWeek || 3,
        isPractical: isLab,
        role: 'coordinator',
      });
    }

    if (isMountedRef.current) {
      const { assignedFaculty: _ignoredAssignedFaculty, ...masterUpdates } = updates;
      setDeptSubjects((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...masterUpdates } : s))
      );
    }
  };

  const deleteDeptSubject = async (id: string): Promise<void> => {
    assertBackendConnectedForMutation();
    await aqsApi.deleteSubject(id);
    if (isMountedRef.current) {
      setDeptSubjects((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const updateDeptSubjectAllocation = async (
    id: string,
    assignedFaculty: string,
    matchType?: DeptSubjectItem['preferenceMatch'],
    scope?: { academicYear?: string; semester?: string; studentYear?: string; section?: string }
  ): Promise<void> => {
    assertBackendConnectedForMutation();
    if (!activeDepartmentId) {
      throw new Error('Active coordinator department is not resolved. Cannot update subject allocation.');
    }
    const sub = deptSubjects.find((s) => s.id === id);
    if (!sub) {
      throw new Error(`Subject "${id}" not found.`);
    }

    const semNumber = parseInt(sub.semNumber?.replace(/\D/g, '') || '', 10) || resolveSemesterNumber(scope?.studentYear || sub.studentYear, scope?.semester || sub.semester, 3);
    const isLab = sub.type?.toLowerCase().includes('lab') || false;

    if (assignedFaculty && assignedFaculty.trim()) {
      await upsertAllocationRecord({
        subjectId: sub.id,
        subjectCode: sub.courseCode,
        subjectName: sub.courseTitle,
        facultyNameOrId: assignedFaculty,
        academicYear: scope?.academicYear,
        studentYear: scope?.studentYear || sub.studentYear,
        semesterNum: semNumber,
        departmentId: activeDepartmentId,
        section: scope?.section || 'Section A',
        weeklyHours: sub.hoursPerWeek || 3,
        isPractical: isLab,
        role: 'coordinator',
      });
    }

    if (isMountedRef.current && matchType) {
      setDeptSubjects((prev) =>
        prev.map((s) => (s.id === id ? { ...s, preferenceMatch: matchType } : s))
      );
    }
  };

  const autoAllocateDeptSubjects = async (
    academicYear: string,
    semester: string,
    studentYear: string,
    section: string = 'Section A'
  ): Promise<void> => {
    assertBackendConnectedForMutation();
    if (!activeDepartmentId) {
      throw new Error('Active coordinator department is not resolved. Cannot auto-allocate subjects.');
    }
    const targetSubjects = deptSubjects.filter(
      (sub) => sub.studentYear === studentYear && sub.semester === semester
    );

    const updatesMap = new Map<string, { assignedFaculty: string; matchType: DeptSubjectItem['preferenceMatch'] }>();
    for (const sub of targetSubjects) {
      let candidate = departmentFaculty.find(
        (f) =>
          f.accountStatus === 'Active' &&
          f.eligibleYears.includes(studentYear) &&
          f.preferences.some((p) => p.priority === 1 && p.subjectCode === sub.courseCode)
      );
      let matchType: DeptSubjectItem['preferenceMatch'] = 'Priority 1';

      if (!candidate) {
        candidate = departmentFaculty.find(
          (f) =>
            f.accountStatus === 'Active' &&
            f.eligibleYears.includes(studentYear) &&
            f.preferences.some((p) => p.priority === 2 && p.subjectCode === sub.courseCode)
        );
        matchType = 'Priority 2';
      }

      if (!candidate) {
        candidate = departmentFaculty.find(
          (f) =>
            f.accountStatus === 'Active' &&
            f.eligibleYears.includes(studentYear) &&
            f.preferences.some((p) => p.priority === 3 && p.subjectCode === sub.courseCode)
        );
        matchType = 'Priority 3';
      }

      if (!candidate) {
        candidate = departmentFaculty.find(
          (f) => f.accountStatus === 'Active' && f.eligibleYears.includes(studentYear)
        );
        matchType = 'Administrative Allocation';
      }

      if (candidate) {
        const semNumber = parseInt(sub.semNumber?.replace(/\D/g, '') || '', 10) || resolveSemesterNumber(studentYear, semester, 3);
        const isLab = sub.type?.toLowerCase().includes('lab') || false;
        await upsertAllocationRecord({
          subjectId: sub.id,
          subjectCode: sub.courseCode,
          subjectName: sub.courseTitle,
          facultyNameOrId: candidate.name,
          academicYear,
          studentYear,
          semesterNum: semNumber,
          departmentId: activeDepartmentId,
          section,
          weeklyHours: sub.hoursPerWeek || 3,
          isPractical: isLab,
          role: 'coordinator',
        });
        updatesMap.set(sub.id, { assignedFaculty: candidate.name, matchType });
      }
    }

    if (isMountedRef.current && updatesMap.size > 0) {
      setDeptSubjects((prev) =>
        prev.map((sub) => {
          const upd = updatesMap.get(sub.id);
          return upd ? { ...sub, preferenceMatch: upd.matchType } : sub;
        })
      );
    }
  };

  const saveDeptSectionTimetable = async (key: string, data: DeptSectionTimetable): Promise<void> => {
    const { ttId, semesterNum, departmentId, cleanAy, cleanSection } = buildDeptTimetableId({
      academicYear: data.academicYear,
      studentYear: data.studentYear,
      semester: data.semester,
      department: data.department || 'AIDS',
      section: data.section,
    });

    saveCoordinatorRef.current.assertCanSave({
      syncStatus,
      isBackendConnected,
      isUsingFallbackData,
      timetableId: ttId,
      scopeKey: key,
      academicYear: cleanAy,
      semester: semesterNum,
      section: cleanSection,
    });

    saveCoordinatorRef.current.beginSave(ttId);
    setActiveSaveCount((c) => c + 1);
    try {
      const draftPayload: TimetableDraftPayload = {
        timetable_id: ttId,
        academic_year: cleanAy,
        semester: semesterNum,
        semester_type: semesterNum % 2 !== 0 ? 'ODD' : 'EVEN',
        department_id: departmentId,
        section: cleanSection,
        status: data.isPublished ? 'FINALIZED' : 'DRAFT',
        placements: (data.placements || []).map((p) => ({
          day: p.day,
          start_period: p.startPeriod,
          duration: p.duration || 1,
          subject_code: p.subjectCode,
          subject_name: p.subjectTitle,
          faculty_name: p.facultyName,
          room: p.room,
          is_locked: p.isLockedSlot || false,
          lock_reason: p.lockedReason,
          is_practical: false,
        })),
      };

      await aqsApi.saveTimetableDraft(draftPayload);
      if (isMountedRef.current) {
        setDeptTimetables((prev) => ({
          ...prev,
          [key]: data,
        }));
      }
    } finally {
      saveCoordinatorRef.current.endSave(ttId);
      if (isMountedRef.current) {
        setActiveSaveCount((c) => Math.max(0, c - 1));
      }
    }
  };

  const publishDeptSectionTimetable = (key: string) => {
    const now = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    let targetTtId = '';
    setDeptTimetables((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      const updated = {
        ...existing,
        isDraft: false,
        isPublished: true,
        publishedAt: now,
        lastSaved: now,
      };

      // Persist published status
      const semNum = updated.semester.toLowerCase().includes('odd') ? 3 : 4;
      const cleanSec = updated.section.replace(/Section\s*/i, '').trim();
      const deptCode = (updated.department || activeDepartmentCode || 'AIDS').toLowerCase();
      targetTtId = `tt_${updated.academicYear.replace('–', '_')}_${deptCode}_sem${semNum}_sec${cleanSec.toLowerCase()}`;

      return {
        ...prev,
        [key]: updated,
      };
    });

    if (targetTtId) {
      aqsApi.publishTimetable(targetTtId).catch((err) => {
        console.warn('Could not persist timetable publication to backend:', err);
      });
    }
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
    let targetTtId = '';
    setDeptTimetables((prev) => {
      const existing = prev[key];
      if (!existing) return prev;
      const semNum = existing.semester.toLowerCase().includes('odd') ? 3 : 4;
      const cleanSec = existing.section.replace(/Section\s*/i, '').trim();
      const deptCode = (existing.department || activeDepartmentCode || 'AIDS').toLowerCase();
      targetTtId = `tt_${existing.academicYear.replace('–', '_')}_${deptCode}_sem${semNum}_sec${cleanSec.toLowerCase()}`;
      return {
        ...prev,
        [key]: {
          ...existing,
          isPublished: false,
          isDraft: true,
        },
      };
    });

    if (targetTtId) {
      aqsApi.updateTimetable(targetTtId, { status: 'DRAFT' }).catch((err) => {
        console.warn('Could not persist timetable unpublication to backend:', err);
      });
    }
  };

  // Faculty Module Actions
  const applyFacultyLeave = (leave: Omit<FacultyLeaveApplication, 'id' | 'status' | 'appliedDate'>) => {
    const newLeave: FacultyLeaveApplication = {
      ...leave,
      id: `leave-fac-${Date.now()}`,
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0],
      approverRemarks: 'Application submitted. Under review by Coordinator & HOD.',
    };
    setFacultyLeaves((prev) => [newLeave, ...prev]);
    pushAudit(
      'Faculty',
      leave.facultyName,
      'APPLIED_LEAVE_REQUEST',
      'Department',
      'v1.0',
      `Applied for ${leave.leaveType} from ${leave.fromDate} to ${leave.toDate} (${leave.daysCount} day(s)).`
    );
  };

  const cancelFacultyLeave = (id: string) => {
    setFacultyLeaves((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: 'Cancelled' as const } : l))
    );
  };

  const submitFacultyPreferences = (facultyId: string, prefs: FacultyPreferenceItem[]) => {
    setDepartmentFaculty((prev) =>
      prev.map((f) => (f.id === facultyId ? { ...f, preferences: prefs } : f))
    );
    aqsApi.submitPreferences({
      academic_year: '2026-2027',
      semester: 3,
      department_id: 'dept_aids',
      preferences: prefs.map((p) => ({
        subject_id: p.subjectCode.toLowerCase().startsWith('sub_') ? p.subjectCode : `sub_${p.subjectCode.toLowerCase()}`,
        preference_rank: p.priority,
        notes: p.justification,
      })),
    }).catch((err) => {
      console.warn('Could not persist faculty preferences to backend:', err);
    });
  };

  // HOD Module Actions
  const approveSectionTimetable = (sectionKey: string, remarks?: string) => {
    const now = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
    setSectionProgressList((prev) =>
      prev.map((item) =>
        item.id === sectionKey || item.section === sectionKey || `${item.year}_${item.section}` === sectionKey
          ? {
              ...item,
              hodReviewStatus: 'Approved' as const,
              overallStatus: 'Approved' as const,
              hodRemarks: remarks || 'Approved by HOD. Ready for final verification and official publication.',
            }
          : item
      )
    );
    setDeptTimetables((prev) => {
      const matchedKey = Object.keys(prev).find((k) => k === sectionKey || k.includes(sectionKey));
      if (!matchedKey) return prev;
      return {
        ...prev,
        [matchedKey]: {
          ...prev[matchedKey],
          lastSaved: now,
        },
      };
    });
    pushAudit(
      'HOD',
      'Dr. Vasudeva',
      'APPROVED_SECTION_TIMETABLE',
      'Department',
      'v1.0-approved',
      remarks ? `Approved timetable for ${sectionKey}. Remarks: ${remarks}` : `Approved timetable for ${sectionKey} without remarks.`
    );
  };

  const returnSectionTimetableForCorrection = (sectionKey: string, reason: string) => {
    setSectionProgressList((prev) =>
      prev.map((item) =>
        item.id === sectionKey || item.section === sectionKey || `${item.year}_${item.section}` === sectionKey
          ? {
              ...item,
              hodReviewStatus: 'Returned for Correction' as const,
              overallStatus: 'Returned for Correction' as const,
              hodRemarks: reason,
            }
          : item
      )
    );
    setDeptTimetables((prev) => {
      const matchedKey = Object.keys(prev).find((k) => k === sectionKey || k.includes(sectionKey));
      if (!matchedKey) return prev;
      return {
        ...prev,
        [matchedKey]: {
          ...prev[matchedKey],
          isDraft: true,
          isPublished: false,
        },
      };
    });
    pushAudit(
      'HOD',
      'Dr. Vasudeva',
      'RETURNED_SECTION_TIMETABLE',
      'Department',
      'v1.1-revision',
      `Returned ${sectionKey} for correction. Reason: ${reason}`
    );
  };

  const updateFacultyDuties = (facultyId: string, duties: FacultyAdditionalDuty[]) => {
    setDepartmentFaculty((prev) =>
      prev.map((f) => {
        if (f.id !== facultyId) return f;
        return {
          ...f,
          additionalDuties: duties,
        };
      })
    );
    pushAudit(
      'HOD',
      'Dr. Vasudeva',
      'UPDATED_FACULTY_DUTIES',
      'Department',
      'v1.0',
      `Updated institutional & departmental duties for faculty ID ${facultyId}.`
    );
  };

  const updateInstitutionalConfig = (updates: Partial<InstitutionalAcademicConfig>) => {
    setInstitutionalConfig((prev) => ({ ...prev, ...updates }));
    pushAudit(
      'Principal',
      'Dr. Thirumaleshwara Bhat',
      'UPDATED_INSTITUTIONAL_CONFIG',
      'Institutional',
      'v1.0',
      'Updated institutional academic calendar and structure settings.'
    );
  };

  const updateDepartmentLeadership = (deptId: string, updates: { hod?: string; coordinator?: string }) => {
    setDepartments((prev) =>
      prev.map((d) => (d.id === deptId ? { ...d, ...updates } : d))
    );
    pushAudit(
      'Principal',
      'Dr. Thirumaleshwara Bhat',
      'UPDATED_DEPARTMENT_LEADERSHIP',
      'Institutional',
      'v1.0',
      `Updated department leadership for ${deptId}: ${updates.hod ? 'HOD: ' + updates.hod + '; ' : ''}${updates.coordinator ? 'Coordinator: ' + updates.coordinator : ''}`
    );
  };

  return (
    <WorkflowContext.Provider
      value={{
        institutionalConfig,
        updateInstitutionalConfig,
        updateDepartmentLeadership,

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
        basicScienceFaculty,
        addBasicScienceFaculty,
        updateBasicScienceFaculty,
        deleteBasicScienceFaculty,
        provisionFacultyLogin,
        updateBasicScienceFacultyFinalizedPreferences,

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

        activeDepartmentId,
        activeDepartmentCode,
        activeDepartmentName,

        deptSubjects,
        addDeptSubject,
        updateDeptSubject,
        deleteDeptSubject,
        updateDeptSubjectAllocation,
        autoAllocateDeptSubjects,

        deptTimetables,
        saveDeptSectionTimetable,
        publishDeptSectionTimetable,
        unpublishDeptSectionTimetable,

        facultyLeaves,
        applyFacultyLeave,
        cancelFacultyLeave,
        submitFacultyPreferences,

        // HOD Module State
        sectionProgressList,
        approveSectionTimetable,
        returnSectionTimetableForCorrection,
        updateFacultyDuties,

        requiresRevalidation,
        auditLogs,

        syncStatus,
        isBackendLoading: syncStatus === 'loading',
        isSavingDraft: activeSaveCount > 0,
        isBackendConnected,
        backendSyncError,
        isUsingFallbackData,
        refreshBackendData: syncBackendData,
        fixedClassrooms,
        labs,
        rooms,
        sections,
        liveTimetables,
        liveTimetableSlots,
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

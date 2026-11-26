/**
 * Academic Quality & Scheduling (AQS) - Workflow Domain Models & Interfaces
 * Exact type definitions extracted from core schema.
 */

export interface InstitutionalSlot {
  id: string;
  name: string;
  category: 'Placement' | 'NSS' | 'Open Elective' | 'Basic Science' | 'Co-Curricular' | 'Institutional';
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startPeriod: number;
  duration: number; // in hours/periods
  applicableSemesters: string[];
  assignedFaculty: string;
  venue: string;
  remarks?: string;
  locked: boolean;
}

export interface FirstYearSection {
  id: string;
  sectionName: string;
  cycle: 'Physics' | 'Chemistry';
  room: string;
  studentCount: number;
  physicsTeacher: string;
  chemistryTeacher: string;
  mathsTeacher: string;
  cProgrammingTeacher: string;
  assignedLabs: string[];
}

export interface DepartmentInfo {
  id: string;
  name: string;
  code: string;
  coordinator: string;
  hod: string;
  facultyCount: number;
  studentCount: number;
  status: 'Not Started' | 'In Progress' | 'Finalized' | 'Published';
  oddSemCompletion: number;
  evenSemCompletion: number;
  category?: string;
}

export interface FacultyWorkloadRecord {
  id: string;
  name: string;
  empId: string;
  department: string;
  designation: string;
  theoryHours: number;
  labHours: number;
  otherHours: number;
  maxHours: number;
  assignedHours: number;
  status: 'Normal' | 'Overallocated' | 'Underallocated';
  assignedCourses: string[];
  preferenceStatus: 'Submitted' | 'Reviewed' | 'Pending';
}

export interface FacultyPreferenceRecord {
  id: string;
  facultyName: string;
  empId: string;
  department: string;
  subjectCode: string;
  subjectTitle: string;
  category: 'Department Core' | 'Basic Science' | 'Open Elective' | 'Laboratory';
  priority: '1st Choice' | '2nd Choice' | '3rd Choice' | '4th Choice';
  justification: string;
  status: 'Pending' | 'Reviewed' | 'Accepted' | 'Rejected';
  submittedDate: string;
  remarks?: string;
}

export interface SubjectAllocationItem {
  id: string;
  subjectId?: string;
  facultyId?: string;
  departmentId?: string | null;
  academicYear?: string;
  studentYear?: string;
  semesterNum?: number;
  courseCode: string;
  courseTitle: string;
  semester: string;
  section: string;
  facultyName: string;
  hoursPerWeek: number;
  type: 'Theory' | 'Laboratory' | 'Mentorship' | 'Seminar';
  venue: string;
}

export interface TimetableCellEntry {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  period: number;
  courseCode: string;
  courseTitle: string;
  facultyName: string;
  room: string;
  section: string;
  isLockedSlot?: boolean;
  lockedStage?: 'Institutional (Dean)' | 'Basic Science';
  lockedReason?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  role: string;
  user: string;
  action: string;
  stage: 'Institutional' | 'Basic Science' | 'Department' | 'Publication';
  version: string;
  remarks: string;
}

export interface DeanSubject {
  id: string;
  name: string;
  code?: string;
  ltp?: string;
  type: string;
  credits?: number | string;
  numFaculty: number;
  facultyNames: string[];
  academicYear?: string;
  studentYear?: string; // First, Second, Third, Fourth
  semester?: string; // Odd, Even
  department?: string | null;
  section?: string;
}

export interface DeanPlacement {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startPeriod: number; // 1 to 7
  duration: number; // 1, 2, or 3 consecutive periods
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  room?: string;
  isMerged?: boolean;
  subjectId?: string;
}

export interface DeanSectionTimetable {
  academicYear: string;
  studentYear: string;
  semester: string;
  department: string | null;
  section: string;
  placements: DeanPlacement[];
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
}

export interface BasicScienceSubject {
  id: string;
  cycle: 'Physics' | 'Chemistry';
  name: string;
  code?: string;
  ltp?: string;
  type: 'Theory' | 'Practical' | 'Integrated' | string;
  credits?: number | string;
  numFaculty: number;
  facultyNames: string[];
}

export interface BasicSciencePlacement {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startPeriod: number; // 1 to 7
  duration: number; // 1, 2, or 3
  subjectCode: string;
  subjectName: string;
  facultyName: string;
  room?: string;
  isMerged?: boolean;
  isDeanLocked?: boolean;
  lockedReason?: string;
  subjectId?: string;
}

export interface CycleSectionTimetable {
  cycle: 'Physics' | 'Chemistry';
  academicYear: string;
  studentYear: string;
  semester: string;
  section: string;
  placements: BasicSciencePlacement[];
  isLocked: boolean;
  lockedAt?: string;
  lockedBy?: string;
}

export interface FacultyAdditionalDuty {
  role: string;
  hours: number;
}

export interface FacultyPreferenceItem {
  id: string;
  priority: 1 | 2 | 3;
  subjectCode: string;
  subjectTitle: string;
  justification?: string;
}

export interface FinalizedPreferenceItem {
  priority: 1 | 2 | 3;
  subjectCode: string;
  subjectTitle: string;
  approvedBy: string;
  approvedAt: string;
  matchType: 'Preference Match' | 'Administrative Allocation';
}

export interface DepartmentFaculty {
  id: string;
  name: string;
  empId: string;
  email: string;
  department: string;
  designation: 'Professor' | 'Associate Professor' | 'Assistant Professor (Sr)' | 'Assistant Professor';
  hasLoginAccess: boolean;
  accountStatus: 'Active' | 'Inactive';
  eligibleYears: string[]; // ['Second Year', 'Third Year', 'Fourth Year']
  normHours: number;
  minHours: number;
  maxHours: number;
  theoryHours: number;
  labHours: number;
  basicScienceHours: number;
  additionalDuties: FacultyAdditionalDuty[];
  preferences: FacultyPreferenceItem[];
  finalizedPreferences: FinalizedPreferenceItem[];
  assignedCourses: string[];
}

export interface DeptSubjectItem {
  id: string;
  courseCode?: string;
  courseTitle: string;
  ltp?: string;
  credits?: number | string;
  studentYear: 'Second Year' | 'Third Year' | 'Fourth Year';
  semester: 'Odd Semester' | 'Even Semester';
  semNumber: string;
  type: 'Theory' | 'Laboratory' | 'Integrated' | 'Elective' | 'Institutional' | string;
  hoursPerWeek: number;
  venue: string;
  assignedFaculty: string;
  preferenceMatch?: 'Priority 1' | 'Priority 2' | 'Priority 3' | 'Administrative Allocation';
}

export interface DeptPlacement {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startPeriod: number; // 1 to 7
  duration: number; // 1, 2, or 3 periods
  subjectCode: string;
  subjectTitle: string;
  facultyName: string;
  room?: string;
  isLockedSlot?: boolean;
  lockedStage?: 'Institutional (Dean)' | 'Basic Science';
  lockedReason?: string;
  subjectId?: string;
}

export interface DeptSectionTimetable {
  academicYear: string;
  studentYear: string;
  semester: string;
  department: string;
  section: string;
  placements: DeptPlacement[];
  isDraft: boolean;
  isPublished: boolean;
  lastSaved: string;
  publishedAt?: string;
}

export interface SectionProgressItem {
  id: string;
  year: 'Second Year' | 'Third Year' | 'Fourth Year';
  semester: 'Odd Semester' | 'Even Semester';
  section: string;
  totalSections: number;
  facultyAllocationStatus: 'Completed' | 'In Progress' | 'Pending';
  subjectAllocationStatus: 'Completed' | 'In Progress' | 'Pending';
  timetableGenerationStatus: 'Generated' | 'In Progress' | 'Pending';
  editingStatus: 'Completed' | 'Under Editing' | 'Draft';
  clashValidationStatus: 'Zero Clashes (Verified)' | 'Clashes Detected' | 'Pending Validation';
  clashCount: number;
  hodReviewStatus: 'Approved' | 'Awaiting HOD Review' | 'Returned for Correction' | 'Pending Submission';
  overallStatus: 'Published' | 'Approved' | 'Awaiting HOD Review' | 'Returned for Correction' | 'Under Editing' | 'Pending';
  hodRemarks?: string;
  lastUpdated: string;
}

export interface AffectedTimetableSlot {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  period: number;
  time: string;
  subjectCode: string;
  subjectTitle: string;
  section: string;
  room: string;
  type: 'Department' | 'Basic Science' | 'Institutional';
  substituteFaculty?: string;
  substituteStatus: 'Arranged' | 'Pending Arrangement' | 'Not Required';
}

export interface FacultyLeaveApplication {
  id: string;
  facultyId: string;
  facultyName: string;
  department: string;
  leaveType: 'Casual Leave' | 'Medical Leave' | 'On Duty' | 'Other';
  fromDate: string;
  toDate: string;
  session: 'Full Day' | 'Half Day (Forenoon)' | 'Half Day (Afternoon)';
  daysCount: number;
  reason: string;
  attachmentName?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  appliedDate: string;
  approverRemarks?: string;
  substituteFaculty?: string;
  substituteStatus?: 'Arranged' | 'Pending Arrangement' | 'Not Required';
  affectedSlots: AffectedTimetableSlot[];
}

export const PERIOD_TIMINGS = [
  { period: 1, label: 'Period 1', time: '9:00–9:55', isBreak: false },
  { period: 2, label: 'Period 2', time: '9:55–10:50', isBreak: false },
  { period: -1, label: 'Tea Break', time: '10:50–11:10', isBreak: true },
  { period: 3, label: 'Period 3', time: '11:10–12:05', isBreak: false },
  { period: 4, label: 'Period 4', time: '12:05–1:00', isBreak: false },
  { period: -2, label: 'Lunch Break', time: '1:00–1:55', isBreak: true },
  { period: 5, label: 'Period 5', time: '1:55–2:50', isBreak: false },
  { period: -3, label: 'Leisure', time: '2:50–3:00', isBreak: true },
  { period: 6, label: 'Period 6', time: '3:00–3:55', isBreak: false },
  { period: 7, label: 'Period 7', time: '3:55–4:45', isBreak: false },
];

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

export const INITIAL_INSTITUTIONAL_SLOTS: InstitutionalSlot[] = [
  {
    id: 'inst-1',
    name: 'Placement & Industry Employability Training',
    category: 'Placement',
    day: 'Friday',
    startPeriod: 5,
    duration: 3,
    applicableSemesters: ['5th Sem', '7th Sem'],
    assignedFaculty: 'Training & Placement Officer (TPO) / Industry Mentors',
    venue: 'Main Auditorium / Seminar Hall',
    remarks: 'Mandatory VTU soft skills and coding mock assessments.',
    locked: true,
  },
  {
    id: 'inst-2',
    name: 'National Service Scheme (NSS) & Youth Red Cross',
    category: 'NSS',
    day: 'Thursday',
    startPeriod: 6,
    duration: 2,
    applicableSemesters: ['3rd Sem'],
    assignedFaculty: 'Prof. Nagaraj Rao (NSS Coordinator)',
    venue: 'Campus Grounds / Audio Visual Hall',
    remarks: 'Community outreach and environmental sustainability modules.',
    locked: true,
  },
  {
    id: 'inst-3',
    name: 'Open Elective - Inter-Departmental Pool',
    category: 'Open Elective',
    day: 'Wednesday',
    startPeriod: 4,
    duration: 2,
    applicableSemesters: ['5th Sem', '7th Sem'],
    assignedFaculty: 'Designated Inter-Departmental Faculty',
    venue: 'Central Academic Block Halls 201-206',
    remarks: 'Common institutional slot for multidisciplinary open electives.',
    locked: true,
  },
  {
    id: 'inst-4',
    name: 'First Year Induction & Universal Human Values',
    category: 'Basic Science',
    day: 'Monday',
    startPeriod: 1,
    duration: 2,
    applicableSemesters: ['1st Sem Physics Cycle', '1st Sem Chem Cycle'],
    assignedFaculty: 'Basic Science Faculty Team',
    venue: 'Aryabhata Seminar Hall',
    remarks: 'AICTE mandated induction and student mentoring hours.',
    locked: true,
  },
  {
    id: 'inst-5',
    name: 'Industry Expert Distinguished Lecture Series',
    category: 'Co-Curricular',
    day: 'Tuesday',
    startPeriod: 6,
    duration: 2,
    applicableSemesters: ['7th Sem'],
    assignedFaculty: 'Dean Academic / Invited Guest Lecturers',
    venue: 'Sir M. Visvesvaraya Auditorium',
    remarks: 'Emerging tech webinars and senior capstone briefings.',
    locked: true,
  },
];

export const INITIAL_FIRST_YEAR_SECTIONS: FirstYearSection[] = [
  {
    id: 'sec-1a',
    sectionName: 'Section A (CSE & AIDS Group)',
    cycle: 'Physics',
    room: 'AB-101',
    studentCount: 64,
    physicsTeacher: 'Dr. Ravindra (Physics)',
    chemistryTeacher: '—',
    mathsTeacher: 'Dr. Subrahmanya (Maths)',
    cProgrammingTeacher: 'Prof. Sneha (CSE)',
    assignedLabs: ['Engineering Physics Lab', 'Computing Center 1'],
  },
  {
    id: 'sec-1b',
    sectionName: 'Section B (ISE Group)',
    cycle: 'Physics',
    room: 'AB-102',
    studentCount: 62,
    physicsTeacher: 'Prof. Raghavendra (Physics)',
    chemistryTeacher: '—',
    mathsTeacher: 'Prof. Divya (Maths)',
    cProgrammingTeacher: 'Prof. Sandesh (ISE)',
    assignedLabs: ['Engineering Physics Lab', 'Computing Center 2'],
  },
  {
    id: 'sec-1c',
    sectionName: 'Section C (ECE Group)',
    cycle: 'Chemistry',
    room: 'AB-103',
    studentCount: 60,
    physicsTeacher: '—',
    chemistryTeacher: 'Dr. K. K. Srinivasan (Chemistry)',
    mathsTeacher: 'Dr. Subrahmanya (Maths)',
    cProgrammingTeacher: 'Prof. Karthik (ECE)',
    assignedLabs: ['Chemistry Lab', 'Basic Electrical Lab'],
  },
  {
    id: 'sec-1d',
    sectionName: 'Section D (Mechanical & Civil Group)',
    cycle: 'Chemistry',
    room: 'AB-104',
    studentCount: 52,
    physicsTeacher: '—',
    chemistryTeacher: 'Prof. Sumana (Chemistry)',
    mathsTeacher: 'Prof. Divya (Maths)',
    cProgrammingTeacher: 'Prof. Vinay (Civil)',
    assignedLabs: ['Chemistry Lab', 'Computer Aided Drafting Lab'],
  },
];

export const INITIAL_DEPARTMENTS: DepartmentInfo[] = [
  {
    id: 'dept-aids',
    name: 'Artificial Intelligence & Data Science',
    code: 'AIDS',
    coordinator: 'Prof. Rajesh Shetty',
    hod: 'Dr. Vasudeva',
    facultyCount: 14,
    studentCount: 248,
    status: 'Finalized',
    oddSemCompletion: 100,
    evenSemCompletion: 90,
  },
  {
    id: 'dept-cse',
    name: 'Computer Science & Engineering',
    code: 'CSE',
    coordinator: 'Prof. Manoj T',
    hod: 'Dr. Shantharama Rai C',
    facultyCount: 22,
    studentCount: 480,
    status: 'In Progress',
    oddSemCompletion: 85,
    evenSemCompletion: 60,
  },
  {
    id: 'dept-ece',
    name: 'Electronics & Communication Engineering',
    code: 'ECE',
    coordinator: 'Prof. Chetan R',
    hod: 'Dr. Sachin Bhat',
    facultyCount: 16,
    studentCount: 310,
    status: 'Finalized',
    oddSemCompletion: 100,
    evenSemCompletion: 80,
  },
  {
    id: 'dept-ise',
    name: 'Information Science & Engineering',
    code: 'ISE',
    coordinator: 'Prof. Sudhir Nayak',
    hod: 'Dr. Sowmya J',
    facultyCount: 14,
    studentCount: 220,
    status: 'In Progress',
    oddSemCompletion: 70,
    evenSemCompletion: 50,
  },
  {
    id: 'dept-mech',
    name: 'Mechanical Engineering',
    code: 'MECH',
    coordinator: 'Prof. Anand V',
    hod: 'Dr. Gajanan Anne',
    facultyCount: 12,
    studentCount: 162,
    status: 'Published',
    oddSemCompletion: 100,
    evenSemCompletion: 100,
  },
];

export const INSTITUTION_FACULTY_ROSTER: FacultyWorkloadRecord[] = [
  {
    id: 'fac-101',
    name: 'Dr. Vasudeva',
    empId: 'FAC101',
    department: 'Artificial Intelligence & Data Science',
    designation: 'Professor & HOD',
    theoryHours: 8,
    labHours: 4,
    otherHours: 2,
    maxHours: 16,
    assignedHours: 14,
    status: 'Normal',
    assignedCourses: ['21AI51 - Management & Entrepreneurship', '21AIL58 - AI Lab'],
    preferenceStatus: 'Reviewed',
  },
  {
    id: 'fac-102',
    name: 'Dr. Ananya Rao',
    empId: 'FAC102',
    department: 'Artificial Intelligence & Data Science',
    designation: 'Associate Professor',
    theoryHours: 10,
    labHours: 5,
    otherHours: 1,
    maxHours: 20,
    assignedHours: 16,
    status: 'Normal',
    assignedCourses: ['21AI32 - Data Structures & Algorithms', '21AI52 - Machine Learning', '21AIL37 - DSA Laboratory'],
    preferenceStatus: 'Reviewed',
  },
  {
    id: 'fac-103',
    name: 'Prof. Rajesh Shetty',
    empId: 'FAC103',
    department: 'Artificial Intelligence & Data Science',
    designation: 'Assistant Professor (Sr)',
    theoryHours: 12,
    labHours: 4,
    otherHours: 2,
    maxHours: 20,
    assignedHours: 18,
    status: 'Normal',
    assignedCourses: ['21AI33 - Discrete Mathematical Structures', '21AI53 - Deep Learning Architectures'],
    preferenceStatus: 'Reviewed',
  },
  {
    id: 'fac-104',
    name: 'Prof. Sneha Kamath',
    empId: 'FAC104',
    department: 'Artificial Intelligence & Data Science',
    designation: 'Assistant Professor',
    theoryHours: 10,
    labHours: 6,
    otherHours: 0,
    maxHours: 20,
    assignedHours: 16,
    status: 'Normal',
    assignedCourses: ['21AI34 - Object Oriented Programming Java', '21AIL38 - Java Lab'],
    preferenceStatus: 'Reviewed',
  },
  {
    id: 'fac-105',
    name: 'Prof. Sandeep Kumar',
    empId: 'FAC105',
    department: 'Artificial Intelligence & Data Science',
    designation: 'Assistant Professor',
    theoryHours: 12,
    labHours: 6,
    otherHours: 1,
    maxHours: 20,
    assignedHours: 19,
    status: 'Normal',
    assignedCourses: ['21AI54 - Natural Language Processing', '21AIL57 - NLP Lab'],
    preferenceStatus: 'Reviewed',
  },
  {
    id: 'fac-201',
    name: 'Dr. Ravindra',
    empId: 'FAC201',
    department: 'Physics (Basic Science)',
    designation: 'Professor & Coordinator',
    theoryHours: 10,
    labHours: 6,
    otherHours: 2,
    maxHours: 20,
    assignedHours: 18,
    status: 'Normal',
    assignedCourses: ['22PHY12 - Engineering Physics', '22PHYL16 - Physics Lab'],
    preferenceStatus: 'Reviewed',
  },
  {
    id: 'fac-202',
    name: 'Dr. Subrahmanya',
    empId: 'FAC202',
    department: 'Mathematics (Basic Science)',
    designation: 'Professor',
    theoryHours: 14,
    labHours: 2,
    otherHours: 1,
    maxHours: 20,
    assignedHours: 17,
    status: 'Normal',
    assignedCourses: ['22MAT11 - Calculus & Linear Algebra', '22MAT21 - Differential Equations'],
    preferenceStatus: 'Reviewed',
  },
  {
    id: 'fac-203',
    name: 'Dr. K. K. Srinivasan',
    empId: 'FAC203',
    department: 'Chemistry (Basic Science)',
    designation: 'Professor & HOD Chem',
    theoryHours: 10,
    labHours: 6,
    otherHours: 2,
    maxHours: 20,
    assignedHours: 18,
    status: 'Normal',
    assignedCourses: ['22CHE12 - Engineering Chemistry', '22CHEL16 - Chemistry Lab'],
    preferenceStatus: 'Reviewed',
  },
];

export const INITIAL_FACULTY_PREFERENCES: FacultyPreferenceRecord[] = [
  {
    id: 'pref-1',
    facultyName: 'Dr. Ananya Rao',
    empId: 'FAC102',
    department: 'Artificial Intelligence & Data Science',
    subjectCode: '21AI52',
    subjectTitle: 'Machine Learning',
    category: 'Department Core',
    priority: '1st Choice',
    justification: 'Authored 4 Springer publications and 3 years experience teaching statistical learning.',
    status: 'Accepted',
    submittedDate: '2026-10-28',
    remarks: 'Approved by Timetable Committee for Semester 5.',
  },
  {
    id: 'pref-2',
    facultyName: 'Dr. Ananya Rao',
    empId: 'FAC102',
    department: 'Artificial Intelligence & Data Science',
    subjectCode: '21AI32',
    subjectTitle: 'Data Structures and Algorithms',
    category: 'Department Core',
    priority: '2nd Choice',
    justification: 'Fundamental core course with algorithmic problem-solving pedagogy.',
    status: 'Accepted',
    submittedDate: '2026-10-28',
    remarks: 'Allocated for AIDS 3A & 3B.',
  },
  {
    id: 'pref-3',
    facultyName: 'Prof. Sneha Kamath',
    empId: 'FAC104',
    department: 'Artificial Intelligence & Data Science',
    subjectCode: '21AI34',
    subjectTitle: 'Object Oriented Programming with Java',
    category: 'Department Core',
    priority: '1st Choice',
    justification: 'Expertise in Java Enterprise and design patterns.',
    status: 'Accepted',
    submittedDate: '2026-10-29',
  },
  {
    id: 'pref-4',
    facultyName: 'Prof. Sandeep Kumar',
    empId: 'FAC105',
    department: 'Artificial Intelligence & Data Science',
    subjectCode: '21AI54',
    subjectTitle: 'Natural Language Processing',
    category: 'Department Core',
    priority: '1st Choice',
    justification: 'Specialized M.Tech thesis in transformer NLP and speech analysis.',
    status: 'Reviewed',
    submittedDate: '2026-10-30',
  },
];

export const INITIAL_SUBJECT_ALLOCATIONS: SubjectAllocationItem[] = [
  {
    id: 'alloc-1',
    courseCode: '21AI32',
    courseTitle: 'Data Structures & Applications',
    semester: '3rd Sem',
    section: 'AIDS - 3A',
    facultyName: 'Dr. Ananya Rao',
    hoursPerWeek: 4,
    type: 'Theory',
    venue: 'LH-201',
  },
  {
    id: 'alloc-2',
    courseCode: '21AIL37',
    courseTitle: 'Data Structures Lab (B1 & B2)',
    semester: '3rd Sem',
    section: 'AIDS - 3A',
    facultyName: 'Dr. Ananya Rao',
    hoursPerWeek: 4,
    type: 'Laboratory',
    venue: 'AI Computing Lab 1',
  },
  {
    id: 'alloc-3',
    courseCode: '21AI33',
    courseTitle: 'Discrete Mathematical Structures',
    semester: '3rd Sem',
    section: 'AIDS - 3A',
    facultyName: 'Prof. Rajesh Shetty',
    hoursPerWeek: 4,
    type: 'Theory',
    venue: 'LH-201',
  },
  {
    id: 'alloc-4',
    courseCode: '21AI34',
    courseTitle: 'Object Oriented Programming with Java',
    semester: '3rd Sem',
    section: 'AIDS - 3A',
    facultyName: 'Prof. Sneha Kamath',
    hoursPerWeek: 4,
    type: 'Theory',
    venue: 'LH-201',
  },
  {
    id: 'alloc-5',
    courseCode: '21AI52',
    courseTitle: 'Machine Learning',
    semester: '5th Sem',
    section: 'AIDS - 5A',
    facultyName: 'Dr. Ananya Rao',
    hoursPerWeek: 4,
    type: 'Theory',
    venue: 'LH-302',
  },
  {
    id: 'alloc-6',
    courseCode: '21AIL58',
    courseTitle: 'Artificial Intelligence & ML Lab',
    semester: '5th Sem',
    section: 'AIDS - 5A',
    facultyName: 'Dr. Vasudeva',
    hoursPerWeek: 4,
    type: 'Laboratory',
    venue: 'Advanced AI Lab',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-1',
    timestamp: '2026-11-01 10:30 AM',
    role: 'Dean',
    user: 'Dr. Sudarshan Rao',
    action: 'LOCKED_INSTITUTIONAL_SCHEDULE',
    stage: 'Institutional',
    version: 'v1.0-locked',
    remarks: 'Approved institutional slots: Placement (Fri), NSS (Thu), Open Electives (Wed).',
  },
  {
    id: 'log-2',
    timestamp: '2026-11-02 02:45 PM',
    role: 'Basic Science Coordinator',
    user: 'Dr. Ravindra',
    action: 'LOCKED_BASIC_SCIENCE_SCHEDULE',
    stage: 'Basic Science',
    version: 'v1.0-locked',
    remarks: 'Completed Physics and Chemistry cycle rotation for sections A, B, C, D.',
  },
  {
    id: 'log-3',
    timestamp: '2026-11-03 11:15 AM',
    role: 'Department Coordinator',
    user: 'Prof. Rajesh Shetty (AIDS)',
    action: 'FINALIZED_DEPARTMENT_TIMETABLE',
    stage: 'Department',
    version: 'v1.0-final',
    remarks: 'AI & Data Science timetable built, clash-checked with 0 conflicts.',
  },
  {
    id: 'log-4',
    timestamp: '2026-11-03 04:00 PM',
    role: 'Principal',
    user: 'Dr. Thirumaleshwara Bhat',
    action: 'APPROVED_FOR_PUBLICATION',
    stage: 'Publication',
    version: 'v1.0-official',
    remarks: 'AIDS and Mechanical Department timetables approved for official publication.',
  },
];

// =====================================================================
// DEAN MODULE SPECIFICATION TYPES AND INITIAL STATE (AQS Redesign)
// =====================================================================

export interface DeanSubject {
  id: string;
  name: string;
  code: string;
  type: string;
  numFaculty: number;
  facultyNames: string[];
  academicYear?: string;
  studentYear?: string; // First, Second, Third, Fourth
  semester?: string; // Odd, Even
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
}

export interface DeanSectionTimetable {
  academicYear: string;
  studentYear: string;
  semester: string;
  department: string;
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
  code: string;
  type: 'Theory' | 'Practical' | 'Integrated';
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

export const DEAN_DEPARTMENTS = [
  { code: 'DS', name: 'Data Science' },
  { code: 'ML', name: 'Machine Learning' },
  { code: 'CSE', name: 'Computer Science & Engineering' },
  { code: 'EC', name: 'Electronics & Communication' },
  { code: 'MECH', name: 'Mechanical' },
  { code: 'CIVIL', name: 'Civil' },
  { code: 'First Year', name: 'First Year' },
];

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

export const REGISTERED_FACULTY_NAMES: string[] = [
  'Dr. Thirumaleshwara Bhat',
  'Dr. Sudarshan Rao',
  'Dr. Vasudeva',
  'Dr. Shantharama Rai C',
  'Dr. Gajanan Anne',
  'Dr. Bhagya',
  'Dr. Ananya Rao',
  'Prof. Rajesh Shetty',
  'Prof. Sneha Kamath',
  'Prof. Manoj T',
  'Prof. Nagaraj Rao',
  'Prof. Anand V',
  'Prof. Sandesh',
  'Prof. Karthik',
  'Prof. Vinay',
  'Prof. Divya',
  'Prof. Sumana',
  'Balachandra',
  'Ashwini',
  'Shalaka',
  'Shabhana',
  'Sarvesh',
  'Ranjan',
  'BJ',
  'VS',
  'AK',
  'NF1',
  'SL',
  'MS',
  'SH',
  'SR',
  'Placement Officer',
];

export const INITIAL_DEAN_SUBJECTS: DeanSubject[] = [
  {
    id: 'sub-1',
    name: 'Mathematics for Computer Science',
    code: 'BCS301',
    type: 'PCC/BSC - Theory',
    numFaculty: 1,
    facultyNames: ['Dr. Bhagya'],
    academicYear: '2026–2027',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
  },
  {
    id: 'sub-2',
    name: 'Digital Design & Computer Organization',
    code: 'BCS302',
    type: 'IPCC - Integrated',
    numFaculty: 3,
    facultyNames: ['Balachandra', 'BJ', 'VS'],
    academicYear: '2026–2027',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
  },
  {
    id: 'sub-3',
    name: 'Operating Systems',
    code: 'BCS303',
    type: 'IPCC - Integrated',
    numFaculty: 3,
    facultyNames: ['Ashwini', 'AK', 'NF1'],
    academicYear: '2026–2027',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
  },
  {
    id: 'sub-4',
    name: 'Data Structures and Applications',
    code: 'BCS304',
    type: 'PCC - Theory',
    numFaculty: 1,
    facultyNames: ['Shalaka'],
    academicYear: '2026–2027',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
  },
  {
    id: 'sub-5',
    name: 'Data Structures Lab',
    code: 'BCSL305',
    type: 'PCCL - Laboratory',
    numFaculty: 3,
    facultyNames: ['Shalaka', 'SL', 'MS'],
    academicYear: '2026–2027',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
  },
  {
    id: 'sub-6',
    name: 'Object Oriented Programming with Java',
    code: 'BCS306A',
    type: 'ESC - Elective',
    numFaculty: 3,
    facultyNames: ['Shabhana', 'SH', 'NF1'],
    academicYear: '2026–2027',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
  },
  {
    id: 'sub-7',
    name: 'Social Connect and Responsibility',
    code: 'BSCK307',
    type: 'UHV - Universal Human Values',
    numFaculty: 1,
    facultyNames: ['Sarvesh'],
    academicYear: '2026–2027',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
  },
  {
    id: 'sub-8',
    name: 'Data Analytics with Excel',
    code: 'BCS358A',
    type: 'AEC/SEC - Skill Enhancement',
    numFaculty: 3,
    facultyNames: ['BJ', 'SR', 'SH'],
    academicYear: '2026–2027',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
  },
  {
    id: 'sub-9',
    name: 'National Service Scheme (NSS)',
    code: 'BNSK359',
    type: 'MC - Mandatory Course',
    numFaculty: 2,
    facultyNames: ['Ranjan', 'Prof. Nagaraj Rao'],
    academicYear: '2026–2027',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
  },
  {
    id: 'sub-10',
    name: 'Technical Training',
    code: 'TECH-TRN',
    type: 'Institutional Activity',
    numFaculty: 2,
    facultyNames: ['Placement Officer', 'Industry Mentors'],
    academicYear: '2026–2027',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
  },
  {
    id: 'sub-11',
    name: 'Value Added Course',
    code: 'VAC',
    type: 'Institutional Activity',
    numFaculty: 1,
    facultyNames: ['Dean Academic / Faculty'],
    academicYear: '2026–2027',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
  },
];

export const INITIAL_DS_3A_PLACEMENTS: DeanPlacement[] = [
  // Monday
  { id: 'p-m1', day: 'Monday', startPeriod: 1, duration: 2, subjectCode: 'TECH-TRN', subjectName: 'Technical Training', facultyName: 'Placement Officer', room: 'Auditorium' },
  { id: 'p-m3', day: 'Monday', startPeriod: 3, duration: 1, subjectCode: 'BCS301', subjectName: 'Mathematics for Computer Science', facultyName: 'Dr. Bhagya', room: 'LH-201' },
  { id: 'p-m4', day: 'Monday', startPeriod: 4, duration: 1, subjectCode: 'BCS302', subjectName: 'Digital Design & Computer Organization', facultyName: 'Balachandra', room: 'LH-201' },
  { id: 'p-m5', day: 'Monday', startPeriod: 5, duration: 1, subjectCode: 'BCS304', subjectName: 'Data Structures and Applications', facultyName: 'Shalaka', room: 'LH-201' },
  { id: 'p-m6', day: 'Monday', startPeriod: 6, duration: 2, subjectCode: 'BCS358A', subjectName: 'Data Analytics with Excel Lab', facultyName: 'BJ, SR, SH', room: 'Computing Center' },

  // Tuesday
  { id: 'p-t1', day: 'Tuesday', startPeriod: 1, duration: 2, subjectCode: 'BCS302/BCS306A', subjectName: 'DDCO/OOPS LAB', facultyName: 'Balachandra, Shabhana', room: 'Hardware Lab' },
  { id: 'p-t3', day: 'Tuesday', startPeriod: 3, duration: 1, subjectCode: 'BCS306A', subjectName: 'Object Oriented Programming with Java', facultyName: 'Shabhana', room: 'LH-201' },
  { id: 'p-t4', day: 'Tuesday', startPeriod: 4, duration: 1, subjectCode: 'BCS304', subjectName: 'Data Structures and Applications', facultyName: 'Shalaka', room: 'LH-201' },
  { id: 'p-t5', day: 'Tuesday', startPeriod: 5, duration: 1, subjectCode: 'BCS303', subjectName: 'Operating Systems', facultyName: 'Ashwini', room: 'LH-201' },
  { id: 'p-t6', day: 'Tuesday', startPeriod: 6, duration: 1, subjectCode: 'BCS303', subjectName: 'Operating Systems', facultyName: 'Ashwini', room: 'LH-201' },
  { id: 'p-t7', day: 'Tuesday', startPeriod: 7, duration: 1, subjectCode: 'BCS301', subjectName: 'Mathematics for Computer Science', facultyName: 'Dr. Bhagya', room: 'LH-201' },

  // Wednesday
  { id: 'p-w1', day: 'Wednesday', startPeriod: 1, duration: 1, subjectCode: 'BCS303', subjectName: 'Operating Systems', facultyName: 'Ashwini', room: 'LH-201' },
  { id: 'p-w2', day: 'Wednesday', startPeriod: 2, duration: 1, subjectCode: 'BCS306A', subjectName: 'Object Oriented Programming with Java', facultyName: 'Shabhana', room: 'LH-201' },
  { id: 'p-w3', day: 'Wednesday', startPeriod: 3, duration: 1, subjectCode: 'BCS304', subjectName: 'Data Structures and Applications', facultyName: 'Shalaka', room: 'LH-201' },
  { id: 'p-w4', day: 'Wednesday', startPeriod: 4, duration: 1, subjectCode: 'BCS301', subjectName: 'Mathematics for Computer Science', facultyName: 'Dr. Bhagya', room: 'LH-201' },
  { id: 'p-w5', day: 'Wednesday', startPeriod: 5, duration: 1, subjectCode: 'BCS302', subjectName: 'Digital Design & Computer Organization', facultyName: 'Balachandra', room: 'LH-201' },
  { id: 'p-w6', day: 'Wednesday', startPeriod: 6, duration: 2, subjectCode: 'BCSL305/BCS302', subjectName: 'DS/DDCO LAB', facultyName: 'Shalaka, Balachandra', room: 'AI Lab 1' },

  // Thursday
  { id: 'p-th1', day: 'Thursday', startPeriod: 1, duration: 1, subjectCode: 'BCS301', subjectName: 'Mathematics for Computer Science', facultyName: 'Dr. Bhagya', room: 'LH-201' },
  { id: 'p-th2', day: 'Thursday', startPeriod: 2, duration: 1, subjectCode: 'BCS303', subjectName: 'Operating Systems', facultyName: 'Ashwini', room: 'LH-201' },
  { id: 'p-th3', day: 'Thursday', startPeriod: 3, duration: 1, subjectCode: 'BCS302', subjectName: 'Digital Design & Computer Organization', facultyName: 'Balachandra', room: 'LH-201' },
  { id: 'p-th4', day: 'Thursday', startPeriod: 4, duration: 1, subjectCode: 'BCS306A', subjectName: 'Object Oriented Programming with Java', facultyName: 'Shabhana', room: 'LH-201' },
  { id: 'p-th5', day: 'Thursday', startPeriod: 5, duration: 1, subjectCode: 'BCS304', subjectName: 'Data Structures and Applications', facultyName: 'Shalaka', room: 'LH-201' },
  { id: 'p-th6', day: 'Thursday', startPeriod: 6, duration: 2, subjectCode: 'BCS306A/BCSL305', subjectName: 'OOPS/DS LAB', facultyName: 'Shabhana, Shalaka', room: 'AI Lab 2' },

  // Friday
  { id: 'p-f1', day: 'Friday', startPeriod: 1, duration: 2, subjectCode: 'BCS303', subjectName: 'OS LAB', facultyName: 'Ashwini', room: 'Systems Lab' },
  { id: 'p-f3', day: 'Friday', startPeriod: 3, duration: 2, subjectCode: 'TECH-TRN', subjectName: 'Technical Training', facultyName: 'Placement Officer', room: 'Auditorium' },
  { id: 'p-f5', day: 'Friday', startPeriod: 5, duration: 1, subjectCode: 'BCS301', subjectName: 'Mathematics for Computer Science', facultyName: 'Dr. Bhagya', room: 'LH-201' },
  { id: 'p-f6', day: 'Friday', startPeriod: 6, duration: 1, subjectCode: 'BSCK307', subjectName: 'Social Connect and Responsibility', facultyName: 'Sarvesh', room: 'LH-201' },
  { id: 'p-f7', day: 'Friday', startPeriod: 7, duration: 1, subjectCode: 'BNSK359', subjectName: 'National Service Scheme (NSS)', facultyName: 'Ranjan', room: 'Campus Grounds' },

  // Saturday
  { id: 'p-s1', day: 'Saturday', startPeriod: 1, duration: 2, subjectCode: 'VAC', subjectName: 'Value Added Course', facultyName: 'Dean Academic', room: 'Seminar Hall' },
  { id: 'p-s3', day: 'Saturday', startPeriod: 3, duration: 2, subjectCode: 'VAC', subjectName: 'Value Added Course', facultyName: 'Dean Academic', room: 'Seminar Hall' },
  { id: 'p-s5', day: 'Saturday', startPeriod: 5, duration: 1, subjectCode: 'MMM', subjectName: 'Faculty Mentorship', facultyName: 'Faculty Mentor', room: 'LH-201' },
];

export const INITIAL_DEAN_TIMETABLES: Record<string, DeanSectionTimetable> = {
  '2026–2027_Second Year_Odd Semester_DS_Section A': {
    academicYear: '2026–2027',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
    department: 'DS',
    section: 'Section A',
    placements: INITIAL_DS_3A_PLACEMENTS,
    isLocked: false,
  },
};

export const DEAN_LOCKED_FIRST_YEAR_SLOTS: BasicSciencePlacement[] = [
  {
    id: 'dean-inst-uhv',
    day: 'Monday',
    startPeriod: 1,
    duration: 2,
    subjectCode: 'UHV101',
    subjectName: 'First Year Induction & Universal Human Values',
    facultyName: 'Basic Science Faculty Team',
    room: 'Aryabhata Seminar Hall',
    isDeanLocked: true,
    lockedReason: 'Institutional AICTE Induction slot locked by Dean (Academic Affairs)',
  },
  {
    id: 'dean-inst-vac-1',
    day: 'Saturday',
    startPeriod: 1,
    duration: 2,
    subjectCode: 'VAC',
    subjectName: 'Value Added Course',
    facultyName: 'Dean Academic / Expert',
    room: 'Seminar Hall',
    isDeanLocked: true,
    lockedReason: 'Institutional Value Added Course locked by Dean',
  },
  {
    id: 'dean-inst-vac-2',
    day: 'Saturday',
    startPeriod: 3,
    duration: 2,
    subjectCode: 'VAC',
    subjectName: 'Value Added Course',
    facultyName: 'Dean Academic / Expert',
    room: 'Seminar Hall',
    isDeanLocked: true,
    lockedReason: 'Institutional Value Added Course locked by Dean',
  },
  {
    id: 'dean-inst-tech-trn',
    day: 'Friday',
    startPeriod: 5,
    duration: 2,
    subjectCode: 'TECH-TRN',
    subjectName: 'Technical Orientation & Soft Skills',
    facultyName: 'Placement Officer',
    room: 'Main Auditorium',
    isDeanLocked: true,
    lockedReason: 'Institutional Technical Orientation locked by Dean',
  },
];

export const INITIAL_PHYSICS_SUBJECTS: BasicScienceSubject[] = [
  {
    id: 'bs-phy-1',
    cycle: 'Physics',
    name: 'Engineering Physics',
    code: '22PHY12',
    type: 'Theory',
    numFaculty: 1,
    facultyNames: ['Dr. Ravindra'],
  },
  {
    id: 'bs-phy-2',
    cycle: 'Physics',
    name: 'Calculus & Linear Algebra',
    code: '22MAT11',
    type: 'Theory',
    numFaculty: 1,
    facultyNames: ['Dr. Subrahmanya'],
  },
  {
    id: 'bs-phy-3',
    cycle: 'Physics',
    name: 'Basic Electronics & Communication Engg',
    code: '22ESC143',
    type: 'Theory',
    numFaculty: 1,
    facultyNames: ['Prof. Karthik'],
  },
  {
    id: 'bs-phy-4',
    cycle: 'Physics',
    name: 'Elements of Mechanical Engineering',
    code: '22ESC144',
    type: 'Theory',
    numFaculty: 1,
    facultyNames: ['Prof. Manoj T'],
  },
  {
    id: 'bs-phy-5',
    cycle: 'Physics',
    name: 'Engineering Physics Laboratory',
    code: '22PHYL16',
    type: 'Practical',
    numFaculty: 2,
    facultyNames: ['Dr. Ravindra', 'Prof. Raghavendra'],
  },
  {
    id: 'bs-phy-6',
    cycle: 'Physics',
    name: 'Basic Electronics Workshop',
    code: '22ESCL147',
    type: 'Practical',
    numFaculty: 2,
    facultyNames: ['Prof. Karthik', 'Prof. Sandesh'],
  },
  {
    id: 'bs-phy-7',
    cycle: 'Physics',
    name: 'Communicative English',
    code: '22ENG155',
    type: 'Theory',
    numFaculty: 1,
    facultyNames: ['Prof. Anand V'],
  },
];

export const INITIAL_CHEMISTRY_SUBJECTS: BasicScienceSubject[] = [
  {
    id: 'bs-chem-1',
    cycle: 'Chemistry',
    name: 'Engineering Chemistry',
    code: '22CHE12',
    type: 'Theory',
    numFaculty: 1,
    facultyNames: ['Dr. K. K. Srinivasan'],
  },
  {
    id: 'bs-chem-2',
    cycle: 'Chemistry',
    name: 'Calculus & Linear Algebra',
    code: '22MAT11',
    type: 'Theory',
    numFaculty: 1,
    facultyNames: ['Prof. Divya'],
  },
  {
    id: 'bs-chem-3',
    cycle: 'Chemistry',
    name: 'Basic Electrical Engineering',
    code: '22ELE13',
    type: 'Theory',
    numFaculty: 1,
    facultyNames: ['Prof. Sandesh'],
  },
  {
    id: 'bs-chem-4',
    cycle: 'Chemistry',
    name: 'Problem Solving through C Programming',
    code: '22POP14',
    type: 'Integrated',
    numFaculty: 2,
    facultyNames: ['Prof. Sneha Kamath', 'Prof. Rajesh Shetty'],
  },
  {
    id: 'bs-chem-5',
    cycle: 'Chemistry',
    name: 'Engineering Chemistry Laboratory',
    code: '22CHEL16',
    type: 'Practical',
    numFaculty: 2,
    facultyNames: ['Dr. K. K. Srinivasan', 'Prof. Sumana'],
  },
  {
    id: 'bs-chem-6',
    cycle: 'Chemistry',
    name: 'Computer Programming Laboratory',
    code: '22POPL17',
    type: 'Practical',
    numFaculty: 2,
    facultyNames: ['Prof. Sneha Kamath', 'Prof. Rajesh Shetty'],
  },
  {
    id: 'bs-chem-7',
    cycle: 'Chemistry',
    name: 'Professional Writing Skills in English',
    code: '22ENG156',
    type: 'Theory',
    numFaculty: 1,
    facultyNames: ['Prof. Anand V'],
  },
];

export const INITIAL_PHYSICS_SEC_A_PLACEMENTS: BasicSciencePlacement[] = [
  ...DEAN_LOCKED_FIRST_YEAR_SLOTS,
  // Monday
  { id: 'phy-m3', day: 'Monday', startPeriod: 3, duration: 1, subjectCode: '22PHY12', subjectName: 'Engineering Physics', facultyName: 'Dr. Ravindra', room: 'AB-101' },
  { id: 'phy-m4', day: 'Monday', startPeriod: 4, duration: 1, subjectCode: '22MAT11', subjectName: 'Calculus & Linear Algebra', facultyName: 'Dr. Subrahmanya', room: 'AB-101' },
  { id: 'phy-m5', day: 'Monday', startPeriod: 5, duration: 1, subjectCode: '22ESC143', subjectName: 'Basic Electronics & Comm Engg', facultyName: 'Prof. Karthik', room: 'AB-101' },
  { id: 'phy-m6', day: 'Monday', startPeriod: 6, duration: 2, subjectCode: '22PHYL16', subjectName: 'Engineering Physics Lab (Batch 1)', facultyName: 'Dr. Ravindra, Prof. Raghavendra', room: 'Physics Lab 1' },

  // Tuesday
  { id: 'phy-t1', day: 'Tuesday', startPeriod: 1, duration: 1, subjectCode: '22MAT11', subjectName: 'Calculus & Linear Algebra', facultyName: 'Dr. Subrahmanya', room: 'AB-101' },
  { id: 'phy-t2', day: 'Tuesday', startPeriod: 2, duration: 1, subjectCode: '22PHY12', subjectName: 'Engineering Physics', facultyName: 'Dr. Ravindra', room: 'AB-101' },
  { id: 'phy-t3', day: 'Tuesday', startPeriod: 3, duration: 1, subjectCode: '22ESC144', subjectName: 'Elements of Mechanical Engg', facultyName: 'Prof. Manoj T', room: 'AB-101' },
  { id: 'phy-t4', day: 'Tuesday', startPeriod: 4, duration: 1, subjectCode: '22ENG155', subjectName: 'Communicative English', facultyName: 'Prof. Anand V', room: 'AB-101' },
  { id: 'phy-t6', day: 'Tuesday', startPeriod: 6, duration: 2, subjectCode: '22ESCL147', subjectName: 'Basic Electronics Workshop', facultyName: 'Prof. Karthik, Prof. Sandesh', room: 'Electronics Lab' },

  // Wednesday
  { id: 'phy-w1', day: 'Wednesday', startPeriod: 1, duration: 1, subjectCode: '22ESC143', subjectName: 'Basic Electronics & Comm Engg', facultyName: 'Prof. Karthik', room: 'AB-101' },
  { id: 'phy-w2', day: 'Wednesday', startPeriod: 2, duration: 1, subjectCode: '22MAT11', subjectName: 'Calculus & Linear Algebra', facultyName: 'Dr. Subrahmanya', room: 'AB-101' },
  { id: 'phy-w3', day: 'Wednesday', startPeriod: 3, duration: 1, subjectCode: '22PHY12', subjectName: 'Engineering Physics', facultyName: 'Dr. Ravindra', room: 'AB-101' },
  { id: 'phy-w4', day: 'Wednesday', startPeriod: 4, duration: 1, subjectCode: '22ESC144', subjectName: 'Elements of Mechanical Engg', facultyName: 'Prof. Manoj T', room: 'AB-101' },
  { id: 'phy-w5', day: 'Wednesday', startPeriod: 5, duration: 1, subjectCode: '22ENG155', subjectName: 'Communicative English', facultyName: 'Prof. Anand V', room: 'AB-101' },

  // Thursday
  { id: 'phy-th1', day: 'Thursday', startPeriod: 1, duration: 1, subjectCode: '22MAT11', subjectName: 'Calculus & Linear Algebra', facultyName: 'Dr. Subrahmanya', room: 'AB-101' },
  { id: 'phy-th2', day: 'Thursday', startPeriod: 2, duration: 1, subjectCode: '22ESC144', subjectName: 'Elements of Mechanical Engg', facultyName: 'Prof. Manoj T', room: 'AB-101' },
  { id: 'phy-th3', day: 'Thursday', startPeriod: 3, duration: 1, subjectCode: '22ESC143', subjectName: 'Basic Electronics & Comm Engg', facultyName: 'Prof. Karthik', room: 'AB-101' },
  { id: 'phy-th4', day: 'Thursday', startPeriod: 4, duration: 1, subjectCode: '22PHY12', subjectName: 'Engineering Physics', facultyName: 'Dr. Ravindra', room: 'AB-101' },
  { id: 'phy-th6', day: 'Thursday', startPeriod: 6, duration: 2, subjectCode: '22PHYL16', subjectName: 'Engineering Physics Lab (Batch 2)', facultyName: 'Dr. Ravindra, Prof. Raghavendra', room: 'Physics Lab 1' },

  // Friday
  { id: 'phy-f1', day: 'Friday', startPeriod: 1, duration: 1, subjectCode: '22PHY12', subjectName: 'Engineering Physics', facultyName: 'Dr. Ravindra', room: 'AB-101' },
  { id: 'phy-f2', day: 'Friday', startPeriod: 2, duration: 1, subjectCode: '22MAT11', subjectName: 'Calculus & Linear Algebra', facultyName: 'Dr. Subrahmanya', room: 'AB-101' },
  { id: 'phy-f3', day: 'Friday', startPeriod: 3, duration: 1, subjectCode: '22ESC143', subjectName: 'Basic Electronics & Comm Engg', facultyName: 'Prof. Karthik', room: 'AB-101' },
  { id: 'phy-f4', day: 'Friday', startPeriod: 4, duration: 1, subjectCode: '22ESC144', subjectName: 'Elements of Mechanical Engg', facultyName: 'Prof. Manoj T', room: 'AB-101' },
];

export const INITIAL_CHEMISTRY_SEC_C_PLACEMENTS: BasicSciencePlacement[] = [
  ...DEAN_LOCKED_FIRST_YEAR_SLOTS,
  // Monday
  { id: 'ch-m3', day: 'Monday', startPeriod: 3, duration: 1, subjectCode: '22CHE12', subjectName: 'Engineering Chemistry', facultyName: 'Dr. K. K. Srinivasan', room: 'AB-103' },
  { id: 'ch-m4', day: 'Monday', startPeriod: 4, duration: 1, subjectCode: '22MAT11', subjectName: 'Calculus & Linear Algebra', facultyName: 'Prof. Divya', room: 'AB-103' },
  { id: 'ch-m5', day: 'Monday', startPeriod: 5, duration: 1, subjectCode: '22ELE13', subjectName: 'Basic Electrical Engineering', facultyName: 'Prof. Sandesh', room: 'AB-103' },
  { id: 'ch-m6', day: 'Monday', startPeriod: 6, duration: 2, subjectCode: '22CHEL16', subjectName: 'Engineering Chemistry Lab (Batch 1)', facultyName: 'Dr. K. K. Srinivasan, Prof. Sumana', room: 'Chemistry Lab' },

  // Tuesday
  { id: 'ch-t1', day: 'Tuesday', startPeriod: 1, duration: 1, subjectCode: '22POP14', subjectName: 'Problem Solving through C Programming', facultyName: 'Prof. Sneha Kamath', room: 'AB-103' },
  { id: 'ch-t2', day: 'Tuesday', startPeriod: 2, duration: 1, subjectCode: '22MAT11', subjectName: 'Calculus & Linear Algebra', facultyName: 'Prof. Divya', room: 'AB-103' },
  { id: 'ch-t3', day: 'Tuesday', startPeriod: 3, duration: 1, subjectCode: '22CHE12', subjectName: 'Engineering Chemistry', facultyName: 'Dr. K. K. Srinivasan', room: 'AB-103' },
  { id: 'ch-t4', day: 'Tuesday', startPeriod: 4, duration: 1, subjectCode: '22ELE13', subjectName: 'Basic Electrical Engineering', facultyName: 'Prof. Sandesh', room: 'AB-103' },
  { id: 'ch-t6', day: 'Tuesday', startPeriod: 6, duration: 2, subjectCode: '22POPL17', subjectName: 'Computer Programming Lab (Batch 1)', facultyName: 'Prof. Sneha Kamath, Prof. Rajesh Shetty', room: 'Computing Center 1' },

  // Wednesday
  { id: 'ch-w1', day: 'Wednesday', startPeriod: 1, duration: 1, subjectCode: '22MAT11', subjectName: 'Calculus & Linear Algebra', facultyName: 'Prof. Divya', room: 'AB-103' },
  { id: 'ch-w2', day: 'Wednesday', startPeriod: 2, duration: 1, subjectCode: '22CHE12', subjectName: 'Engineering Chemistry', facultyName: 'Dr. K. K. Srinivasan', room: 'AB-103' },
  { id: 'ch-w3', day: 'Wednesday', startPeriod: 3, duration: 1, subjectCode: '22POP14', subjectName: 'Problem Solving through C Programming', facultyName: 'Prof. Sneha Kamath', room: 'AB-103' },
  { id: 'ch-w4', day: 'Wednesday', startPeriod: 4, duration: 1, subjectCode: '22ENG156', subjectName: 'Prof Writing Skills in English', facultyName: 'Prof. Anand V', room: 'AB-103' },
  { id: 'ch-w5', day: 'Wednesday', startPeriod: 5, duration: 1, subjectCode: '22ELE13', subjectName: 'Basic Electrical Engineering', facultyName: 'Prof. Sandesh', room: 'AB-103' },

  // Thursday
  { id: 'ch-th1', day: 'Thursday', startPeriod: 1, duration: 1, subjectCode: '22CHE12', subjectName: 'Engineering Chemistry', facultyName: 'Dr. K. K. Srinivasan', room: 'AB-103' },
  { id: 'ch-th2', day: 'Thursday', startPeriod: 2, duration: 1, subjectCode: '22MAT11', subjectName: 'Calculus & Linear Algebra', facultyName: 'Prof. Divya', room: 'AB-103' },
  { id: 'ch-th3', day: 'Thursday', startPeriod: 3, duration: 1, subjectCode: '22ELE13', subjectName: 'Basic Electrical Engineering', facultyName: 'Prof. Sandesh', room: 'AB-103' },
  { id: 'ch-th4', day: 'Thursday', startPeriod: 4, duration: 1, subjectCode: '22POP14', subjectName: 'Problem Solving through C Programming', facultyName: 'Prof. Sneha Kamath', room: 'AB-103' },
  { id: 'ch-th6', day: 'Thursday', startPeriod: 6, duration: 2, subjectCode: '22CHEL16', subjectName: 'Engineering Chemistry Lab (Batch 2)', facultyName: 'Dr. K. K. Srinivasan, Prof. Sumana', room: 'Chemistry Lab' },

  // Friday
  { id: 'ch-f1', day: 'Friday', startPeriod: 1, duration: 1, subjectCode: '22POP14', subjectName: 'Problem Solving through C Programming', facultyName: 'Prof. Sneha Kamath', room: 'AB-103' },
  { id: 'ch-f2', day: 'Friday', startPeriod: 2, duration: 1, subjectCode: '22CHE12', subjectName: 'Engineering Chemistry', facultyName: 'Dr. K. K. Srinivasan', room: 'AB-103' },
  { id: 'ch-f3', day: 'Friday', startPeriod: 3, duration: 1, subjectCode: '22MAT11', subjectName: 'Calculus & Linear Algebra', facultyName: 'Prof. Divya', room: 'AB-103' },
  { id: 'ch-f4', day: 'Friday', startPeriod: 4, duration: 1, subjectCode: '22ENG156', subjectName: 'Prof Writing Skills in English', facultyName: 'Prof. Anand V', room: 'AB-103' },
];

export const INITIAL_CYCLE_TIMETABLES: Record<string, CycleSectionTimetable> = {
  'Physics_2026–2027_Odd Semester_Section A': {
    cycle: 'Physics',
    academicYear: '2026–2027',
    studentYear: 'First Year',
    semester: 'Odd Semester',
    section: 'Section A',
    placements: INITIAL_PHYSICS_SEC_A_PLACEMENTS,
    isLocked: false,
  },
  'Chemistry_2026–2027_Odd Semester_Section C': {
    cycle: 'Chemistry',
    academicYear: '2026–2027',
    studentYear: 'First Year',
    semester: 'Odd Semester',
    section: 'Section C',
    placements: INITIAL_CHEMISTRY_SEC_C_PLACEMENTS,
    isLocked: false,
  },
};

// =====================================================================
// DEPARTMENT COORDINATOR MODULE SPECIFICATION TYPES AND INITIAL STATE
// =====================================================================

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

export const INITIAL_DEPT_FACULTY: DepartmentFaculty[] = [
  {
    id: 'dept-fac-1',
    name: 'Dr. Vasudeva',
    empId: 'FAC101',
    email: 'vasudeva.hod@smvitm.ac.in',
    department: 'Artificial Intelligence & Data Science',
    designation: 'Professor',
    hasLoginAccess: true,
    accountStatus: 'Active',
    eligibleYears: ['Second Year', 'Third Year', 'Fourth Year'],
    normHours: 14,
    minHours: 12,
    maxHours: 16,
    theoryHours: 6,
    labHours: 4,
    basicScienceHours: 0,
    additionalDuties: [
      { role: 'HOD Responsibilities', hours: 4 },
      { role: 'Dept Academic Advisory', hours: 1 },
    ],
    preferences: [
      { id: 'pref-v1', priority: 1, subjectCode: '21AI51', subjectTitle: 'Management & Entrepreneurship' },
      { id: 'pref-v2', priority: 2, subjectCode: '21AI71', subjectTitle: 'Big Data Analytics' },
      { id: 'pref-v3', priority: 3, subjectCode: '21AI33', subjectTitle: 'Discrete Mathematical Structures' },
    ],
    finalizedPreferences: [
      { priority: 1, subjectCode: '21AI51', subjectTitle: 'Management & Entrepreneurship', approvedBy: 'Prof. Rajesh Shetty', approvedAt: '2026-11-02', matchType: 'Preference Match' },
      { priority: 2, subjectCode: '21AIL58', subjectTitle: 'AI & ML Laboratory', approvedBy: 'Prof. Rajesh Shetty', approvedAt: '2026-11-02', matchType: 'Administrative Allocation' },
    ],
    assignedCourses: ['21AI51 - Management & Entrepreneurship', '21AIL58 - AI & ML Lab'],
  },
  {
    id: 'dept-fac-2',
    name: 'Dr. Ananya Rao',
    empId: 'FAC102',
    email: 'ananya.rao@smvitm.ac.in',
    department: 'Artificial Intelligence & Data Science',
    designation: 'Associate Professor',
    hasLoginAccess: true,
    accountStatus: 'Active',
    eligibleYears: ['Second Year', 'Third Year'],
    normHours: 16,
    minHours: 14,
    maxHours: 18,
    theoryHours: 8,
    labHours: 4,
    basicScienceHours: 0,
    additionalDuties: [
      { role: 'NBA Criterion Head', hours: 2 },
      { role: 'Student Counsellor', hours: 1 },
    ],
    preferences: [
      { id: 'pref-ar1', priority: 1, subjectCode: '21AI32', subjectTitle: 'Data Structures & Applications', justification: 'Core domain expertise and previous 3 semesters teaching DSA.' },
      { id: 'pref-ar2', priority: 2, subjectCode: '21AI52', subjectTitle: 'Computer Networks' },
      { id: 'pref-ar3', priority: 3, subjectCode: '21AI72', subjectTitle: 'Reinforcement Learning' },
    ],
    finalizedPreferences: [
      { priority: 1, subjectCode: '21AI32', subjectTitle: 'Data Structures & Applications', approvedBy: 'Dr. Vasudeva', approvedAt: '2026-11-01', matchType: 'Preference Match' },
      { priority: 2, subjectCode: '21AIL37', subjectTitle: 'Data Structures Laboratory', approvedBy: 'Dr. Vasudeva', approvedAt: '2026-11-01', matchType: 'Preference Match' },
    ],
    assignedCourses: ['21AI32 - Data Structures & Applications', '21AIL37 - DSA Laboratory'],
  },
  {
    id: 'dept-fac-3',
    name: 'Prof. Rajesh Shetty',
    empId: 'FAC103',
    email: 'rajesh.shetty@smvitm.ac.in',
    department: 'Artificial Intelligence & Data Science',
    designation: 'Assistant Professor (Sr)',
    hasLoginAccess: true,
    accountStatus: 'Active',
    eligibleYears: ['Second Year', 'Third Year', 'Fourth Year'],
    normHours: 18,
    minHours: 16,
    maxHours: 20,
    theoryHours: 8,
    labHours: 4,
    basicScienceHours: 2, // Basic Science C-Programming Lab
    additionalDuties: [
      { role: 'Dept Timetable Coordinator', hours: 3 },
      { role: 'Institutional ERP Cell', hours: 1 },
    ],
    preferences: [
      { id: 'pref-rs1', priority: 1, subjectCode: '21AI33', subjectTitle: 'Discrete Mathematical Structures' },
      { id: 'pref-rs2', priority: 2, subjectCode: '21AI53', subjectTitle: 'Deep Learning Architectures' },
      { id: 'pref-rs3', priority: 3, subjectCode: '21AI731', subjectTitle: 'Computer Vision' },
    ],
    finalizedPreferences: [
      { priority: 1, subjectCode: '21AI33', subjectTitle: 'Discrete Mathematical Structures', approvedBy: 'Dr. Vasudeva', approvedAt: '2026-11-01', matchType: 'Preference Match' },
      { priority: 2, subjectCode: '21AI53', subjectTitle: 'Deep Learning Architectures', approvedBy: 'Dr. Vasudeva', approvedAt: '2026-11-01', matchType: 'Preference Match' },
    ],
    assignedCourses: ['21AI33 - Discrete Mathematical Structures', '21AI53 - Deep Learning Architectures', '22POPL17 - Basic Science C-Lab'],
  },
  {
    id: 'dept-fac-4',
    name: 'Prof. Sneha Kamath',
    empId: 'FAC104',
    email: 'sneha.kamath@smvitm.ac.in',
    department: 'Artificial Intelligence & Data Science',
    designation: 'Assistant Professor',
    hasLoginAccess: true,
    accountStatus: 'Active',
    eligibleYears: ['Second Year', 'Third Year'],
    normHours: 18,
    minHours: 16,
    maxHours: 20,
    theoryHours: 8,
    labHours: 4,
    basicScienceHours: 4, // 22POP14 Theory & Lab in Chem Cycle
    additionalDuties: [
      { role: 'Cultural Committee Member', hours: 1 },
      { role: 'Class Advisor 3A', hours: 1 },
    ],
    preferences: [
      { id: 'pref-sk1', priority: 1, subjectCode: '21AI34', subjectTitle: 'Object Oriented Programming with Java' },
      { id: 'pref-sk2', priority: 2, subjectCode: '21AI54', subjectTitle: 'Natural Language Processing' },
      { id: 'pref-sk3', priority: 3, subjectCode: '21AI32', subjectTitle: 'Data Structures & Applications' },
    ],
    finalizedPreferences: [
      { priority: 1, subjectCode: '21AI34', subjectTitle: 'Object Oriented Programming with Java', approvedBy: 'Prof. Rajesh Shetty', approvedAt: '2026-11-02', matchType: 'Preference Match' },
      { priority: 2, subjectCode: '21AIL38', subjectTitle: 'Java Programming Laboratory', approvedBy: 'Prof. Rajesh Shetty', approvedAt: '2026-11-02', matchType: 'Preference Match' },
    ],
    assignedCourses: ['21AI34 - OOP with Java', '21AIL38 - Java Lab', '22POP14 - C Programming (Basic Science)'],
  },
  {
    id: 'dept-fac-5',
    name: 'Prof. Sandeep Kumar',
    empId: 'FAC105',
    email: 'sandeep.kumar@smvitm.ac.in',
    department: 'Artificial Intelligence & Data Science',
    designation: 'Assistant Professor',
    hasLoginAccess: true,
    accountStatus: 'Active',
    eligibleYears: ['Third Year', 'Fourth Year'],
    normHours: 18,
    minHours: 16,
    maxHours: 20,
    theoryHours: 10,
    labHours: 6,
    basicScienceHours: 0,
    additionalDuties: [
      { role: 'AI Computing Lab In-charge', hours: 2 },
    ],
    preferences: [
      { id: 'pref-snd1', priority: 1, subjectCode: '21AI54', subjectTitle: 'Natural Language Processing' },
      { id: 'pref-snd2', priority: 2, subjectCode: '21AI742', subjectTitle: 'MLOps & Production Engineering' },
      { id: 'pref-snd3', priority: 3, subjectCode: '21AI53', subjectTitle: 'Deep Learning Architectures' },
    ],
    finalizedPreferences: [
      { priority: 1, subjectCode: '21AI54', subjectTitle: 'Natural Language Processing', approvedBy: 'Prof. Rajesh Shetty', approvedAt: '2026-11-03', matchType: 'Preference Match' },
      { priority: 2, subjectCode: '21AIL57', subjectTitle: 'NLP Laboratory', approvedBy: 'Prof. Rajesh Shetty', approvedAt: '2026-11-03', matchType: 'Preference Match' },
    ],
    assignedCourses: ['21AI54 - NLP', '21AIL57 - NLP Lab'],
  },
  {
    id: 'dept-fac-6',
    name: 'Prof. Priyanka Nayak',
    empId: 'FAC106',
    email: 'priyanka.nayak@smvitm.ac.in',
    department: 'Artificial Intelligence & Data Science',
    designation: 'Assistant Professor',
    hasLoginAccess: true,
    accountStatus: 'Active',
    eligibleYears: ['Second Year', 'Fourth Year'],
    normHours: 18,
    minHours: 16,
    maxHours: 20,
    theoryHours: 8,
    labHours: 6,
    basicScienceHours: 0,
    additionalDuties: [
      { role: 'Student Proctoring', hours: 1 },
      { role: 'Library Committee', hours: 1 },
    ],
    preferences: [
      { id: 'pref-pn1', priority: 1, subjectCode: '21AI71', subjectTitle: 'Big Data Analytics' },
      { id: 'pref-pn2', priority: 2, subjectCode: '21AI34', subjectTitle: 'Object Oriented Programming with Java' },
      { id: 'pref-pn3', priority: 3, subjectCode: '21AI52', subjectTitle: 'Computer Networks' },
    ],
    finalizedPreferences: [
      { priority: 1, subjectCode: '21AI71', subjectTitle: 'Big Data Analytics', approvedBy: 'Prof. Rajesh Shetty', approvedAt: '2026-11-02', matchType: 'Preference Match' },
    ],
    assignedCourses: ['21AI71 - Big Data Analytics'],
  },
  {
    id: 'dept-fac-7',
    name: 'Prof. Vignesh Pai',
    empId: 'FAC107',
    email: 'vignesh.pai@smvitm.ac.in',
    department: 'Artificial Intelligence & Data Science',
    designation: 'Assistant Professor',
    hasLoginAccess: true,
    accountStatus: 'Active',
    eligibleYears: ['Second Year', 'Third Year'],
    normHours: 18,
    minHours: 16,
    maxHours: 20,
    theoryHours: 8,
    labHours: 6,
    basicScienceHours: 0,
    additionalDuties: [
      { role: 'Department Website In-charge', hours: 1 },
    ],
    preferences: [
      { id: 'pref-vp1', priority: 1, subjectCode: '21AI52', subjectTitle: 'Computer Networks' },
      { id: 'pref-vp2', priority: 2, subjectCode: '21AI32', subjectTitle: 'Data Structures & Applications' },
      { id: 'pref-vp3', priority: 3, subjectCode: '21AI742', subjectTitle: 'MLOps & Production Engineering' },
    ],
    finalizedPreferences: [
      { priority: 1, subjectCode: '21AI52', subjectTitle: 'Computer Networks', approvedBy: 'Prof. Rajesh Shetty', approvedAt: '2026-11-03', matchType: 'Preference Match' },
    ],
    assignedCourses: ['21AI52 - Computer Networks'],
  },
  {
    id: 'dept-fac-8',
    name: 'Dr. Chethan Acharya',
    empId: 'FAC108',
    email: 'chethan.acharya@smvitm.ac.in',
    department: 'Artificial Intelligence & Data Science',
    designation: 'Associate Professor',
    hasLoginAccess: true,
    accountStatus: 'Active',
    eligibleYears: ['Third Year', 'Fourth Year'],
    normHours: 16,
    minHours: 14,
    maxHours: 18,
    theoryHours: 8,
    labHours: 4,
    basicScienceHours: 0,
    additionalDuties: [
      { role: 'R&D Cell Coordinator', hours: 2 },
      { role: 'IPR & Patent Cell', hours: 1 },
    ],
    preferences: [
      { id: 'pref-ca1', priority: 1, subjectCode: '21AI72', subjectTitle: 'Reinforcement Learning & Autonomous Agents' },
      { id: 'pref-ca2', priority: 2, subjectCode: '21AI731', subjectTitle: 'Computer Vision' },
      { id: 'pref-ca3', priority: 3, subjectCode: '21AI53', subjectTitle: 'Deep Learning Architectures' },
    ],
    finalizedPreferences: [
      { priority: 1, subjectCode: '21AI72', subjectTitle: 'Reinforcement Learning', approvedBy: 'Dr. Vasudeva', approvedAt: '2026-11-01', matchType: 'Preference Match' },
    ],
    assignedCourses: ['21AI72 - Reinforcement Learning'],
  },
];

export interface DeptSubjectItem {
  id: string;
  courseCode: string;
  courseTitle: string;
  studentYear: 'Second Year' | 'Third Year' | 'Fourth Year';
  semester: 'Odd Semester' | 'Even Semester';
  semNumber: string;
  type: 'Theory' | 'Laboratory' | 'Integrated' | 'Elective' | 'Institutional';
  hoursPerWeek: number;
  venue: string;
  assignedFaculty: string;
  preferenceMatch?: 'Priority 1' | 'Priority 2' | 'Priority 3' | 'Administrative Allocation';
}

export const INITIAL_DEPT_SUBJECTS: DeptSubjectItem[] = [
  // 2nd Year (3rd Sem)
  {
    id: 'dsub-301',
    courseCode: '21AI32',
    courseTitle: 'Data Structures & Applications',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
    semNumber: '3rd Sem',
    type: 'Theory',
    hoursPerWeek: 4,
    venue: 'LH-201',
    assignedFaculty: 'Dr. Ananya Rao',
    preferenceMatch: 'Priority 1',
  },
  {
    id: 'dsub-302',
    courseCode: '21AI33',
    courseTitle: 'Discrete Mathematical Structures',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
    semNumber: '3rd Sem',
    type: 'Theory',
    hoursPerWeek: 4,
    venue: 'LH-201',
    assignedFaculty: 'Prof. Rajesh Shetty',
    preferenceMatch: 'Priority 1',
  },
  {
    id: 'dsub-303',
    courseCode: '21AI34',
    courseTitle: 'Object Oriented Programming with Java',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
    semNumber: '3rd Sem',
    type: 'Theory',
    hoursPerWeek: 4,
    venue: 'LH-201',
    assignedFaculty: 'Prof. Sneha Kamath',
    preferenceMatch: 'Priority 1',
  },
  {
    id: 'dsub-304',
    courseCode: '21AIL37',
    courseTitle: 'Data Structures Laboratory',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
    semNumber: '3rd Sem',
    type: 'Laboratory',
    hoursPerWeek: 3,
    venue: 'AI Computing Lab 1',
    assignedFaculty: 'Dr. Ananya Rao',
    preferenceMatch: 'Priority 1',
  },
  {
    id: 'dsub-305',
    courseCode: '21AIL38',
    courseTitle: 'Java Programming Laboratory',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
    semNumber: '3rd Sem',
    type: 'Laboratory',
    hoursPerWeek: 3,
    venue: 'AI Computing Lab 2',
    assignedFaculty: 'Prof. Sneha Kamath',
    preferenceMatch: 'Priority 1',
  },
  {
    id: 'dsub-306',
    courseCode: '21CIP37',
    courseTitle: 'Constitution of India & Professional Ethics',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
    semNumber: '3rd Sem',
    type: 'Theory',
    hoursPerWeek: 1,
    venue: 'LH-201',
    assignedFaculty: 'Prof. Vignesh Pai',
    preferenceMatch: 'Administrative Allocation',
  },

  // 3rd Year (5th Sem)
  {
    id: 'dsub-501',
    courseCode: '21AI51',
    courseTitle: 'Management & Entrepreneurship for IT Industry',
    studentYear: 'Third Year',
    semester: 'Odd Semester',
    semNumber: '5th Sem',
    type: 'Theory',
    hoursPerWeek: 3,
    venue: 'LH-302',
    assignedFaculty: 'Dr. Vasudeva',
    preferenceMatch: 'Priority 1',
  },
  {
    id: 'dsub-502',
    courseCode: '21AI52',
    courseTitle: 'Computer Networks',
    studentYear: 'Third Year',
    semester: 'Odd Semester',
    semNumber: '5th Sem',
    type: 'Theory',
    hoursPerWeek: 4,
    venue: 'LH-302',
    assignedFaculty: 'Prof. Vignesh Pai',
    preferenceMatch: 'Priority 1',
  },
  {
    id: 'dsub-503',
    courseCode: '21AI53',
    courseTitle: 'Deep Learning Architectures',
    studentYear: 'Third Year',
    semester: 'Odd Semester',
    semNumber: '5th Sem',
    type: 'Theory',
    hoursPerWeek: 4,
    venue: 'LH-302',
    assignedFaculty: 'Prof. Rajesh Shetty',
    preferenceMatch: 'Priority 2',
  },
  {
    id: 'dsub-504',
    courseCode: '21AI54',
    courseTitle: 'Natural Language Processing',
    studentYear: 'Third Year',
    semester: 'Odd Semester',
    semNumber: '5th Sem',
    type: 'Theory',
    hoursPerWeek: 3,
    venue: 'LH-302',
    assignedFaculty: 'Prof. Sandeep Kumar',
    preferenceMatch: 'Priority 1',
  },
  {
    id: 'dsub-505',
    courseCode: '21AIL57',
    courseTitle: 'NLP Laboratory',
    studentYear: 'Third Year',
    semester: 'Odd Semester',
    semNumber: '5th Sem',
    type: 'Laboratory',
    hoursPerWeek: 3,
    venue: 'Advanced AI Lab',
    assignedFaculty: 'Prof. Sandeep Kumar',
    preferenceMatch: 'Priority 1',
  },
  {
    id: 'dsub-506',
    courseCode: '21AIL58',
    courseTitle: 'Deep Learning Laboratory',
    studentYear: 'Third Year',
    semester: 'Odd Semester',
    semNumber: '5th Sem',
    type: 'Laboratory',
    hoursPerWeek: 3,
    venue: 'Advanced AI Lab',
    assignedFaculty: 'Dr. Vasudeva',
    preferenceMatch: 'Administrative Allocation',
  },

  // 4th Year (7th Sem)
  {
    id: 'dsub-701',
    courseCode: '21AI71',
    courseTitle: 'Big Data Analytics',
    studentYear: 'Fourth Year',
    semester: 'Odd Semester',
    semNumber: '7th Sem',
    type: 'Theory',
    hoursPerWeek: 4,
    venue: 'LH-401',
    assignedFaculty: 'Prof. Priyanka Nayak',
    preferenceMatch: 'Priority 1',
  },
  {
    id: 'dsub-702',
    courseCode: '21AI72',
    courseTitle: 'Reinforcement Learning & Autonomous Agents',
    studentYear: 'Fourth Year',
    semester: 'Odd Semester',
    semNumber: '7th Sem',
    type: 'Theory',
    hoursPerWeek: 4,
    venue: 'LH-401',
    assignedFaculty: 'Dr. Chethan Acharya',
    preferenceMatch: 'Priority 1',
  },
  {
    id: 'dsub-703',
    courseCode: '21AI731',
    courseTitle: 'Computer Vision',
    studentYear: 'Fourth Year',
    semester: 'Odd Semester',
    semNumber: '7th Sem',
    type: 'Elective',
    hoursPerWeek: 3,
    venue: 'LH-401',
    assignedFaculty: 'Prof. Rajesh Shetty',
    preferenceMatch: 'Priority 3',
  },
  {
    id: 'dsub-704',
    courseCode: '21AI742',
    courseTitle: 'MLOps & Production Engineering',
    studentYear: 'Fourth Year',
    semester: 'Odd Semester',
    semNumber: '7th Sem',
    type: 'Elective',
    hoursPerWeek: 3,
    venue: 'LH-401',
    assignedFaculty: 'Prof. Sandeep Kumar',
    preferenceMatch: 'Priority 2',
  },
];

export interface DeptPlacement {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  startPeriod: number; // 1 to 7
  duration: number; // 1, 2, or 3 periods
  subjectCode: string;
  subjectTitle: string;
  facultyName: string;
  room: string;
  isLockedSlot?: boolean;
  lockedStage?: 'Institutional (Dean)' | 'Basic Science';
  lockedReason?: string;
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

// Institutional slots locked by Dean that must appear read-only across all department sections
export const DEAN_LOCKED_DEPT_SLOTS: DeptPlacement[] = [
  {
    id: 'dean-dept-open-el',
    day: 'Wednesday',
    startPeriod: 4,
    duration: 2,
    subjectCode: 'OPEN-EL',
    subjectTitle: 'Open Elective Pool (Inter-Dept)',
    facultyName: 'Designated Faculty',
    room: 'Central Academic Block',
    isLockedSlot: true,
    lockedStage: 'Institutional (Dean)',
    lockedReason: 'Institutional Open Elective pool locked by Dean (Academic Affairs)',
  },
  {
    id: 'dean-dept-nss',
    day: 'Thursday',
    startPeriod: 6,
    duration: 2,
    subjectCode: 'NSS-YRC',
    subjectTitle: 'NSS & Community Engagement',
    facultyName: 'Prof. Nagaraj Rao',
    room: 'Campus Grounds',
    isLockedSlot: true,
    lockedStage: 'Institutional (Dean)',
    lockedReason: 'Institutional NSS & Social Service slot locked by Dean',
  },
  {
    id: 'dean-dept-tpo',
    day: 'Friday',
    startPeriod: 5,
    duration: 3,
    subjectCode: 'TPO-TRN',
    subjectTitle: 'Placement & Soft Skills Training',
    facultyName: 'Training & Placement Officer',
    room: 'Main Auditorium',
    isLockedSlot: true,
    lockedStage: 'Institutional (Dean)',
    lockedReason: 'Institutional Placement & Employability Training locked by Dean',
  },
];

export const INITIAL_AIDS_3A_PLACEMENTS: DeptPlacement[] = [
  ...DEAN_LOCKED_DEPT_SLOTS,
  // Monday
  { id: 'dp-m1', day: 'Monday', startPeriod: 1, duration: 1, subjectCode: '21AI32', subjectTitle: 'Data Structures & Applications', facultyName: 'Dr. Ananya Rao', room: 'LH-201' },
  { id: 'dp-m2', day: 'Monday', startPeriod: 2, duration: 1, subjectCode: '21AI33', subjectTitle: 'Discrete Mathematical Structures', facultyName: 'Prof. Rajesh Shetty', room: 'LH-201' },
  { id: 'dp-m3', day: 'Monday', startPeriod: 3, duration: 1, subjectCode: '21AI34', subjectTitle: 'Object Oriented Programming with Java', facultyName: 'Prof. Sneha Kamath', room: 'LH-201' },
  { id: 'dp-m4', day: 'Monday', startPeriod: 4, duration: 1, subjectCode: '21CIP37', subjectTitle: 'Constitution of India', facultyName: 'Prof. Vignesh Pai', room: 'LH-201' },

  // Tuesday
  { id: 'dp-t1', day: 'Tuesday', startPeriod: 1, duration: 1, subjectCode: '21AI33', subjectTitle: 'Discrete Mathematical Structures', facultyName: 'Prof. Rajesh Shetty', room: 'LH-201' },
  { id: 'dp-t2', day: 'Tuesday', startPeriod: 2, duration: 1, subjectCode: '21AI32', subjectTitle: 'Data Structures & Applications', facultyName: 'Dr. Ananya Rao', room: 'LH-201' },
  { id: 'dp-t3', day: 'Tuesday', startPeriod: 3, duration: 1, subjectCode: '21AI34', subjectTitle: 'Object Oriented Programming with Java', facultyName: 'Prof. Sneha Kamath', room: 'LH-201' },
  { id: 'dp-t4', day: 'Tuesday', startPeriod: 4, duration: 1, subjectCode: '21AI32', subjectTitle: 'Data Structures & Applications', facultyName: 'Dr. Ananya Rao', room: 'LH-201' },

  // Wednesday
  { id: 'dp-w1', day: 'Wednesday', startPeriod: 1, duration: 1, subjectCode: '21AI32', subjectTitle: 'Data Structures & Applications', facultyName: 'Dr. Ananya Rao', room: 'LH-201' },
  { id: 'dp-w2', day: 'Wednesday', startPeriod: 2, duration: 1, subjectCode: '21AI34', subjectTitle: 'Object Oriented Programming with Java', facultyName: 'Prof. Sneha Kamath', room: 'LH-201' },
  { id: 'dp-w3', day: 'Wednesday', startPeriod: 3, duration: 1, subjectCode: '21AI33', subjectTitle: 'Discrete Mathematical Structures', facultyName: 'Prof. Rajesh Shetty', room: 'LH-201' },
  { id: 'dp-w6', day: 'Wednesday', startPeriod: 6, duration: 2, subjectCode: '21AIL38', subjectTitle: 'Java Programming Laboratory', facultyName: 'Prof. Sneha Kamath', room: 'AI Computing Lab 2' },

  // Thursday
  { id: 'dp-th1', day: 'Thursday', startPeriod: 1, duration: 2, subjectCode: '21AIL37', subjectTitle: 'Data Structures Laboratory', facultyName: 'Dr. Ananya Rao', room: 'AI Computing Lab 1' },
  { id: 'dp-th3', day: 'Thursday', startPeriod: 3, duration: 1, subjectCode: '21AI34', subjectTitle: 'Object Oriented Programming with Java', facultyName: 'Prof. Sneha Kamath', room: 'LH-201' },
  { id: 'dp-th4', day: 'Thursday', startPeriod: 4, duration: 1, subjectCode: '21AI33', subjectTitle: 'Discrete Mathematical Structures', facultyName: 'Prof. Rajesh Shetty', room: 'LH-201' },

  // Friday
  { id: 'dp-f1', day: 'Friday', startPeriod: 1, duration: 1, subjectCode: '21AI33', subjectTitle: 'Discrete Mathematical Structures', facultyName: 'Prof. Rajesh Shetty', room: 'LH-201' },
  { id: 'dp-f2', day: 'Friday', startPeriod: 2, duration: 1, subjectCode: '21AI32', subjectTitle: 'Data Structures & Applications', facultyName: 'Dr. Ananya Rao', room: 'LH-201' },
  { id: 'dp-f3', day: 'Friday', startPeriod: 3, duration: 1, subjectCode: '21AI34', subjectTitle: 'Object Oriented Programming with Java', facultyName: 'Prof. Sneha Kamath', room: 'LH-201' },
];

export const INITIAL_AIDS_3B_PLACEMENTS: DeptPlacement[] = [
  ...DEAN_LOCKED_DEPT_SLOTS,
  // Monday
  { id: 'dp-3b-m1', day: 'Monday', startPeriod: 1, duration: 1, subjectCode: '21AI33', subjectTitle: 'Discrete Mathematical Structures', facultyName: 'Prof. Rajesh Shetty', room: 'LH-202' },
  { id: 'dp-3b-m2', day: 'Monday', startPeriod: 2, duration: 1, subjectCode: '21AI32', subjectTitle: 'Data Structures & Applications', facultyName: 'Dr. Ananya Rao', room: 'LH-202' },
  { id: 'dp-3b-m3', day: 'Monday', startPeriod: 3, duration: 1, subjectCode: '21CIP37', subjectTitle: 'Constitution of India', facultyName: 'Prof. Vignesh Pai', room: 'LH-202' },
  { id: 'dp-3b-m6', day: 'Monday', startPeriod: 6, duration: 2, subjectCode: '21AIL37', subjectTitle: 'Data Structures Laboratory', facultyName: 'Dr. Ananya Rao', room: 'AI Computing Lab 1' },

  // Tuesday
  { id: 'dp-3b-t1', day: 'Tuesday', startPeriod: 1, duration: 1, subjectCode: '21AI32', subjectTitle: 'Data Structures & Applications', facultyName: 'Dr. Ananya Rao', room: 'LH-202' },
  { id: 'dp-3b-t2', day: 'Tuesday', startPeriod: 2, duration: 1, subjectCode: '21AI33', subjectTitle: 'Discrete Mathematical Structures', facultyName: 'Prof. Rajesh Shetty', room: 'LH-202' },
  { id: 'dp-3b-t3', day: 'Tuesday', startPeriod: 3, duration: 1, subjectCode: '21AI34', subjectTitle: 'Object Oriented Programming with Java', facultyName: 'Prof. Sneha Kamath', room: 'LH-202' },

  // Wednesday
  { id: 'dp-3b-w1', day: 'Wednesday', startPeriod: 1, duration: 1, subjectCode: '21AI34', subjectTitle: 'Object Oriented Programming with Java', facultyName: 'Prof. Sneha Kamath', room: 'LH-202' },
  { id: 'dp-3b-w2', day: 'Wednesday', startPeriod: 2, duration: 1, subjectCode: '21AI33', subjectTitle: 'Discrete Mathematical Structures', facultyName: 'Prof. Rajesh Shetty', room: 'LH-202' },
  { id: 'dp-3b-w3', day: 'Wednesday', startPeriod: 3, duration: 1, subjectCode: '21AI32', subjectTitle: 'Data Structures & Applications', facultyName: 'Dr. Ananya Rao', room: 'LH-202' },

  // Thursday
  { id: 'dp-3b-th1', day: 'Thursday', startPeriod: 1, duration: 1, subjectCode: '21AI34', subjectTitle: 'Object Oriented Programming with Java', facultyName: 'Prof. Sneha Kamath', room: 'LH-202' },
  { id: 'dp-3b-th2', day: 'Thursday', startPeriod: 2, duration: 1, subjectCode: '21AI32', subjectTitle: 'Data Structures & Applications', facultyName: 'Dr. Ananya Rao', room: 'LH-202' },
  { id: 'dp-3b-th3', day: 'Thursday', startPeriod: 3, duration: 2, subjectCode: '21AIL38', subjectTitle: 'Java Programming Laboratory', facultyName: 'Prof. Sneha Kamath', room: 'AI Computing Lab 2' },

  // Friday
  { id: 'dp-3b-f1', day: 'Friday', startPeriod: 1, duration: 1, subjectCode: '21AI32', subjectTitle: 'Data Structures & Applications', facultyName: 'Dr. Ananya Rao', room: 'LH-202' },
  { id: 'dp-3b-f2', day: 'Friday', startPeriod: 2, duration: 1, subjectCode: '21AI33', subjectTitle: 'Discrete Mathematical Structures', facultyName: 'Prof. Rajesh Shetty', room: 'LH-202' },
  { id: 'dp-3b-f3', day: 'Friday', startPeriod: 3, duration: 1, subjectCode: '21AI34', subjectTitle: 'Object Oriented Programming with Java', facultyName: 'Prof. Sneha Kamath', room: 'LH-202' },
];

export const INITIAL_AIDS_5A_PLACEMENTS: DeptPlacement[] = [
  ...DEAN_LOCKED_DEPT_SLOTS,
  // Monday
  { id: 'dp-5a-m1', day: 'Monday', startPeriod: 1, duration: 1, subjectCode: '21AI51', subjectTitle: 'Management & Entrepreneurship', facultyName: 'Dr. Vasudeva', room: 'LH-302' },
  { id: 'dp-5a-m2', day: 'Monday', startPeriod: 2, duration: 1, subjectCode: '21AI52', subjectTitle: 'Computer Networks', facultyName: 'Prof. Vignesh Pai', room: 'LH-302' },
  { id: 'dp-5a-m3', day: 'Monday', startPeriod: 3, duration: 1, subjectCode: '21AI53', subjectTitle: 'Deep Learning Architectures', facultyName: 'Prof. Rajesh Shetty', room: 'LH-302' },

  // Tuesday
  { id: 'dp-5a-t1', day: 'Tuesday', startPeriod: 1, duration: 1, subjectCode: '21AI54', subjectTitle: 'Natural Language Processing', facultyName: 'Prof. Sandeep Kumar', room: 'LH-302' },
  { id: 'dp-5a-t2', day: 'Tuesday', startPeriod: 2, duration: 1, subjectCode: '21AI52', subjectTitle: 'Computer Networks', facultyName: 'Prof. Vignesh Pai', room: 'LH-302' },
  { id: 'dp-5a-t3', day: 'Tuesday', startPeriod: 3, duration: 1, subjectCode: '21AI53', subjectTitle: 'Deep Learning Architectures', facultyName: 'Prof. Rajesh Shetty', room: 'LH-302' },

  // Wednesday
  { id: 'dp-5a-w1', day: 'Wednesday', startPeriod: 1, duration: 1, subjectCode: '21AI51', subjectTitle: 'Management & Entrepreneurship', facultyName: 'Dr. Vasudeva', room: 'LH-302' },
  { id: 'dp-5a-w2', day: 'Wednesday', startPeriod: 2, duration: 1, subjectCode: '21AI54', subjectTitle: 'Natural Language Processing', facultyName: 'Prof. Sandeep Kumar', room: 'LH-302' },

  // Thursday
  { id: 'dp-5a-th1', day: 'Thursday', startPeriod: 1, duration: 2, subjectCode: '21AIL57', subjectTitle: 'NLP Laboratory', facultyName: 'Prof. Sandeep Kumar', room: 'Advanced AI Lab' },
  { id: 'dp-5a-th3', day: 'Thursday', startPeriod: 3, duration: 1, subjectCode: '21AI52', subjectTitle: 'Computer Networks', facultyName: 'Prof. Vignesh Pai', room: 'LH-302' },
  { id: 'dp-5a-th4', day: 'Thursday', startPeriod: 4, duration: 1, subjectCode: '21AI53', subjectTitle: 'Deep Learning Architectures', facultyName: 'Prof. Rajesh Shetty', room: 'LH-302' },

  // Friday
  { id: 'dp-5a-f1', day: 'Friday', startPeriod: 1, duration: 2, subjectCode: '21AIL58', subjectTitle: 'Deep Learning Laboratory', facultyName: 'Dr. Vasudeva', room: 'Advanced AI Lab' },
  { id: 'dp-5a-f3', day: 'Friday', startPeriod: 3, duration: 1, subjectCode: '21AI54', subjectTitle: 'Natural Language Processing', facultyName: 'Prof. Sandeep Kumar', room: 'LH-302' },
];

export const INITIAL_AIDS_7A_PLACEMENTS: DeptPlacement[] = [
  ...DEAN_LOCKED_DEPT_SLOTS,
  // Monday
  { id: 'dp-7a-m1', day: 'Monday', startPeriod: 1, duration: 1, subjectCode: '21AI71', subjectTitle: 'Big Data Analytics', facultyName: 'Prof. Priyanka Nayak', room: 'LH-401' },
  { id: 'dp-7a-m2', day: 'Monday', startPeriod: 2, duration: 1, subjectCode: '21AI72', subjectTitle: 'Reinforcement Learning & Autonomous Agents', facultyName: 'Dr. Chethan Acharya', room: 'LH-401' },
  { id: 'dp-7a-m3', day: 'Monday', startPeriod: 3, duration: 1, subjectCode: '21AI731', subjectTitle: 'Computer Vision', facultyName: 'Prof. Rajesh Shetty', room: 'LH-401' },

  // Tuesday
  { id: 'dp-7a-t1', day: 'Tuesday', startPeriod: 1, duration: 1, subjectCode: '21AI742', subjectTitle: 'MLOps & Production Engineering', facultyName: 'Prof. Sandeep Kumar', room: 'LH-401' },
  { id: 'dp-7a-t2', day: 'Tuesday', startPeriod: 2, duration: 1, subjectCode: '21AI71', subjectTitle: 'Big Data Analytics', facultyName: 'Prof. Priyanka Nayak', room: 'LH-401' },
  { id: 'dp-7a-t3', day: 'Tuesday', startPeriod: 3, duration: 1, subjectCode: '21AI72', subjectTitle: 'Reinforcement Learning', facultyName: 'Dr. Chethan Acharya', room: 'LH-401' },

  // Wednesday
  { id: 'dp-7a-w1', day: 'Wednesday', startPeriod: 1, duration: 1, subjectCode: '21AI731', subjectTitle: 'Computer Vision', facultyName: 'Prof. Rajesh Shetty', room: 'LH-401' },
  { id: 'dp-7a-w2', day: 'Wednesday', startPeriod: 2, duration: 1, subjectCode: '21AI742', subjectTitle: 'MLOps & Production Engineering', facultyName: 'Prof. Sandeep Kumar', room: 'LH-401' },

  // Thursday
  { id: 'dp-7a-th1', day: 'Thursday', startPeriod: 1, duration: 2, subjectCode: '21AIP76', subjectTitle: 'Project Phase-1 Planning', facultyName: 'Dr. Vasudeva', room: 'Project Lab' },
  { id: 'dp-7a-th3', day: 'Thursday', startPeriod: 3, duration: 1, subjectCode: '21AI71', subjectTitle: 'Big Data Analytics', facultyName: 'Prof. Priyanka Nayak', room: 'LH-401' },

  // Friday
  { id: 'dp-7a-f1', day: 'Friday', startPeriod: 1, duration: 1, subjectCode: '21AI72', subjectTitle: 'Reinforcement Learning', facultyName: 'Dr. Chethan Acharya', room: 'LH-401' },
  { id: 'dp-7a-f2', day: 'Friday', startPeriod: 2, duration: 1, subjectCode: '21AI731', subjectTitle: 'Computer Vision', facultyName: 'Prof. Rajesh Shetty', room: 'LH-401' },
];

export const INITIAL_DEPT_SECTION_TIMETABLES: Record<string, DeptSectionTimetable> = {
  '2026–2027_Second Year_Odd Semester_AIDS_Section A': {
    academicYear: '2026–2027',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
    department: 'AIDS',
    section: 'Section A',
    placements: INITIAL_AIDS_3A_PLACEMENTS,
    isDraft: false,
    isPublished: true,
    lastSaved: '2026-11-03 11:15 AM',
    publishedAt: '2026-11-03 04:00 PM',
  },
  '2026–2027_Second Year_Odd Semester_AIDS_Section B': {
    academicYear: '2026–2027',
    studentYear: 'Second Year',
    semester: 'Odd Semester',
    department: 'AIDS',
    section: 'Section B',
    placements: INITIAL_AIDS_3B_PLACEMENTS,
    isDraft: false,
    isPublished: true,
    lastSaved: '2026-11-03 11:45 AM',
    publishedAt: '2026-11-03 04:00 PM',
  },
  '2026–2027_Third Year_Odd Semester_AIDS_Section A': {
    academicYear: '2026–2027',
    studentYear: 'Third Year',
    semester: 'Odd Semester',
    department: 'AIDS',
    section: 'Section A',
    placements: INITIAL_AIDS_5A_PLACEMENTS,
    isDraft: false,
    isPublished: false,
    lastSaved: '2026-11-04 10:30 AM',
  },
  '2026–2027_Fourth Year_Odd Semester_AIDS_Section A': {
    academicYear: '2026–2027',
    studentYear: 'Fourth Year',
    semester: 'Odd Semester',
    department: 'AIDS',
    section: 'Section A',
    placements: INITIAL_AIDS_7A_PLACEMENTS,
    isDraft: true,
    isPublished: false,
    lastSaved: '2026-11-04 03:15 PM',
  },
};

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

export const INITIAL_SECTION_PROGRESS: SectionProgressItem[] = [
  {
    id: 'prog-3a',
    year: 'Second Year',
    semester: 'Odd Semester',
    section: 'Section A',
    totalSections: 2,
    facultyAllocationStatus: 'Completed',
    subjectAllocationStatus: 'Completed',
    timetableGenerationStatus: 'Generated',
    editingStatus: 'Completed',
    clashValidationStatus: 'Zero Clashes (Verified)',
    clashCount: 0,
    hodReviewStatus: 'Approved',
    overallStatus: 'Published',
    hodRemarks: 'Full curriculum covered with verified faculty allocations. Ratified for official publication.',
    lastUpdated: '2026-11-03 04:00 PM',
  },
  {
    id: 'prog-3b',
    year: 'Second Year',
    semester: 'Odd Semester',
    section: 'Section B',
    totalSections: 2,
    facultyAllocationStatus: 'Completed',
    subjectAllocationStatus: 'Completed',
    timetableGenerationStatus: 'Generated',
    editingStatus: 'Completed',
    clashValidationStatus: 'Zero Clashes (Verified)',
    clashCount: 0,
    hodReviewStatus: 'Approved',
    overallStatus: 'Published',
    hodRemarks: 'Balanced laboratory load with Section A. Ratified for official publication.',
    lastUpdated: '2026-11-03 04:00 PM',
  },
  {
    id: 'prog-5a',
    year: 'Third Year',
    semester: 'Odd Semester',
    section: 'Section A',
    totalSections: 1,
    facultyAllocationStatus: 'Completed',
    subjectAllocationStatus: 'Completed',
    timetableGenerationStatus: 'Generated',
    editingStatus: 'Completed',
    clashValidationStatus: 'Zero Clashes (Verified)',
    clashCount: 0,
    hodReviewStatus: 'Awaiting HOD Review',
    overallStatus: 'Awaiting HOD Review',
    hodRemarks: 'Submitted by Dept Coordinator Prof. Rajesh Shetty on 04-Nov-2026. Ready for HOD review.',
    lastUpdated: '2026-11-04 10:30 AM',
  },
  {
    id: 'prog-7a',
    year: 'Fourth Year',
    semester: 'Odd Semester',
    section: 'Section A',
    totalSections: 1,
    facultyAllocationStatus: 'Completed',
    subjectAllocationStatus: 'Completed',
    timetableGenerationStatus: 'In Progress',
    editingStatus: 'Under Editing',
    clashValidationStatus: 'Pending Validation',
    clashCount: 0,
    hodReviewStatus: 'Pending Submission',
    overallStatus: 'Under Editing',
    hodRemarks: 'Elective course distribution in progress by Dept Coordinator.',
    lastUpdated: '2026-11-04 03:15 PM',
  },
];


// =====================================================================
// FACULTY MODULE SPECIFICATION TYPES AND INITIAL LEAVE RECORDS
// =====================================================================

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

export const INITIAL_FACULTY_LEAVES: FacultyLeaveApplication[] = [
  {
    id: 'leave-fac-1',
    facultyId: 'FAC102',
    facultyName: 'Dr. Ananya Rao',
    department: 'Artificial Intelligence & Data Science',
    leaveType: 'Casual Leave',
    fromDate: '2026-10-15',
    toDate: '2026-10-15',
    session: 'Full Day',
    daysCount: 1,
    reason: 'Personal urgent family commitment at native place.',
    attachmentName: 'Family_Affidavit.pdf',
    status: 'Approved',
    appliedDate: '2026-10-10',
    approverRemarks: 'Approved by HOD Dr. Vasudeva. Class adjustment confirmed.',
    substituteFaculty: 'Prof. Rajesh Shetty',
    substituteStatus: 'Arranged',
    affectedSlots: [
      {
        day: 'Thursday',
        period: 1,
        time: '9:00–9:55',
        subjectCode: '21AIL37',
        subjectTitle: 'Data Structures Laboratory',
        section: 'AIDS - 3A',
        room: 'AI Computing Lab 1',
        type: 'Department',
        substituteFaculty: 'Prof. Rajesh Shetty',
        substituteStatus: 'Arranged',
      },
      {
        day: 'Thursday',
        period: 2,
        time: '9:55–10:50',
        subjectCode: '21AIL37',
        subjectTitle: 'Data Structures Laboratory',
        section: 'AIDS - 3A',
        room: 'AI Computing Lab 1',
        type: 'Department',
        substituteFaculty: 'Prof. Rajesh Shetty',
        substituteStatus: 'Arranged',
      },
    ],
  },
  {
    id: 'leave-fac-2',
    facultyId: 'FAC102',
    facultyName: 'Dr. Ananya Rao',
    department: 'Artificial Intelligence & Data Science',
    leaveType: 'On Duty',
    fromDate: '2026-11-26',
    toDate: '2026-11-26',
    session: 'Full Day',
    daysCount: 1,
    reason: 'Presenting accepted research paper at IEEE International Conference on Cognitive Computing (Bengaluru).',
    attachmentName: 'IEEE_Acceptance_Letter.pdf',
    status: 'Pending',
    appliedDate: '2026-11-15',
    approverRemarks: 'Under review by Dept Coordinator Prof. Rajesh Shetty and HOD.',
    substituteFaculty: 'Prof. Sneha Kamath',
    substituteStatus: 'Pending Arrangement',
    affectedSlots: [
      {
        day: 'Thursday',
        period: 1,
        time: '9:00–9:55',
        subjectCode: '21AIL37',
        subjectTitle: 'Data Structures Laboratory',
        section: 'AIDS - 3A',
        room: 'AI Computing Lab 1',
        type: 'Department',
        substituteFaculty: 'Prof. Sneha Kamath',
        substituteStatus: 'Pending Arrangement',
      },
      {
        day: 'Thursday',
        period: 2,
        time: '9:55–10:50',
        subjectCode: '21AIL37',
        subjectTitle: 'Data Structures Laboratory',
        section: 'AIDS - 3A',
        room: 'AI Computing Lab 1',
        type: 'Department',
        substituteFaculty: 'Prof. Sneha Kamath',
        substituteStatus: 'Pending Arrangement',
      },
    ],
  },
];





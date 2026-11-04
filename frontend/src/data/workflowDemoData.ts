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

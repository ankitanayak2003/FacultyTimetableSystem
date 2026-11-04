export interface FacultyProfileData {
  fullName: string;
  facultyId: string;
  email: string;
  department: string;
  departmentCode: string;
  designation: string;
  qualification: string;
  specialization: string;
  dateOfJoining: string;
  maxWeeklyWorkload: number; // e.g. 20
  assignedWeeklyHours: number; // e.g. 16
  academicYear: string;
  collegeName: string;
  status: string;
}

export interface FacultyScheduleSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  period: number;
  time: string;
  courseCode: string;
  courseTitle: string;
  classSection: string; // e.g. "AIDS - 4A"
  room: string;
  type: 'Theory' | 'Laboratory' | 'Mentorship' | 'Institutional';
  duration?: number;
}

export interface ClassSectionTimetable {
  classId: string;
  label: string; // e.g. "AIDS – Semester 3 – Section A"
  semester: string;
  section: string;
  department: string;
  classroom: string;
  slots: {
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
    period: number;
    time: string;
    courseCode: string;
    courseTitle: string;
    faculty: string;
    room: string;
    type: 'Theory' | 'Laboratory' | 'Mentorship' | 'Library';
    duration?: number;
  }[];
}

export interface SubjectPreferenceItem {
  id: string;
  category: 'Department Subject' | 'Basic Science' | 'Open Elective' | 'Additional Responsibility';
  subjectOrActivity: string;
  code?: string;
  priority: 1 | 2 | 3;
  justification: string;
  remarks?: string;
}

export interface LeaveRequestItem {
  id: string;
  leaveType: 'Casual Leave' | 'Duty Leave (OOD)' | 'Medical Leave' | 'Restricted Holiday' | 'Earned Leave';
  startDate: string;
  endDate: string;
  daysCount: number;
  reason: string;
  substituteFaculty: string;
  remarks?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedDate: string;
}

export interface FacultyNotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'Timetable' | 'Preferences' | 'Workload' | 'Meeting' | 'Leave' | 'Academic';
  timestamp: string;
  isRead: boolean;
  priority: 'normal' | 'high' | 'urgent';
}

// -------------------------------------------------------------
// Sample Faculty Data
// -------------------------------------------------------------

export const FACULTY_PROFILE: FacultyProfileData = {
  fullName: 'Dr. Ananya Rao',
  facultyId: 'FAC102',
  email: 'ananya.faculty@sode-edu.in',
  department: 'Artificial Intelligence & Data Science',
  departmentCode: 'AI&DS',
  designation: 'Associate Professor',
  qualification: 'Ph.D. in Computer Science & Engineering (VTU Belagavi), M.Tech (CSE)',
  specialization: 'Machine Learning, Algorithmic Analysis & Distributed Systems',
  dateOfJoining: '12-Aug-2018',
  maxWeeklyWorkload: 20,
  assignedWeeklyHours: 16,
  academicYear: '2026–27',
  collegeName: 'Shri Madhwa Vadiraja Institute of Technology & Management (SMVITM)',
  status: 'Active Full-Time Faculty',
};

// Workload breakdown details
export const FACULTY_WORKLOAD_BREAKDOWN = {
  maxHours: 20,
  assignedHours: 16,
  availableHours: 4,
  theoryHours: 9, // 3 courses x 3 hrs
  labHours: 6, // 2 lab sessions x 3 hrs
  otherResponsibilitiesHours: 1, // Mentorship & Proctorial
  courses: [
    {
      code: '21AI42',
      title: 'Analysis & Design of Algorithms',
      classSection: 'AIDS - Sem 4 Sec A',
      hoursPerWeek: 3,
      type: 'Theory' as const,
      credits: '3:0:0',
    },
    {
      code: '21AI42',
      title: 'Analysis & Design of Algorithms',
      classSection: 'AIDS - Sem 4 Sec B',
      hoursPerWeek: 3,
      type: 'Theory' as const,
      credits: '3:0:0',
    },
    {
      code: '21AI44',
      title: 'Machine Learning Foundations',
      classSection: 'AIDS - Sem 4 Sec A',
      hoursPerWeek: 3,
      type: 'Theory' as const,
      credits: '3:0:0',
    },
    {
      code: '21AIL47',
      title: 'Algorithms & Machine Learning Lab',
      classSection: 'AIDS - Sem 4 Batch A1',
      hoursPerWeek: 3,
      type: 'Laboratory' as const,
      credits: '0:0:3',
    },
    {
      code: '21AIL47',
      title: 'Algorithms & Machine Learning Lab',
      classSection: 'AIDS - Sem 4 Batch A2',
      hoursPerWeek: 3,
      type: 'Laboratory' as const,
      credits: '0:0:3',
    },
    {
      code: 'PROCTOR',
      title: 'Proctorial & Student Mentoring Hour',
      classSection: 'AIDS - Sem 4 Cohort',
      hoursPerWeek: 1,
      type: 'Mentorship' as const,
      credits: '0:0:1',
    },
  ],
};

// Personal teaching schedule: ODD Semester
export const FACULTY_ODD_TIMETABLE: FacultyScheduleSlot[] = [
  // Monday
  {
    id: 'f-mon-2',
    day: 'Monday',
    period: 2,
    time: '10:00 - 11:00 AM',
    courseCode: '21AI42',
    courseTitle: 'Analysis & Design of Algorithms',
    classSection: 'AIDS - Sem 4 Sec A',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'f-mon-4',
    day: 'Monday',
    period: 4,
    time: '12:15 - 01:15 PM',
    courseCode: '21AI44',
    courseTitle: 'Machine Learning Foundations',
    classSection: 'AIDS - Sem 4 Sec A',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'f-mon-6',
    day: 'Monday',
    period: 6,
    time: '03:00 - 04:00 PM',
    courseCode: '21AI42',
    courseTitle: 'Algorithms Tutorial & Remedial',
    classSection: 'AIDS - Sem 4 Sec A',
    room: 'LH-201',
    type: 'Theory',
  },

  // Tuesday
  {
    id: 'f-tue-1',
    day: 'Tuesday',
    period: 1,
    time: '09:00 - 10:00 AM',
    courseCode: '21AI44',
    courseTitle: 'Machine Learning Foundations',
    classSection: 'AIDS - Sem 4 Sec A',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'f-tue-3',
    day: 'Tuesday',
    period: 3,
    time: '11:15 - 12:15 PM',
    courseCode: '21AI42',
    courseTitle: 'Analysis & Design of Algorithms',
    classSection: 'AIDS - Sem 4 Sec B',
    room: 'LH-202',
    type: 'Theory',
  },
  {
    id: 'f-tue-7',
    day: 'Tuesday',
    period: 7,
    time: '04:00 - 05:00 PM',
    courseCode: 'PROCTOR',
    courseTitle: 'Proctorial Mentoring Session',
    classSection: 'AIDS - Sem 4 Mentees',
    room: 'LH-201',
    type: 'Mentorship',
  },

  // Wednesday
  {
    id: 'f-wed-2',
    day: 'Wednesday',
    period: 2,
    time: '10:00 - 11:00 AM',
    courseCode: '21AI44',
    courseTitle: 'Machine Learning Foundations',
    classSection: 'AIDS - Sem 4 Sec A',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'f-wed-4',
    day: 'Wednesday',
    period: 4,
    time: '12:15 - 01:15 PM',
    courseCode: '21AI42',
    courseTitle: 'Analysis & Design of Algorithms',
    classSection: 'AIDS - Sem 4 Sec B',
    room: 'LH-202',
    type: 'Theory',
  },
  {
    id: 'f-wed-5',
    day: 'Wednesday',
    period: 5,
    time: '02:00 - 05:00 PM',
    courseCode: '21AIL47',
    courseTitle: 'Algorithms & ML Lab (Batch A1)',
    classSection: 'AIDS - Sem 4 Batch A1',
    room: 'AI-Lab 01',
    type: 'Laboratory',
    duration: 3,
  },

  // Thursday
  {
    id: 'f-thu-1',
    day: 'Thursday',
    period: 1,
    time: '09:00 - 10:00 AM',
    courseCode: '21AI42',
    courseTitle: 'Analysis & Design of Algorithms',
    classSection: 'AIDS - Sem 4 Sec A',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'f-thu-3',
    day: 'Thursday',
    period: 3,
    time: '11:15 - 12:15 PM',
    courseCode: '21AI44',
    courseTitle: 'Machine Learning Foundations',
    classSection: 'AIDS - Sem 4 Sec A',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'f-thu-5',
    day: 'Thursday',
    period: 5,
    time: '02:00 - 05:00 PM',
    courseCode: '21AIL47',
    courseTitle: 'Algorithms & ML Lab (Batch A2)',
    classSection: 'AIDS - Sem 4 Batch A2',
    room: 'AI-Lab 01',
    type: 'Laboratory',
    duration: 3,
  },

  // Friday
  {
    id: 'f-fri-2',
    day: 'Friday',
    period: 2,
    time: '10:00 - 11:00 AM',
    courseCode: '21AI44',
    courseTitle: 'Machine Learning Foundations',
    classSection: 'AIDS - Sem 4 Sec A',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'f-fri-3',
    day: 'Friday',
    period: 3,
    time: '11:15 - 12:15 PM',
    courseCode: '21AI42',
    courseTitle: 'Analysis & Design of Algorithms',
    classSection: 'AIDS - Sem 4 Sec B',
    room: 'LH-202',
    type: 'Theory',
  },

  // Saturday
  {
    id: 'f-sat-1',
    day: 'Saturday',
    period: 1,
    time: '09:00 - 10:00 AM',
    courseCode: '21AI42',
    courseTitle: 'Algorithms Review & Case Studies',
    classSection: 'AIDS - Sem 4 Sec A',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'f-sat-2',
    day: 'Saturday',
    period: 2,
    time: '10:00 - 11:00 AM',
    courseCode: '21AI44',
    courseTitle: 'ML Colloquium & Student Demos',
    classSection: 'AIDS - Sem 4 Sec A',
    room: 'LH-201',
    type: 'Theory',
  },
];

// Personal teaching schedule: EVEN Semester (simulated alternative for the toggle)
export const FACULTY_EVEN_TIMETABLE: FacultyScheduleSlot[] = [
  {
    id: 'f-even-mon-1',
    day: 'Monday',
    period: 1,
    time: '09:00 - 10:00 AM',
    courseCode: '21AI61',
    courseTitle: 'Deep Learning Architectures',
    classSection: 'AIDS - Sem 6 Sec A',
    room: 'LH-301',
    type: 'Theory',
  },
  {
    id: 'f-even-mon-3',
    day: 'Monday',
    period: 3,
    time: '11:15 - 12:15 PM',
    courseCode: '21AI63',
    courseTitle: 'Natural Language Processing',
    classSection: 'AIDS - Sem 6 Sec A',
    room: 'LH-301',
    type: 'Theory',
  },
  {
    id: 'f-even-tue-2',
    day: 'Tuesday',
    period: 2,
    time: '10:00 - 11:00 AM',
    courseCode: '21AI61',
    courseTitle: 'Deep Learning Architectures',
    classSection: 'AIDS - Sem 6 Sec A',
    room: 'LH-301',
    type: 'Theory',
  },
  {
    id: 'f-even-wed-5',
    day: 'Wednesday',
    period: 5,
    time: '02:00 - 05:00 PM',
    courseCode: '21AIL66',
    courseTitle: 'Deep Learning Lab',
    classSection: 'AIDS - Sem 6 Batch A1',
    room: 'AI-Lab 02',
    type: 'Laboratory',
    duration: 3,
  },
  {
    id: 'f-even-thu-2',
    day: 'Thursday',
    period: 2,
    time: '10:00 - 11:00 AM',
    courseCode: '21AI63',
    courseTitle: 'Natural Language Processing',
    classSection: 'AIDS - Sem 6 Sec A',
    room: 'LH-301',
    type: 'Theory',
  },
  {
    id: 'f-even-fri-1',
    day: 'Friday',
    period: 1,
    time: '09:00 - 10:00 AM',
    courseCode: '21AI61',
    courseTitle: 'Deep Learning Architectures',
    classSection: 'AIDS - Sem 6 Sec A',
    room: 'LH-301',
    type: 'Theory',
  },
];

// -------------------------------------------------------------
// Class-Wise Timetables (for Dept. of AI & DS)
// -------------------------------------------------------------

export const CLASS_WISE_TIMETABLES: ClassSectionTimetable[] = [
  {
    classId: 'aids-3a',
    label: 'AIDS – Semester 3 – Section A',
    semester: 'Semester 3',
    section: 'Section A',
    department: 'Artificial Intelligence & Data Science',
    classroom: 'LH-104',
    slots: [
      {
        day: 'Monday',
        period: 1,
        time: '09:00 - 10:00 AM',
        courseCode: '21MAT31',
        courseTitle: 'Transform Calculus & Linear Algebra',
        faculty: 'Dr. Ramesh S.',
        room: 'LH-104',
        type: 'Theory',
      },
      {
        day: 'Monday',
        period: 2,
        time: '10:00 - 11:00 AM',
        courseCode: '21AI32',
        courseTitle: 'Data Structures & Applications',
        faculty: 'Prof. Manoj Kumar',
        room: 'LH-104',
        type: 'Theory',
      },
      {
        day: 'Monday',
        period: 3,
        time: '11:15 - 12:15 PM',
        courseCode: '21AI33',
        courseTitle: 'Analog & Digital Electronics',
        faculty: 'Prof. Keerthi V.',
        room: 'LH-104',
        type: 'Theory',
      },
      {
        day: 'Monday',
        period: 5,
        time: '02:00 - 05:00 PM',
        courseCode: '21AIL37',
        courseTitle: 'Data Structures Laboratory',
        faculty: 'Prof. Manoj Kumar & Batch B1',
        room: 'CC-Lab 01',
        type: 'Laboratory',
        duration: 3,
      },
      {
        day: 'Tuesday',
        period: 1,
        time: '09:00 - 10:00 AM',
        courseCode: '21AI34',
        courseTitle: 'Computer Organization & Architecture',
        faculty: 'Dr. Sowmya Bhat',
        room: 'LH-104',
        type: 'Theory',
      },
      {
        day: 'Tuesday',
        period: 2,
        time: '10:00 - 11:00 AM',
        courseCode: '21MAT31',
        courseTitle: 'Transform Calculus & Linear Algebra',
        faculty: 'Dr. Ramesh S.',
        room: 'LH-104',
        type: 'Theory',
      },
      {
        day: 'Wednesday',
        period: 1,
        time: '09:00 - 10:00 AM',
        courseCode: '21AI32',
        courseTitle: 'Data Structures & Applications',
        faculty: 'Prof. Manoj Kumar',
        room: 'LH-104',
        type: 'Theory',
      },
      {
        day: 'Thursday',
        period: 2,
        time: '10:00 - 11:00 AM',
        courseCode: '21AI33',
        courseTitle: 'Analog & Digital Electronics',
        faculty: 'Prof. Keerthi V.',
        room: 'LH-104',
        type: 'Theory',
      },
      {
        day: 'Friday',
        period: 3,
        time: '11:15 - 12:15 PM',
        courseCode: '21AI34',
        courseTitle: 'Computer Organization & Architecture',
        faculty: 'Dr. Sowmya Bhat',
        room: 'LH-104',
        type: 'Theory',
      },
    ],
  },
  {
    classId: 'aids-3b',
    label: 'AIDS – Semester 3 – Section B',
    semester: 'Semester 3',
    section: 'Section B',
    department: 'Artificial Intelligence & Data Science',
    classroom: 'LH-105',
    slots: [
      {
        day: 'Monday',
        period: 1,
        time: '09:00 - 10:00 AM',
        courseCode: '21AI32',
        courseTitle: 'Data Structures & Applications',
        faculty: 'Prof. Manoj Kumar',
        room: 'LH-105',
        type: 'Theory',
      },
      {
        day: 'Monday',
        period: 2,
        time: '10:00 - 11:00 AM',
        courseCode: '21MAT31',
        courseTitle: 'Transform Calculus & Linear Algebra',
        faculty: 'Dr. Ramesh S.',
        room: 'LH-105',
        type: 'Theory',
      },
      {
        day: 'Tuesday',
        period: 5,
        time: '02:00 - 05:00 PM',
        courseCode: '21AIL37',
        courseTitle: 'Data Structures Laboratory (Batch B2)',
        faculty: 'Prof. Manoj Kumar',
        room: 'CC-Lab 02',
        type: 'Laboratory',
        duration: 3,
      },
      {
        day: 'Wednesday',
        period: 2,
        time: '10:00 - 11:00 AM',
        courseCode: '21AI34',
        courseTitle: 'Computer Organization & Architecture',
        faculty: 'Dr. Sowmya Bhat',
        room: 'LH-105',
        type: 'Theory',
      },
      {
        day: 'Thursday',
        period: 1,
        time: '09:00 - 10:00 AM',
        courseCode: '21AI33',
        courseTitle: 'Analog & Digital Electronics',
        faculty: 'Prof. Keerthi V.',
        room: 'LH-105',
        type: 'Theory',
      },
      {
        day: 'Friday',
        period: 2,
        time: '10:00 - 11:00 AM',
        courseCode: '21MAT31',
        courseTitle: 'Transform Calculus & Linear Algebra',
        faculty: 'Dr. Ramesh S.',
        room: 'LH-105',
        type: 'Theory',
      },
    ],
  },
  {
    classId: 'aids-5a',
    label: 'AIDS – Semester 5 – Section A',
    semester: 'Semester 5',
    section: 'Section A',
    department: 'Artificial Intelligence & Data Science',
    classroom: 'LH-203',
    slots: [
      {
        day: 'Monday',
        period: 1,
        time: '09:00 - 10:00 AM',
        courseCode: '21AI51',
        courseTitle: 'Automata Theory & Computability',
        faculty: 'Prof. Sandhya Kamath',
        room: 'LH-203',
        type: 'Theory',
      },
      {
        day: 'Monday',
        period: 2,
        time: '10:00 - 11:00 AM',
        courseCode: '21AI52',
        courseTitle: 'Computer Networks & Security',
        faculty: 'Dr. Vasudeva (HOD)',
        room: 'LH-203',
        type: 'Theory',
      },
      {
        day: 'Tuesday',
        period: 3,
        time: '11:15 - 12:15 PM',
        courseCode: '21AI53',
        courseTitle: 'Database Management Systems',
        faculty: 'Prof. Keerthi V.',
        room: 'LH-203',
        type: 'Theory',
      },
      {
        day: 'Wednesday',
        period: 5,
        time: '02:00 - 05:00 PM',
        courseCode: '21AIL57',
        courseTitle: 'DBMS & Network Security Lab',
        faculty: 'Prof. Keerthi V. & Staff',
        room: 'CC-Lab 03',
        type: 'Laboratory',
        duration: 3,
      },
      {
        day: 'Thursday',
        period: 1,
        time: '09:00 - 10:00 AM',
        courseCode: '21AI52',
        courseTitle: 'Computer Networks & Security',
        faculty: 'Dr. Vasudeva (HOD)',
        room: 'LH-203',
        type: 'Theory',
      },
      {
        day: 'Friday',
        period: 4,
        time: '12:15 - 01:15 PM',
        courseCode: '21AI54',
        courseTitle: 'Artificial Intelligence Applications',
        faculty: 'Dr. Ananya Rao',
        room: 'LH-203',
        type: 'Theory',
      },
    ],
  },
];

// -------------------------------------------------------------
// Subject Preference Catalog & Initial Submissions
// -------------------------------------------------------------

export const AVAILABLE_DEPARTMENT_SUBJECTS = [
  { code: '21AI42', title: 'Analysis & Design of Algorithms', credits: '3:0:0', sem: 'Sem 4' },
  { code: '21AI44', title: 'Machine Learning Foundations', credits: '3:0:0', sem: 'Sem 4' },
  { code: '21AIL47', title: 'Algorithms & Machine Learning Lab', credits: '0:0:3', sem: 'Sem 4' },
  { code: '21AI54', title: 'Artificial Intelligence Applications', credits: '3:0:0', sem: 'Sem 5' },
  { code: '21AI61', title: 'Deep Learning Architectures', credits: '3:0:0', sem: 'Sem 6' },
  { code: '21AI63', title: 'Natural Language Processing', credits: '3:0:0', sem: 'Sem 6' },
  { code: '21AIL66', title: 'Deep Learning & NLP Laboratory', credits: '0:0:3', sem: 'Sem 6' },
];

export const AVAILABLE_BASIC_SCIENCE_SUBJECTS = [
  { code: '22ESC14', title: 'Problem Solving through C Programming', credits: '3:0:0', sem: 'Sem 1 / 2' },
  { code: '22PLC15B', title: 'Introduction to Python for AI & DS', credits: '3:0:0', sem: 'Sem 1 / 2' },
  { code: '22AI101', title: 'Foundations of Computer & Data Science', credits: '2:0:0', sem: 'Sem 1' },
];

export const AVAILABLE_OPEN_ELECTIVES = [
  { code: '21AI751', title: 'Applied Machine Learning for Engineers', credits: '3:0:0', sem: 'Sem 7' },
  { code: '21AI754', title: 'Introduction to Data Visualization & BI Tools', credits: '3:0:0', sem: 'Sem 7' },
];

export const AVAILABLE_RESPONSIBILITIES = [
  { code: 'IEEE-COORD', title: 'IEEE Student Branch Coordinator' },
  { code: 'AI-CLUB', title: 'AI Coding Club & Hackathon Mentor' },
  { code: 'NAAC-CRIT2', title: 'NAAC / NBA Criterion 2 In-Charge (Curriculum & Workload)' },
  { code: 'CAPSTONE-GUIDE', title: 'Final Year Major Capstone Project Guide' },
  { code: 'DEPT-PLACEMENT', title: 'Department Placement & Industry Internship Coordinator' },
  { code: 'TIME-ASST', title: 'Timetable Committee Assistant' },
];

export const INITIAL_PREFERENCES: SubjectPreferenceItem[] = [
  {
    id: 'pref-1',
    category: 'Department Subject',
    subjectOrActivity: '21AI44: Machine Learning Foundations (Semester 4)',
    priority: 1,
    justification: 'Core research specialization and previous teaching experience with excellent student feedback.',
    remarks: 'Preferred Section A or B.',
  },
  {
    id: 'pref-2',
    category: 'Department Subject',
    subjectOrActivity: '21AI42: Analysis & Design of Algorithms (Semester 4)',
    priority: 2,
    justification: 'Strong background in competitive programming and algorithmic complexity theory.',
    remarks: 'Also willing to handle corresponding laboratory.',
  },
  {
    id: 'pref-3',
    category: 'Additional Responsibility',
    subjectOrActivity: 'AI Coding Club & Hackathon Mentor',
    priority: 1,
    justification: 'Mentored winning student teams in Smart India Hackathon and regional coding contests.',
    remarks: 'Weekly mentoring on Saturdays.',
  },
];

// -------------------------------------------------------------
// Leave Requests Initial Data
// -------------------------------------------------------------

export const INITIAL_LEAVE_REQUESTS: LeaveRequestItem[] = [
  {
    id: 'leave-101',
    leaveType: 'Casual Leave',
    startDate: '2026-10-18',
    endDate: '2026-10-19',
    daysCount: 2,
    reason: 'Personal urgent family commitment at native place.',
    substituteFaculty: 'Prof. Manoj Kumar (Handled LH-201 lecture periods)',
    remarks: 'All class adjustments ratified by HOD.',
    status: 'Approved',
    appliedDate: '2026-10-12',
  },
  {
    id: 'leave-102',
    leaveType: 'Duty Leave (OOD)',
    startDate: '2026-11-20',
    endDate: '2026-11-21',
    daysCount: 2,
    reason: 'Presenting research paper at IEEE International Conference on Cognitive Computing (Bengaluru).',
    substituteFaculty: 'Dr. Sowmya Bhat',
    remarks: 'Registration and paper acceptance certificate appended.',
    status: 'Pending',
    appliedDate: '2026-11-01',
  },
];

// -------------------------------------------------------------
// Department Specific Notifications
// -------------------------------------------------------------

export const INITIAL_FACULTY_NOTIFICATIONS: FacultyNotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Odd Semester 2026–27 Timetable Officially Published',
    message: 'The Department of AI & DS finalized timetable has been ratified by HOD Dr. Vasudeva and Academic Dean. Classes take effect from Monday, 27-Oct-2026.',
    category: 'Timetable',
    timestamp: '2 hours ago',
    isRead: false,
    priority: 'urgent',
  },
  {
    id: 'notif-2',
    title: 'Subject Preferences for Even Semester 2026–27 Window Open',
    message: 'Faculty members are requested to log their subject and elective preferences before 15-Nov-2026 for next term planning.',
    category: 'Preferences',
    timestamp: 'Yesterday at 04:30 PM',
    isRead: false,
    priority: 'high',
  },
  {
    id: 'notif-3',
    title: 'Departmental Faculty Council Meeting',
    message: 'Meeting on Friday at 04:15 PM in Seminar Hall 1 to review mid-term syllabus progress and laboratory hardware requirements.',
    category: 'Meeting',
    timestamp: '2 days ago',
    isRead: true,
    priority: 'normal',
  },
  {
    id: 'notif-4',
    title: 'Workload Allotment Compliance Certified',
    message: 'Your current workload allotment (16 Hours/Week) meets VTU normative criteria. 4 available hours remain for departmental projects.',
    category: 'Workload',
    timestamp: '24-Oct-2026',
    isRead: true,
    priority: 'normal',
  },
  {
    id: 'notif-5',
    title: 'Duty Leave Application (IEEE Conference) Received',
    message: 'Your application for Duty Leave on 20-Nov-2026 has been forwarded to the Dean of Academic Affairs for final endorsement.',
    category: 'Leave',
    timestamp: '01-Nov-2026',
    isRead: false,
    priority: 'normal',
  },
];

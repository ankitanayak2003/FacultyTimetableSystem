export interface CourseInfo {
  code: string;
  title: string;
  credits: string;
  type: 'Theory' | 'Laboratory' | 'Humanities';
  faculty: string;
  facultyDesignation: string;
  room: string;
}

export interface TimetableSlot {
  id: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
  period: number; // 1 to 7
  time: string; // e.g. "09:00 - 10:00"
  courseCode?: string;
  courseTitle?: string;
  faculty?: string;
  room?: string;
  type?: 'Theory' | 'Laboratory' | 'Break' | 'Library' | 'Mentorship';
  duration?: number; // span of periods (e.g. 2 or 3 for labs)
  isBreak?: boolean;
}

export interface StudentProfileData {
  fullName: string;
  usn: string;
  email: string;
  department: string;
  departmentCode: string;
  semester: string;
  section: string;
  academicYear: string;
  degree: string;
  admissionBatch: string;
  proctorName: string;
  proctorEmail: string;
  proctorDepartment: string;
  collegeName: string;
  status: string;
  cgpa: string;
}

export const STUDENT_PROFILE: StudentProfileData = {
  fullName: 'Ananya Rao',
  usn: '4MW22AI018',
  email: 'ananya.22ai@sode-edu.in',
  department: 'Artificial Intelligence & Data Science',
  departmentCode: 'AI&DS',
  semester: 'Semester 4',
  section: 'Section A',
  academicYear: '2026–27',
  degree: 'Bachelor of Engineering (B.E.)',
  admissionBatch: '2022–2026',
  proctorName: 'Dr. Sowmya Bhat',
  proctorEmail: 'sowmya.aids@sode-edu.in',
  proctorDepartment: 'Dept. of AI & Data Science',
  collegeName: 'Shri Madhwa Vadiraja Institute of Technology & Management (SMVITM)',
  status: 'Active Full-Time Scholar',
  cgpa: '8.84',
};

export const ENROLLED_COURSES: CourseInfo[] = [
  {
    code: '21MAT41',
    title: 'Complex Analysis, Probability & Statistical Methods',
    credits: '3:0:0 (3)',
    type: 'Theory',
    faculty: 'Dr. Ramesh S.',
    facultyDesignation: 'Professor, Dept. of Mathematics',
    room: 'LH-201',
  },
  {
    code: '21AI42',
    title: 'Analysis & Design of Algorithms',
    credits: '3:0:0 (3)',
    type: 'Theory',
    faculty: 'Dr. Radhika Shenoy',
    facultyDesignation: 'Associate Professor, Dept. of AI & DS',
    room: 'LH-201',
  },
  {
    code: '21AI43',
    title: 'Operating Systems & System Architecture',
    credits: '3:0:0 (3)',
    type: 'Theory',
    faculty: 'Prof. Manoj Kumar',
    facultyDesignation: 'Assistant Professor, Dept. of AI & DS',
    room: 'LH-201',
  },
  {
    code: '21AI44',
    title: 'Machine Learning Foundations',
    credits: '3:0:0 (3)',
    type: 'Theory',
    faculty: 'Dr. Sowmya Bhat',
    facultyDesignation: 'Associate Professor & Proctor, Dept. of AI & DS',
    room: 'LH-201',
  },
  {
    code: '21AIL47',
    title: 'Algorithms & Machine Learning Laboratory',
    credits: '0:0:3 (1.5)',
    type: 'Laboratory',
    faculty: 'Dr. Radhika Shenoy & Prof. Manoj Kumar',
    facultyDesignation: 'Lab Instructors (Batch A1/A2)',
    room: 'AI-Lab 01',
  },
  {
    code: '21AIL48',
    title: 'Python for Data Science Laboratory',
    credits: '0:0:3 (1.5)',
    type: 'Laboratory',
    faculty: 'Prof. Keerthi V.',
    facultyDesignation: 'Assistant Professor, Dept. of AI & DS',
    room: 'CC-Lab 02',
  },
  {
    code: '21UH49',
    title: 'Universal Human Values & Professional Ethics',
    credits: '1:0:0 (1)',
    type: 'Humanities',
    faculty: 'Prof. Sandhya Kamath',
    facultyDesignation: 'Assistant Professor, Dept. of Humanities',
    room: 'LH-201',
  },
];

export const PERIOD_TIMES = [
  { period: 1, time: '09:00 - 10:00 AM', label: 'Period 1' },
  { period: 2, time: '10:00 - 11:00 AM', label: 'Period 2' },
  { period: 'tea', time: '11:00 - 11:15 AM', label: 'Tea Break', isBreak: true },
  { period: 3, time: '11:15 - 12:15 PM', label: 'Period 3' },
  { period: 4, time: '12:15 - 01:15 PM', label: 'Period 4' },
  { period: 'lunch', time: '01:15 - 02:00 PM', label: 'Lunch Break', isBreak: true },
  { period: 5, time: '02:00 - 03:00 PM', label: 'Period 5' },
  { period: 6, time: '03:00 - 04:00 PM', label: 'Period 6' },
  { period: 7, time: '04:00 - 05:00 PM', label: 'Period 7' },
];

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export type DayOfWeek = typeof DAYS_OF_WEEK[number];

export const WEEKLY_TIMETABLE_SLOTS: TimetableSlot[] = [
  // --- MONDAY ---
  {
    id: 'mon-1',
    day: 'Monday',
    period: 1,
    time: '09:00 - 10:00 AM',
    courseCode: '21MAT41',
    courseTitle: 'Complex Analysis & Probability',
    faculty: 'Dr. Ramesh S.',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'mon-2',
    day: 'Monday',
    period: 2,
    time: '10:00 - 11:00 AM',
    courseCode: '21AI42',
    courseTitle: 'Analysis & Design of Algorithms',
    faculty: 'Dr. Radhika Shenoy',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'mon-3',
    day: 'Monday',
    period: 3,
    time: '11:15 - 12:15 PM',
    courseCode: '21AI43',
    courseTitle: 'Operating Systems',
    faculty: 'Prof. Manoj Kumar',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'mon-4',
    day: 'Monday',
    period: 4,
    time: '12:15 - 01:15 PM',
    courseCode: '21AI44',
    courseTitle: 'Machine Learning Foundations',
    faculty: 'Dr. Sowmya Bhat',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'mon-5',
    day: 'Monday',
    period: 5,
    time: '02:00 - 03:00 PM',
    courseCode: '21UH49',
    courseTitle: 'Universal Human Values',
    faculty: 'Prof. Sandhya Kamath',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'mon-6',
    day: 'Monday',
    period: 6,
    time: '03:00 - 04:00 PM',
    courseCode: '21AI42',
    courseTitle: 'Algorithms Tutorial & Remedial',
    faculty: 'Dr. Radhika Shenoy',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'mon-7',
    day: 'Monday',
    period: 7,
    time: '04:00 - 05:00 PM',
    courseCode: 'LIB-01',
    courseTitle: 'Technical Reading & Library',
    faculty: 'Dept. Coordinator',
    room: 'Central Library',
    type: 'Library',
  },

  // --- TUESDAY ---
  {
    id: 'tue-1',
    day: 'Tuesday',
    period: 1,
    time: '09:00 - 10:00 AM',
    courseCode: '21AI44',
    courseTitle: 'Machine Learning Foundations',
    faculty: 'Dr. Sowmya Bhat',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'tue-2',
    day: 'Tuesday',
    period: 2,
    time: '10:00 - 11:00 AM',
    courseCode: '21MAT41',
    courseTitle: 'Complex Analysis & Probability',
    faculty: 'Dr. Ramesh S.',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'tue-3',
    day: 'Tuesday',
    period: 3,
    time: '11:15 - 12:15 PM',
    courseCode: '21AI42',
    courseTitle: 'Analysis & Design of Algorithms',
    faculty: 'Dr. Radhika Shenoy',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'tue-4',
    day: 'Tuesday',
    period: 4,
    time: '12:15 - 01:15 PM',
    courseCode: '21AI43',
    courseTitle: 'Operating Systems',
    faculty: 'Prof. Manoj Kumar',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'tue-5',
    day: 'Tuesday',
    period: 5,
    time: '02:00 - 04:00 PM',
    courseCode: '21AIL48',
    courseTitle: 'Python for Data Science Lab (Batch A1)',
    faculty: 'Prof. Keerthi V.',
    room: 'CC-Lab 02',
    type: 'Laboratory',
    duration: 2,
  },
  {
    id: 'tue-7',
    day: 'Tuesday',
    period: 7,
    time: '04:00 - 05:00 PM',
    courseCode: 'PROCTOR',
    courseTitle: 'Proctorial Meeting & Mentoring',
    faculty: 'Dr. Sowmya Bhat',
    room: 'LH-201',
    type: 'Mentorship',
  },

  // --- WEDNESDAY ---
  {
    id: 'wed-1',
    day: 'Wednesday',
    period: 1,
    time: '09:00 - 10:00 AM',
    courseCode: '21AI43',
    courseTitle: 'Operating Systems',
    faculty: 'Prof. Manoj Kumar',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'wed-2',
    day: 'Wednesday',
    period: 2,
    time: '10:00 - 11:00 AM',
    courseCode: '21AI44',
    courseTitle: 'Machine Learning Foundations',
    faculty: 'Dr. Sowmya Bhat',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'wed-3',
    day: 'Wednesday',
    period: 3,
    time: '11:15 - 12:15 PM',
    courseCode: '21MAT41',
    courseTitle: 'Complex Analysis & Probability',
    faculty: 'Dr. Ramesh S.',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'wed-4',
    day: 'Wednesday',
    period: 4,
    time: '12:15 - 01:15 PM',
    courseCode: '21AI42',
    courseTitle: 'Analysis & Design of Algorithms',
    faculty: 'Dr. Radhika Shenoy',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'wed-5',
    day: 'Wednesday',
    period: 5,
    time: '02:00 - 05:00 PM',
    courseCode: '21AIL47',
    courseTitle: 'Algorithms & Machine Learning Lab',
    faculty: 'Dr. Radhika Shenoy & Prof. Manoj',
    room: 'AI-Lab 01',
    type: 'Laboratory',
    duration: 3,
  },

  // --- THURSDAY ---
  {
    id: 'thu-1',
    day: 'Thursday',
    period: 1,
    time: '09:00 - 10:00 AM',
    courseCode: '21AI42',
    courseTitle: 'Analysis & Design of Algorithms',
    faculty: 'Dr. Radhika Shenoy',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'thu-2',
    day: 'Thursday',
    period: 2,
    time: '10:00 - 11:00 AM',
    courseCode: '21AI43',
    courseTitle: 'Operating Systems',
    faculty: 'Prof. Manoj Kumar',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'thu-3',
    day: 'Thursday',
    period: 3,
    time: '11:15 - 12:15 PM',
    courseCode: '21AI44',
    courseTitle: 'Machine Learning Foundations',
    faculty: 'Dr. Sowmya Bhat',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'thu-4',
    day: 'Thursday',
    period: 4,
    time: '12:15 - 01:15 PM',
    courseCode: '21MAT41',
    courseTitle: 'Complex Analysis & Probability',
    faculty: 'Dr. Ramesh S.',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'thu-5',
    day: 'Thursday',
    period: 5,
    time: '02:00 - 03:00 PM',
    courseCode: '21AI43',
    courseTitle: 'OS Lab Practical Session',
    faculty: 'Prof. Manoj Kumar',
    room: 'CC-Lab 01',
    type: 'Laboratory',
  },
  {
    id: 'thu-6',
    day: 'Thursday',
    period: 6,
    time: '03:00 - 04:00 PM',
    courseCode: '21MAT41',
    courseTitle: 'Statistics Tutorial',
    faculty: 'Dr. Ramesh S.',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'thu-7',
    day: 'Thursday',
    period: 7,
    time: '04:00 - 05:00 PM',
    courseCode: 'CLUB-01',
    courseTitle: 'AI Coding Club & Innovation Hub',
    faculty: 'Student Technical Society',
    room: 'Innovation Center',
    type: 'Mentorship',
  },

  // --- FRIDAY ---
  {
    id: 'fri-1',
    day: 'Friday',
    period: 1,
    time: '09:00 - 10:00 AM',
    courseCode: '21MAT41',
    courseTitle: 'Complex Analysis & Probability',
    faculty: 'Dr. Ramesh S.',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'fri-2',
    day: 'Friday',
    period: 2,
    time: '10:00 - 11:00 AM',
    courseCode: '21AI44',
    courseTitle: 'Machine Learning Foundations',
    faculty: 'Dr. Sowmya Bhat',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'fri-3',
    day: 'Friday',
    period: 3,
    time: '11:15 - 12:15 PM',
    courseCode: '21AI42',
    courseTitle: 'Analysis & Design of Algorithms',
    faculty: 'Dr. Radhika Shenoy',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'fri-4',
    day: 'Friday',
    period: 4,
    time: '12:15 - 01:15 PM',
    courseCode: '21AI43',
    courseTitle: 'Operating Systems',
    faculty: 'Prof. Manoj Kumar',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'fri-5',
    day: 'Friday',
    period: 5,
    time: '02:00 - 05:00 PM',
    courseCode: '21AIL48',
    courseTitle: 'Python Data Science Project Lab',
    faculty: 'Prof. Keerthi V.',
    room: 'CC-Lab 02',
    type: 'Laboratory',
    duration: 3,
  },

  // --- SATURDAY ---
  {
    id: 'sat-1',
    day: 'Saturday',
    period: 1,
    time: '09:00 - 10:00 AM',
    courseCode: '21AI42',
    courseTitle: 'Algorithms Review & Case Studies',
    faculty: 'Dr. Radhika Shenoy',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'sat-2',
    day: 'Saturday',
    period: 2,
    time: '10:00 - 11:00 AM',
    courseCode: '21AI44',
    courseTitle: 'Machine Learning Seminar & Presentations',
    faculty: 'Dr. Sowmya Bhat',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'sat-3',
    day: 'Saturday',
    period: 3,
    time: '11:15 - 12:15 PM',
    courseCode: '21UH49',
    courseTitle: 'Professional Ethics & Societal Values',
    faculty: 'Prof. Sandhya Kamath',
    room: 'LH-201',
    type: 'Theory',
  },
  {
    id: 'sat-4',
    day: 'Saturday',
    period: 4,
    time: '12:15 - 01:15 PM',
    courseCode: 'SEMINAR',
    courseTitle: 'Department Technical Colloquium',
    faculty: 'Dept. of AI & DS',
    room: 'Seminar Hall 1',
    type: 'Mentorship',
  },
];

export const TIMETABLE_METADATA = {
  department: 'Artificial Intelligence & Data Science',
  semester: 'Semester 4',
  section: 'Section A',
  academicYear: '2026–27',
  effectiveDate: '27-Oct-2026',
  ratifiedByHOD: 'Dr. Vasudeva, Ph.D.',
  ratifiedByDean: 'Dr. Sudarshan Rao, Ph.D.',
  status: 'Published' as 'Published' | 'Not yet published',
  version: 'v2.4 (Official Final Release)',
  totalWeeklyHours: '34 Hours',
};

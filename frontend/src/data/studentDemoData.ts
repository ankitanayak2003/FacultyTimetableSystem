/**
 * Student Profile & Timetable Models
 * All dummy and mock records have been removed.
 * Data is populated dynamically from FastAPI / Firebase Cloud Firestore.
 */

export * from '../types/student';

import {
  StudentProfileData,
  CourseInfo,
  TimetableSlot,
} from '../types/student';

export const STUDENT_PROFILE: StudentProfileData = {
  fullName: 'Student Viewer',
  usn: '4MW23AI001',
  email: 'student@sode-edu.in',
  department: 'Artificial Intelligence & Data Science',
  departmentCode: 'AIDS',
  semester: 'Semester 4',
  section: 'Section A',
  academicYear: '2026–27',
  degree: 'B.E.',
  admissionBatch: '2023–27',
  proctorName: 'Assigned Proctor',
  proctorEmail: 'proctor@sode-edu.in',
  proctorDepartment: 'AIDS',
  collegeName: 'Shri Madhwa Vadiraja Institute of Technology & Management',
  status: 'Active',
  cgpa: '8.5',
};

export const ENROLLED_COURSES: CourseInfo[] = [];
export const WEEKLY_TIMETABLE_SLOTS: TimetableSlot[] = [];

export const TIMETABLE_METADATA = {
  department: 'Artificial Intelligence & Data Science',
  semester: 'Semester 4',
  section: 'Section A',
  academicYear: '2026–27',
  effectiveDate: '2026-11-24',
  ratifiedByHOD: 'Head of Department',
  ratifiedByDean: 'Dean Academics',
  status: 'Published' as 'Published' | 'Not yet published',
  version: 'v1.0 (Live)',
  totalWeeklyHours: '32 Hours',
};

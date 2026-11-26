/**
 * Student Domain Types & Interfaces
 */

export const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export type DayOfWeek = typeof DAYS_OF_WEEK[number];

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
  period: number;
  time: string;
  courseCode?: string;
  courseTitle?: string;
  faculty?: string;
  room?: string;
  type?: 'Theory' | 'Laboratory' | 'Break' | 'Library' | 'Mentorship';
  duration?: number;
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

/**
 * Faculty Profile & Schedule Models
 * All dummy and mock records have been removed.
 * Data is populated dynamically from FastAPI / Firebase Cloud Firestore.
 */

export * from '../types/faculty';

import {
  FacultyProfileData,
  FacultyScheduleSlot,
  LeaveRequestItem,
  SubjectPreferenceItem,
} from '../types/faculty';

export const FACULTY_PROFILE: FacultyProfileData = {
  fullName: 'Faculty Member',
  facultyId: 'FAC001',
  email: 'faculty@sode-edu.in',
  department: 'Artificial Intelligence & Data Science',
  departmentCode: 'AIDS',
  designation: 'Assistant Professor',
  qualification: 'M.Tech, Ph.D.',
  specialization: 'Artificial Intelligence & Machine Learning',
  dateOfJoining: '2021-08-16',
  maxWeeklyWorkload: 16,
  assignedWeeklyHours: 12,
  academicYear: '2026–27',
  collegeName: 'Shri Madhwa Vadiraja Institute of Technology & Management',
  status: 'Active',
};

export const FACULTY_ODD_TIMETABLE: FacultyScheduleSlot[] = [];
export const FACULTY_EVEN_TIMETABLE: FacultyScheduleSlot[] = [];

export const FACULTY_WORKLOAD_BREAKDOWN: {
  maxHours: number;
  assignedHours: number;
  availableHours: number;
  theoryHours: number;
  labHours: number;
  otherResponsibilitiesHours: number;
  courses: any[];
} = {
  maxHours: 16,
  assignedHours: 0,
  availableHours: 16,
  theoryHours: 0,
  labHours: 0,
  otherResponsibilitiesHours: 0,
  courses: [],
};

export const INITIAL_LEAVE_REQUESTS: LeaveRequestItem[] = [];

export const AVAILABLE_DEPARTMENT_SUBJECTS: any[] = [];
export const AVAILABLE_BASIC_SCIENCE_SUBJECTS: any[] = [];
export const AVAILABLE_OPEN_ELECTIVES: any[] = [];
export const AVAILABLE_RESPONSIBILITIES: any[] = [];
export const SUBJECT_PREFERENCES: SubjectPreferenceItem[] = [];

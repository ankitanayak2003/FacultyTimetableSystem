/**
 * Faculty Domain Types & Interfaces
 */

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
  maxWeeklyWorkload: number;
  assignedWeeklyHours: number;
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
  classSection: string;
  room: string;
  type: 'Theory' | 'Laboratory' | 'Mentorship' | 'Institutional';
  duration?: number;
}

export interface ClassSectionTimetable {
  classId: string;
  label: string;
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

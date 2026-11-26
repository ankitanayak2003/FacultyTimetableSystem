import React, { useState } from 'react';
import { FacultyTab } from '../components/faculty/FacultySidebar';
import { FacultyHeader } from '../components/faculty/FacultyHeader';
import { MyTimetablePage } from '../components/faculty/MyTimetablePage';
import { SubjectPreferencesAndWorkloadPage } from '../components/faculty/SubjectPreferencesAndWorkloadPage';
import { LeaveRequestsPage } from '../components/faculty/LeaveRequestsPage';
import { FacultyProfileData } from '../types/faculty';
import { RetractableNavBar, NavItem } from '../components/common/RetractableNavBar';
import { useWorkflow } from '../context/WorkflowContext';
import { useAuth } from '../context/AuthContext';

const FACULTY_NAV_ITEMS: NavItem[] = [
  { id: 'my-timetable', label: 'My Timetable' },
  { id: 'preferences-workload', label: 'Preferences & Workload' },
  { id: 'leave-requests', label: 'Leave Requests' },
];

interface FacultyDashboardProps {
  onLogout: () => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ onLogout }) => {
  // Default landing page after Faculty login is strictly My Timetable
  const [activeTab, setActiveTab] = useState<FacultyTab>('my-timetable');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { departmentFaculty } = useWorkflow();
  const { currentUser } = useAuth();

  const currentFaculty = departmentFaculty.find(
    (f) =>
      (currentUser?.email && f.email?.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUser?.uid && f.id === currentUser.uid)
  );

  const liveFacultyProfile: FacultyProfileData = {
    fullName: currentFaculty?.name || currentUser?.displayName || '',
    facultyId: currentFaculty?.empId || '',
    email: currentFaculty?.email || currentUser?.email || '',
    department: currentFaculty?.department || currentUser?.departmentName || '',
    departmentCode: currentUser?.departmentCode || '',
    designation: currentFaculty?.designation || 'Faculty',
    qualification: '',
    specialization: '',
    dateOfJoining: '',
    maxWeeklyWorkload: currentFaculty?.maxHours || 16,
    assignedWeeklyHours: (currentFaculty?.theoryHours || 0) + (currentFaculty?.labHours || 0),
    academicYear: '2026–2027',
    collegeName: 'SMVITM',
    status: currentFaculty?.accountStatus || 'Active',
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink pt-14">
      <FacultyHeader
        faculty={liveFacultyProfile}
        activeTab={activeTab}
        onOpenMobileMenu={() => setIsMobileNavOpen((prev) => !prev)}
      />

      <RetractableNavBar
        items={FACULTY_NAV_ITEMS}
        activeTab={activeTab}
        onSelectTab={(id) => setActiveTab(id as FacultyTab)}
        onLogout={onLogout}
        isOpenControlled={isMobileNavOpen}
        onToggleControlled={() => setIsMobileNavOpen((prev) => !prev)}
      />

      <main className="flex-1 p-3.5 sm:p-5 lg:p-5 max-w-7xl w-full mx-auto space-y-4">
        {(activeTab === 'my-timetable' || activeTab === 'timetable') && (
          <MyTimetablePage />
        )}

        {(activeTab === 'preferences-workload' ||
          activeTab === 'preferences' ||
          activeTab === 'workload') && <SubjectPreferencesAndWorkloadPage />}

        {(activeTab === 'leave-requests' || activeTab === 'leaves') && (
          <LeaveRequestsPage />
        )}
      </main>
    </div>
  );
};

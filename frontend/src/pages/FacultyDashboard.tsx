import React, { useState } from 'react';
import {
  FacultySidebar,
  FacultyTab,
} from '../components/faculty/FacultySidebar';
import { FacultyHeader } from '../components/faculty/FacultyHeader';
import { MyTimetablePage } from '../components/faculty/MyTimetablePage';
import { SubjectPreferencesAndWorkloadPage } from '../components/faculty/SubjectPreferencesAndWorkloadPage';
import { LeaveRequestsPage } from '../components/faculty/LeaveRequestsPage';
import { FACULTY_PROFILE } from '../data/facultyDemoData';

interface FacultyDashboardProps {
  onLogout: () => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ onLogout }) => {
  // Default landing page after Faculty login is strictly My Timetable
  const [activeTab, setActiveTab] = useState<FacultyTab>('my-timetable');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      {/* Sidebar - Exactly 3 Navigation items */}
      <FacultySidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={onLogout}
        faculty={FACULTY_PROFILE}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative transition-all duration-300">
        <FacultyHeader
          faculty={FACULTY_PROFILE}
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
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
    </div>
  );
};

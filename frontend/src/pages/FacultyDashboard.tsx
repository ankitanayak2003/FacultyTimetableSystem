import React, { useState } from 'react';
import { FacultySidebar, FacultyTab } from '../components/faculty/FacultySidebar';
import { FacultyHeader } from '../components/faculty/FacultyHeader';
import { FacultyOverview } from '../components/faculty/FacultyOverview';
import { FacultyTimetable } from '../components/faculty/FacultyTimetable';
import { SubjectPreferences } from '../components/faculty/SubjectPreferences';
import { WorkloadOverview } from '../components/faculty/WorkloadOverview';
import { LeaveRequests } from '../components/faculty/LeaveRequests';
import { FacultyProfile } from '../components/faculty/FacultyProfile';
import {
  FACULTY_PROFILE,
  INITIAL_PREFERENCES,
  SubjectPreferenceItem,
} from '../data/facultyDemoData';

interface FacultyDashboardProps {
  onLogout: () => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<FacultyTab>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [preferences, setPreferences] = useState<SubjectPreferenceItem[]>(INITIAL_PREFERENCES);
  const [preferenceStatus, setPreferenceStatus] = useState<string>('Submitted');

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      {/* Sidebar Navigation with Arrow Toggle */}
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
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Header - Sticky on scroll */}
        <FacultyHeader
          faculty={FACULTY_PROFILE}
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onLogout={onLogout}
        />

        {/* Dynamic Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto academic-grid-pattern">
          {activeTab === 'overview' && (
            <FacultyOverview
              faculty={FACULTY_PROFILE}
              onNavigateToTab={setActiveTab}
              preferenceStatus={preferenceStatus}
            />
          )}

          {activeTab === 'timetable' && <FacultyTimetable />}

          {activeTab === 'preferences' && (
            <SubjectPreferences
              preferences={preferences}
              onUpdatePreferences={setPreferences}
              status={preferenceStatus}
              onUpdateStatus={setPreferenceStatus}
            />
          )}

          {activeTab === 'workload' && (
            <WorkloadOverview faculty={FACULTY_PROFILE} />
          )}

          {activeTab === 'leaves' && <LeaveRequests />}

          {activeTab === 'profile' && (
            <FacultyProfile faculty={FACULTY_PROFILE} />
          )}

          {/* Academic Footer */}
          <footer className="mt-12 pt-6 border-t border-border-beige text-center text-xs text-ink-muted">
            <p>
              © {new Date().getFullYear()} Shri Madhwa Vadiraja Institute of Technology &amp; Management (SMVITM). All rights reserved.
            </p>
            <p className="mt-1 text-[11px] text-ink-light font-mono">
              Faculty Workload &amp; Timetable Management System • Affiliated to VTU Belagavi
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

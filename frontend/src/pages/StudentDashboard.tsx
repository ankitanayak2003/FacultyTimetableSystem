import React, { useState } from 'react';
import { StudentSidebar, StudentTab } from '../components/student/StudentSidebar';
import { StudentHeader } from '../components/student/StudentHeader';
import { StudentWelcome } from '../components/student/StudentWelcome';
import { StudentTimetable } from '../components/student/StudentTimetable';
import { StudentProfile } from '../components/student/StudentProfile';
import { STUDENT_PROFILE } from '../data/studentDemoData';

interface StudentDashboardProps {
  onLogout: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<StudentTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  const togglePublished = () => {
    setIsPublished((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      {/* Sidebar Navigation */}
      <StudentSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={onLogout}
        student={STUDENT_PROFILE}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <StudentHeader
          student={STUDENT_PROFILE}
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onLogout={onLogout}
          isPublished={isPublished}
          onTogglePublished={togglePublished}
        />

        {/* Dynamic Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto academic-grid-pattern">
          {activeTab === 'dashboard' && (
            <StudentWelcome
              student={STUDENT_PROFILE}
              onNavigateToTab={setActiveTab}
              isPublished={isPublished}
            />
          )}

          {activeTab === 'timetable' && (
            <StudentTimetable
              isPublished={isPublished}
              onTogglePublished={togglePublished}
            />
          )}

          {activeTab === 'profile' && (
            <StudentProfile student={STUDENT_PROFILE} />
          )}

          {/* Simple Academic Footer */}
          <footer className="mt-12 pt-6 border-t border-border-beige text-center text-xs text-ink-muted">
            <p>
              © {new Date().getFullYear()} Shri Madhwa Vadiraja Institute of Technology &amp; Management (SMVITM).
            </p>
            <p className="mt-1 text-[11px] text-ink-light font-mono">
              Autonomous Workload Balancing &amp; Timetable Generation Engine • VTU Belagavi
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

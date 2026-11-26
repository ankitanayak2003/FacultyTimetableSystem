import React, { useState } from 'react';
import { StudentSidebar, StudentTab } from '../components/student/StudentSidebar';
import { StudentHeader } from '../components/student/StudentHeader';
import { StudentWelcome } from '../components/student/StudentWelcome';
import { StudentTimetable } from '../components/student/StudentTimetable';
import { StudentProfile } from '../components/student/StudentProfile';
import { StudentProfileData } from '../types/student';
import { useAuth } from '../context/AuthContext';

interface StudentDashboardProps {
  onLogout: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onLogout }) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<StudentTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPublished, setIsPublished] = useState(true);

  const studentProfile: StudentProfileData = {
    fullName: currentUser?.displayName || 'Student Schedule Viewer',
    usn: '',
    email: currentUser?.email || '',
    department: currentUser?.departmentName || '',
    departmentCode: currentUser?.departmentCode || '',
    semester: '',
    section: '',
    academicYear: '2026–2027',
    degree: 'B.E.',
    admissionBatch: '',
    proctorName: '',
    proctorEmail: '',
    proctorDepartment: '',
    collegeName: 'SMVITM',
    status: 'Active',
    cgpa: '',
  };

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
        student={studentProfile}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative transition-all duration-300">
        {/* Top Header */}
        <StudentHeader
          student={studentProfile}
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          isPublished={isPublished}
          onTogglePublished={togglePublished}
        />

        {/* Dynamic Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto academic-grid-pattern">
          {activeTab === 'dashboard' && (
            <StudentWelcome
              student={studentProfile}
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
            <StudentProfile student={studentProfile} />
          )}

          {/* Academic Portal Footer */}
          <footer className="mt-12 pt-6 border-t border-border-beige text-center text-xs text-ink-muted">
            <p>
              © {new Date().getFullYear()} Shri Madhwa Vadiraja Institute of Technology &amp; Management (SMVITM).
            </p>
            <p className="mt-1 text-[11px] text-ink-light font-mono">
              Class Timetable Access Portal • Affiliated to VTU Belagavi
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
};

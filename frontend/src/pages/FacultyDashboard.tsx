import React, { useState } from 'react';
import { FacultySidebar, FacultyTab } from '../components/faculty/FacultySidebar';
import { FacultyHeader } from '../components/faculty/FacultyHeader';
import { FacultyOverview } from '../components/faculty/FacultyOverview';
import { FacultyTimetable } from '../components/faculty/FacultyTimetable';
import { SubjectPreferences } from '../components/faculty/SubjectPreferences';
import { WorkloadOverview } from '../components/faculty/WorkloadOverview';
import { LeaveRequests } from '../components/faculty/LeaveRequests';
import { FacultyNotifications } from '../components/faculty/FacultyNotifications';
import { FacultyProfile } from '../components/faculty/FacultyProfile';
import {
  FACULTY_PROFILE,
  INITIAL_PREFERENCES,
  INITIAL_FACULTY_NOTIFICATIONS,
  SubjectPreferenceItem,
  FacultyNotificationItem,
} from '../data/facultyDemoData';

interface FacultyDashboardProps {
  onLogout: () => void;
}

export const FacultyDashboard: React.FC<FacultyDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<FacultyTab>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [preferences, setPreferences] = useState<SubjectPreferenceItem[]>(INITIAL_PREFERENCES);
  const [preferenceStatus, setPreferenceStatus] = useState<string>('Submitted');
  const [notifications, setNotifications] = useState<FacultyNotificationItem[]>(
    INITIAL_FACULTY_NOTIFICATIONS
  );

  const unreadNotifsCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      {/* Sidebar Navigation */}
      <FacultySidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={onLogout}
        faculty={FACULTY_PROFILE}
        unreadNotifsCount={unreadNotifsCount}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <FacultyHeader
          faculty={FACULTY_PROFILE}
          activeTab={activeTab}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onLogout={onLogout}
          unreadNotifsCount={unreadNotifsCount}
          onNavigateToNotifications={() => setActiveTab('notifications')}
        />

        {/* Dynamic Main Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto academic-grid-pattern">
          {activeTab === 'overview' && (
            <FacultyOverview
              faculty={FACULTY_PROFILE}
              onNavigateToTab={setActiveTab}
              preferenceStatus={preferenceStatus}
              notifications={notifications}
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

          {activeTab === 'notifications' && (
            <FacultyNotifications
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
            />
          )}

          {activeTab === 'profile' && (
            <FacultyProfile faculty={FACULTY_PROFILE} />
          )}

          {/* Simple Academic Footer */}
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

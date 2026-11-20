import React, { useState } from 'react';
import {
  PrincipalSidebar,
  PrincipalTab,
} from '../components/principal/PrincipalSidebar';
import { PrincipalHeader } from '../components/principal/PrincipalHeader';
import { InstitutionalManagementView } from '../components/principal/InstitutionalManagementView';
import { PrincipalFacultyManagementView } from '../components/principal/PrincipalFacultyManagementView';
import { InstitutionalTimetableView } from '../components/principal/InstitutionalTimetableView';
import { AcademicMonitoringView } from '../components/principal/AcademicMonitoringView';

interface PrincipalDashboardProps {
  onLogout: () => void;
}

export const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({ onLogout }) => {
  // Default landing page after Principal login is strictly Institutional Management
  const [activeTab, setActiveTab] = useState<PrincipalTab>('institutional-management');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      {/* Sidebar with Exactly 4 Navigation Items */}
      <PrincipalSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={onLogout}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative transition-all duration-300">
        <PrincipalHeader
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-3.5 sm:p-5 lg:p-5 max-w-7xl w-full mx-auto space-y-4">
          {(activeTab === 'institutional-management' || activeTab === 'overview') && (
            <InstitutionalManagementView />
          )}

          {(activeTab === 'faculty-management' || activeTab === 'faculty') && (
            <PrincipalFacultyManagementView />
          )}

          {(activeTab === 'institutional-timetable' ||
            activeTab === 'institutional' ||
            activeTab === 'published') && <InstitutionalTimetableView />}

          {(activeTab === 'academic-monitoring' || activeTab === 'departments') && (
            <AcademicMonitoringView />
          )}
        </main>
      </div>
    </div>
  );
};

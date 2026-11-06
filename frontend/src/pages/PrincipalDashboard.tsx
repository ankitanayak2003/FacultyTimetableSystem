import React, { useState } from 'react';
import {
  PrincipalSidebar,
  PrincipalTab,
} from '../components/principal/PrincipalSidebar';
import { PrincipalHeader } from '../components/principal/PrincipalHeader';
import { PrincipalOverview } from '../components/principal/PrincipalOverview';
import { InstitutionalTimetableView } from '../components/principal/InstitutionalTimetableView';
import { DepartmentsMonitoring } from '../components/principal/DepartmentsMonitoring';
import { FacultyWorkloadSummary } from '../components/principal/FacultyWorkloadSummary';
import { PrincipalVTUTimetableView } from '../components/principal/PrincipalVTUTimetableView';

interface PrincipalDashboardProps {
  onLogout: () => void;
}

export const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<PrincipalTab>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      {/* Sidebar with Arrow Toggle */}
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
      <div className="flex-1 flex flex-col min-w-0 relative">
        <PrincipalHeader
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onLogout={onLogout}
          onSelectTab={setActiveTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'overview' && (
            <PrincipalOverview onNavigate={setActiveTab} />
          )}

          {activeTab === 'institutional' && <InstitutionalTimetableView />}

          {activeTab === 'departments' && <DepartmentsMonitoring />}

          {activeTab === 'faculty' && <FacultyWorkloadSummary />}

          {activeTab === 'published' && <PrincipalVTUTimetableView />}
        </main>
      </div>
    </div>
  );
};

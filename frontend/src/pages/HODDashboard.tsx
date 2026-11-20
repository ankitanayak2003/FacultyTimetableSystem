import React, { useState } from 'react';
import { HODSidebar, HODTab } from '../components/hod/HODSidebar';
import { HODHeader } from '../components/hod/HODHeader';
import { HODDepartmentTimetableView } from '../components/hod/HODDepartmentTimetableView';
import { HODWorkloadPreferencesView } from '../components/hod/HODWorkloadPreferencesView';
import { HODTimetableProgressView } from '../components/hod/HODTimetableProgressView';

interface HODDashboardProps {
  onLogout: () => void;
}

export const HODDashboard: React.FC<HODDashboardProps> = ({ onLogout }) => {
  // Default landing page after HOD login must strictly be 'department-timetable'
  const [activeTab, setActiveTab] = useState<HODTab>('department-timetable');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      <HODSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={onLogout}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex-1 flex flex-col min-w-0 relative transition-all duration-300">
        <HODHeader
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />

        <main className="flex-1 p-3.5 sm:p-5 lg:p-5 max-w-7xl w-full mx-auto space-y-4">
          {(activeTab === 'department-timetable' ||
            activeTab === 'timetable' ||
            activeTab === 'overview' ||
            activeTab === 'published') && <HODDepartmentTimetableView />}

          {(activeTab === 'workload-preferences' ||
            activeTab === 'workload' ||
            activeTab === 'preferences' ||
            activeTab === 'faculty' ||
            activeTab === 'allocations') && <HODWorkloadPreferencesView />}

          {(activeTab === 'timetable-progress' ||
            activeTab === 'progress') && <HODTimetableProgressView />}
        </main>
      </div>
    </div>
  );
};

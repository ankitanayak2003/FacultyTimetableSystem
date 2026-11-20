import React, { useState } from 'react';
import {
  BasicScienceSidebar,
  BasicScienceTab,
} from '../components/basic-science/BasicScienceSidebar';
import { BasicScienceHeader } from '../components/basic-science/BasicScienceHeader';
import { BasicScienceSubjectAllocation } from '../components/basic-science/BasicScienceSubjectAllocation';
import { CycleTimetableEditor } from '../components/basic-science/CycleTimetableEditor';
import { BasicScienceFinalTimetables } from '../components/basic-science/BasicScienceFinalTimetables';

interface BasicScienceDashboardProps {
  onLogout: () => void;
}

export const BasicScienceDashboard: React.FC<BasicScienceDashboardProps> = ({
  onLogout,
}) => {
  // Default landing page after Basic Science Coordinator login is strictly Subject & Faculty Allocation
  const [activeTab, setActiveTab] = useState<BasicScienceTab>('subject-allocation');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      {/* Sidebar - Exactly 4 Navigation items */}
      <BasicScienceSidebar
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
        <BasicScienceHeader
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onSelectTab={setActiveTab}
        />

        <main className="flex-1 p-3.5 sm:p-5 lg:p-5 max-w-7xl w-full mx-auto space-y-4">
          {activeTab === 'subject-allocation' && <BasicScienceSubjectAllocation />}

          {activeTab === 'chemistry-timetable' && (
            <CycleTimetableEditor cycle="Chemistry" />
          )}

          {activeTab === 'physics-timetable' && (
            <CycleTimetableEditor cycle="Physics" />
          )}

          {activeTab === 'final-timetables' && <BasicScienceFinalTimetables />}
        </main>
      </div>
    </div>
  );
};

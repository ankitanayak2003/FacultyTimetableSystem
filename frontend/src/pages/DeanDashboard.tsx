import React, { useState } from 'react';
import { DeanSidebar, DeanTab } from '../components/dean/DeanSidebar';
import { DeanHeader } from '../components/dean/DeanHeader';
import { SubjectFacultyAllocation } from '../components/dean/SubjectFacultyAllocation';
import { DeanTimetableEditor } from '../components/dean/DeanTimetableEditor';
import { FinalTimetablesView } from '../components/dean/FinalTimetablesView';

interface DeanDashboardProps {
  onLogout: () => void;
}

export const DeanDashboard: React.FC<DeanDashboardProps> = ({ onLogout }) => {
  // Default landing page after Dean login is strictly Subject & Faculty Allocation
  const [activeTab, setActiveTab] = useState<DeanTab>('subject-allocation');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      {/* Sidebar - Exactly 3 Navigation items */}
      <DeanSidebar
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
        <DeanHeader
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onSelectTab={setActiveTab}
        />

        <main className="flex-1 p-3.5 sm:p-5 lg:p-5 max-w-7xl w-full mx-auto space-y-4">
          {activeTab === 'subject-allocation' && <SubjectFacultyAllocation />}

          {activeTab === 'timetable-editor' && <DeanTimetableEditor />}

          {activeTab === 'final-timetables' && <FinalTimetablesView />}
        </main>
      </div>
    </div>
  );
};

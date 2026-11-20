import React, { useState } from 'react';
import {
  DeptCoordinatorSidebar,
  DeptCoordinatorTab,
} from '../components/department-coordinator/DeptCoordinatorSidebar';
import { DeptCoordinatorHeader } from '../components/department-coordinator/DeptCoordinatorHeader';
import { FacultyAllocationView } from '../components/department-coordinator/FacultyAllocationView';
import { FacultyWorkloadPreferencesView } from '../components/department-coordinator/FacultyWorkloadPreferencesView';
import { DeptSubjectAllocationView } from '../components/department-coordinator/DeptSubjectAllocationView';
import { DeptTimetableEditor } from '../components/department-coordinator/DeptTimetableEditor';
import { DeptTimetableViewer } from '../components/department-coordinator/DeptTimetableViewer';

interface DepartmentCoordinatorDashboardProps {
  onLogout: () => void;
}

export const DepartmentCoordinatorDashboard: React.FC<
  DepartmentCoordinatorDashboardProps
> = ({ onLogout }) => {
  // Default landing page after Department Coordinator login is strictly Faculty Allocation
  const [activeTab, setActiveTab] = useState<DeptCoordinatorTab>('faculty-allocation');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      {/* Sidebar - Exactly 5 Navigation items */}
      <DeptCoordinatorSidebar
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
        <DeptCoordinatorHeader
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onSelectTab={setActiveTab}
        />

        <main className="flex-1 p-3.5 sm:p-5 lg:p-5 max-w-7xl w-full mx-auto space-y-4">
          {activeTab === 'faculty-allocation' && <FacultyAllocationView />}

          {activeTab === 'workload-preferences' && <FacultyWorkloadPreferencesView />}

          {activeTab === 'subject-allocation' && <DeptSubjectAllocationView />}

          {activeTab === 'timetable-editor' && <DeptTimetableEditor />}

          {activeTab === 'timetable-viewer' && <DeptTimetableViewer />}
        </main>
      </div>
    </div>
  );
};

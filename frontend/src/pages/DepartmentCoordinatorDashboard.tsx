import React, { useState } from 'react';
import { DeptCoordinatorTab } from '../components/department-coordinator/DeptCoordinatorSidebar';
import { DeptCoordinatorHeader } from '../components/department-coordinator/DeptCoordinatorHeader';
import { FacultyAllocationView } from '../components/department-coordinator/FacultyAllocationView';
import { FacultyWorkloadPreferencesView } from '../components/department-coordinator/FacultyWorkloadPreferencesView';
import { DeptSubjectAllocationView } from '../components/department-coordinator/DeptSubjectAllocationView';
import { DeptTimetableEditor } from '../components/department-coordinator/DeptTimetableEditor';
import { DeptTimetableViewer } from '../components/department-coordinator/DeptTimetableViewer';
import { RetractableNavBar, NavItem } from '../components/common/RetractableNavBar';

const DEPT_COORD_NAV_ITEMS: NavItem[] = [
  { id: 'faculty-allocation', label: 'Faculty Allocation' },
  { id: 'workload-preferences', label: 'Workload Preferences' },
  { id: 'subject-allocation', label: 'Subject Allocation' },
  { id: 'timetable-editor', label: 'Timetable Editor' },
  { id: 'timetable-viewer', label: 'Timetable Viewer' },
];

interface DepartmentCoordinatorDashboardProps {
  onLogout: () => void;
}

export const DepartmentCoordinatorDashboard: React.FC<
  DepartmentCoordinatorDashboardProps
> = ({ onLogout }) => {
  // Default landing page after Department Coordinator login is strictly Faculty Allocation
  const [activeTab, setActiveTab] = useState<DeptCoordinatorTab>('faculty-allocation');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink pt-14">
      <DeptCoordinatorHeader
        activeTab={activeTab}
        onOpenMobileSidebar={() => setIsMobileNavOpen((prev) => !prev)}
        onSelectTab={setActiveTab}
      />

      <RetractableNavBar
        items={DEPT_COORD_NAV_ITEMS}
        activeTab={activeTab}
        onSelectTab={(id) => setActiveTab(id as DeptCoordinatorTab)}
        onLogout={onLogout}
        isOpenControlled={isMobileNavOpen}
        onToggleControlled={() => setIsMobileNavOpen((prev) => !prev)}
      />

      <main className="flex-1 p-3.5 sm:p-5 lg:p-5 max-w-7xl w-full mx-auto space-y-4">
        {activeTab === 'faculty-allocation' && <FacultyAllocationView />}

        {activeTab === 'workload-preferences' && <FacultyWorkloadPreferencesView />}

        {activeTab === 'subject-allocation' && <DeptSubjectAllocationView />}

        {activeTab === 'timetable-editor' && <DeptTimetableEditor />}

        {activeTab === 'timetable-viewer' && <DeptTimetableViewer />}
      </main>
    </div>
  );
};

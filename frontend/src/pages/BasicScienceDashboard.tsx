import React, { useState } from 'react';
import { BasicScienceTab } from '../components/basic-science/BasicScienceSidebar';
import { BasicScienceHeader } from '../components/basic-science/BasicScienceHeader';
import { BasicScienceFacultyManagementView } from '../components/basic-science/BasicScienceFacultyManagementView';
import { BasicScienceSubjectAllocation } from '../components/basic-science/BasicScienceSubjectAllocation';
import { BasicScienceWorkloadView } from '../components/basic-science/BasicScienceWorkloadView';
import { CycleTimetableEditor } from '../components/basic-science/CycleTimetableEditor';
import { BasicScienceFinalTimetables } from '../components/basic-science/BasicScienceFinalTimetables';
import { RetractableNavBar, NavItem } from '../components/common/RetractableNavBar';

const BASIC_SCI_NAV_ITEMS: NavItem[] = [
  { id: 'faculty-allocation', label: 'Faculty Allocation' },
  { id: 'subject-allocation', label: 'Subject & Faculty Allocation' },
  { id: 'faculty-workload', label: 'Faculty Workload' },
  { id: 'chemistry-timetable', label: 'Chemistry Cycle' },
  { id: 'physics-timetable', label: 'Physics Cycle' },
  { id: 'final-timetables', label: 'Final Timetables' },
];

interface BasicScienceDashboardProps {
  onLogout: () => void;
}

export const BasicScienceDashboard: React.FC<BasicScienceDashboardProps> = ({
  onLogout,
}) => {
  // Default landing page after Basic Science Coordinator login is strictly Subject & Faculty Allocation
  const [activeTab, setActiveTab] = useState<BasicScienceTab>('subject-allocation');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink pt-14">
      <BasicScienceHeader
        activeTab={activeTab}
        onOpenMobileSidebar={() => setIsMobileNavOpen((prev) => !prev)}
        onSelectTab={setActiveTab}
      />

      <RetractableNavBar
        items={BASIC_SCI_NAV_ITEMS}
        activeTab={activeTab}
        onSelectTab={(id) => setActiveTab(id as BasicScienceTab)}
        onLogout={onLogout}
        isOpenControlled={isMobileNavOpen}
        onToggleControlled={() => setIsMobileNavOpen((prev) => !prev)}
      />

      <main className="flex-1 p-3.5 sm:p-5 lg:p-5 max-w-7xl w-full mx-auto space-y-4">
        {activeTab === 'faculty-allocation' && <BasicScienceFacultyManagementView />}

        {activeTab === 'subject-allocation' && <BasicScienceSubjectAllocation />}

        {activeTab === 'faculty-workload' && <BasicScienceWorkloadView />}

        {activeTab === 'chemistry-timetable' && (
          <CycleTimetableEditor cycle="Chemistry" />
        )}

        {activeTab === 'physics-timetable' && (
          <CycleTimetableEditor cycle="Physics" />
        )}

        {activeTab === 'final-timetables' && <BasicScienceFinalTimetables />}
      </main>
    </div>
  );
};

import React, { useState } from 'react';
import { HODTab } from '../components/hod/HODSidebar';
import { HODHeader } from '../components/hod/HODHeader';
import { HODDepartmentTimetableView } from '../components/hod/HODDepartmentTimetableView';
import { HODWorkloadPreferencesView } from '../components/hod/HODWorkloadPreferencesView';
import { HODTimetableProgressView } from '../components/hod/HODTimetableProgressView';
import { RetractableNavBar, NavItem } from '../components/common/RetractableNavBar';

const HOD_NAV_ITEMS: NavItem[] = [
  { id: 'department-timetable', label: 'Department Timetable' },
  { id: 'workload-preferences', label: 'Workload & Preferences' },
  { id: 'timetable-progress', label: 'Timetable Progress' },
];

interface HODDashboardProps {
  onLogout: () => void;
}

export const HODDashboard: React.FC<HODDashboardProps> = ({ onLogout }) => {
  // Default landing page after HOD login must strictly be 'department-timetable'
  const [activeTab, setActiveTab] = useState<HODTab>('department-timetable');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink pt-14">
      <HODHeader
        activeTab={activeTab}
        onOpenMobileSidebar={() => setIsMobileNavOpen((prev) => !prev)}
      />

      <RetractableNavBar
        items={HOD_NAV_ITEMS}
        activeTab={activeTab}
        onSelectTab={(id) => setActiveTab(id as HODTab)}
        onLogout={onLogout}
        isOpenControlled={isMobileNavOpen}
        onToggleControlled={() => setIsMobileNavOpen((prev) => !prev)}
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
  );
};

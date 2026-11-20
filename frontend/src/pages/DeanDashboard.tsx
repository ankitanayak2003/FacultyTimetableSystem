import React, { useState } from 'react';
import { DeanTab } from '../components/dean/DeanSidebar';
import { DeanHeader } from '../components/dean/DeanHeader';
import { SubjectFacultyAllocation } from '../components/dean/SubjectFacultyAllocation';
import { DeanTimetableEditor } from '../components/dean/DeanTimetableEditor';
import { FinalTimetablesView } from '../components/dean/FinalTimetablesView';
import { RetractableNavBar, NavItem } from '../components/common/RetractableNavBar';

const DEAN_NAV_ITEMS: NavItem[] = [
  { id: 'subject-allocation', label: 'Subject & Faculty Allocation' },
  { id: 'timetable-editor', label: 'Timetable Editor' },
  { id: 'final-timetables', label: 'Final Timetables' },
];

interface DeanDashboardProps {
  onLogout: () => void;
}

export const DeanDashboard: React.FC<DeanDashboardProps> = ({ onLogout }) => {
  // Default landing page after Dean login is strictly Subject & Faculty Allocation
  const [activeTab, setActiveTab] = useState<DeanTab>('subject-allocation');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink pt-14">
      <DeanHeader
        activeTab={activeTab}
        onOpenMobileSidebar={() => setIsMobileNavOpen((prev) => !prev)}
        onSelectTab={setActiveTab}
      />

      <RetractableNavBar
        items={DEAN_NAV_ITEMS}
        activeTab={activeTab}
        onSelectTab={(id) => setActiveTab(id as DeanTab)}
        onLogout={onLogout}
        isOpenControlled={isMobileNavOpen}
        onToggleControlled={() => setIsMobileNavOpen((prev) => !prev)}
      />

      <main className="flex-1 p-3.5 sm:p-5 lg:p-5 max-w-7xl w-full mx-auto space-y-4">
        {activeTab === 'subject-allocation' && <SubjectFacultyAllocation />}

        {activeTab === 'timetable-editor' && <DeanTimetableEditor />}

        {activeTab === 'final-timetables' && <FinalTimetablesView />}
      </main>
    </div>
  );
};

import React, { useState } from 'react';
import { PrincipalTab } from '../components/principal/PrincipalSidebar';
import { PrincipalHeader } from '../components/principal/PrincipalHeader';
import { InstitutionalManagementView } from '../components/principal/InstitutionalManagementView';
import { PrincipalFacultyManagementView } from '../components/principal/PrincipalFacultyManagementView';
import { InstitutionalTimetableView } from '../components/principal/InstitutionalTimetableView';
import { AcademicMonitoringView } from '../components/principal/AcademicMonitoringView';
import { RetractableNavBar, NavItem } from '../components/common/RetractableNavBar';

const PRINCIPAL_NAV_ITEMS: NavItem[] = [
  { id: 'institutional-management', label: 'Institutional Management' },
  { id: 'faculty-management', label: 'Faculty Directory' },
  { id: 'institutional-timetable', label: 'Institutional Timetables' },
  { id: 'academic-monitoring', label: 'Academic Monitoring' },
];

interface PrincipalDashboardProps {
  onLogout: () => void;
}

export const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({ onLogout }) => {
  // Default landing page after Principal login is strictly Institutional Management
  const [activeTab, setActiveTab] = useState<PrincipalTab>('institutional-management');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink pt-14">
      <PrincipalHeader
        activeTab={activeTab}
        onOpenMobileSidebar={() => setIsMobileNavOpen((prev) => !prev)}
      />

      <RetractableNavBar
        items={PRINCIPAL_NAV_ITEMS}
        activeTab={activeTab}
        onSelectTab={(id) => setActiveTab(id as PrincipalTab)}
        onLogout={onLogout}
        isOpenControlled={isMobileNavOpen}
        onToggleControlled={() => setIsMobileNavOpen((prev) => !prev)}
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
  );
};

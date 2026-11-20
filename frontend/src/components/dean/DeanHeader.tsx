import React from 'react';
import { DeanTab } from './DeanSidebar';
import { GlobalTopHeader } from '../common/GlobalTopHeader';

interface DeanHeaderProps {
  activeTab: DeanTab;
  onOpenMobileSidebar?: () => void;
  onSelectTab?: (tab: DeanTab) => void;
}

export const DeanHeader: React.FC<DeanHeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
}) => {
  const getTabTitle = (tab: DeanTab) => {
    switch (tab) {
      case 'subject-allocation':
        return 'Subject & Faculty Allocation';
      case 'timetable-editor':
        return 'Timetable Editor';
      case 'final-timetables':
        return 'Final Timetables';
      default:
        return 'Dean Academic Platform';
    }
  };

  return (
    <GlobalTopHeader
      breadcrumbCategory="Office of Academic Affairs"
      breadcrumbModule="Dean Module"
      pageTitle={getTabTitle(activeTab)}
      userName="Dr. Sudarshan Rao"
      academicYear="AY 2026–27"
      onToggleMobileNav={onOpenMobileSidebar}
    />
  );
};

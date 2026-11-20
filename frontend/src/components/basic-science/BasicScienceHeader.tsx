import React from 'react';
import { BasicScienceTab } from './BasicScienceSidebar';
import { GlobalTopHeader } from '../common/GlobalTopHeader';

interface BasicScienceHeaderProps {
  activeTab: BasicScienceTab;
  onOpenMobileSidebar?: () => void;
  onSelectTab?: (tab: BasicScienceTab) => void;
}

export const BasicScienceHeader: React.FC<BasicScienceHeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
}) => {
  const getTabTitle = (tab: BasicScienceTab) => {
    switch (tab) {
      case 'subject-allocation':
        return 'Subject & Faculty Allocation';
      case 'chemistry-timetable':
        return 'Chemistry Cycle Timetable';
      case 'physics-timetable':
        return 'Physics Cycle Timetable';
      case 'final-timetables':
        return 'Final Timetables';
      default:
        return 'Basic Science Academic Platform';
    }
  };

  return (
    <GlobalTopHeader
      breadcrumbCategory="Academic Affairs"
      breadcrumbModule="Basic Science Coordinator Module"
      pageTitle={getTabTitle(activeTab)}
      userName="Dr. Ravindra Shenoy"
      onToggleMobileNav={onOpenMobileSidebar}
    />
  );
};

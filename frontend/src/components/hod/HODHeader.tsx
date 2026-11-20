import React from 'react';
import { HODTab } from './HODSidebar';
import { GlobalTopHeader } from '../common/GlobalTopHeader';

interface HODHeaderProps {
  activeTab: HODTab;
  onOpenMobileSidebar?: () => void;
}

export const HODHeader: React.FC<HODHeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
}) => {
  const getTabTitle = (tab: HODTab) => {
    switch (tab) {
      case 'department-timetable':
      case 'timetable':
      case 'overview':
      case 'published':
        return 'Department Timetable';
      case 'workload-preferences':
      case 'workload':
      case 'preferences':
      case 'faculty':
      case 'allocations':
        return 'Faculty Workload & Subject Preferences';
      case 'timetable-progress':
      case 'progress':
        return 'Department Timetable Progress';
      default:
        return 'Department Timetable';
    }
  };

  return (
    <GlobalTopHeader
      breadcrumbCategory="Department of AI & DS"
      breadcrumbModule="Head of Department"
      pageTitle={getTabTitle(activeTab)}
      userName="Dr. Vasudeva"
      onToggleMobileNav={onOpenMobileSidebar}
    />
  );
};

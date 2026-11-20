import React from 'react';
import { DeptCoordinatorTab } from './DeptCoordinatorSidebar';
import { GlobalTopHeader } from '../common/GlobalTopHeader';

interface DeptCoordinatorHeaderProps {
  activeTab: DeptCoordinatorTab;
  onOpenMobileSidebar?: () => void;
  onSelectTab?: (tab: DeptCoordinatorTab) => void;
}

export const DeptCoordinatorHeader: React.FC<DeptCoordinatorHeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
}) => {
  const getTabTitle = (tab: DeptCoordinatorTab) => {
    switch (tab) {
      case 'faculty-allocation':
        return 'Faculty Allocation';
      case 'workload-preferences':
        return 'Faculty Workload & Preferences';
      case 'subject-allocation':
        return 'Subject Allocation';
      case 'timetable-editor':
        return 'Timetable Editor';
      case 'timetable-viewer':
        return 'Timetable Viewer';
      default:
        return 'Department Coordinator Platform';
    }
  };

  return (
    <GlobalTopHeader
      breadcrumbCategory="Department of Artificial Intelligence & Data Science"
      breadcrumbModule="Coordinator Module"
      pageTitle={getTabTitle(activeTab)}
      userName="Prof. Rajesh Shetty"
      onToggleMobileNav={onOpenMobileSidebar}
    />
  );
};

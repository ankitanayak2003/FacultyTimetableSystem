import React from 'react';
import { FacultyTab } from './FacultySidebar';
import { FacultyProfileData } from '../../data/facultyDemoData';
import { GlobalTopHeader } from '../common/GlobalTopHeader';

interface FacultyHeaderProps {
  faculty: FacultyProfileData;
  activeTab: FacultyTab;
  onOpenMobileMenu?: () => void;
}

export const FacultyHeader: React.FC<FacultyHeaderProps> = ({
  faculty,
  activeTab,
  onOpenMobileMenu,
}) => {
  const getTabTitle = (tab: FacultyTab) => {
    switch (tab) {
      case 'my-timetable':
      case 'timetable':
        return 'My Timetable';
      case 'preferences-workload':
      case 'preferences':
      case 'workload':
        return 'Subject Preferences & My Workload';
      case 'leave-requests':
      case 'leaves':
        return 'Leave Requests';
      default:
        return 'Faculty Academic Portal';
    }
  };

  return (
    <GlobalTopHeader
      breadcrumbCategory="Department of Artificial Intelligence & Data Science"
      breadcrumbModule="Faculty Portal"
      pageTitle={getTabTitle(activeTab)}
      userName={faculty?.fullName || 'Dr. Ananya Rao'}
      onToggleMobileNav={onOpenMobileMenu}
    />
  );
};

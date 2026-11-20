import React from 'react';
import { PrincipalTab } from './PrincipalSidebar';
import { GlobalTopHeader } from '../common/GlobalTopHeader';

interface PrincipalHeaderProps {
  activeTab: PrincipalTab;
  onOpenMobileSidebar?: () => void;
}

export const PrincipalHeader: React.FC<PrincipalHeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
}) => {
  const getTabTitle = (tab: PrincipalTab) => {
    switch (tab) {
      case 'institutional-management':
      case 'overview':
        return 'Institutional Management';
      case 'faculty-management':
      case 'faculty':
        return 'Faculty Management';
      case 'institutional-timetable':
      case 'institutional':
      case 'published':
        return 'Institutional Timetable';
      case 'academic-monitoring':
      case 'departments':
        return 'Academic Monitoring';
      default:
        return 'Institutional Management';
    }
  };

  return (
    <GlobalTopHeader
      breadcrumbCategory="SMVITM Administration"
      breadcrumbModule="Institutional Oversight"
      pageTitle={getTabTitle(activeTab)}
      userName="Dr. Thirumaleshwara Bhat"
      onToggleMobileNav={onOpenMobileSidebar}
    />
  );
};

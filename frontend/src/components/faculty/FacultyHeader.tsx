import React from 'react';
import { Menu } from 'lucide-react';
import { FacultyTab } from './FacultySidebar';
import { FacultyProfileData } from '../../data/facultyDemoData';

interface FacultyHeaderProps {
  faculty: FacultyProfileData;
  activeTab: FacultyTab;
  onOpenMobileMenu: () => void;
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
    <header className="sticky top-0 z-30 w-full bg-surface/95 backdrop-blur-md border-b border-border-beige py-2 px-4 sm:px-6 shadow-crisp-sm transition-all duration-200">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Active Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="md:hidden p-1.5 text-ink-muted hover:text-ink hover:bg-canvas-muted rounded-card transition-colors flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-ink-light">
              <span>Department of Artificial Intelligence &amp; Data Science</span>
              <span>/</span>
              <span className="text-primary font-semibold">Faculty Portal</span>
            </div>
            <h1 className="font-headline text-base sm:text-lg font-semibold text-primary truncate leading-tight">
              {getTabTitle(activeTab)}
            </h1>
          </div>
        </div>

        {/* Right: Logged-in faculty identity and role badge */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-canvas-paper rounded-card border border-border-beige shadow-crisp-sm">
            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px] font-mono shadow-crisp-sm flex-shrink-0">
              AR
            </div>
            <div className="text-xs">
              <span className="font-semibold text-ink">
                {faculty.fullName} <span className="text-ink-light font-normal">•</span> {faculty.designation} (AI&amp;DS)
              </span>
            </div>
            <span className="ml-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-white uppercase tracking-wider shadow-xs">
              Faculty
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

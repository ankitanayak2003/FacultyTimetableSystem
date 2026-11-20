import React from 'react';
import { Menu } from 'lucide-react';
import { BasicScienceTab } from './BasicScienceSidebar';

interface BasicScienceHeaderProps {
  activeTab: BasicScienceTab;
  onOpenMobileSidebar: () => void;
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
    <header className="sticky top-0 z-30 w-full bg-surface/95 backdrop-blur-md border-b border-border-beige py-2 px-4 sm:px-6 shadow-crisp-sm transition-all duration-200">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Active Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-label="Open navigation menu"
            className="md:hidden p-1.5 text-ink-muted hover:text-ink hover:bg-canvas-muted rounded-card transition-colors flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-ink-light">
              <span>Academic Affairs</span>
              <span>/</span>
              <span className="text-primary font-semibold">Basic Science Coordinator Module</span>
            </div>
            <h1 className="font-headline text-base sm:text-lg font-semibold text-primary truncate leading-tight">
              {getTabTitle(activeTab)}
            </h1>
          </div>
        </div>

        {/* Right: Logged-in user's identity and role badge */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 px-2.5 py-1 bg-canvas-paper rounded-card border border-border-beige shadow-crisp-sm">
            <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[10px] font-mono shadow-crisp-sm flex-shrink-0">
              RS
            </div>
            <div className="text-xs">
              <span className="font-semibold text-ink">
                Dr. Ravindra Shenoy <span className="text-ink-light font-normal">•</span> Basic Science Coordinator
              </span>
            </div>
            <span className="ml-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-primary text-white uppercase tracking-wider shadow-xs">
              Basic Science
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

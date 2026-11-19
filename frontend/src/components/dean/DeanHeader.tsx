import React from 'react';
import { Menu } from 'lucide-react';
import { DeanTab } from './DeanSidebar';

interface DeanHeaderProps {
  activeTab: DeanTab;
  onOpenMobileSidebar: () => void;
  onSelectTab: (tab: DeanTab) => void;
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
    <header className="sticky top-0 z-30 w-full bg-surface/95 backdrop-blur-md border-b border-border-beige py-3 px-4 sm:px-6 shadow-crisp-sm transition-all duration-200">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Active Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            aria-label="Open navigation menu"
            className="md:hidden p-2 text-ink-muted hover:text-ink hover:bg-canvas-muted rounded-card transition-colors flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-ink-light">
              <span>Office of Academic Affairs</span>
              <span>/</span>
              <span className="text-primary font-semibold">Dean Module</span>
            </div>
            <h1 className="font-headline text-lg sm:text-xl font-semibold text-primary truncate">
              {getTabTitle(activeTab)}
            </h1>
          </div>
        </div>

        {/* Right: Logged-in user's identity and role badge */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-canvas-paper rounded-card border border-border-beige shadow-crisp-sm">
            <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs font-mono shadow-crisp-sm flex-shrink-0">
              SR
            </div>
            <div className="text-xs">
              <span className="font-semibold text-ink">
                Dr. Sudarshan Rao <span className="text-ink-light font-normal">•</span> Dean (Academic Affairs)
              </span>
            </div>
            <span className="ml-1 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-primary text-white uppercase tracking-wider shadow-xs">
              Dean
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

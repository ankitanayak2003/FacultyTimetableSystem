import React from 'react';
import { Menu, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { HODTab } from './HODSidebar';

interface HODHeaderProps {
  activeTab: HODTab;
  onOpenMobileSidebar: () => void;
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
    <header className="sticky top-0 z-30 w-full bg-surface/95 backdrop-blur-md border-b border-border-beige py-2.5 px-4 sm:px-6 shadow-crisp-sm transition-all duration-200">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile toggle & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 text-ink-muted hover:text-ink hover:bg-canvas-muted rounded-card transition-colors"
            aria-label="Open mobile navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-ink-light">
              <span>Department of AI &amp; DS</span>
              <span>/</span>
              <span className="text-primary font-semibold">Head of Department</span>
            </div>
            <h1 className="font-headline text-lg sm:text-xl font-semibold text-primary truncate">
              {getTabTitle(activeTab)}
            </h1>
          </div>
        </div>

        {/* Right: Academic year badge & User identity */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary-subtle text-primary border border-primary/20 text-xs font-mono font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
            <span>Academic Year 2026–27 (Odd Sem)</span>
          </div>

          <div className="flex items-center gap-2.5 pl-3 border-l border-border-subtle text-xs">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs font-mono flex-shrink-0">
              DV
            </div>
            <div className="hidden md:block text-left leading-tight">
              <span className="font-semibold text-ink block text-xs">Dr. Vasudeva</span>
              <span className="text-[10px] text-ink-light font-mono flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-primary inline" />
                HOD • AI &amp; DS
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

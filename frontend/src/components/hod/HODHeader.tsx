import React from 'react';
import { Menu, Bell, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { HODTab } from './HODSidebar';

interface HODHeaderProps {
  activeTab: HODTab;
  onOpenMobileSidebar: () => void;
  onSelectTab: (tab: HODTab) => void;
  unreadCount?: number;
}

export const HODHeader: React.FC<HODHeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
  onSelectTab,
  unreadCount = 2,
}) => {
  const getTabTitle = (tab: HODTab) => {
    switch (tab) {
      case 'overview':
        return 'Department Executive Overview';
      case 'timetable':
        return 'Department Master Timetable';
      case 'faculty':
        return 'Faculty Allocation & Workload';
      case 'allocations':
        return 'Subject Allocation Monitor';
      case 'workload':
        return 'Faculty Workload Equity Audit';
      case 'preferences':
        return 'Faculty Teaching Preferences';
      case 'progress':
        return 'Department Scheduling Progress';
      case 'published':
        return 'Officially Published Timetable';
      case 'notifications':
        return 'Department Academic Announcements';
      case 'profile':
        return 'HOD Profile';
      default:
        return 'HOD Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-surface/95 backdrop-blur-md border-b border-border-beige py-3 px-4 sm:px-6 shadow-crisp-sm transition-all duration-200">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile toggle & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="md:hidden p-2 text-ink-muted hover:text-ink hover:bg-canvas-muted rounded-card transition-colors"
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

        {/* Right: Quick actions & profile */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary-subtle text-primary border border-primary/20 text-xs font-mono font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Academic Year 2026–27</span>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab('notifications')}
            className="relative p-2 text-ink-muted hover:text-primary hover:bg-canvas-muted rounded-card transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent-gold" />
            )}
          </button>

          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-border-subtle text-xs">
            <div className="text-right">
              <span className="font-semibold text-ink block">Dr. Vasudeva</span>
              <span className="text-[10px] text-ink-light font-mono flex items-center justify-end gap-1">
                <ShieldCheck className="w-3 h-3 text-primary" />
                HOD (AI &amp; DS)
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

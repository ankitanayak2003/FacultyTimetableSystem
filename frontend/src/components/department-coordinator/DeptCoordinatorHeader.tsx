import React from 'react';
import { Menu, Bell, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DeptCoordinatorTab } from './DeptCoordinatorSidebar';
import { useWorkflow } from '../../context/WorkflowContext';

interface DeptCoordinatorHeaderProps {
  activeTab: DeptCoordinatorTab;
  onOpenMobileSidebar: () => void;
  onSelectTab: (tab: DeptCoordinatorTab) => void;
  unreadCount?: number;
}

export const DeptCoordinatorHeader: React.FC<DeptCoordinatorHeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
  onSelectTab,
  unreadCount = 2,
}) => {
  const { departmentStatus, basicScienceStatus } = useWorkflow();

  const isGated = basicScienceStatus !== 'LOCKED';

  const getTabTitle = (tab: DeptCoordinatorTab) => {
    switch (tab) {
      case 'overview':
        return 'Department Timetable Coordination';
      case 'institutional':
        return 'Institutional Constraint Slots';
      case 'basic-science':
        return 'First-Year Basic Science Rotation';
      case 'faculty':
        return 'Department Faculty Roster';
      case 'preferences':
        return 'Faculty Preference Evaluation';
      case 'workload':
        return 'Workload Distribution Audit';
      case 'allocations':
        return 'Subject Allocation Matrix';
      case 'builder':
        return 'Interactive Schedule Builder';
      case 'clashes':
        return 'Real-Time Conflict Audit';
      case 'final':
        return 'Finalize & HOD Submission Gateway';
      case 'export':
        return 'Official Publication & Export';
      case 'notifications':
        return 'Coordinator Announcements';
      case 'profile':
        return 'Coordinator Profile';
      default:
        return 'Coordinator Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-surface/95 backdrop-blur-md border-b border-border-beige py-3 px-4 sm:px-6 shadow-crisp-sm transition-all duration-200">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & Title */}
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
              <span className="text-primary font-semibold">Stage 3: Department Coordination</span>
            </div>
            <h1 className="font-headline text-lg sm:text-xl font-semibold text-primary truncate">
              {getTabTitle(activeTab)}
            </h1>
          </div>
        </div>

        {/* Right: Gated status & profile */}
        <div className="flex items-center gap-3">
          {/* Gating alert if Stage 2 not locked */}
          {isGated && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-300 text-xs font-mono font-medium animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              <span>Awaiting Basic Science Lock</span>
            </div>
          )}

          {/* Department Stage Status Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary-subtle text-primary border border-primary/20 text-xs font-mono font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              Stage 3: {departmentStatus}
            </span>
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
              <span className="font-semibold text-ink block">Prof. Rajesh Shetty</span>
              <span className="text-[10px] text-ink-light font-mono flex items-center justify-end gap-1">
                <ShieldCheck className="w-3 h-3 text-primary" />
                Coordinator
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

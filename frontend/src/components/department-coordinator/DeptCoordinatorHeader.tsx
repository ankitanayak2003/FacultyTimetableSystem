import React from 'react';
import { Menu, Bell, ShieldCheck, LogOut, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DeptCoordinatorTab } from './DeptCoordinatorSidebar';
import { useWorkflow } from '../../context/WorkflowContext';

interface DeptCoordinatorHeaderProps {
  activeTab: DeptCoordinatorTab;
  onOpenMobileSidebar: () => void;
  onLogout: () => void;
  onSelectTab: (tab: DeptCoordinatorTab) => void;
  unreadCount?: number;
}

export const DeptCoordinatorHeader: React.FC<DeptCoordinatorHeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
  onLogout,
  onSelectTab,
  unreadCount = 2,
}) => {
  const { departmentStatus, basicScienceStatus } = useWorkflow();

  const isGated = basicScienceStatus !== 'LOCKED';

  const getTabTitle = (tab: DeptCoordinatorTab) => {
    switch (tab) {
      case 'overview':
        return 'Department Timetable Coordinator Overview';
      case 'institutional':
        return 'Dean Institutional Locked Assignments (Read-Only)';
      case 'basic-science':
        return 'Basic Science Locked Cycles (Read-Only)';
      case 'faculty':
        return 'Department Faculty Management';
      case 'preferences':
        return 'Faculty Subject Preference Review';
      case 'workload':
        return 'Workload Balancing & Quota Monitoring';
      case 'allocations':
        return 'Subject & Laboratory Allocation Mapping';
      case 'builder':
        return 'Interactive Weekly Timetable Builder';
      case 'clashes':
        return 'Clash & Resource Constraint Engine';
      case 'final':
        return 'Final Timetable Verification & Publication';
      case 'export':
        return 'Timetable Export & PDF Printing';
      case 'notifications':
        return 'Coordinator Announcements';
      case 'profile':
        return 'Coordinator Profile';
      default:
        return 'Coordinator Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-sm border-b border-border-beige py-3 px-4 sm:px-6 shadow-crisp-sm">
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
              <span>Stage 3 Preparation</span>
              <span>/</span>
              <span className="text-primary font-semibold">AIDS Timetable Builder</span>
            </div>
            <h1 className="font-headline text-lg sm:text-xl font-semibold text-primary truncate">
              {getTabTitle(activeTab)}
            </h1>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold border ${
              isGated
                ? 'bg-amber-50 text-amber-800 border-amber-300'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
            }`}
          >
            {isGated ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Stage 3: GATED</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>AIDS: {departmentStatus}</span>
              </>
            )}
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

          <button
            type="button"
            onClick={onLogout}
            className="p-2 text-ink-light hover:text-error hover:bg-error/10 rounded-card transition-colors"
            title="Exit Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

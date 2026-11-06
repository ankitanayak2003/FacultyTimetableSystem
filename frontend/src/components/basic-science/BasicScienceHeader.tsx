import React from 'react';
import { Menu, Bell, ShieldCheck, Lock, Unlock, AlertTriangle } from 'lucide-react';
import { BasicScienceTab } from './BasicScienceSidebar';
import { useWorkflow } from '../../context/WorkflowContext';

interface BasicScienceHeaderProps {
  activeTab: BasicScienceTab;
  onOpenMobileSidebar: () => void;
  onSelectTab: (tab: BasicScienceTab) => void;
  unreadCount?: number;
}

export const BasicScienceHeader: React.FC<BasicScienceHeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
  onSelectTab,
  unreadCount = 1,
}) => {
  const { basicScienceStatus, basicScienceVersion, deanStatus } = useWorkflow();

  const isGated = deanStatus !== 'LOCKED';

  const getTabTitle = (tab: BasicScienceTab) => {
    switch (tab) {
      case 'overview':
        return 'First-Year Basic Science Coordination';
      case 'institutional':
        return 'Dean Institutional Constraints';
      case 'sections':
        return 'First-Year Section Matrix';
      case 'cycles':
        return 'Physics / Chemistry Cycle Allocation';
      case 'faculty':
        return 'Basic Science Faculty Workload';
      case 'preview':
        return 'Stage 2 Integrated Schedule Preview';
      case 'clashes':
        return 'Cross-Department Clash Audit';
      case 'lock':
        return 'Stage 2 Lock Certification';
      case 'versions':
        return 'Schedule Version Audit Log';
      case 'notifications':
        return 'First-Year Academic Circulars';
      case 'profile':
        return 'Coordinator Profile';
      default:
        return 'Basic Science Portal';
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
              <span>Academic Affairs</span>
              <span>/</span>
              <span className="text-primary font-semibold">Stage 2: Basic Science</span>
            </div>
            <h1 className="font-headline text-lg sm:text-xl font-semibold text-primary truncate">
              {getTabTitle(activeTab)}
            </h1>
          </div>
        </div>

        {/* Right: Gated status & profile */}
        <div className="flex items-center gap-3">
          {/* Gating warning if Stage 1 not locked */}
          {isGated && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-800 border border-amber-300 text-xs font-mono font-medium animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              <span>Awaiting Dean Lock</span>
            </div>
          )}

          {/* Stage Status Badge */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-medium border ${
              basicScienceStatus === 'LOCKED'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            {basicScienceStatus === 'LOCKED' ? (
              <Lock className="w-3.5 h-3.5 text-emerald-700" />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-amber-700" />
            )}
            <span>
              Stage 2: {basicScienceStatus} ({basicScienceVersion})
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

          {/* User badge */}
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-border-subtle text-xs">
            <div className="text-right">
              <span className="font-semibold text-ink block">Dr. Ravindra</span>
              <span className="text-[10px] text-ink-light font-mono flex items-center justify-end gap-1">
                <ShieldCheck className="w-3 h-3 text-primary" />
                BS Coordinator
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

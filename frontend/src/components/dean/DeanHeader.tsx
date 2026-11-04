import React from 'react';
import { Menu, Bell, ShieldCheck, LogOut, Lock, Unlock } from 'lucide-react';
import { DeanTab } from './DeanSidebar';
import { useWorkflow } from '../../context/WorkflowContext';

interface DeanHeaderProps {
  activeTab: DeanTab;
  onOpenMobileSidebar: () => void;
  onLogout: () => void;
  onSelectTab: (tab: DeanTab) => void;
  unreadCount?: number;
}

export const DeanHeader: React.FC<DeanHeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
  onLogout,
  onSelectTab,
  unreadCount = 2,
}) => {
  const { deanStatus, deanVersion } = useWorkflow();

  const getTabTitle = (tab: DeanTab) => {
    switch (tab) {
      case 'overview':
        return 'Dean Academics Overview';
      case 'institutional':
        return 'Master Institutional Schedule';
      case 'fixed-slots':
        return 'Fixed Slot Configuration';
      case 'faculty':
        return 'Institutional Faculty Assignments';
      case 'activities':
        return 'Academic & Extension Activities';
      case 'preview':
        return 'Weekly Grid Preview & Clash Detection';
      case 'lock-reopen':
        return 'Lock / Reopen Governance Control';
      case 'versions':
        return 'Schedule Version History';
      case 'notifications':
        return 'Academic Circulars & Alerts';
      case 'profile':
        return 'Dean Office Profile';
      default:
        return 'Dean Dashboard';
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
              <span>Stage 1 Governance</span>
              <span>/</span>
              <span className="text-primary font-semibold">Institutional Allocation</span>
            </div>
            <h1 className="font-headline text-lg sm:text-xl font-semibold text-primary truncate">
              {getTabTitle(activeTab)}
            </h1>
          </div>
        </div>

        {/* Right: Lock Status Pill & Profile */}
        <div className="flex items-center gap-3">
          {/* Lock status pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono font-semibold border ${
              deanStatus === 'LOCKED'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-amber-50 text-amber-800 border-amber-300'
            }`}
          >
            {deanStatus === 'LOCKED' ? (
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-amber-600" />
            )}
            <span>
              Stage 1: {deanStatus} ({deanVersion})
            </span>
          </div>

          {/* Notifications */}
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

          {/* Dean badge */}
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-border-subtle text-xs">
            <div className="text-right">
              <span className="font-semibold text-ink block">Dr. Sudarshan Rao</span>
              <span className="text-[10px] text-ink-light font-mono flex items-center justify-end gap-1">
                <ShieldCheck className="w-3 h-3 text-primary" />
                Dean Academics
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

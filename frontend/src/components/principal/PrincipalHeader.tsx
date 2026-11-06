import React from 'react';
import { Menu, ShieldCheck, LogOut, CheckCircle2 } from 'lucide-react';
import { PrincipalTab } from './PrincipalSidebar';

interface PrincipalHeaderProps {
  activeTab: PrincipalTab;
  onOpenMobileSidebar: () => void;
  onLogout: () => void;
  onSelectTab: (tab: PrincipalTab) => void;
}

export const PrincipalHeader: React.FC<PrincipalHeaderProps> = ({
  activeTab,
  onOpenMobileSidebar,
  onLogout,
}) => {
  const getTabTitle = (tab: PrincipalTab) => {
    switch (tab) {
      case 'overview':
        return 'Institutional Executive Overview';
      case 'institutional':
        return 'Institutional Timetable & Common Slots';
      case 'departments':
        return 'Department Timetable Monitoring';
      case 'faculty':
        return 'Institution-Wide Faculty Workload';
      case 'published':
        return 'Officially Published Timetables';
      default:
        return 'Principal Dashboard';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-surface/95 backdrop-blur-md border-b border-border-beige py-3 px-4 sm:px-6 shadow-crisp-sm transition-all duration-200">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Hamburger & Breadcrumbs */}
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
              <span>SMVITM Administration</span>
              <span>/</span>
              <span className="text-primary font-semibold">Institutional Oversight</span>
            </div>
            <h1 className="font-headline text-lg sm:text-xl font-semibold text-primary truncate">
              {getTabTitle(activeTab)}
            </h1>
          </div>
        </div>

        {/* Right: Compliance badge & profile */}
        <div className="flex items-center gap-3">
          {/* Institutional Compliance Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary-subtle text-primary border border-primary/20 text-xs font-mono font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>VTU Academic Cal. 2026–27</span>
          </div>

          {/* Principal Info & Exit */}
          <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-border-subtle text-xs">
            <div className="text-right">
              <span className="font-semibold text-ink block">Dr. Thirumaleshwara Bhat</span>
              <span className="text-[10px] text-ink-light font-mono flex items-center justify-end gap-1">
                <ShieldCheck className="w-3 h-3 text-primary" />
                Principal
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="Sign out of Principal Portal"
            className="p-2 text-ink-muted hover:text-error hover:bg-error/10 rounded-card transition-colors border border-border-beige hover:border-error/20"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

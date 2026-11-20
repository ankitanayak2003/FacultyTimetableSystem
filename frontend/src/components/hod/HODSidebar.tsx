import React from 'react';
import {
  Calendar,
  Scale,
  CheckCircle2,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import smvitmLogo from '../../assets/smvitm_logo.webp';

export type HODTab =
  | 'department-timetable'
  | 'workload-preferences'
  | 'timetable-progress'
  // Legacy compatibility types
  | 'overview'
  | 'timetable'
  | 'faculty'
  | 'allocations'
  | 'workload'
  | 'preferences'
  | 'progress'
  | 'published'
  | 'notifications'
  | 'profile';

interface HODSidebarProps {
  activeTab: HODTab;
  onSelectTab: (tab: HODTab) => void;
  onLogout: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const HODSidebar: React.FC<HODSidebarProps> = ({
  activeTab,
  onSelectTab,
  onLogout,
  isOpenMobile = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  // Exactly THREE navigation items as specified for HOD module
  const navItems = [
    {
      id: 'department-timetable' as HODTab,
      label: 'Department Timetable',
      icon: Calendar,
      matchTabs: ['department-timetable', 'timetable', 'published', 'overview'],
    },
    {
      id: 'workload-preferences' as HODTab,
      label: 'Faculty Workload & Preferences',
      icon: Scale,
      matchTabs: ['workload-preferences', 'workload', 'preferences', 'faculty', 'allocations'],
    },
    {
      id: 'timetable-progress' as HODTab,
      label: 'Timetable Progress',
      icon: CheckCircle2,
      matchTabs: ['timetable-progress', 'progress'],
    },
  ];

  const isTabActive = (item: (typeof navItems)[0]) => {
    return activeTab === item.id || item.matchTabs.includes(activeTab);
  };

  const handleNavClick = (tab: HODTab) => {
    onSelectTab(tab);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          role="presentation"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-xs md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        aria-label="HOD Portal Navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 bg-surface border-r border-border-beige flex flex-col justify-between transition-all duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:z-40 overflow-y-auto ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-60 lg:w-64'}`}
      >
        <div>
          {/* Header Bar */}
          <div
            className={`p-4 border-b border-border-subtle flex items-center ${
              isCollapsed ? 'justify-center' : 'justify-between'
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <img
                src={smvitmLogo}
                alt="SMVITM Logo"
                className="h-9 w-auto object-contain flex-shrink-0"
              />
              {!isCollapsed && (
                <div className="min-w-0 transition-opacity duration-200">
                  <span className="font-headline font-semibold text-xs text-primary uppercase tracking-tight block truncate">
                    SMVITM Bantakal
                  </span>
                  <span className="text-[10px] font-mono text-ink-light block truncate">
                    HOD Portal — AIDS
                  </span>
                </div>
              )}
            </div>

            {/* Mobile close button */}
            {isOpenMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="md:hidden p-1.5 text-ink-muted hover:text-ink hover:bg-canvas-muted rounded-card transition-colors"
                aria-label="Close mobile navigation"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            {/* Desktop collapse toggle */}
            {onToggleCollapse && !isOpenMobile && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="hidden md:flex p-1 text-ink-muted hover:text-primary hover:bg-canvas-muted rounded transition-colors"
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-4 h-4" />
                ) : (
                  <ChevronLeft className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Navigation Links (Exactly 3) */}
          <nav className="p-3 space-y-1.5" aria-label="HOD Primary Navigation">
            {navItems.map((item) => {
              const active = isTabActive(item);
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-card text-xs font-medium transition-all ${
                    isCollapsed ? 'justify-center' : 'justify-start'
                  } ${
                    active
                      ? 'bg-primary text-white shadow-crisp font-semibold'
                      : 'text-ink-muted hover:text-ink hover:bg-canvas-muted'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      active ? 'text-white' : 'text-primary'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate text-left leading-tight">{item.label}</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: User details and Sign Out */}
        <div className="p-3 border-t border-border-subtle bg-canvas-muted/40 space-y-2">
          {!isCollapsed ? (
            <div className="flex items-center gap-2.5 px-2 py-1.5 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs font-mono flex-shrink-0">
                DV
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-ink truncate leading-tight">
                  Dr. Vasudeva
                </p>
                <div className="flex items-center gap-1 text-[10px] text-ink-light font-mono truncate">
                  <ShieldCheck className="w-3 h-3 text-primary flex-shrink-0" />
                  <span className="truncate">HOD • AI &amp; DS</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-1">
              <div
                className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs font-mono"
                title="Dr. Vasudeva (HOD - AI & DS)"
              >
                DV
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onLogout}
            title={isCollapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-accent-red hover:bg-accent-red/10 rounded-card transition-colors ${
              isCollapsed ? 'justify-center' : 'justify-start'
            }`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

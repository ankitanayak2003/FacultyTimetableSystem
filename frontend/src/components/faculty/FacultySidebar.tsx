import React from 'react';
import {
  Calendar,
  Sliders,
  CalendarDays,
  LogOut,
  X,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import smvitmLogo from '../../assets/smvitm_logo.webp';
import { FacultyProfileData } from '../../data/facultyDemoData';

export type FacultyTab =
  | 'my-timetable'
  | 'preferences-workload'
  | 'leave-requests'
  // Legacy compatibility types
  | 'overview'
  | 'timetable'
  | 'preferences'
  | 'workload'
  | 'leaves'
  | 'profile';

interface FacultySidebarProps {
  activeTab: FacultyTab;
  onSelectTab: (tab: FacultyTab) => void;
  onLogout: () => void;
  faculty: FacultyProfileData;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const FacultySidebar: React.FC<FacultySidebarProps> = ({
  activeTab,
  onSelectTab,
  onLogout,
  isOpenMobile = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  // Exactly THREE navigation items as specified
  const navItems = [
    {
      id: 'my-timetable' as FacultyTab,
      label: 'My Timetable',
      icon: Calendar,
    },
    {
      id: 'preferences-workload' as FacultyTab,
      label: 'Subject Preferences & My Workload',
      icon: Sliders,
    },
    {
      id: 'leave-requests' as FacultyTab,
      label: 'Leave Requests',
      icon: CalendarDays,
    },
  ];

  const handleNavClick = (tab: FacultyTab) => {
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
        aria-label="Faculty Portal Navigation"
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
                    Faculty Academic Portal
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Desktop Arrow Toggle Button */}
              {onToggleCollapse && (
                <button
                  type="button"
                  onClick={onToggleCollapse}
                  title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  className="hidden md:flex p-1.5 rounded-card text-ink-muted hover:text-ink hover:bg-canvas-muted transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4 text-primary" />
                  ) : (
                    <ChevronLeft className="w-4 h-4 text-primary" />
                  )}
                </button>
              )}

              {/* Mobile Close Button */}
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close sidebar"
                className="md:hidden p-1.5 text-ink-muted hover:text-ink hover:bg-canvas-muted rounded-card transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Department Faculty Role Tag */}
          {!isCollapsed && (
            <div className="mx-3 mt-3 px-3 py-2 bg-primary/5 rounded-card border border-primary/15 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-bold block truncate">
                  Faculty Member Portal
                </span>
                <span className="text-[10px] text-ink-muted block truncate">
                  Dept of AI &amp; Data Science
                </span>
              </div>
            </div>
          )}

          {/* Navigation Links - Exactly 3 items */}
          <nav aria-label="Faculty Navigation" className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-card text-xs font-medium transition-all group relative ${
                    isActive
                      ? 'bg-primary text-white shadow-crisp font-semibold'
                      : 'text-ink-muted hover:text-ink hover:bg-canvas-muted'
                  } ${isCollapsed ? 'justify-center px-2' : ''}`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-ink-light group-hover:text-primary'
                    }`}
                  />
                  {!isCollapsed && (
                    <span className="truncate text-left flex-1">{item.label}</span>
                  )}
                  {isActive && !isCollapsed && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer with Sign Out */}
        <div className="p-3 border-t border-border-subtle bg-canvas-paper/50">
          <button
            type="button"
            onClick={onLogout}
            title={isCollapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-card text-xs font-medium text-crimson hover:bg-crimson/10 transition-colors ${
              isCollapsed ? 'justify-center px-2' : ''
            }`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0 text-crimson" />
            {!isCollapsed && <span className="font-semibold">Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

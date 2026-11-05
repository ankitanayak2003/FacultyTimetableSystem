import React from 'react';
import {
  LayoutDashboard,
  CalendarRange,
  BookmarkCheck,
  Scale,
  CalendarDays,
  User,
  LogOut,
  X,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import smvitmLogo from '../../assets/smvitm_logo.webp';
import { FacultyProfileData } from '../../data/facultyDemoData';

export type FacultyTab =
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
  faculty,
  isOpenMobile = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const navItems = [
    {
      id: 'overview' as FacultyTab,
      label: 'Dashboard Overview',
      shortLabel: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'timetable' as FacultyTab,
      label: 'My Timetable',
      shortLabel: 'Timetable',
      icon: CalendarRange,
      badge: 'Odd/Even',
    },
    {
      id: 'preferences' as FacultyTab,
      label: 'Subject Preferences',
      shortLabel: 'Preferences',
      icon: BookmarkCheck,
      badge: null,
    },
    {
      id: 'workload' as FacultyTab,
      label: 'My Workload',
      shortLabel: 'Workload',
      icon: Scale,
      badge: `${faculty.assignedWeeklyHours}/${faculty.maxWeeklyWorkload}h`,
    },
    {
      id: 'leaves' as FacultyTab,
      label: 'Leave Requests',
      shortLabel: 'Leaves',
      icon: CalendarDays,
      badge: null,
    },
    {
      id: 'profile' as FacultyTab,
      label: 'My Profile',
      shortLabel: 'Profile',
      icon: User,
      badge: null,
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
          className="fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        aria-label="Faculty Portal Navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 bg-surface border-r border-border-beige flex flex-col justify-between transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:z-40 overflow-y-auto ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-72'}`}
      >
        {/* Top Section */}
        <div>
          {/* Logo & Toggle Header */}
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
                  <span className="text-[10px] uppercase font-mono tracking-wider text-ink-light block">
                    SMVITM Portal
                  </span>
                  <h2 className="font-headline font-semibold text-sm text-primary tracking-tight leading-tight truncate">
                    Faculty Workspace
                  </h2>
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
                  className="hidden lg:flex p-1.5 rounded-card text-ink-muted hover:text-primary hover:bg-canvas-muted border border-border-beige transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronLeft className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Close Button on Mobile */}
              {onCloseMobile && (
                <button
                  type="button"
                  onClick={onCloseMobile}
                  aria-label="Close menu"
                  className="p-1 rounded text-ink-muted hover:text-ink hover:bg-canvas-muted lg:hidden"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>

          {/* Faculty Designation Banner */}
          {!isCollapsed ? (
            <div className="px-5 py-3 bg-canvas-muted/50 border-b border-border-subtle transition-all duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                  <UserCheck className="w-4 h-4 text-primary" />
                  <span>Teaching Faculty</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface text-ink-muted border border-border-subtle font-medium">
                  {faculty.facultyId}
                </span>
              </div>
              <p className="text-[11px] text-ink-muted mt-1 truncate">
                {faculty.designation} • {faculty.departmentCode}
              </p>
            </div>
          ) : (
            <div
              className="py-2.5 flex justify-center bg-canvas-muted/50 border-b border-border-subtle"
              title={`Faculty: ${faculty.facultyId} • ${faculty.designation}`}
            >
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface text-ink-muted border border-border-subtle font-medium">
                {faculty.facultyId}
              </span>
            </div>
          )}

          {/* Nav Items */}
          <nav className="p-3 space-y-1.5" aria-label="Faculty Navigation">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-light font-semibold">
                Academic Modules
              </div>
            )}

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  title={item.label}
                  className={`w-full flex items-center ${
                    isCollapsed
                      ? 'justify-center px-2 py-2.5'
                      : 'justify-between px-3.5 py-2.5'
                  } rounded-card text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-crisp-sm'
                      : 'text-ink hover:bg-canvas-muted hover:text-primary'
                  }`}
                >
                  <div
                    className={`flex items-center gap-3 ${
                      isCollapsed ? 'justify-center' : 'min-w-0'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive ? 'text-white' : 'text-ink-muted'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-primary-subtle text-primary border border-primary/20'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Profile Summary & Logout */}
        <div className="p-3 border-t border-border-beige bg-canvas-muted/30 space-y-2">
          {/* Quick Profile Pill */}
          <button
            type="button"
            onClick={() => handleNavClick('profile')}
            title={faculty.fullName}
            className={`w-full ${
              isCollapsed ? 'p-2 justify-center' : 'p-2.5 justify-start'
            } rounded-card bg-surface border border-border-subtle flex items-center gap-2.5 hover:border-primary/40 transition-colors text-left`}
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center text-xs flex-shrink-0 font-mono">
              AR
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-ink truncate leading-tight">
                  {faculty.fullName}
                </span>
                <span className="block text-[10px] font-mono text-ink-light truncate mt-0.5">
                  {faculty.departmentCode} • {faculty.designation}
                </span>
              </div>
            )}
          </button>

          {/* Logout Action */}
          <button
            type="button"
            onClick={onLogout}
            title="Sign Out of Faculty Portal"
            aria-label="Sign Out"
            className={`w-full flex items-center ${
              isCollapsed
                ? 'justify-center px-2 py-2'
                : 'justify-center gap-2 px-3 py-2'
            } text-xs font-semibold text-error hover:bg-error-container/40 rounded-card transition-colors border border-transparent hover:border-error/20`}
          >
            <LogOut className="w-3.5 h-3.5 flex-shrink-0" />
            {!isCollapsed && <span>Sign Out of Faculty Portal</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

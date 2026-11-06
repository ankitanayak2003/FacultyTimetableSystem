import React from 'react';
import {
  LayoutDashboard,
  Building,
  GraduationCap,
  Users,
  CalendarRange,
  LogOut,
  X,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import smvitmLogo from '../../assets/smvitm_logo.webp';

export type PrincipalTab =
  | 'overview'
  | 'institutional'
  | 'departments'
  | 'faculty'
  | 'published';

interface PrincipalSidebarProps {
  activeTab: PrincipalTab;
  onSelectTab: (tab: PrincipalTab) => void;
  onLogout: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const PrincipalSidebar: React.FC<PrincipalSidebarProps> = ({
  activeTab,
  onSelectTab,
  onLogout,
  isOpenMobile = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const navItems = [
    {
      id: 'overview' as PrincipalTab,
      label: 'Institutional Overview',
      shortLabel: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'institutional' as PrincipalTab,
      label: 'Institutional Timetable',
      shortLabel: 'Institutional Schedule',
      icon: Building,
      badge: 'Dean Locked',
    },
    {
      id: 'departments' as PrincipalTab,
      label: 'Department Monitoring',
      shortLabel: 'Departments',
      icon: GraduationCap,
      badge: '5 Depts',
    },
    {
      id: 'faculty' as PrincipalTab,
      label: 'Faculty Workload Oversight',
      shortLabel: 'Faculty Workload',
      icon: Users,
      badge: null,
    },
    {
      id: 'published' as PrincipalTab,
      label: 'Published Timetables',
      shortLabel: 'Published View',
      icon: CalendarRange,
      badge: 'Official',
    },
  ];

  const handleNavClick = (tab: PrincipalTab) => {
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
        aria-label="Principal Portal Navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 bg-surface border-r border-border-beige flex flex-col justify-between transition-all duration-300 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:z-40 overflow-y-auto ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64 lg:w-72'}`}
      >
        {/* Top Branding & Nav */}
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
                    Principal Portal
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
                  className="hidden lg:flex p-1.5 rounded-card text-ink-muted hover:text-primary hover:bg-canvas-muted border border-border-beige transition-colors"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronLeft className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Mobile Close Button */}
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

          {/* User Mini Card */}
          {!isCollapsed ? (
            <div className="p-3 mx-3 my-3 bg-canvas-paper rounded-card border border-border-subtle shadow-crisp-sm transition-all duration-200">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs font-mono shadow-crisp-sm flex-shrink-0">
                  TB
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-ink truncate">
                    Dr. Thirumaleshwara Bhat
                  </div>
                  <div className="text-[10px] text-primary font-medium truncate flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 flex-shrink-0" />
                    <span>Principal &amp; Head of Institution</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="py-3 flex justify-center border-b border-border-subtle bg-canvas-paper/50"
              title="Dr. Thirumaleshwara Bhat • Principal & Head of Institution"
            >
              <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs font-mono shadow-crisp-sm">
                TB
              </div>
            </div>
          )}

          {/* Navigation List */}
          <nav className="p-3 space-y-1.5" aria-label="Principal Navigation">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-light font-semibold">
                Institutional Modules
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
                        isActive ? 'text-accent-gold' : 'text-primary'
                      }`}
                    />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isCollapsed && item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-canvas-muted text-ink-light border border-border-subtle'
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

        {/* Logout Footer */}
        <div className="p-3 border-t border-border-subtle bg-canvas-paper">
          <button
            type="button"
            onClick={onLogout}
            title="Exit Principal Portal"
            className={`w-full flex items-center ${
              isCollapsed
                ? 'justify-center px-2 py-2'
                : 'justify-center gap-2 px-3 py-2'
            } text-xs font-semibold text-error hover:bg-error/10 border border-error/20 rounded-card transition-colors shadow-crisp-sm`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Exit Principal Portal</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

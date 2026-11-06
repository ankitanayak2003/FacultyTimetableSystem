import React from 'react';
import {
  LayoutDashboard,
  Building,
  GraduationCap,
  Users,
  BookmarkCheck,
  Scale,
  Layers,
  CalendarPlus,
  ShieldAlert,
  CalendarCheck,
  Download,
  Bell,
  User,
  LogOut,
  X,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import smvitmLogo from '../../assets/smvitm_logo.webp';
import { useWorkflow } from '../../context/WorkflowContext';

export type DeptCoordinatorTab =
  | 'overview'
  | 'institutional'
  | 'basic-science'
  | 'faculty'
  | 'preferences'
  | 'workload'
  | 'allocations'
  | 'builder'
  | 'clashes'
  | 'final'
  | 'export'
  | 'notifications'
  | 'profile';

interface DeptCoordinatorSidebarProps {
  activeTab: DeptCoordinatorTab;
  onSelectTab: (tab: DeptCoordinatorTab) => void;
  onLogout: () => void;
  unreadCount?: number;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const DeptCoordinatorSidebar: React.FC<DeptCoordinatorSidebarProps> = ({
  activeTab,
  onSelectTab,
  onLogout,
  unreadCount = 2,
  isOpenMobile = false,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { departmentStatus, basicScienceStatus } = useWorkflow();

  const isGated = basicScienceStatus !== 'LOCKED';

  const navItems = [
    {
      id: 'overview' as DeptCoordinatorTab,
      label: 'Coordinator Overview',
      shortLabel: 'Overview',
      icon: LayoutDashboard,
      badge: 'AIDS',
    },
    {
      id: 'institutional' as DeptCoordinatorTab,
      label: 'Institutional Locked Slots',
      shortLabel: 'Institutional',
      icon: Building,
      badge: 'Read-Only',
    },
    {
      id: 'basic-science' as DeptCoordinatorTab,
      label: 'Basic Science Rotations',
      shortLabel: '1st Year',
      icon: GraduationCap,
      badge: isGated ? 'Gated' : 'Verified',
    },
    {
      id: 'faculty' as DeptCoordinatorTab,
      label: 'Department Faculty Roster',
      shortLabel: 'Faculty',
      icon: Users,
      badge: '14 Active',
    },
    {
      id: 'preferences' as DeptCoordinatorTab,
      label: 'Elective Preferences',
      shortLabel: 'Preferences',
      icon: BookmarkCheck,
      badge: '14 Submitted',
    },
    {
      id: 'workload' as DeptCoordinatorTab,
      label: 'Workload Distribution',
      shortLabel: 'Workload',
      icon: Scale,
      badge: 'AICTE / VTU',
    },
    {
      id: 'allocations' as DeptCoordinatorTab,
      label: 'Subject Allotment Matrix',
      shortLabel: 'Allotments',
      icon: Layers,
      badge: 'Step 3',
    },
    {
      id: 'builder' as DeptCoordinatorTab,
      label: 'Interactive Timetable Grid',
      shortLabel: 'Timetable Grid',
      icon: CalendarPlus,
      badge: departmentStatus,
    },
    {
      id: 'clashes' as DeptCoordinatorTab,
      label: 'Real-time Clash Prevention',
      shortLabel: 'Clash Audit',
      icon: ShieldAlert,
      badge: '0 Conflicts',
    },
    {
      id: 'final' as DeptCoordinatorTab,
      label: 'Finalize & HOD Submission',
      shortLabel: 'Finalize',
      icon: CalendarCheck,
      badge: departmentStatus === 'DRAFT' ? 'Pending' : 'Finalized',
    },
    {
      id: 'export' as DeptCoordinatorTab,
      label: 'Export Official Timetables',
      shortLabel: 'Export',
      icon: Download,
      badge: 'PDF / Excel',
    },
    {
      id: 'notifications' as DeptCoordinatorTab,
      label: 'Circulars & Deadlines',
      shortLabel: 'Circulars',
      icon: Bell,
      badge: unreadCount > 0 ? `${unreadCount} New` : null,
    },
    {
      id: 'profile' as DeptCoordinatorTab,
      label: 'Coordinator Profile',
      shortLabel: 'Profile',
      icon: User,
      badge: null,
    },
  ];

  const handleNavClick = (tab: DeptCoordinatorTab) => {
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
        aria-label="Coordinator Portal Navigation"
        className={`fixed top-0 bottom-0 left-0 z-50 bg-surface border-r border-border-beige flex flex-col justify-between transition-all duration-300 ease-in-out md:sticky md:top-0 md:h-screen md:z-40 overflow-y-auto ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${isCollapsed ? 'w-20' : 'w-64 lg:w-72'}`}
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
                    Dept Coordinator • AIDS
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
                  className="hidden md:flex p-1.5 rounded-card text-ink-muted hover:text-primary hover:bg-canvas-muted border border-border-beige transition-colors"
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
                  className="p-1 rounded text-ink-muted hover:text-ink hover:bg-canvas-muted md:hidden"
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
                  MK
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-ink truncate">
                    Prof. Manoj Kumar
                  </div>
                  <div className="text-[10px] text-primary font-medium truncate flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 flex-shrink-0" />
                    <span>Timetable Coordinator (AIDS)</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="py-3 flex justify-center border-b border-border-subtle bg-canvas-paper/50"
              title="Prof. Manoj Kumar • Timetable Coordinator (AIDS)"
            >
              <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs font-mono shadow-crisp-sm">
                MK
              </div>
            </div>
          )}

          {/* Navigation List */}
          <nav className="p-3 space-y-1" aria-label="Coordinator Navigation">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-light font-semibold">
                Coordination Modules
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
                      ? 'justify-center px-2 py-2'
                      : 'justify-between px-3 py-2'
                  } rounded-card text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-crisp-sm'
                      : 'text-ink-muted hover:text-ink hover:bg-primary-subtle/50'
                  }`}
                >
                  <div
                    className={`flex items-center gap-2.5 ${
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
                          : isGated && item.id === 'basic-science'
                          ? 'bg-amber-50 text-amber-800 border border-amber-300'
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
            title="Exit Coordinator Portal"
            className={`w-full flex items-center ${
              isCollapsed
                ? 'justify-center px-2 py-2'
                : 'justify-center gap-2 px-3 py-2'
            } text-xs font-semibold text-error hover:bg-error/10 border border-error/20 rounded-card transition-colors shadow-crisp-sm`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Exit Coordinator Portal</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

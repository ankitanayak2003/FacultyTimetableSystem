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
}

export const DeptCoordinatorSidebar: React.FC<DeptCoordinatorSidebarProps> = ({
  activeTab,
  onSelectTab,
  onLogout,
  unreadCount = 2,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { departmentStatus, basicScienceStatus } = useWorkflow();

  const isGated = basicScienceStatus !== 'LOCKED';

  const navItems = [
    {
      id: 'overview' as DeptCoordinatorTab,
      label: 'Coordinator Overview',
      shortLabel: 'Overview',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'institutional' as DeptCoordinatorTab,
      label: 'Dean Institutional Slots',
      shortLabel: 'Dean Slots',
      icon: Building,
      badge: 'Locked',
    },
    {
      id: 'basic-science' as DeptCoordinatorTab,
      label: 'Basic Science Slots',
      shortLabel: 'Basic Sci',
      icon: GraduationCap,
      badge: 'Locked',
    },
    {
      id: 'faculty' as DeptCoordinatorTab,
      label: 'Department Faculty',
      shortLabel: 'Faculty',
      icon: Users,
      badge: '14 Faculty',
    },
    {
      id: 'preferences' as DeptCoordinatorTab,
      label: 'Review Faculty Preferences',
      shortLabel: 'Preferences',
      icon: BookmarkCheck,
      badge: 'Actionable',
    },
    {
      id: 'workload' as DeptCoordinatorTab,
      label: 'Workload Management',
      shortLabel: 'Workload',
      icon: Scale,
      badge: 'AICTE Quota',
    },
    {
      id: 'allocations' as DeptCoordinatorTab,
      label: 'Subject Allocation Mapping',
      shortLabel: 'Allocations',
      icon: Layers,
      badge: null,
    },
    {
      id: 'builder' as DeptCoordinatorTab,
      label: 'Timetable Builder',
      shortLabel: 'Builder',
      icon: CalendarPlus,
      badge: isGated ? 'Gated' : 'Interactive',
    },
    {
      id: 'clashes' as DeptCoordinatorTab,
      label: 'Clash Validation Engine',
      shortLabel: 'Clashes',
      icon: ShieldAlert,
      badge: '0 Conflicts',
    },
    {
      id: 'final' as DeptCoordinatorTab,
      label: 'Final Timetable & Publish',
      shortLabel: 'Finalize',
      icon: CalendarCheck,
      badge: departmentStatus,
    },
    {
      id: 'export' as DeptCoordinatorTab,
      label: 'Export Timetable (PDF)',
      shortLabel: 'Export',
      icon: Download,
      badge: null,
    },
    {
      id: 'notifications' as DeptCoordinatorTab,
      label: 'Department Notifications',
      shortLabel: 'Alerts',
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

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between bg-surface border-r border-border-beige text-ink">
      <div>
        {/* Branding */}
        <div className="p-5 border-b border-border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={smvitmLogo}
              alt="SMVITM Logo"
              className="h-10 w-auto object-contain flex-shrink-0"
            />
            <div>
              <span className="font-headline font-semibold text-xs text-primary uppercase tracking-tight block">
                SMVITM Bantakal
              </span>
              <span className="text-[10px] font-mono text-ink-light">
                Dept Coordinator Portal
              </span>
            </div>
          </div>
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="md:hidden p-1.5 text-ink-light hover:text-ink hover:bg-canvas-muted rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* User Mini Card */}
        <div className="p-4 mx-3 my-3 bg-canvas-paper rounded-card border border-border-subtle shadow-crisp-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs font-mono shadow-crisp-sm flex-shrink-0">
              RS
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-ink truncate">
                Prof. Rajesh Shetty
              </div>
              <div className="text-[10px] text-primary font-medium truncate flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 flex-shrink-0" />
                <span>Timetable Coordinator (AIDS)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-card text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-crisp-sm'
                    : 'text-ink-muted hover:text-ink hover:bg-primary-subtle/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-accent-gold' : 'text-primary'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
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
      <div className="p-4 border-t border-border-subtle bg-canvas-paper">
        <button
          type="button"
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-error hover:bg-error/10 border border-error/20 rounded-card transition-colors shadow-crisp-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Coordinator Portal</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:block w-64 lg:w-72 flex-shrink-0 min-h-screen">
        {sidebarContent}
      </aside>

      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-ink/40 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-crisp-lg z-10 animate-slide-right">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

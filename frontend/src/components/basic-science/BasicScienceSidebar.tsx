import React from 'react';
import {
  Layers,
  FlaskConical,
  Atom,
  FileText,
  LogOut,
  X,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import smvitmLogo from '../../assets/smvitm_logo.webp';

export type BasicScienceTab =
  | 'subject-allocation'
  | 'chemistry-timetable'
  | 'physics-timetable'
  | 'final-timetables';

interface BasicScienceSidebarProps {
  activeTab: BasicScienceTab;
  onSelectTab: (tab: BasicScienceTab) => void;
  onLogout: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const BasicScienceSidebar: React.FC<BasicScienceSidebarProps> = ({
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
      id: 'subject-allocation' as BasicScienceTab,
      label: 'Subject & Faculty Allocation',
      icon: Layers,
    },
    {
      id: 'chemistry-timetable' as BasicScienceTab,
      label: 'Chemistry Cycle Timetable',
      icon: FlaskConical,
    },
    {
      id: 'physics-timetable' as BasicScienceTab,
      label: 'Physics Cycle Timetable',
      icon: Atom,
    },
    {
      id: 'final-timetables' as BasicScienceTab,
      label: 'Final Timetables',
      icon: FileText,
    },
  ];

  const handleNavClick = (tab: BasicScienceTab) => {
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
        aria-label="Basic Science Portal Navigation"
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
                    Basic Science Portal
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Desktop Collapse Toggle */}
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

          {/* User Identity Mini Card */}
          {!isCollapsed ? (
            <div className="p-3 mx-3 my-3 bg-canvas-paper rounded-card border border-border-subtle shadow-crisp-sm transition-all duration-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs font-mono shadow-crisp-sm flex-shrink-0">
                  RS
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-ink truncate">
                    Dr. Ravindra Shenoy
                  </div>
                  <div className="text-[10px] text-primary font-medium truncate flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 flex-shrink-0" />
                    <span>Basic Science Coordinator</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="py-3 flex justify-center border-b border-border-subtle bg-canvas-paper/50"
              title="Dr. Ravindra Shenoy • Basic Science Coordinator"
            >
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs font-mono shadow-crisp-sm">
                RS
              </div>
            </div>
          )}

          {/* Navigation List */}
          <nav className="p-2.5 space-y-1" aria-label="Basic Science Navigation">
            {!isCollapsed && (
              <div className="px-2.5 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-light font-semibold">
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
                      ? 'justify-center px-2 py-2'
                      : 'justify-start gap-2.5 px-3 py-2'
                  } rounded-card text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-white shadow-crisp-sm'
                      : 'text-ink-muted hover:text-ink hover:bg-primary-subtle/50'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${
                      isActive ? 'text-accent-gold' : 'text-primary'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sign Out Footer */}
        <div className="p-3 border-t border-border-subtle bg-canvas-paper">
          <button
            type="button"
            onClick={onLogout}
            title="Sign out of Basic Science Platform"
            className={`w-full flex items-center ${
              isCollapsed
                ? 'justify-center px-2 py-2'
                : 'justify-center gap-2 px-3 py-2'
            } text-xs font-semibold text-error hover:bg-error/10 border border-error/20 rounded-card transition-colors shadow-crisp-sm`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

import React from 'react';
import {
  Menu,
  LogOut,
  Calendar,
  UserCheck,
} from 'lucide-react';
import sodeLogo from '../../assets/sode_group_logo.png';
import { FacultyProfileData } from '../../data/facultyDemoData';
import { FacultyTab } from './FacultySidebar';

interface FacultyHeaderProps {
  faculty: FacultyProfileData;
  activeTab: FacultyTab;
  onOpenMobileMenu: () => void;
  onLogout: () => void;
}

export const FacultyHeader: React.FC<FacultyHeaderProps> = ({
  faculty,
  activeTab,
  onOpenMobileMenu,
  onLogout,
}) => {
  const getTabLabel = (tab: FacultyTab) => {
    switch (tab) {
      case 'overview':
        return 'Dashboard Overview';
      case 'timetable':
        return 'Teaching Timetable';
      case 'preferences':
        return 'Subject Preferences';
      case 'workload':
        return 'Workload Distribution';
      case 'leaves':
        return 'Leave Management';
      case 'profile':
        return 'Faculty Profile';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-surface/95 backdrop-blur-sm border-b border-border-beige px-4 sm:px-6 py-2.5 shadow-crisp-sm">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Breadcrumb */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
            className="p-1.5 rounded-card text-ink-muted hover:text-primary hover:bg-canvas-muted lg:hidden border border-border-beige"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-mono tracking-wider text-ink-light hidden sm:inline">
                Faculty Portal
              </span>
              <span className="text-ink-light text-xs hidden sm:inline">•</span>
              <span className="text-xs font-semibold text-primary font-headline">
                {getTabLabel(activeTab)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-ink-muted">
              <span className="font-medium text-ink hidden md:inline">
                {faculty.department}
              </span>
              <span className="hidden md:inline">•</span>
              <span className="font-mono text-ink-light">
                {faculty.facultyId} ({faculty.designation})
              </span>
            </div>
          </div>
        </div>

        {/* Right: Academic Term, Logos, Avatar, Logout */}
        <div className="flex items-center gap-3">
          {/* Academic Term Tag */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-canvas-muted border border-border-subtle text-[11px] font-mono text-ink-muted">
            <Calendar className="w-3 h-3 text-primary" />
            <span>AY {faculty.academicYear} • Odd Sem</span>
          </div>

          {/* Sode Group Logo */}
          <img
            src={sodeLogo}
            alt="Sode Group"
            className="h-7 w-auto object-contain hidden lg:block opacity-90"
          />

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-border-subtle">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs font-mono border border-primary/20">
              AR
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-ink leading-tight flex items-center gap-1">
                <span>{faculty.fullName}</span>
                <UserCheck className="w-3 h-3 text-accent-teal" />
              </div>
              <div className="text-[10px] font-mono text-ink-light">
                {faculty.facultyId} • {faculty.departmentCode}
              </div>
            </div>
          </div>

          {/* Logout Action */}
          <button
            type="button"
            onClick={onLogout}
            title="Sign out of faculty portal"
            aria-label="Sign out"
            className="p-1.5 rounded-card text-ink-muted hover:text-error hover:bg-error-container/40 transition-colors border border-border-beige hover:border-error/30"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

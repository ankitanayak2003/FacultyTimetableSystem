import React from 'react';
import {
  Menu,
  GraduationCap,
  Calendar,
  Lock,
  Unlock,
} from 'lucide-react';
import sodeLogo from '../../assets/sode_group_logo.png';
import { StudentProfileData } from '../../data/studentDemoData';
import { StudentTab } from './StudentSidebar';

interface StudentHeaderProps {
  student: StudentProfileData;
  activeTab: StudentTab;
  onOpenMobileMenu: () => void;
  isPublished?: boolean;
  onTogglePublished?: () => void;
}

export const StudentHeader: React.FC<StudentHeaderProps> = ({
  student,
  activeTab,
  onOpenMobileMenu,
  isPublished = true,
  onTogglePublished,
}) => {
  const getTabLabel = (tab: StudentTab) => {
    switch (tab) {
      case 'dashboard':
        return 'Dashboard Overview';
      case 'timetable':
        return 'My Weekly Timetable';
      case 'profile':
        return 'Student Profile';
    }
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-surface/95 backdrop-blur-md border-b border-border-beige px-4 sm:px-6 py-2.5 shadow-crisp-sm transition-all duration-200">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
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
                Student Portal
              </span>
              <span className="text-ink-light text-xs hidden sm:inline">•</span>
              <span className="text-xs font-semibold text-primary font-headline">
                {getTabLabel(activeTab)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-ink-muted">
              <span className="font-medium text-ink hidden md:inline">
                {student.department}
              </span>
              <span className="hidden md:inline">•</span>
              <span className="font-mono text-ink-light">
                {student.usn} ({student.semester} - {student.section})
              </span>
            </div>
          </div>
        </div>

        {/* Right: Academic Context, Logos, Avatar */}
        <div className="flex items-center gap-3">
          {/* Published vs Draft toggle pill */}
          {onTogglePublished && (
            <button
              type="button"
              onClick={onTogglePublished}
              title="Toggle timetable status (Demo mode)"
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono transition-colors border ${
                isPublished
                  ? 'bg-success-container/40 text-success border-success/30 hover:bg-success-container/70'
                  : 'bg-warning-container/40 text-warning border-warning/30 hover:bg-warning-container/70'
              }`}
            >
              {isPublished ? (
                <>
                  <Lock className="w-3 h-3 text-success" />
                  <span>Official Release</span>
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3 text-warning" />
                  <span>Draft Preview</span>
                </>
              )}
            </button>
          )}

          {/* Academic Term Tag */}
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-canvas-muted border border-border-subtle text-[11px] font-mono text-ink-muted">
            <Calendar className="w-3 h-3 text-primary" />
            <span>AY {student.academicYear} • Odd Sem</span>
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
                <span>{student.fullName}</span>
                <GraduationCap className="w-3 h-3 text-primary" />
              </div>
              <div className="text-[10px] font-mono text-ink-light">
                {student.usn}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

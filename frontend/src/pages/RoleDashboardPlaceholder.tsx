import React from 'react';
import {
  ShieldCheck,
  Award,
  Building2,
  BookOpen,
  CalendarRange,
  UserCheck,
  LogOut,
  Calendar,
  Layers,
  Info,
  Clock,
} from 'lucide-react';
import { UserRole } from '../types/auth';
import { InstitutionalHeader } from '../components/common/InstitutionalHeader';

interface RoleDashboardPlaceholderProps {
  role: UserRole;
  onLogout: () => void;
}

export const RoleDashboardPlaceholder: React.FC<RoleDashboardPlaceholderProps> = ({
  role,
  onLogout,
}) => {
  const getRoleIcon = () => {
    switch (role) {
      case 'Principal':
        return <ShieldCheck className="w-8 h-8 text-primary" />;
      case 'Dean':
        return <Award className="w-8 h-8 text-accent-violet" />;
      case 'HOD':
        return <Building2 className="w-8 h-8 text-accent-teal" />;
      case 'Basic Science Coordinator':
        return <BookOpen className="w-8 h-8 text-primary" />;
      case 'Department Coordinator':
        return <CalendarRange className="w-8 h-8 text-accent-teal" />;
      case 'Faculty':
        return <UserCheck className="w-8 h-8 text-accent-violet" />;
      default:
        return <Layers className="w-8 h-8 text-primary" />;
    }
  };

  const getRoleDescription = () => {
    switch (role) {
      case 'Principal':
        return 'Executive governance, institutional compliance audits, and final timetable ratification.';
      case 'Dean':
        return 'Academic council oversight, curriculum audits, and normative faculty workload policies.';
      case 'HOD':
        return 'Departmental faculty load distribution, subject assignments, and timetable authorization.';
      case 'Basic Science Coordinator':
        return 'First-year foundational sciences coordination and cross-department batch synchronization.';
      case 'Department Coordinator':
        return 'Constraint-based schedule modeling, laboratory batching, and OR-Tools optimization.';
      case 'Faculty':
        return 'Personalized teaching timetable, lecture hall reservations, and weekly workload monitoring.';
      default:
        return 'Academic administration portal.';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink">
      {/* Top Institutional Header */}
      <InstitutionalHeader />

      {/* Main Body */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10 academic-grid-pattern">
        <div className="w-full max-w-2xl bg-surface rounded-card border border-border-beige shadow-crisp-lg p-6 sm:p-8 animate-fade-in text-center">
          {/* Role Icon Circle */}
          <div className="w-16 h-16 rounded-full bg-canvas-muted border border-border-beige flex items-center justify-center mx-auto mb-4 shadow-crisp-sm">
            {getRoleIcon()}
          </div>

          {/* Academic Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-subtle border border-primary/20 text-primary text-xs font-mono font-medium mb-3">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>Academic Year 2026–2027 • Odd Semester</span>
          </div>

          {/* Title */}
          <h2 className="font-headline text-3xl font-semibold text-primary-dark tracking-tight mb-2">
            {role} Dashboard
          </h2>

          <p className="text-sm text-ink-muted leading-relaxed max-w-lg mx-auto mb-6">
            {getRoleDescription()}
          </p>

          {/* Demonstration Notice */}
          <div className="p-4 bg-canvas-paper rounded-card border border-border-subtle text-left text-xs text-ink-muted space-y-2 mb-6">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>Frontend Demonstration Active</span>
            </div>
            <p className="leading-relaxed">
              You have navigated to the <strong className="text-ink">{role}</strong> placeholder portal via frontend role-based routing. Full administrative modules, timetable generation, and backend authorization for this role will be connected in future development phases.
            </p>
            <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-ink-light">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-accent-teal" />
                <span>Status: Navigation Route Verified</span>
              </span>
              <span>SMVITM Bantakal</span>
            </div>
          </div>

          {/* Logout & Return Action */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={onLogout}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-card hover:bg-primary-hover transition-colors shadow-crisp"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out &amp; Return to Login</span>
            </button>
          </div>
        </div>
      </main>

      {/* Simple Academic Footer */}
      <footer className="py-4 text-center text-xs text-ink-muted border-t border-border-beige bg-surface">
        <p>
          © {new Date().getFullYear()} Shri Madhwa Vadiraja Institute of Technology &amp; Management (SMVITM). All rights reserved.
        </p>
      </footer>
    </div>
  );
};

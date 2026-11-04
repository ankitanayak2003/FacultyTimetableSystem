import React from 'react';
import {
  CalendarPlus,
  Users,
  BookmarkCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { WorkflowProgress } from '../common/WorkflowProgress';
import { DeptCoordinatorTab } from './DeptCoordinatorSidebar';

interface DeptCoordinatorOverviewProps {
  onNavigate: (tab: DeptCoordinatorTab) => void;
}

export const DeptCoordinatorOverview: React.FC<DeptCoordinatorOverviewProps> = ({
  onNavigate,
}) => {
  const {
    deanStatus,
    basicScienceStatus,
    departmentStatus,
    facultyPreferences,
  } = useWorkflow();

  const isDeanLocked = deanStatus === 'LOCKED';
  const isBsLocked = basicScienceStatus === 'LOCKED';
  const isGated = !isDeanLocked || !isBsLocked;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Workflow Gating Banners */}
      {!isDeanLocked && (
        <div className="p-6 bg-amber-50 border border-amber-300 rounded-card shadow-crisp space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-semibold text-base font-headline">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>Workflow Gated: Dean Institutional Timetable Pending</span>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            Institutional scheduling is currently in draft. Department timetable preparation cannot begin until the Dean locks Stage 1 institutional assignments.
          </p>
        </div>
      )}

      {isDeanLocked && !isBsLocked && (
        <div className="p-6 bg-amber-50 border border-amber-300 rounded-card shadow-crisp space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-semibold text-base font-headline">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>Department Timetable Preparation Locked</span>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed">
            <strong>
              Department timetable preparation is currently locked. It will become available after the Basic Science Coordinator finalizes the first-year timetable.
            </strong>
          </p>
          <div className="text-[11px] font-mono text-amber-800 pt-1">
            Log in as <strong>Basic Science Coordinator</strong> to review cycles and lock Stage 2.
          </div>
        </div>
      )}

      {/* Active Banner when both earlier stages are locked */}
      {!isGated && (
        <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                  Stage 3 Timetable Engineering
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Upstream Stages 1 &amp; 2 Locked</span>
                </span>
              </div>
              <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
                AI &amp; Data Science Department Timetable Workspace
              </h2>
              <p className="text-xs text-ink-muted mt-1 max-w-2xl leading-relaxed">
                Build conflict-free section timetables, map faculty course preferences, balance weekly teaching quotas, and export finalized schedules for official release.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('builder')}
                className="px-4 py-2 bg-primary text-white hover:bg-primary-dark text-xs font-semibold rounded-card transition-all shadow-crisp-sm flex items-center gap-2"
              >
                <CalendarPlus className="w-3.5 h-3.5" />
                <span>Launch Timetable Builder</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Department Faculty */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
              Faculty Pool
            </span>
            <div className="p-1.5 rounded bg-primary-subtle text-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-bold text-primary">
            14 <span className="text-xs font-normal text-ink-muted">Faculty</span>
          </div>
          <div className="text-[11px] text-ink-muted mt-1">
            AIDS Teaching Roster
          </div>
        </div>

        {/* Card 2: Faculty Preferences */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
              Preferences Submitted
            </span>
            <div className="p-1.5 rounded bg-teal-50 text-teal-700">
              <BookmarkCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-bold text-teal-800">
            {facultyPreferences.length} <span className="text-xs font-normal text-ink-muted">Reviewed</span>
          </div>
          <div className="text-[11px] text-ink-muted mt-1">
            Dr. Ananya Rao + Department Staff
          </div>
        </div>

        {/* Card 3: Clashes */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
              Clash Engine
            </span>
            <div className="p-1.5 rounded bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-bold text-emerald-800">
            0 <span className="text-xs font-normal text-ink-muted">Clashes</span>
          </div>
          <div className="text-[11px] text-ink-muted mt-1">
            Zero Room / Teacher Collisions
          </div>
        </div>

        {/* Card 4: Publication Status */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
              Timetable Status
            </span>
            <div className="p-1.5 rounded bg-primary-subtle text-primary">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-xl sm:text-2xl font-bold text-ink uppercase">
            {departmentStatus}
          </div>
          <div className="text-[11px] text-ink-muted mt-1 font-mono">
            {isGated ? 'Gated' : 'Ready for release'}
          </div>
        </div>
      </div>

      {/* Global Workflow Pipeline */}
      <WorkflowProgress currentStage="Department" />

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase font-bold text-primary">
                Upstream Slots
              </span>
              <span className="text-[10px] font-mono text-emerald-700 font-semibold flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                <span>Protected</span>
              </span>
            </div>
            <h4 className="font-semibold text-ink text-sm mt-1.5">
              Dean &amp; Basic Science Slots
            </h4>
            <p className="text-ink-muted text-[11px] leading-relaxed mt-0.5">
              Placement (Fri), NSS (Thu), Open Electives (Wed), and First-Year Induction are rendered as locked blocks.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('institutional')}
            className="text-primary font-semibold text-xs hover:underline flex items-center gap-1 pt-2 border-t border-border-subtle"
          >
            <span>Inspect Locked Blocks</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase font-bold text-teal-700">
                Course Preferences
              </span>
              <span className="text-[10px] font-mono text-ink-light">
                {facultyPreferences.length} Received
              </span>
            </div>
            <h4 className="font-semibold text-ink text-sm mt-1.5">
              Faculty Preference Review
            </h4>
            <p className="text-ink-muted text-[11px] leading-relaxed mt-0.5">
              Review course choices submitted by Dr. Ananya Rao, Prof. Sneha Kamath, and department staff with accept/reject state.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('preferences')}
            className="text-primary font-semibold text-xs hover:underline flex items-center gap-1 pt-2 border-t border-border-subtle"
          >
            <span>Review Preferences</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm space-y-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase font-bold text-emerald-700">
                Interactive Grid
              </span>
              <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                Validated
              </span>
            </div>
            <h4 className="font-semibold text-ink text-sm mt-1.5">
              Weekly Timetable Builder
            </h4>
            <p className="text-ink-muted text-[11px] leading-relaxed mt-0.5">
              Assign theory lectures, lab sessions, and tutorial hours while avoiding clash violations.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('builder')}
            disabled={isGated}
            className="text-primary font-semibold text-xs hover:underline flex items-center gap-1 pt-2 border-t border-border-subtle disabled:opacity-50"
          >
            <span>Open Builder</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  GraduationCap,
  Atom,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { WorkflowProgress } from '../common/WorkflowProgress';
import { BasicScienceTab } from './BasicScienceSidebar';

interface BasicScienceOverviewProps {
  onNavigate: (tab: BasicScienceTab) => void;
}

export const BasicScienceOverview: React.FC<BasicScienceOverviewProps> = ({
  onNavigate,
}) => {
  const {
    deanStatus,
    deanVersion,
    basicScienceStatus,
    basicScienceVersion,
    firstYearSections,
  } = useWorkflow();

  const isDeanLocked = deanStatus === 'LOCKED';
  const isBsLocked = basicScienceStatus === 'LOCKED';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Gating Alert if Dean has not locked Stage 1 */}
      {!isDeanLocked ? (
        <div className="p-6 bg-amber-50 border border-amber-300 rounded-card shadow-crisp space-y-3">
          <div className="flex items-center gap-2.5 text-amber-900 font-semibold text-base font-headline">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>Workflow Gated: Stage 1 Incomplete</span>
          </div>
          <p className="text-xs text-amber-900 leading-relaxed max-w-3xl">
            <strong>Institutional timetable preparation is not yet complete.</strong> Basic Science scheduling will become available after the Dean locks the institutional timetable. Downstream scheduling controls are temporarily disabled to prevent conflicting room and common slot allocations.
          </p>
          <div className="pt-2 text-[11px] font-mono text-amber-800">
            Current Stage 1 Status: <strong className="uppercase">{deanStatus}</strong>. Please log in as <strong>Dean</strong> to review and lock fixed institutional slots.
          </div>
        </div>
      ) : (
        /* Top Active Banner */
        <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                  Stage 2 Governance
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Dean Slots Verified ({deanVersion})</span>
                </span>
              </div>
              <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
                First-Year Physics &amp; Chemistry Cycles
              </h2>
              <p className="text-xs text-ink-muted mt-1 max-w-2xl leading-relaxed">
                Oversee first-year student cycle distributions, laboratory batch rotations, and foundational science faculty workloads for academic year 2026–27.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('lock')}
                className={`px-4 py-2 text-xs font-semibold rounded-card transition-all shadow-crisp-sm flex items-center gap-2 ${
                  isBsLocked
                    ? 'bg-amber-600 text-white hover:bg-amber-700'
                    : 'bg-emerald-600 text-white hover:bg-emerald-700'
                }`}
              >
                {isBsLocked ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Reopen Schedule</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock Timetable ({basicScienceVersion})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: First Year Sections */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
              Sections Enrolled
            </span>
            <div className="p-1.5 rounded bg-primary-subtle text-primary">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-bold text-primary">
            {firstYearSections.length} <span className="text-xs font-normal text-ink-muted">Sections</span>
          </div>
          <div className="text-[11px] text-ink-muted mt-1">
            238 First-Year Students
          </div>
        </div>

        {/* Card 2: Cycle Balance */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
              Cycles Assigned
            </span>
            <div className="p-1.5 rounded bg-teal-50 text-teal-700">
              <Atom className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-bold text-teal-800">
            2 <span className="text-xs font-normal text-ink-muted">Cycles</span>
          </div>
          <div className="text-[11px] text-ink-muted mt-1">
            Physics (Sec A, B) • Chem (Sec C, D)
          </div>
        </div>

        {/* Card 3: Clashes */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
              Resource Clashes
            </span>
            <div className="p-1.5 rounded bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-bold text-emerald-800">
            0 <span className="text-xs font-normal text-ink-muted">Conflicts</span>
          </div>
          <div className="text-[11px] text-ink-muted mt-1">
            Labs &amp; Classrooms Validated
          </div>
        </div>

        {/* Card 4: Stage 2 Status */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
              Lock Status
            </span>
            <div className="p-1.5 rounded bg-primary-subtle text-primary">
              {isBsLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </div>
          </div>
          <div className="font-headline text-xl sm:text-2xl font-bold text-ink">
            {basicScienceStatus}
          </div>
          <div className="text-[11px] text-ink-muted mt-1 font-mono">
            {isBsLocked ? 'Unblocks Depts' : 'In Progress'}
          </div>
        </div>
      </div>

      {/* Workflow Stepper */}
      <WorkflowProgress currentStage="Basic Science" />

      {/* Sections and Cycles Overview */}
      <div className="bg-surface rounded-card border border-border-beige p-5 shadow-crisp">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-subtle">
          <div>
            <h3 className="font-headline text-base font-semibold text-primary">
              First-Year Section Cycle Allocations
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              VTU curriculum requires alternating Physics and Chemistry cycles each semester.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('cycles')}
            disabled={!isDeanLocked}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
          >
            <span>Manage Cycles</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {firstYearSections.map((sec) => {
            const isPhysics = sec.cycle === 'Physics';
            return (
              <div
                key={sec.id}
                className="p-4 bg-canvas-paper rounded-card border border-border-subtle text-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                        isPhysics
                          ? 'bg-primary-subtle text-primary'
                          : 'bg-accent-teal/15 text-accent-teal'
                      }`}
                    >
                      {sec.cycle} Cycle
                    </span>
                    <span className="font-mono text-ink-light text-[11px]">
                      Room: {sec.room}
                    </span>
                  </div>

                  <h4 className="font-semibold text-ink text-sm mt-2">
                    {sec.sectionName}
                  </h4>
                  <div className="text-[11px] text-ink-muted mt-1">
                    Enrolled: {sec.studentCount} Students
                  </div>
                </div>

                <div className="pt-2 border-t border-border-subtle space-y-1 text-[11px]">
                  <div className="flex items-center justify-between text-ink-muted">
                    <span>Maths Lead:</span>
                    <span className="text-ink font-medium">{sec.mathsTeacher.split(' ')[1]}</span>
                  </div>
                  <div className="flex items-center justify-between text-ink-muted">
                    <span>Cycle Lead:</span>
                    <span className="text-ink font-medium">
                      {isPhysics
                        ? sec.physicsTeacher.split(' ')[1]
                        : sec.chemistryTeacher.split(' ')[1]}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  Building,
  GraduationCap,
  Users,
  CheckCircle2,
  CalendarRange,
  ArrowRight,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { WorkflowProgress } from '../common/WorkflowProgress';
import { PrincipalTab } from './PrincipalSidebar';

interface PrincipalOverviewProps {
  onNavigate: (tab: PrincipalTab) => void;
}

export const PrincipalOverview: React.FC<PrincipalOverviewProps> = ({ onNavigate }) => {
  const {
    deanStatus,
    deanVersion,
    basicScienceStatus,
    departments,
    institutionalSlots,
  } = useWorkflow();

  const completedDepts = departments.filter((d) => d.status === 'Finalized' || d.status === 'Published').length;
  const pendingDepts = departments.length - completedDepts;
  const publishedDepts = departments.filter((d) => d.status === 'Published').length;

  const totalStudents = departments.reduce((acc, d) => acc + d.studentCount, 0) + 238; // + Basic Science 1st Year

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Institutional Executive Oversight
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-teal/15 text-accent-teal font-semibold">
                Autonomous Academic Body
              </span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
              Institutional Governance &amp; Timetable Status
            </h2>
            <p className="text-xs text-ink-muted mt-1 max-w-2xl leading-relaxed">
              Real-time monitoring of institutional timetable preparation, VTU compliance, department readiness, and faculty workload quotas across all 5 engineering streams.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('published')}
              className="px-4 py-2 bg-primary text-white hover:bg-primary-dark text-xs font-semibold rounded-card transition-all shadow-crisp-sm flex items-center gap-2"
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>View Published Timetables ({publishedDepts})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Departments */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
              Total Departments
            </span>
            <div className="p-1.5 rounded bg-primary-subtle text-primary">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-bold text-primary">
            5 <span className="text-xs font-normal text-ink-muted">Streams</span>
          </div>
          <div className="text-[11px] text-ink-muted mt-1">
            AIDS, CSE, ECE, ISE, MECH
          </div>
        </div>

        {/* Card 2: Faculty Count */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
              Faculty Workload
            </span>
            <div className="p-1.5 rounded bg-teal-50 text-teal-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-bold text-teal-800">
            84 <span className="text-xs font-normal text-ink-muted">Professors</span>
          </div>
          <div className="text-[11px] text-ink-muted mt-1">
            100% within AICTE/VTU limits
          </div>
        </div>

        {/* Card 3: Total Students */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
              Enrolled Students
            </span>
            <div className="p-1.5 rounded bg-amber-50 text-amber-700">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-bold text-amber-800">
            {totalStudents} <span className="text-xs font-normal text-ink-muted">Students</span>
          </div>
          <div className="text-[11px] text-ink-muted mt-1">
            Odd Sem 2026–27 registered
          </div>
        </div>

        {/* Card 4: Timetable Readiness */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
              Department Progress
            </span>
            <div className="p-1.5 rounded bg-primary-subtle text-primary">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-bold text-primary">
            {completedDepts} / {departments.length}
          </div>
          <div className="text-[11px] text-ink-muted mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{pendingDepts} department(s) compiling</span>
          </div>
        </div>
      </div>

      {/* Global Workflow Pipeline Component */}
      <WorkflowProgress currentStage="Publication" />

      {/* Two Column Layout: Department Readiness & Institutional Slots Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Department Progress Table (7 Cols) */}
        <div className="lg:col-span-7 bg-surface rounded-card border border-border-beige p-5 shadow-crisp">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-subtle">
            <div>
              <h3 className="font-headline text-base font-semibold text-primary">
                Department Timetable Preparation Progress
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Current status of odd semester scheduling across academic departments.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('departments')}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {departments.map((dept) => {
              const isDone = dept.status === 'Finalized' || dept.status === 'Published';
              return (
                <div
                  key={dept.id}
                  className="p-3 bg-canvas-paper rounded-card border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-primary">{dept.code}</span>
                      <span className="font-medium text-ink truncate">{dept.name}</span>
                    </div>
                    <div className="text-[11px] text-ink-muted mt-0.5">
                      HOD: {dept.hod} • Coord: {dept.coordinator}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                          dept.status === 'Published'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : dept.status === 'Finalized'
                            ? 'bg-teal-50 text-teal-800 border border-teal-300'
                            : 'bg-amber-50 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {dept.status}
                      </span>
                      <span className="text-[10px] text-ink-light block font-mono mt-0.5">
                        {dept.oddSemCompletion}% complete
                      </span>
                    </div>
                    <div className="w-20 bg-canvas-muted h-2 rounded-full overflow-hidden border border-border-subtle hidden sm:block">
                      <div
                        style={{ width: `${dept.oddSemCompletion}%` }}
                        className={`h-full ${
                          isDone ? 'bg-emerald-600' : 'bg-amber-500'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Institutional Schedule Status (5 Cols) */}
        <div className="lg:col-span-5 bg-surface rounded-card border border-border-beige p-5 shadow-crisp flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-subtle">
              <div>
                <h3 className="font-headline text-base font-semibold text-primary">
                  Institutional Master Schedule
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Dean-locked campus slots &amp; Basic Science cycles.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('institutional')}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Full Grid</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              <div className="p-3 bg-canvas-paper rounded-card border border-border-subtle text-xs">
                <div className="flex items-center justify-between text-[11px] font-mono text-ink-light mb-1">
                  <span>Dean Institutional Slots</span>
                  <span className="text-emerald-700 font-semibold uppercase">
                    {deanStatus} ({deanVersion})
                  </span>
                </div>
                <div className="font-semibold text-ink">
                  {institutionalSlots.length} Institutional Reserved Blocks Configured
                </div>
                <div className="text-[11px] text-ink-muted mt-0.5">
                  Placement, NSS, Open Electives, Induction modules.
                </div>
              </div>

              <div className="p-3 bg-canvas-paper rounded-card border border-border-subtle text-xs">
                <div className="flex items-center justify-between text-[11px] font-mono text-ink-light mb-1">
                  <span>Basic Science Allocation</span>
                  <span className="text-emerald-700 font-semibold uppercase">
                    {basicScienceStatus}
                  </span>
                </div>
                <div className="font-semibold text-ink">
                  First Year Physics &amp; Chemistry Rotation
                </div>
                <div className="text-[11px] text-ink-muted mt-0.5">
                  4 Sections (A, B, C, D) configured without clashes.
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Compliance Seal */}
          <div className="mt-4 pt-4 border-t border-border-subtle flex items-center justify-between text-xs text-ink-muted">
            <div className="flex items-center gap-1.5 font-medium text-primary">
              <ShieldCheck className="w-4 h-4" />
              <span>VTU Statute Compliance 100%</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[10px] text-ink-light">
              <Clock className="w-3.5 h-3.5" />
              <span>Updated: Nov 2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

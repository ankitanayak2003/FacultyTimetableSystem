import React from 'react';
import {
  GraduationCap,
  Users,
  Layers,
  CheckCircle2,
  CalendarRange,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { WorkflowProgress } from '../common/WorkflowProgress';
import { HODTab } from './HODSidebar';

interface HODOverviewProps {
  onNavigate: (tab: HODTab) => void;
}

export const HODOverview: React.FC<HODOverviewProps> = ({ onNavigate }) => {
  const { departmentStatus, facultyWorkload, facultyPreferences } =
    useWorkflow();

  const aidsFaculty = facultyWorkload.filter(
    (f) => f.department === 'Artificial Intelligence & Data Science'
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Department Leadership Oversight
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary font-semibold">
                Autonomous Academic Unit
              </span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
              Department of Artificial Intelligence &amp; Data Science
            </h2>
            <p className="text-xs text-ink-muted mt-1 max-w-2xl leading-relaxed">
              Monitoring departmental academic operations, faculty teaching load balance, course allocations, and timetable compliance for Odd Semester 2026–27.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('timetable')}
              className="px-4 py-2 bg-primary text-white hover:bg-primary-dark text-xs font-semibold rounded-card transition-all shadow-crisp-sm flex items-center gap-2"
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Inspect Timetable</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Faculty */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
              Department Faculty
            </span>
            <div className="p-1.5 rounded bg-primary-subtle text-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-bold text-primary">
            14 <span className="text-xs font-normal text-ink-muted">Faculty</span>
          </div>
          <div className="text-[11px] text-ink-muted mt-1">
            Professors &amp; Research Scholars
          </div>
        </div>

        {/* Card 2: Student Sections */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
              Student Sections
            </span>
            <div className="p-1.5 rounded bg-teal-50 text-teal-700">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-bold text-teal-800">
            6 <span className="text-xs font-normal text-ink-muted">Sections</span>
          </div>
          <div className="text-[11px] text-ink-muted mt-1">
            AIDS 3A, 3B, 5A, 5B, 7A, 7B (248 Students)
          </div>
        </div>

        {/* Card 3: Subjects Assigned */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
              Department Subjects
            </span>
            <div className="p-1.5 rounded bg-amber-50 text-amber-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-bold text-amber-800">
            28 <span className="text-xs font-normal text-ink-muted">Courses</span>
          </div>
          <div className="text-[11px] text-ink-muted mt-1">
            Theory, Labs &amp; Capstone
          </div>
        </div>

        {/* Card 4: Timetable Readiness */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
              Preparation Status
            </span>
            <div className="p-1.5 rounded bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-xl sm:text-2xl font-bold text-emerald-800 uppercase">
            {departmentStatus}
          </div>
          <div className="text-[11px] text-ink-muted mt-1">
            Coordinator: Prof. Rajesh Shetty
          </div>
        </div>
      </div>

      {/* Global Stepper */}
      <WorkflowProgress currentStage="Department" />

      {/* Roster & Allocation Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Faculty Workload Summary (7 Cols) */}
        <div className="lg:col-span-7 bg-surface rounded-card border border-border-beige p-5 shadow-crisp">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-subtle">
            <div>
              <h3 className="font-headline text-base font-semibold text-primary">
                Faculty Workload &amp; Contact Hours (AIDS)
              </h3>
              <p className="text-xs text-ink-muted mt-0.5">
                Weekly teaching hours mapped against AICTE 20-hour maximum limit.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('workload')}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <span>View Roster</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {aidsFaculty.map((fac) => {
              const pct = Math.round((fac.assignedHours / fac.maxHours) * 100);
              return (
                <div
                  key={fac.id}
                  className="p-3 bg-canvas-paper rounded border border-border-subtle flex items-center justify-between gap-3 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-ink">{fac.name}</div>
                    <div className="text-[11px] text-ink-muted mt-0.5 font-mono">
                      {fac.designation} • {fac.empId}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right font-mono">
                      <span className="font-bold text-ink">
                        {fac.assignedHours} / {fac.maxHours}h
                      </span>
                      <span className="text-[10px] text-ink-light block">
                        {fac.theoryHours}h Th + {fac.labHours}h Lab
                      </span>
                    </div>

                    <div className="w-20 bg-canvas-muted h-2 rounded-full overflow-hidden border border-border-subtle hidden sm:block">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Preferences Status (5 Cols) */}
        <div className="lg:col-span-5 bg-surface rounded-card border border-border-beige p-5 shadow-crisp flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-subtle">
              <div>
                <h3 className="font-headline text-base font-semibold text-primary">
                  Faculty Course Preferences
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Submissions reviewed by Timetable Coordinator.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('preferences')}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              {facultyPreferences.slice(0, 3).map((pref) => (
                <div
                  key={pref.id}
                  className="p-3 bg-canvas-paper rounded border border-border-subtle space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-ink">{pref.facultyName}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold">
                      {pref.status}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-primary">
                    {pref.subjectCode} — {pref.subjectTitle}
                  </div>
                  <div className="text-[11px] text-ink-muted">
                    Priority: {pref.priority} • {pref.category}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle mt-4 text-xs text-ink-muted flex items-center gap-2">
            <Info className="w-4 h-4 text-primary flex-shrink-0" />
            <span>
              Subject allocations and timetable generation are administered by the Department Timetable Coordinator.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

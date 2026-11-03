import React from 'react';
import { Clock, CheckCircle2, Cpu, Sparkles, BookOpen, MapPin } from 'lucide-react';

export const SchedulePreview: React.FC = () => {
  return (
    <div className="w-full space-y-4">
      {/* Mini Top Banner - Solver Status */}
      <div className="flex items-center justify-between p-3 rounded-card bg-surface/90 border border-border-beige shadow-crisp-sm backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-teal opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-teal"></span>
          </span>
          <span className="text-xs font-mono font-semibold tracking-wide text-ink">
            ENGINE STATUS
          </span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent-teal/10 border border-accent-teal/20 text-accent-teal font-mono text-[11px] font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>OR-Tools CP-SAT Ready</span>
        </div>
      </div>

      {/* Timetable Card 1: Core Lecture */}
      <div className="group p-4 bg-surface rounded-card border border-border-beige hover:border-primary/40 transition-all duration-200 shadow-crisp">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] font-mono font-semibold uppercase rounded border border-primary/20">
                Core Theory
              </span>
              <span className="text-[11px] font-mono text-ink-muted">CS302 • 3:0:0</span>
            </div>
            <h4 className="font-headline font-semibold text-sm text-ink group-hover:text-primary transition-colors">
              Data Structures & Algorithmic Analysis
            </h4>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-canvas-muted text-ink-muted font-mono text-[10px] font-medium">
            <Clock className="w-3 h-3 text-ink-light" /> 09:00 - 10:00
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-border-subtle">
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-accent-teal" />
            <span className="font-medium">Dr. Radhika Shenoy</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-ink-light">
            <MapPin className="w-3 h-3" />
            <span>Room L-302</span>
          </div>
        </div>
      </div>

      {/* Timetable Card 2: Laboratory Session */}
      <div className="group p-4 bg-surface rounded-card border-l-4 border-l-accent-teal border-y border-r border-border-beige shadow-crisp">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-1.5 py-0.5 bg-accent-teal/15 text-accent-teal text-[10px] font-mono font-semibold uppercase rounded border border-accent-teal/25">
                Instructional Lab
              </span>
              <span className="text-[11px] font-mono text-ink-muted">CS308P • 0:0:3</span>
            </div>
            <h4 className="font-headline font-semibold text-sm text-ink group-hover:text-accent-teal transition-colors">
              Advanced Systems & Embedded Architecture
            </h4>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-canvas-muted text-ink-muted font-mono text-[10px] font-medium">
            <Clock className="w-3 h-3 text-ink-light" /> 10:15 - 12:15
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-ink-muted pt-2 border-t border-border-subtle">
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-accent-teal" />
            <span className="font-medium">Prof. K. V. Bhat & Batch B1</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] font-mono text-ink-light">
            <MapPin className="w-3 h-3" />
            <span>CC-Lab 02</span>
          </div>
        </div>
      </div>

      {/* Timetable Card 3: Workload Equilibrium Widget */}
      <div className="p-3.5 bg-surface/90 rounded-card border border-border-beige shadow-crisp-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Faculty Allocation Equilibrium
          </span>
          <span className="text-[11px] font-mono font-semibold text-primary">
            18 / 20 Hrs Assigned
          </span>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 bg-canvas-muted rounded-full overflow-hidden border border-border-subtle">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: '90%' }}
          ></div>
        </div>
        <div className="flex items-center justify-between text-[10px] text-ink-light font-mono mt-1.5">
          <span>VTU Normative Baseline</span>
          <span className="text-success font-medium">Optimal Workload</span>
        </div>
      </div>

      {/* Days Strip */}
      <div className="grid grid-cols-6 gap-1.5 pt-1 text-center font-mono text-[11px]">
        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, idx) => (
          <div
            key={day}
            className={`py-1.5 rounded border ${
              idx === 1
                ? 'bg-primary text-white border-primary font-semibold shadow-crisp-sm'
                : 'bg-surface text-ink-muted border-border-beige hover:border-ink-light'
            }`}
          >
            {day}
          </div>
        ))}
      </div>
    </div>
  );
};

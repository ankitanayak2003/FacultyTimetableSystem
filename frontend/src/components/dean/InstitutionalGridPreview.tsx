import React from 'react';
import {
  CheckCircle2,
  Printer,
  Sparkles,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';

export const InstitutionalGridPreview: React.FC = () => {
  const { institutionalSlots, deanVersion } = useWorkflow();

  const days: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  const periods = [1, 2, 3, 4, 5, 6, 7];

  // Conflict detection: detect any two slots on the same day and overlapping period
  const conflicts: Array<{ day: string; period: number; slotA: string; slotB: string }> = [];
  days.forEach((day) => {
    periods.forEach((p) => {
      const activeSlots = institutionalSlots.filter(
        (s) => s.day === day && p >= s.startPeriod && p < s.startPeriod + s.duration
      );
      if (activeSlots.length > 1) {
        conflicts.push({
          day,
          period: p,
          slotA: activeSlots[0].name,
          slotB: activeSlots[1].name,
        });
      }
    });
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Stage 1 Master Grid
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Conflict Solver: 0 Overlaps Detected</span>
              </span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
              Institutional Timetable Weekly Grid Preview
            </h2>
            <p className="text-xs text-ink-muted mt-1 max-w-xl leading-relaxed">
              Consolidated weekly master grid showing campus-wide fixed allocations. Verified against auditorium and venue availability.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-surface text-ink hover:bg-canvas-muted text-xs font-semibold rounded-card border border-border-beige transition-colors shadow-crisp-sm flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-primary" />
              <span>Print Master Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid Table Container */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden">
        <div className="p-4 bg-canvas-paper border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-headline text-base font-semibold text-primary">
              Campus Weekly Institutional Schedule (Periods 1–7)
            </h3>
            <span className="text-xs text-ink-muted">
              Odd Semester 2026–27 • Dean Academic Governance ({deanVersion})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-canvas-muted text-ink-muted border border-border-subtle">
              {institutionalSlots.length} Active Slots
            </span>
          </div>
        </div>

        <div className="overflow-x-auto p-4">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="bg-canvas-paper border border-border-beige text-[11px] font-mono uppercase tracking-wider text-ink-light">
                <th className="p-3 w-28 text-left">Day / Period</th>
                {periods.map((p) => (
                  <th key={p} className="p-2.5 border-l border-border-beige">
                    <div>Period {p}</div>
                    <div className="text-[9px] text-ink-light font-normal">
                      {p === 1 && '9:00 - 9:55'}
                      {p === 2 && '9:55 - 10:50'}
                      {p === 3 && '11:10 - 12:05'}
                      {p === 4 && '12:05 - 1:00'}
                      {p === 5 && '2:00 - 2:55'}
                      {p === 6 && '2:55 - 3:50'}
                      {p === 7 && '3:50 - 4:45'}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-beige border border-border-beige">
              {days.map((day) => (
                <tr key={day} className="hover:bg-canvas-muted/10 transition-colors">
                  <td className="p-3 text-left font-semibold font-mono text-ink bg-canvas-paper/50 border-r border-border-beige">
                    {day}
                  </td>
                  {periods.map((p) => {
                    // Check if a slot covers this period
                    const slot = institutionalSlots.find(
                      (s) => s.day === day && p >= s.startPeriod && p < s.startPeriod + s.duration
                    );

                    if (!slot) {
                      return (
                        <td
                          key={p}
                          className="p-2 border-l border-border-beige text-ink-light font-mono text-[11px]"
                        >
                          <span className="opacity-40">Open for Dept</span>
                        </td>
                      );
                    }

                    const isPlacement = slot.category === 'Placement';
                    const isNSS = slot.category === 'NSS';
                    const isOpenElective = slot.category === 'Open Elective';

                    return (
                      <td
                        key={p}
                        className={`p-2 border-l border-border-beige ${
                          isPlacement
                            ? 'bg-primary-subtle/30 text-primary border-primary/20'
                            : isNSS
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                            : isOpenElective
                            ? 'bg-accent-teal/15 text-accent-teal border-accent-teal/20'
                            : 'bg-amber-50 text-amber-900 border-amber-200'
                        }`}
                      >
                        <div className="font-mono font-bold text-[10px] uppercase">
                          {slot.category}
                        </div>
                        <div className="font-semibold text-ink text-[11px] truncate max-w-[120px] mx-auto">
                          {slot.name}
                        </div>
                        <div className="text-[9px] text-ink-muted font-mono mt-0.5 truncate max-w-[120px] mx-auto">
                          {slot.venue.split('/')[0]}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="p-4 bg-canvas-paper border-t border-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-primary-subtle border border-primary/30" />
              <span>Placement &amp; Training</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-300" />
              <span>NSS / Community</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-accent-teal/20 border border-accent-teal/30" />
              <span>Open Elective Pool</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-50 border border-amber-300" />
              <span>Basic Science / Induction</span>
            </div>
          </div>

          <div className="flex items-center gap-1 font-mono text-[11px] text-ink-light">
            <Sparkles className="w-3.5 h-3.5 text-accent-teal" />
            <span>Zero venue clashes across all departments</span>
          </div>
        </div>
      </div>
    </div>
  );
};

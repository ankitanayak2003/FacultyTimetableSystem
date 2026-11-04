import React, { useState } from 'react';
import {
  Lock,
  Building,
  ShieldCheck,
  Calendar,
  Clock,
  Printer,
  Info,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';

export const InstitutionalTimetableView: React.FC = () => {
  const { institutionalSlots, deanStatus, deanVersion, deanLockedTimestamp } =
    useWorkflow();

  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    'All',
    'Placement',
    'NSS',
    'Open Elective',
    'Basic Science',
    'Co-Curricular',
  ];

  const filteredSlots =
    selectedCategory === 'All'
      ? institutionalSlots
      : institutionalSlots.filter((s) => s.category === selectedCategory);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Institution-Wide Master Schedule
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" />
                <span>Dean Status: {deanStatus} ({deanVersion})</span>
              </span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
              Institutional Timetable &amp; Fixed Slots
            </h2>
            <p className="text-xs text-ink-muted mt-1 max-w-xl leading-relaxed">
              Dean-certified institutional slots reserved for placement training, open electives, NSS community service, and basic science common hours.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-surface text-ink hover:bg-canvas-muted text-xs font-semibold rounded-card border border-border-beige transition-colors shadow-crisp-sm flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-primary" />
              <span>Print Schedule</span>
            </button>
          </div>
        </div>

        {/* Lock metadata banner */}
        <div className="mt-4 pt-3 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs text-ink-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Officially locked on <strong>{deanLockedTimestamp}</strong> by Dean Academics (Dr. Sudarshan Rao).
            </span>
          </div>
          <span className="text-[11px] font-mono text-ink-light">
            Immutable to downstream department coordinators
          </span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-card text-xs font-medium transition-colors whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-primary text-white shadow-crisp-sm'
                : 'bg-surface text-ink-muted hover:text-ink border border-border-subtle'
            }`}
          >
            {cat} {cat === 'All' ? `(${institutionalSlots.length})` : ''}
          </button>
        ))}
      </div>

      {/* Institutional Slots Table */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden">
        <div className="p-4 bg-canvas-paper border-b border-border-subtle flex items-center justify-between">
          <h3 className="font-headline text-base font-semibold text-primary">
            Fixed Institutional Activity Roster
          </h3>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-canvas-muted text-ink-muted">
            {filteredSlots.length} Configured Slots
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-canvas-paper/70 border-b border-border-subtle text-[11px] font-mono uppercase tracking-wider text-ink-light">
                <th className="p-3.5">Activity &amp; Category</th>
                <th className="p-3.5">Scheduled Day &amp; Time</th>
                <th className="p-3.5">Applicable Semesters</th>
                <th className="p-3.5">Assigned Lead / Faculty</th>
                <th className="p-3.5">Designated Venue</th>
                <th className="p-3.5 text-right">Lock Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredSlots.map((slot) => (
                <tr key={slot.id} className="hover:bg-canvas-muted/20 transition-colors">
                  <td className="p-3.5">
                    <div className="font-semibold text-ink">{slot.name}</div>
                    <div className="text-[11px] text-ink-muted mt-0.5 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-primary-subtle text-primary font-mono text-[10px]">
                        {slot.category}
                      </span>
                      {slot.remarks && <span className="truncate max-w-xs">{slot.remarks}</span>}
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="font-medium text-ink flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>{slot.day}</span>
                    </div>
                    <div className="text-[11px] text-ink-muted flex items-center gap-1 font-mono mt-0.5">
                      <Clock className="w-3 h-3 text-ink-light" />
                      <span>
                        Period {slot.startPeriod} to {slot.startPeriod + slot.duration - 1} ({slot.duration} hrs)
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1">
                      {slot.applicableSemesters.map((sem) => (
                        <span
                          key={sem}
                          className="px-2 py-0.5 rounded bg-canvas-muted text-ink font-mono text-[10px] border border-border-subtle"
                        >
                          {sem}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3.5 font-medium text-ink">
                    {slot.assignedFaculty}
                  </td>
                  <td className="p-3.5 font-mono text-ink-muted">
                    <div className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-ink-light" />
                      <span>{slot.venue}</span>
                    </div>
                  </td>
                  <td className="p-3.5 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold">
                      <Lock className="w-3 h-3" />
                      <span>LOCKED</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Read-only notice */}
        <div className="p-3.5 bg-canvas-muted border-t border-border-subtle text-xs text-ink-muted flex items-center gap-2">
          <Info className="w-4 h-4 text-primary flex-shrink-0" />
          <span>
            Institutional slots are configured and governed solely by the Dean Academics. Downstream departments inherit these slots as read-only blocks.
          </span>
        </div>
      </div>
    </div>
  );
};

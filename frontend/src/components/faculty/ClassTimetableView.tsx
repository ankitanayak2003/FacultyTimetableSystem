import React, { useState } from 'react';
import {
  MapPin,
  Building,
  GraduationCap,
} from 'lucide-react';
import { CLASS_WISE_TIMETABLES } from '../../data/facultyDemoData';

export const ClassTimetableView: React.FC = () => {
  const [selectedClassId, setSelectedClassId] = useState<string>(
    CLASS_WISE_TIMETABLES[0].classId
  );

  const activeClass =
    CLASS_WISE_TIMETABLES.find((c) => c.classId === selectedClassId) ||
    CLASS_WISE_TIMETABLES[0];

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
  const PERIODS = [1, 2, 3, 4, 5, 6, 7];

  const getSlot = (day: string, period: number) => {
    return activeClass.slots.find((s) => s.day === day && s.period === period);
  };

  return (
    <div className="w-full space-y-4 animate-fade-in">
      {/* Class Selector Header */}
      <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-ink-light block">
            Department of AI &amp; DS
          </span>
          <h3 className="font-headline text-lg font-semibold text-primary">
            Class-Wise Schedule Matrix
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            View section-level timetables within your department. (Read-Only)
          </p>
        </div>

        {/* Dropdown to switch class/section */}
        <div className="flex items-center gap-2">
          <label htmlFor="class-select" className="text-xs font-semibold text-ink-muted">
            Select Class:
          </label>
          <select
            id="class-select"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="px-3 py-1.5 rounded-card bg-surface border border-border-beige text-xs font-semibold text-ink focus:outline-none focus:border-primary shadow-crisp-sm cursor-pointer"
          >
            {CLASS_WISE_TIMETABLES.map((c) => (
              <option key={c.classId} value={c.classId}>
                {c.label} ({c.classroom})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Class Information Strip */}
      <div className="p-3 bg-canvas-muted rounded-card border border-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 font-semibold text-ink font-headline text-sm">
            <Building className="w-4 h-4 text-primary" />
            {activeClass.label}
          </span>
          <span className="text-ink-light">•</span>
          <span className="font-mono text-ink-muted">Venue: {activeClass.classroom}</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-ink-light">
          <GraduationCap className="w-3.5 h-3.5 text-accent-teal" />
          <span>Curriculum: VTU 2021 CBCS Scheme</span>
        </div>
      </div>

      {/* Timetable Table */}
      <div className="overflow-x-auto rounded-card border border-border-beige shadow-crisp bg-surface">
        <table className="w-full border-collapse min-w-[850px] text-left text-xs">
          <thead>
            <tr className="bg-canvas-paper border-b border-border-beige text-primary font-mono">
              <th className="p-3 w-28 border-r border-border-beige">Day / Time</th>
              {PERIODS.map((p) => (
                <th key={p} className="p-3 border-r border-border-subtle last:border-r-0">
                  <div className="font-bold">Period {p}</div>
                  <div className="text-[10px] text-ink-light font-normal">
                    {p === 1 && '09:00 - 10:00'}
                    {p === 2 && '10:00 - 11:00'}
                    {p === 3 && '11:15 - 12:15'}
                    {p === 4 && '12:15 - 01:15'}
                    {p === 5 && '02:00 - 03:00'}
                    {p === 6 && '03:00 - 04:00'}
                    {p === 7 && '04:00 - 05:00'}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {DAYS.map((day) => {
              let skipPeriods = 0;

              return (
                <tr key={day} className="hover:bg-canvas-muted/20 transition-colors">
                  <th className="p-3 bg-canvas-paper border-r border-border-beige font-headline font-semibold text-primary">
                    {day}
                  </th>
                  {PERIODS.map((period) => {
                    if (skipPeriods > 0) {
                      skipPeriods--;
                      return null;
                    }

                    const slot = getSlot(day, period);
                    if (!slot) {
                      return (
                        <td
                          key={period}
                          className="p-2 border-r border-border-subtle last:border-r-0 bg-surface/50 text-center"
                        >
                          <div className="h-full min-h-[75px] flex items-center justify-center">
                            <span className="text-xs text-ink-light/40 font-mono">Free</span>
                          </div>
                        </td>
                      );
                    }

                    const span = slot.duration || 1;
                    if (span > 1) {
                      skipPeriods = span - 1;
                    }

                    const isLab = slot.type === 'Laboratory';

                    return (
                      <td
                        key={period}
                        colSpan={span}
                        className="p-2 border-r border-border-subtle last:border-r-0 align-top"
                      >
                        <div
                          className={`h-full min-h-[75px] p-2 rounded-card border flex flex-col justify-between ${
                            isLab
                              ? 'bg-accent-teal/10 border-accent-teal/30 border-l-4 border-l-accent-teal text-ink shadow-crisp-sm'
                              : 'bg-surface border-border-beige hover:border-primary/40 shadow-crisp-sm text-ink'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-0.5">
                              <span
                                className={`text-[11px] font-mono font-bold ${
                                  isLab ? 'text-accent-teal' : 'text-primary'
                                }`}
                              >
                                {slot.courseCode}
                              </span>
                              <span className="text-[9px] font-mono px-1 rounded bg-canvas-muted text-ink-light">
                                {slot.type}
                              </span>
                            </div>
                            <h5 className="font-headline text-xs font-semibold text-ink line-clamp-1">
                              {slot.courseTitle}
                            </h5>
                          </div>

                          <div className="pt-1.5 mt-1 border-t border-border-subtle/60 flex items-center justify-between text-[10px] text-ink-muted">
                            <span className="truncate max-w-[90px]">{slot.faculty}</span>
                            <span className="font-mono text-ink-light flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5 text-primary" />
                              {slot.room}
                            </span>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

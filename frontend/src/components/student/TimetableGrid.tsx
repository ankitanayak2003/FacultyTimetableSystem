import React from 'react';
import {
  Clock,
  MapPin,
  User,
  Coffee,
  Utensils,
  GraduationCap,
} from 'lucide-react';
import {
  TimetableSlot,
  DayOfWeek,
  DAYS_OF_WEEK,
} from '../../data/studentDemoData';

interface TimetableGridProps {
  slots: TimetableSlot[];
  selectedDayFilter?: string; // 'All' or specific day
  typeFilter?: string; // 'All' | 'Theory' | 'Laboratory'
  isPublished: boolean;
}

interface PeriodDef {
  id: string;
  periodNum: number | null;
  label: string;
  time: string;
  isBreak?: boolean;
  breakType?: 'tea' | 'lunch';
}

const PERIOD_COLUMNS: PeriodDef[] = [
  { id: 'p1', periodNum: 1, label: 'Period 1', time: '09:00 - 10:00' },
  { id: 'p2', periodNum: 2, label: 'Period 2', time: '10:00 - 11:00' },
  { id: 'tea', periodNum: null, label: 'Tea Break', time: '11:00 - 11:15', isBreak: true, breakType: 'tea' },
  { id: 'p3', periodNum: 3, label: 'Period 3', time: '11:15 - 12:15' },
  { id: 'p4', periodNum: 4, label: 'Period 4', time: '12:15 - 01:15' },
  { id: 'lunch', periodNum: null, label: 'Lunch Break', time: '01:15 - 02:00', isBreak: true, breakType: 'lunch' },
  { id: 'p5', periodNum: 5, label: 'Period 5', time: '02:00 - 03:00' },
  { id: 'p6', periodNum: 6, label: 'Period 6', time: '03:00 - 04:00' },
  { id: 'p7', periodNum: 7, label: 'Period 7', time: '04:00 - 05:00' },
];

export const TimetableGrid: React.FC<TimetableGridProps> = ({
  slots,
  selectedDayFilter = 'All',
  typeFilter = 'All',
  isPublished,
}) => {
  if (!isPublished) {
    return (
      <div className="p-12 text-center bg-surface rounded-card border border-border-beige shadow-crisp my-4">
        <div className="w-16 h-16 rounded-full bg-canvas-muted text-ink-light mx-auto flex items-center justify-center mb-4 border border-border-beige">
          <Clock className="w-8 h-8 text-primary/60" />
        </div>
        <h4 className="font-headline text-2xl font-semibold text-ink mb-2">
          Timetable Under Review &amp; Optimization
        </h4>
        <p className="text-sm text-ink-muted max-w-md mx-auto leading-relaxed mb-4">
          The semester timetable for Section A is currently being finalized by the Department Timetable Committee.
        </p>
        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-subtle border border-primary/20 text-primary text-xs font-mono font-medium">
          Official Release Pending HOD Sign-Off
        </span>
      </div>
    );
  }

  // Filter slots based on day & type
  const filteredDays: DayOfWeek[] =
    selectedDayFilter === 'All'
      ? (DAYS_OF_WEEK as unknown as DayOfWeek[])
      : [selectedDayFilter as DayOfWeek];

  const getSlot = (day: DayOfWeek, period: number) => {
    return slots.find((s) => s.day === day && s.period === period);
  };

  const shouldHighlight = (slot?: TimetableSlot) => {
    if (!slot) return true;
    if (typeFilter === 'All') return true;
    if (typeFilter === 'Theory' && slot.type === 'Theory') return true;
    if (typeFilter === 'Laboratory' && slot.type === 'Laboratory') return true;
    return false;
  };

  return (
    <div className="w-full space-y-4">
      {/* Scrollable Container with sticky day label */}
      <div className="overflow-x-auto rounded-card border border-border-beige shadow-crisp bg-surface">
        <table className="w-full border-collapse min-w-[960px] text-left">
          {/* Table Header */}
          <thead>
            <tr className="bg-canvas-paper border-b border-border-beige">
              <th
                scope="col"
                className="sticky left-0 z-20 bg-canvas-paper p-3 text-xs font-mono font-semibold uppercase tracking-wider text-primary border-r border-border-beige w-32 shadow-[2px_0_4px_-1px_rgba(83,14,33,0.06)]"
              >
                Day / Time
              </th>
              {PERIOD_COLUMNS.map((col) => {
                if (col.isBreak) {
                  return (
                    <th
                      key={col.id}
                      scope="col"
                      className="p-2 text-center text-[10px] font-mono text-ink-light bg-canvas-muted/60 border-r border-border-subtle w-14"
                    >
                      <div className="flex flex-col items-center justify-center">
                        {col.breakType === 'tea' ? (
                          <Coffee className="w-3.5 h-3.5 text-primary/70 mb-0.5" />
                        ) : (
                          <Utensils className="w-3.5 h-3.5 text-accent-teal/70 mb-0.5" />
                        )}
                        <span className="font-semibold uppercase">{col.label}</span>
                        <span className="text-[9px] text-ink-light font-normal">
                          {col.time.split(' - ')[0]}
                        </span>
                      </div>
                    </th>
                  );
                }

                return (
                  <th
                    key={col.id}
                    scope="col"
                    className="p-3 text-xs font-mono text-ink border-r border-border-subtle last:border-r-0 min-w-[130px]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary">{col.label}</span>
                      <span className="text-[10px] text-ink-light font-normal">
                        P{col.periodNum}
                      </span>
                    </div>
                    <div className="text-[10px] text-ink-muted mt-0.5 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-ink-light" />
                      <span>{col.time}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-border-subtle">
            {filteredDays.map((day) => {
              // Track skipped cells for multi-period slots (like labs)
              let skipPeriods = 0;

              return (
                <tr key={day} className="hover:bg-canvas-muted/20 transition-colors">
                  {/* Sticky Day Column */}
                  <th
                    scope="row"
                    className="sticky left-0 z-10 bg-canvas-paper p-3 text-xs font-headline font-bold text-ink border-r border-border-beige shadow-[2px_0_4px_-1px_rgba(83,14,33,0.06)]"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-primary">{day}</span>
                    </div>
                    <span className="text-[10px] font-mono text-ink-light block font-normal mt-0.5">
                      {day === 'Saturday' ? 'Half Day' : 'Full Day'}
                    </span>
                  </th>

                  {/* Period Columns */}
                  {PERIOD_COLUMNS.map((col) => {
                    // Break columns
                    if (col.isBreak) {
                      return (
                        <td
                          key={col.id}
                          className="p-1.5 bg-canvas-muted/40 border-r border-border-subtle text-center text-[10px] font-mono text-ink-light select-none"
                        >
                          <div className="h-full min-h-[90px] flex items-center justify-center opacity-60">
                            <span className="[writing-mode:vertical-rl] rotate-180 text-[9px] uppercase tracking-widest font-semibold">
                              {col.label}
                            </span>
                          </div>
                        </td>
                      );
                    }

                    if (!col.periodNum) return null;

                    // Handle multi-period span skipping
                    if (skipPeriods > 0) {
                      skipPeriods--;
                      return null;
                    }

                    const slot = getSlot(day, col.periodNum);
                    const isDimmed = !shouldHighlight(slot);

                    if (!slot) {
                      return (
                        <td
                          key={col.id}
                          className="p-2 border-r border-border-subtle last:border-r-0 bg-surface/50 text-center"
                        >
                          <div className="h-full min-h-[90px] flex items-center justify-center">
                            <span className="text-xs text-ink-light/50 font-mono">—</span>
                          </div>
                        </td>
                      );
                    }

                    // Check for multi-period lab span (e.g. Wed lab spans periods 5, 6, 7)
                    const colSpan = slot.duration || 1;
                    if (colSpan > 1) {
                      skipPeriods = colSpan - 1;
                    }

                    // Style depending on type
                    const isLab = slot.type === 'Laboratory';
                    const isMentorship = slot.type === 'Mentorship';
                    const isLibrary = slot.type === 'Library';

                    return (
                      <td
                        key={col.id}
                        colSpan={colSpan}
                        className={`p-2 border-r border-border-subtle last:border-r-0 align-top transition-opacity ${
                          isDimmed ? 'opacity-30' : 'opacity-100'
                        }`}
                      >
                        <div
                          className={`h-full min-h-[96px] p-2.5 rounded-card border transition-all flex flex-col justify-between ${
                            isLab
                              ? 'bg-accent-teal/10 border-accent-teal/30 border-l-4 border-l-accent-teal text-ink shadow-crisp-sm'
                              : isMentorship
                              ? 'bg-accent-violet/10 border-accent-violet/30 border-l-4 border-l-accent-violet text-ink shadow-crisp-sm'
                              : isLibrary
                              ? 'bg-canvas-muted border-border-subtle border-l-4 border-l-ink-light text-ink'
                              : 'bg-surface border-border-beige hover:border-primary/40 shadow-crisp-sm text-ink'
                          }`}
                        >
                          {/* Course Code & Type Tag */}
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span
                                className={`text-[11px] font-mono font-bold tracking-tight ${
                                  isLab
                                    ? 'text-accent-teal'
                                    : isMentorship
                                    ? 'text-accent-violet'
                                    : 'text-primary'
                                }`}
                              >
                                {slot.courseCode}
                              </span>
                              <span
                                className={`text-[9px] font-mono px-1 py-0.2 rounded uppercase font-semibold ${
                                  isLab
                                    ? 'bg-accent-teal/20 text-accent-teal'
                                    : isMentorship
                                    ? 'bg-accent-violet/20 text-accent-violet'
                                    : 'bg-primary-subtle text-primary'
                                }`}
                              >
                                {slot.type}
                              </span>
                            </div>

                            {/* Title */}
                            <h5 className="text-xs font-headline font-semibold text-ink leading-tight line-clamp-2">
                              {slot.courseTitle}
                            </h5>
                          </div>

                          {/* Faculty & Room Footer */}
                          <div className="pt-2 mt-2 border-t border-border-subtle/60 flex flex-wrap items-center justify-between gap-1 text-[10px] text-ink-muted">
                            <div className="flex items-center gap-1 max-w-[120px] truncate">
                              <User className="w-3 h-3 text-ink-light flex-shrink-0" />
                              <span className="truncate">{slot.faculty}</span>
                            </div>
                            <div className="flex items-center gap-0.5 font-mono px-1.5 py-0.2 rounded bg-surface border border-border-subtle text-ink font-semibold flex-shrink-0">
                              <MapPin className="w-2.5 h-2.5 text-primary" />
                              <span>{slot.room}</span>
                            </div>
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

      {/* Legend & Summary Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface rounded-card border border-border-beige text-xs text-ink-muted">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-ink font-mono text-[11px] uppercase tracking-wide">
            Schedule Legend:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-surface border border-primary/40 inline-block"></span>
            <span>Core Theory Lecture</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-accent-teal/30 border border-accent-teal inline-block"></span>
            <span>Instructional Laboratory</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-accent-violet/30 border border-accent-violet inline-block"></span>
            <span>Mentorship &amp; Seminars</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px] text-ink-light">
          <GraduationCap className="w-3.5 h-3.5 text-primary" />
          <span>VTU CBCS 2021 Scheme • 34 Weekly Instructional Hours</span>
        </div>
      </div>
    </div>
  );
};

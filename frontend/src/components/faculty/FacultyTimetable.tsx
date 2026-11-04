import React, { useState } from 'react';
import {
  Printer,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import {
  FACULTY_ODD_TIMETABLE,
  FACULTY_EVEN_TIMETABLE,
  FacultyScheduleSlot,
} from '../../data/facultyDemoData';
import { ClassTimetableView } from './ClassTimetableView';

export const FacultyTimetable: React.FC = () => {
  const [semesterTerm, setSemesterTerm] = useState<'Odd' | 'Even'>('Odd');
  const [timetableMode, setTimetableMode] = useState<'personal' | 'classwise'>('personal');

  const slots: FacultyScheduleSlot[] =
    semesterTerm === 'Odd' ? FACULTY_ODD_TIMETABLE : FACULTY_EVEN_TIMETABLE;

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
  const PERIODS = [1, 2, 3, 4, 5, 6, 7];

  const getSlot = (day: string, period: number) => {
    return slots.find((s) => s.day === day && s.period === period);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-5 animate-fade-in">
      {/* Top Header & Controls */}
      <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-ink-light">
              Academic Schedule Engine
            </span>
            <span className="text-xs font-mono text-primary font-semibold">• {semesterTerm} Term</span>
          </div>
          <h3 className="font-headline text-xl font-semibold text-primary">
            Instructional Timetable Portal
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            View your individual teaching allocation and departmental class timetables. (Read-Only)
          </p>
        </div>

        {/* Action Controls: Mode Switcher & Semester Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Personal vs Class-Wise Mode Switcher */}
          <div className="flex items-center bg-canvas-muted p-1 rounded-card border border-border-subtle text-xs">
            <button
              type="button"
              onClick={() => setTimetableMode('personal')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                timetableMode === 'personal'
                  ? 'bg-surface text-primary shadow-crisp-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              My Teaching Timetable
            </button>
            <button
              type="button"
              onClick={() => setTimetableMode('classwise')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                timetableMode === 'classwise'
                  ? 'bg-surface text-primary shadow-crisp-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Class-Wise Timetables
            </button>
          </div>

          {/* Odd vs Even Semester Selector */}
          <div className="flex items-center bg-canvas-muted p-1 rounded-card border border-border-subtle text-xs">
            <button
              type="button"
              onClick={() => setSemesterTerm('Odd')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                semesterTerm === 'Odd'
                  ? 'bg-primary text-white shadow-crisp-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Odd Semester
            </button>
            <button
              type="button"
              onClick={() => setSemesterTerm('Even')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                semesterTerm === 'Even'
                  ? 'bg-primary text-white shadow-crisp-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Even Semester
            </button>
          </div>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            aria-label="Print timetable"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-card bg-surface hover:bg-canvas-muted text-ink text-xs font-semibold border border-border-beige transition-colors shadow-crisp-sm"
          >
            <Printer className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Print Schedule</span>
          </button>
        </div>
      </div>

      {/* Main View: Personal vs Class-Wise */}
      {timetableMode === 'classwise' ? (
        <ClassTimetableView />
      ) : (
        <div className="space-y-4">
          {/* Status Strip */}
          <div className="p-3 bg-canvas-muted rounded-card border border-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span className="font-semibold text-ink">
                Official Ratified Allocation — {semesterTerm} Semester AY 2026–27
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] text-ink-light">
              <span>HOD Approved (Dr. Vasudeva)</span>
              <span>•</span>
              <span>16 Teaching Hours Allocated</span>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-card border border-border-beige shadow-crisp bg-surface">
            <table className="w-full border-collapse min-w-[950px] text-left text-xs">
              <thead>
                <tr className="bg-canvas-paper border-b border-border-beige text-primary font-mono">
                  <th className="p-3 w-32 border-r border-border-beige">Day / Period</th>
                  {PERIODS.map((p) => (
                    <th key={p} className="p-3 border-r border-border-subtle last:border-r-0 min-w-[125px]">
                      <div className="font-bold">Period {p}</div>
                      <div className="text-[10px] text-ink-light font-normal">
                        {p === 1 && '09:00 - 10:00 AM'}
                        {p === 2 && '10:00 - 11:00 AM'}
                        {p === 3 && '11:15 - 12:15 PM'}
                        {p === 4 && '12:15 - 01:15 PM'}
                        {p === 5 && '02:00 - 03:00 PM'}
                        {p === 6 && '03:00 - 04:00 PM'}
                        {p === 7 && '04:00 - 05:00 PM'}
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
                        <div>{day}</div>
                        <span className="text-[10px] font-mono text-ink-light font-normal">
                          {day === 'Saturday' ? 'Half-Day' : 'Full-Day'}
                        </span>
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
                              <div className="h-full min-h-[85px] flex items-center justify-center">
                                <span className="text-xs text-ink-light/40 font-mono">—</span>
                              </div>
                            </td>
                          );
                        }

                        const span = slot.duration || 1;
                        if (span > 1) {
                          skipPeriods = span - 1;
                        }

                        const isLab = slot.type === 'Laboratory';
                        const isMentorship = slot.type === 'Mentorship';

                        return (
                          <td
                            key={period}
                            colSpan={span}
                            className="p-2 border-r border-border-subtle last:border-r-0 align-top"
                          >
                            <div
                              className={`h-full min-h-[85px] p-2.5 rounded-card border flex flex-col justify-between transition-all ${
                                isLab
                                  ? 'bg-accent-teal/10 border-accent-teal/30 border-l-4 border-l-accent-teal text-ink shadow-crisp-sm'
                                  : isMentorship
                                  ? 'bg-accent-violet/10 border-accent-violet/30 border-l-4 border-l-accent-violet text-ink shadow-crisp-sm'
                                  : 'bg-surface border-border-beige hover:border-primary/40 shadow-crisp-sm text-ink'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <span
                                    className={`text-[11px] font-mono font-bold ${
                                      isLab
                                        ? 'text-accent-teal'
                                        : isMentorship
                                        ? 'text-accent-violet'
                                        : 'text-primary'
                                    }`}
                                  >
                                    {slot.courseCode}
                                  </span>
                                  <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-surface border border-border-subtle text-ink-light">
                                    {slot.classSection}
                                  </span>
                                </div>
                                <h5 className="font-headline text-xs font-semibold text-ink leading-tight line-clamp-2">
                                  {slot.courseTitle}
                                </h5>
                              </div>

                              <div className="pt-1.5 mt-1 border-t border-border-subtle/60 flex items-center justify-between text-[10px] text-ink-muted">
                                <span className="font-mono">{slot.time.split(' - ')[0]}</span>
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

          {/* Schedule Footer Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface rounded-card border border-border-beige text-xs text-ink-muted">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-semibold text-ink font-mono text-[11px] uppercase tracking-wide">
                Legend:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-surface border border-primary/40 inline-block"></span>
                <span>Theory Lecture</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-accent-teal/30 border border-accent-teal inline-block"></span>
                <span>Laboratory Session</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-accent-violet/30 border border-accent-violet inline-block"></span>
                <span>Student Mentorship / Proctorial</span>
              </div>
            </div>

            <span className="text-[11px] font-mono text-ink-light">
              Academic Dean Ratification • SMVITM Timetable Cell
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

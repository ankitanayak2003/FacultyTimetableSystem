import React, { useState } from 'react';
import {
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';

export const HODDepartmentTimetableView: React.FC = () => {
  const { timetableEntries, departmentStatus } = useWorkflow();

  const [selectedSection, setSelectedSection] = useState('AIDS - 3A');
  const [selectedFacultyFilter, setSelectedFacultyFilter] = useState('All');
  const [semesterCycle, setSemesterCycle] = useState<'Odd' | 'Even'>('Odd');

  const days: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  const periods = [1, 2, 3, 4, 5, 6, 7];

  const facultyOptions = [
    'All',
    'Dr. Ananya Rao',
    'Prof. Rajesh Shetty',
    'Prof. Sneha Kamath',
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Departmental Academic Oversight
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>AIDS Status: {departmentStatus}</span>
              </span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
              Department Master Timetable
            </h2>
            <p className="text-xs text-ink-muted mt-1 max-w-xl leading-relaxed">
              Read-only oversight of the AI &amp; Data Science timetable prepared by Timetable Coordinator Prof. Rajesh Shetty.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-surface text-ink hover:bg-canvas-muted text-xs font-semibold rounded-card border border-border-beige transition-colors shadow-crisp-sm flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-primary" />
              <span>Print Timetable</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-surface rounded-card border border-border-beige p-4 shadow-crisp-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Cycle selector */}
          <div className="flex items-center rounded border border-border-subtle p-0.5 bg-canvas-muted">
            <button
              type="button"
              onClick={() => setSemesterCycle('Odd')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                semesterCycle === 'Odd'
                  ? 'bg-primary text-white shadow-crisp-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Odd Sem 2026–27
            </button>
            <button
              type="button"
              onClick={() => setSemesterCycle('Even')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                semesterCycle === 'Even'
                  ? 'bg-primary text-white shadow-crisp-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Even Sem
            </button>
          </div>

          {/* Section selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-ink-light font-medium">Section:</span>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="p-1.5 bg-canvas-paper border border-border-beige rounded text-xs text-ink focus:outline-none focus:border-primary font-mono"
            >
              <option value="AIDS - 3A">AIDS - 3A (Sem 3)</option>
              <option value="AIDS - 3B">AIDS - 3B (Sem 3)</option>
              <option value="AIDS - 5A">AIDS - 5A (Sem 5)</option>
            </select>
          </div>

          {/* Faculty filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-ink-light font-medium">Faculty:</span>
            <select
              value={selectedFacultyFilter}
              onChange={(e) => setSelectedFacultyFilter(e.target.value)}
              className="p-1.5 bg-canvas-paper border border-border-beige rounded text-xs text-ink focus:outline-none focus:border-primary"
            >
              {facultyOptions.map((fac) => (
                <option key={fac} value={fac}>
                  {fac}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs font-mono text-ink-light">
          Classroom: LH-201 / Computing Lab 1
        </div>
      </div>

      {/* Timetable Table Grid */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden">
        <div className="p-4 bg-canvas-paper border-b border-border-subtle flex items-center justify-between">
          <div>
            <h3 className="font-headline text-base font-semibold text-primary">
              Section Schedule: {selectedSection} ({semesterCycle} Semester)
            </h3>
            <span className="text-xs text-ink-muted">
              HOD Oversight View • Verified AICTE Normative Compliance
            </span>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 uppercase">
            {departmentStatus}
          </span>
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
                    const entry = timetableEntries.find(
                      (e) => e.day === day && e.period === p && e.section === selectedSection
                    );

                    if (!entry) {
                      return (
                        <td
                          key={p}
                          className="p-2 border-l border-border-beige text-ink-light font-mono text-[11px]"
                        >
                          —
                        </td>
                      );
                    }

                    // Check faculty filter
                    if (
                      selectedFacultyFilter !== 'All' &&
                      entry.facultyName !== selectedFacultyFilter
                    ) {
                      return (
                        <td
                          key={p}
                          className="p-2 border-l border-border-beige text-ink-light font-mono text-[11px] opacity-25"
                        >
                          Other Faculty
                        </td>
                      );
                    }

                    const isInstitutional = entry.isLockedSlot;

                    return (
                      <td
                        key={p}
                        className={`p-2 border-l border-border-beige ${
                          isInstitutional
                            ? 'bg-amber-50/70 border-amber-200'
                            : 'bg-primary-subtle/25'
                        }`}
                      >
                        <div
                          className={`font-mono font-bold text-[11px] ${
                            isInstitutional ? 'text-amber-900' : 'text-primary'
                          }`}
                        >
                          {entry.courseCode}
                        </div>
                        <div className="text-[10px] text-ink truncate max-w-[120px] mx-auto mt-0.5">
                          {entry.courseTitle}
                        </div>
                        <div className="text-[9px] text-ink-muted font-mono mt-0.5">
                          {entry.room} • {entry.facultyName.split(' ')[0]}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

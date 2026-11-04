import React, { useState } from 'react';
import {
  Lock,
  Plus,
  Trash2,
  AlertCircle,
  Printer,
  Sparkles,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';

export const TimetableBuilder: React.FC = () => {
  const {
    timetableEntries,
    addTimetableEntry,
    removeTimetableEntry,
    basicScienceStatus,
  } = useWorkflow();

  const isGated = basicScienceStatus !== 'LOCKED';

  const [selectedSection, setSelectedSection] = useState('AIDS - 3A');
  const [activeCellModal, setActiveCellModal] = useState<{
    day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
    period: number;
  } | null>(null);

  // New slot form
  const [courseCode, setCourseCode] = useState('21AI32');
  const [courseTitle, setCourseTitle] = useState('Data Structures & Applications');
  const [facultyName, setFacultyName] = useState('Dr. Ananya Rao');
  const [room, setRoom] = useState('LH-201');
  const [errorMsg, setErrorMsg] = useState('');

  const days: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  const periods = [1, 2, 3, 4, 5, 6, 7];

  const handleCellClick = (day: typeof days[0], period: number) => {
    if (isGated) return;
    const existing = timetableEntries.find(
      (e) => e.day === day && e.period === period && e.section === selectedSection
    );
    if (existing?.isLockedSlot) {
      alert(`This slot is locked by ${existing.lockedStage || 'Institutional Dean'}: "${existing.lockedReason}" and cannot be modified.`);
      return;
    }

    setActiveCellModal({ day, period });
    if (existing) {
      setCourseCode(existing.courseCode);
      setCourseTitle(existing.courseTitle);
      setFacultyName(existing.facultyName);
      setRoom(existing.room);
    }
  };

  const handleSaveSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCellModal) return;

    // Check teacher clash: is this faculty teaching another section at the same time?
    const teacherClash = timetableEntries.find(
      (e) =>
        e.day === activeCellModal.day &&
        e.period === activeCellModal.period &&
        e.facultyName === facultyName &&
        e.section !== selectedSection
    );

    if (teacherClash) {
      setErrorMsg(
        `Clash detected! ${facultyName} is already assigned to ${teacherClash.section} on ${activeCellModal.day} Period ${activeCellModal.period}.`
      );
      return;
    }

    setErrorMsg('');
    addTimetableEntry({
      day: activeCellModal.day,
      period: activeCellModal.period,
      courseCode,
      courseTitle,
      facultyName,
      room,
      section: selectedSection,
    });

    setActiveCellModal(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Stage 3 Interactive Workspace
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>AICTE Constraint Solver Active</span>
              </span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
              Visual Timetable Builder &amp; Slot Assigner
            </h2>
            <p className="text-xs text-ink-muted mt-1 max-w-xl leading-relaxed">
              Click any open period cell to assign lectures, laboratories, or electives. Locked institutional assignments are highlighted and protected from editing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-surface text-ink hover:bg-canvas-muted text-xs font-semibold rounded-card border border-border-beige transition-colors shadow-crisp-sm flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-primary" />
              <span>Print Draft</span>
            </button>
          </div>
        </div>
      </div>

      {/* Section Switcher Toolbar */}
      <div className="bg-surface rounded-card border border-border-beige p-4 shadow-crisp-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-medium text-ink-light">Active Cohort:</span>
          {['AIDS - 3A', 'AIDS - 3B', 'AIDS - 5A'].map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setSelectedSection(sec)}
              className={`px-3 py-1.5 rounded text-xs font-semibold font-mono transition-colors ${
                selectedSection === sec
                  ? 'bg-primary text-white shadow-crisp-sm'
                  : 'bg-canvas-paper text-ink-muted hover:text-ink border border-border-subtle'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-ink-light">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-50 border border-amber-300" />
            <span>Dean Locked Block</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-primary-subtle border border-primary/30" />
            <span>Dept Lecture</span>
          </span>
        </div>
      </div>

      {/* Interactive Weekly Timetable Grid */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden">
        <div className="p-4 bg-canvas-paper border-b border-border-subtle flex items-center justify-between">
          <div>
            <h3 className="font-headline text-base font-semibold text-primary">
              Section Schedule: {selectedSection}
            </h3>
            <span className="text-xs text-ink-muted">
              Odd Semester 2026–27 • Department of AI &amp; Data Science
            </span>
          </div>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-canvas-muted text-ink-muted">
            Click Cell to Assign / Edit
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
                          onClick={() => handleCellClick(day, p)}
                          className="p-2 border-l border-border-beige text-ink-light font-mono text-[11px] hover:bg-primary-subtle/30 cursor-pointer transition-colors"
                        >
                          <span className="opacity-40 flex items-center justify-center gap-1">
                            <Plus className="w-3 h-3 text-ink-light" />
                            <span>Assign</span>
                          </span>
                        </td>
                      );
                    }

                    const isInstitutional = entry.isLockedSlot;

                    return (
                      <td
                        key={p}
                        onClick={() => handleCellClick(day, p)}
                        className={`p-2 border-l border-border-beige cursor-pointer transition-all ${
                          isInstitutional
                            ? 'bg-amber-50/80 border-amber-300 text-amber-950 hover:bg-amber-100/80'
                            : 'bg-primary-subtle/30 hover:bg-primary-subtle/60'
                        }`}
                        title={
                          isInstitutional
                            ? `Locked: ${entry.lockedReason}`
                            : `Click to edit ${entry.courseCode}`
                        }
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-mono font-bold text-[11px] ${
                              isInstitutional ? 'text-amber-900' : 'text-primary'
                            }`}
                          >
                            {entry.courseCode}
                          </span>
                          {isInstitutional && (
                            <Lock className="w-2.5 h-2.5 text-amber-700 flex-shrink-0" />
                          )}
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

      {/* Cell Assignment Modal */}
      {activeCellModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-fade-in"
        >
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp-lg w-full max-w-md overflow-hidden animate-slide-up">
            <div className="p-4 bg-canvas-paper border-b border-border-subtle flex items-center justify-between">
              <div>
                <h3 className="font-headline text-base font-semibold text-primary">
                  Assign Slot: {activeCellModal.day} Period {activeCellModal.period}
                </h3>
                <span className="text-xs text-ink-muted font-mono">{selectedSection}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveCellModal(null)}
                className="p-1 text-ink-light hover:text-ink hover:bg-canvas-muted rounded"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 m-4 mb-0 bg-error-container border border-error/30 rounded-card text-xs text-error flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveSlot} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-medium text-ink mb-1">Course Code</label>
                <input
                  type="text"
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  className="w-full p-2 bg-canvas-paper border border-border-beige rounded text-xs text-ink focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Course Title</label>
                <input
                  type="text"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                  className="w-full p-2 bg-canvas-paper border border-border-beige rounded text-xs text-ink focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Assigned Faculty</label>
                <select
                  value={facultyName}
                  onChange={(e) => setFacultyName(e.target.value)}
                  className="w-full p-2 bg-canvas-paper border border-border-beige rounded text-xs text-ink focus:outline-none focus:border-primary"
                >
                  <option value="Dr. Ananya Rao">Dr. Ananya Rao (DSA / ML)</option>
                  <option value="Prof. Rajesh Shetty">Prof. Rajesh Shetty (Discrete Maths / DL)</option>
                  <option value="Prof. Sneha Kamath">Prof. Sneha Kamath (OOP Java)</option>
                  <option value="Prof. Sandeep Kumar">Prof. Sandeep Kumar (NLP)</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Classroom / Lab Venue</label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full p-2 bg-canvas-paper border border-border-beige rounded text-xs text-ink focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    removeTimetableEntry(activeCellModal.day, activeCellModal.period, selectedSection);
                    setActiveCellModal(null);
                  }}
                  className="px-3 py-1.5 text-xs text-error hover:bg-error/10 border border-error/20 rounded transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Slot</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveCellModal(null)}
                    className="px-3.5 py-1.5 text-xs text-ink-muted hover:text-ink"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-primary text-white hover:bg-primary-dark rounded shadow-crisp-sm"
                  >
                    Save Slot
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

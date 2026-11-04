import React, { useState } from 'react';
import {
  CheckCircle2,
  Printer,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';

export const PublishedTimetablesView: React.FC = () => {
  const { departments, timetableEntries } = useWorkflow();
  const [selectedDeptCode, setSelectedDeptCode] = useState('AIDS');

  const selectedDept = departments.find((d) => d.code === selectedDeptCode) || departments[0];
  const isPublished = selectedDept.status === 'Published';

  const days: Array<'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'> = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ];

  const periods = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Official Institutional Publication
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Executive Verified</span>
              </span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
              Published Academic Timetables
            </h2>
            <p className="text-xs text-ink-muted mt-1 max-w-xl leading-relaxed">
              Officially published timetables visible to students and faculty. Draft or in-progress schedules remain unapproved for release.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              disabled={!isPublished}
              className={`px-3.5 py-2 text-xs font-semibold rounded-card border transition-colors shadow-crisp-sm flex items-center gap-1.5 ${
                isPublished
                  ? 'bg-primary text-white hover:bg-primary-dark border-primary'
                  : 'bg-canvas-muted text-ink-light border-border-subtle cursor-not-allowed'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Timetable</span>
            </button>
          </div>
        </div>
      </div>

      {/* Department Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {departments.map((dept) => {
          const isDeptPub = dept.status === 'Published';
          return (
            <button
              key={dept.id}
              type="button"
              onClick={() => setSelectedDeptCode(dept.code)}
              className={`px-4 py-2 rounded-card text-xs font-medium transition-all flex items-center gap-2 ${
                selectedDeptCode === dept.code
                  ? 'bg-primary text-white shadow-crisp-sm'
                  : 'bg-surface text-ink-muted hover:text-ink border border-border-subtle'
              }`}
            >
              <span>{dept.code}</span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                  isDeptPub
                    ? selectedDeptCode === dept.code
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : selectedDeptCode === dept.code
                    ? 'bg-white/20 text-white'
                    : 'bg-amber-50 text-amber-800 border border-amber-300'
                }`}
              >
                {isDeptPub ? 'Published' : dept.status}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Timetable Display Area */}
      {isPublished ? (
        <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden">
          <div className="p-4 bg-canvas-paper border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-headline text-lg font-semibold text-primary">
                  {selectedDept.name} ({selectedDept.code})
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold">
                  Official v1.0
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                Class Section: AIDS - 3A • Odd Semester 2026–27 • HOD: {selectedDept.hod}
              </p>
            </div>
            <div className="text-right text-xs font-mono text-ink-light">
              <span>Classroom: LH-201 / Computing Labs</span>
            </div>
          </div>

          {/* Weekly Timetable Grid */}
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
                        (e) => e.day === day && e.period === p && e.section.includes('3A')
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

                      const isInstitutional = entry.isLockedSlot;

                      return (
                        <td
                          key={p}
                          className={`p-2 border-l border-border-beige ${
                            isInstitutional
                              ? 'bg-amber-50/60 border-amber-200'
                              : 'bg-primary-subtle/20'
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

          {/* Footer Seal */}
          <div className="p-3.5 bg-canvas-muted border-t border-border-subtle flex items-center justify-between text-xs text-ink-muted">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Certified under SMVITM Academic Regulations &amp; VTU Framework.</span>
            </div>
            <span className="font-mono text-[10px] text-ink-light">
              Signature: Dr. Thirumaleshwara Bhat, Principal
            </span>
          </div>
        </div>
      ) : (
        <div className="p-8 bg-surface rounded-card border border-border-beige shadow-crisp text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-headline text-lg font-semibold text-ink">
            {selectedDept.name} Timetable is Currently in {selectedDept.status} State
          </h3>
          <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
            Per institutional policy, draft and finalized timetables are not published for student viewing until the Department Coordinator and HOD complete official release authorization.
          </p>
        </div>
      )}
    </div>
  );
};

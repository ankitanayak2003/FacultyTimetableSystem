import React, { useState } from 'react';
import {
  Printer,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';

export const BasicScienceTimetablePreview: React.FC = () => {
  const { firstYearSections, basicScienceVersion } = useWorkflow();
  const [selectedSecId, setSelectedSecId] = useState(firstYearSections[0]?.id || '');

  const section = firstYearSections.find((s) => s.id === selectedSecId) || firstYearSections[0];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [1, 2, 3, 4, 5, 6, 7];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Stage 2 Preview
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Basic Science Certified ({basicScienceVersion})</span>
              </span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
              First-Year Section Master Timetable Preview
            </h2>
            <p className="text-xs text-ink-muted mt-1 max-w-xl leading-relaxed">
              Consolidated preview of first-year theory hours, laboratory contact blocks, and foundational mathematics modules for sections A through D.
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-surface text-ink hover:bg-canvas-muted text-xs font-semibold rounded-card border border-border-beige transition-colors shadow-crisp-sm flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5 text-primary" />
            <span>Print Section Schedule</span>
          </button>
        </div>
      </div>

      {/* Section Switcher Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {firstYearSections.map((sec) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => setSelectedSecId(sec.id)}
            className={`px-4 py-2 rounded-card text-xs font-medium transition-all ${
              selectedSecId === sec.id
                ? 'bg-primary text-white shadow-crisp-sm'
                : 'bg-surface text-ink-muted hover:text-ink border border-border-subtle'
            }`}
          >
            {sec.sectionName} ({sec.cycle} Cycle)
          </button>
        ))}
      </div>

      {/* Grid Container */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden">
        <div className="p-4 bg-canvas-paper border-b border-border-subtle flex items-center justify-between">
          <div>
            <h3 className="font-headline text-base font-semibold text-primary">
              {section?.sectionName} — {section?.cycle} Cycle
            </h3>
            <span className="text-xs text-ink-muted">
              Room: {section?.room} • Student Cohort: {section?.studentCount} Students
            </span>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
            Validated Clean
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
                    // Monday P1-P2 is Dean's Basic Science Induction
                    if (day === 'Monday' && (p === 1 || p === 2)) {
                      return (
                        <td key={p} className="p-2 border-l border-border-beige bg-amber-50/70 text-amber-900">
                          <div className="font-mono text-[10px] font-bold">INDUCTION</div>
                          <div className="text-[10px] font-medium">Universal Human Values</div>
                          <div className="text-[9px] font-mono text-amber-800 flex items-center justify-center gap-1 mt-0.5">
                            <Lock className="w-2.5 h-2.5" />
                            <span>Dean Locked</span>
                          </div>
                        </td>
                      );
                    }

                    // Thursday P4-P6 Lab
                    if (day === 'Thursday' && (p === 4 || p === 5 || p === 6)) {
                      return (
                        <td key={p} className="p-2 border-l border-border-beige bg-accent-teal/15 text-accent-teal">
                          <div className="font-mono text-[10px] font-bold">
                            {section?.cycle === 'Physics' ? 'PHYS-LAB' : 'CHEM-LAB'}
                          </div>
                          <div className="text-[10px] font-medium">Batch Practical Session</div>
                          <div className="text-[9px] font-mono text-ink-muted">Lab Block A</div>
                        </td>
                      );
                    }

                    // Tuesday P1-P2 Maths
                    if (day === 'Tuesday' && (p === 1 || p === 2)) {
                      return (
                        <td key={p} className="p-2 border-l border-border-beige bg-primary-subtle/30 text-primary">
                          <div className="font-mono text-[10px] font-bold">22MAT11</div>
                          <div className="text-[10px] font-medium">Calculus &amp; Algebra</div>
                          <div className="text-[9px] font-mono text-ink-muted">{section?.mathsTeacher.split(' ')[1]}</div>
                        </td>
                      );
                    }

                    // Wednesday P2-P3 Cycle theory
                    if (day === 'Wednesday' && (p === 2 || p === 3)) {
                      return (
                        <td key={p} className="p-2 border-l border-border-beige bg-teal-50 text-teal-900">
                          <div className="font-mono text-[10px] font-bold">
                            {section?.cycle === 'Physics' ? '22PHY12' : '22CHE12'}
                          </div>
                          <div className="text-[10px] font-medium">
                            {section?.cycle === 'Physics' ? 'Engg Physics' : 'Engg Chemistry'}
                          </div>
                          <div className="text-[9px] font-mono text-ink-muted">{section?.room}</div>
                        </td>
                      );
                    }

                    return (
                      <td key={p} className="p-2 border-l border-border-beige text-ink-light font-mono text-[11px]">
                        <span className="opacity-40">Open Study</span>
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

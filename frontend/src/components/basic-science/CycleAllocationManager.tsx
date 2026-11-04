import React, { useState } from 'react';
import {
  Atom,
  Lock,
  Info,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';

export const CycleAllocationManager: React.FC = () => {
  const {
    firstYearSections,
    updateFirstYearSection,
    basicScienceStatus,
    deanStatus,
  } = useWorkflow();

  const isGated = deanStatus !== 'LOCKED';
  const isLocked = basicScienceStatus === 'LOCKED';

  const [selectedSectionId, setSelectedSectionId] = useState<string>(
    firstYearSections[0]?.id || ''
  );

  const selectedSection =
    firstYearSections.find((s) => s.id === selectedSectionId) ||
    firstYearSections[0];

  const handleCycleToggle = (sectionId: string, newCycle: 'Physics' | 'Chemistry') => {
    if (isLocked || isGated) return;
    updateFirstYearSection(sectionId, { cycle: newCycle });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Stage 2 • 1st Year Allocation Engine
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                  isGated
                    ? 'bg-canvas-muted text-ink-light border border-border-subtle'
                    : isLocked
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border border-amber-300'
                }`}
              >
                {isGated
                  ? 'Gated by Dean'
                  : isLocked
                  ? 'Locked & Immutable'
                  : 'Drafting Active'}
              </span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
              Physics / Chemistry Cycle Allocation
            </h2>
            <p className="text-xs text-ink-muted mt-1 max-w-xl leading-relaxed">
              Assign first-year engineering cohorts to Physics and Chemistry instructional cycles, ensuring laboratory capacities and foundational faculty contact hours are balanced.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-canvas-muted text-ink border border-border-subtle">
              4 First-Year Sections
            </span>
          </div>
        </div>
      </div>

      {/* Section Selector Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {firstYearSections.map((sec) => (
          <button
            key={sec.id}
            type="button"
            onClick={() => setSelectedSectionId(sec.id)}
            className={`px-4 py-2 rounded-card text-xs font-medium transition-all flex items-center gap-2 ${
              selectedSectionId === sec.id
                ? 'bg-primary text-white shadow-crisp-sm'
                : 'bg-surface text-ink-muted hover:text-ink border border-border-subtle'
            }`}
          >
            <span>{sec.sectionName.split('(')[0]}</span>
            <span
              className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                sec.cycle === 'Physics'
                  ? selectedSectionId === sec.id
                    ? 'bg-white/20 text-white'
                    : 'bg-primary-subtle text-primary'
                  : selectedSectionId === sec.id
                  ? 'bg-white/20 text-white'
                  : 'bg-accent-teal/15 text-accent-teal'
              }`}
            >
              {sec.cycle} Cycle
            </span>
          </button>
        ))}
      </div>

      {/* Selected Section Details & Cycle Switcher */}
      {selectedSection && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Cycle Config (5 Cols) */}
          <div className="lg:col-span-5 bg-surface rounded-card border border-border-beige p-5 shadow-crisp space-y-4">
            <div className="pb-3 border-b border-border-subtle flex items-center justify-between">
              <div>
                <h3 className="font-headline text-base font-semibold text-primary">
                  {selectedSection.sectionName}
                </h3>
                <span className="text-xs text-ink-muted">
                  Room: {selectedSection.room} • {selectedSection.studentCount} Students
                </span>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-primary-subtle text-primary">
                {selectedSection.cycle} Cycle
              </span>
            </div>

            {/* Cycle Selector Toggle */}
            <div>
              <label className="block text-xs font-semibold text-ink mb-1.5">
                Instructional Stream Cycle
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isLocked || isGated}
                  onClick={() => handleCycleToggle(selectedSection.id, 'Physics')}
                  className={`p-3 rounded-card border text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                    selectedSection.cycle === 'Physics'
                      ? 'bg-primary text-white border-primary shadow-crisp-sm'
                      : 'bg-canvas-paper text-ink-muted hover:text-ink border-border-subtle'
                  } disabled:opacity-50`}
                >
                  <Atom className="w-5 h-5" />
                  <span>Physics Cycle</span>
                  <span className="text-[10px] font-mono opacity-80 font-normal">
                    Maths, Physics, C-Prog
                  </span>
                </button>

                <button
                  type="button"
                  disabled={isLocked || isGated}
                  onClick={() => handleCycleToggle(selectedSection.id, 'Chemistry')}
                  className={`p-3 rounded-card border text-xs font-semibold transition-all flex flex-col items-center gap-1 ${
                    selectedSection.cycle === 'Chemistry'
                      ? 'bg-accent-teal text-white border-accent-teal shadow-crisp-sm'
                      : 'bg-canvas-paper text-ink-muted hover:text-ink border-border-subtle'
                  } disabled:opacity-50`}
                >
                  <Atom className="w-5 h-5" />
                  <span>Chemistry Cycle</span>
                  <span className="text-[10px] font-mono opacity-80 font-normal">
                    Maths, Chemistry, CAD
                  </span>
                </button>
              </div>
            </div>

            {/* Faculty Mappings */}
            <div className="space-y-2 pt-2 border-t border-border-subtle text-xs">
              <span className="text-[10px] font-mono uppercase text-ink-light block">
                Assigned Teaching Faculty
              </span>

              <div className="p-2.5 bg-canvas-paper rounded border border-border-subtle flex items-center justify-between">
                <div>
                  <div className="font-semibold text-ink">Mathematics:</div>
                  <div className="text-[11px] text-ink-muted">{selectedSection.mathsTeacher}</div>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                  4h / wk
                </span>
              </div>

              <div className="p-2.5 bg-canvas-paper rounded border border-border-subtle flex items-center justify-between">
                <div>
                  <div className="font-semibold text-ink">
                    {selectedSection.cycle === 'Physics' ? 'Engineering Physics:' : 'Engineering Chemistry:'}
                  </div>
                  <div className="text-[11px] text-ink-muted">
                    {selectedSection.cycle === 'Physics'
                      ? selectedSection.physicsTeacher
                      : selectedSection.chemistryTeacher}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                  4h / wk
                </span>
              </div>

              <div className="p-2.5 bg-canvas-paper rounded border border-border-subtle flex items-center justify-between">
                <div>
                  <div className="font-semibold text-ink">Computing / CAD Lead:</div>
                  <div className="text-[11px] text-ink-muted">
                    {selectedSection.cProgrammingTeacher}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                  3h / wk
                </span>
              </div>
            </div>

            {/* Labs */}
            <div className="pt-2 border-t border-border-subtle text-xs">
              <span className="text-[10px] font-mono uppercase text-ink-light block mb-1.5">
                Allocated Laboratory Spaces
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedSection.assignedLabs.map((lab) => (
                  <span
                    key={lab}
                    className="px-2.5 py-1 rounded bg-canvas-muted text-ink font-mono text-[10px] border border-border-subtle"
                  >
                    {lab}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Weekly Schedule for Selected Section (7 Cols) */}
          <div className="lg:col-span-7 bg-surface rounded-card border border-border-beige p-5 shadow-crisp space-y-4">
            <div className="pb-3 border-b border-border-subtle flex items-center justify-between">
              <div>
                <h3 className="font-headline text-base font-semibold text-primary">
                  Weekly Class Schedule: {selectedSection.sectionName.split('(')[0]}
                </h3>
                <span className="text-xs text-ink-muted">
                  Displays core cycle courses alongside Dean's locked institutional assignments.
                </span>
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
                0 Clashes Flagged
              </span>
            </div>

            {/* Sample Weekly Schedule Roster */}
            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-canvas-paper rounded border border-border-subtle flex items-center justify-between">
                <div>
                  <div className="font-semibold text-ink">Monday Periods 1–2 (9:00 - 10:50 AM)</div>
                  <div className="text-[11px] text-primary font-medium mt-0.5">
                    First Year Induction &amp; Human Values (Aryabhata Hall)
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 font-semibold flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>Dean Locked</span>
                </span>
              </div>

              <div className="p-3 bg-canvas-paper rounded border border-border-subtle flex items-center justify-between">
                <div>
                  <div className="font-semibold text-ink">Tuesday Periods 1–3 (9:00 - 12:05 PM)</div>
                  <div className="text-[11px] text-ink-muted mt-0.5">
                    Calculus &amp; Linear Algebra (Dr. Subrahmanya) • LH-101
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary font-semibold">
                  Maths Core
                </span>
              </div>

              <div className="p-3 bg-canvas-paper rounded border border-border-subtle flex items-center justify-between">
                <div>
                  <div className="font-semibold text-ink">Wednesday Periods 2–4 (9:55 - 1:00 PM)</div>
                  <div className="text-[11px] text-ink-muted mt-0.5">
                    {selectedSection.cycle === 'Physics'
                      ? 'Engineering Physics Lecture (Dr. Ravindra)'
                      : 'Engineering Chemistry Lecture (Dr. K. K. Srinivasan)'}
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-semibold">
                  Cycle Theory
                </span>
              </div>

              <div className="p-3 bg-canvas-paper rounded border border-border-subtle flex items-center justify-between">
                <div>
                  <div className="font-semibold text-ink">Thursday Periods 4–6 (12:05 - 3:50 PM)</div>
                  <div className="text-[11px] text-ink-muted mt-0.5">
                    {selectedSection.cycle === 'Physics'
                      ? 'Engineering Physics Lab (Batch 1 & 2)'
                      : 'Engineering Chemistry Lab (Batch 1 & 2)'}
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-accent-violet/15 text-accent-violet font-semibold">
                  Cycle Practical
                </span>
              </div>
            </div>

            <div className="p-3 bg-canvas-muted rounded border border-border-subtle text-xs text-ink-muted flex items-center gap-2">
              <Info className="w-4 h-4 text-primary flex-shrink-0" />
              <span>
                First-year timetable entries conform with the AICTE Model Curriculum and Dean's Stage 1 master schedule.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

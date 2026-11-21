import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  Calendar,
  Printer,
  CheckCircle2,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { useDragAutoScroll } from '../../hooks/useDragAutoScroll';
import { InstitutionalSlot } from '../../data/workflowDemoData';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const InstitutionalTimetableView: React.FC = () => {
  const {
    institutionalSlots,
    deanStatus,
    deanVersion,
    deanLockedTimestamp,
    lockDeanSchedule,
    reopenDeanSchedule,
    addInstitutionalSlot,
    removeInstitutionalSlot,
  } = useWorkflow();

  // Automatic scrolling during timetable drag-and-drop
  useDragAutoScroll();

  const isLocked = deanStatus === 'LOCKED';

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modal States
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [isAddSlotModalOpen, setIsAddSlotModalOpen] = useState(false);

  // Form State for Add Slot
  const [slotName, setSlotName] = useState('');
  const [slotCategory, setSlotCategory] = useState<InstitutionalSlot['category']>('Placement');
  const [slotDay, setSlotDay] = useState<InstitutionalSlot['day']>('Friday');
  const [slotStartPeriod, setSlotStartPeriod] = useState<number>(5);
  const [slotDuration, setSlotDuration] = useState<number>(3);
  const [slotSemesters, setSlotSemesters] = useState('3rd Sem, 5th Sem, 7th Sem');
  const [slotFaculty, setSlotFaculty] = useState('Placement Officer');
  const [slotVenue, setSlotVenue] = useState('Auditorium');
  const [slotRemarks, setSlotRemarks] = useState('');

  // Dialog Remarks
  const [lockRemarks, setLockRemarks] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState<{ type: 'success' | 'warn'; msg: string } | null>(null);

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

  const handleConfirmLock = () => {
    lockDeanSchedule(lockRemarks.trim() || 'Approved and locked by Principal.');
    setIsLockModalOpen(false);
    setLockRemarks('');
    setFeedbackBanner({
      type: 'success',
      msg: 'Institutional master schedule locked! Downstream Basic Science and Department Coordinators are notified.',
    });
    setTimeout(() => setFeedbackBanner(null), 4500);
  };

  const handleConfirmReopen = () => {
    if (!reopenReason.trim()) return;
    reopenDeanSchedule(reopenReason.trim());
    setIsReopenModalOpen(false);
    setReopenReason('');
    setFeedbackBanner({
      type: 'warn',
      msg: 'Institutional schedule reopened for editing. Dependent timetables are flagged for revalidation.',
    });
    setTimeout(() => setFeedbackBanner(null), 4500);
  };

  const handleAddSlotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotName.trim() || !slotFaculty.trim() || !slotVenue.trim()) return;

    const applicableSemesters = slotSemesters
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    addInstitutionalSlot({
      name: slotName.trim(),
      category: slotCategory,
      day: slotDay,
      startPeriod: Number(slotStartPeriod),
      duration: Number(slotDuration),
      applicableSemesters,
      assignedFaculty: slotFaculty.trim(),
      venue: slotVenue.trim(),
      remarks: slotRemarks.trim() || undefined,
    });

    setIsAddSlotModalOpen(false);
    setSlotName('');
    setFeedbackBanner({
      type: 'success',
      msg: 'Institutional fixed slot added successfully to draft!',
    });
    setTimeout(() => setFeedbackBanner(null), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in text-ink">
      {/* Top Banner */}
      <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Institutional Level 1 Architecture
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border flex items-center gap-1 ${
                  isLocked
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border-amber-300'
                }`}
              >
                <Lock className="w-3 h-3" />
                <span>
                  {isLocked ? `Status: ${deanStatus} (${deanVersion})` : 'Status: DRAFT (Editing Enabled)'}
                </span>
              </span>
            </div>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-primary">
              Institutional Master Timetable &amp; Fixed Slots
            </h2>
            <p className="text-xs text-ink-muted mt-0.5 max-w-2xl leading-relaxed">
              Designate and freeze institutional periods for Placement Training, Open Electives, and NSS Social Service. Locked assignments propagate automatically to all engineering streams.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-surface text-ink hover:bg-canvas-muted text-xs font-semibold rounded-card border border-border-beige transition-colors shadow-crisp-sm flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5 text-primary" />
              <span>Print Schedule</span>
            </button>

            {isLocked ? (
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(true)}
                className="px-3.5 py-1.5 bg-surface text-ink hover:bg-canvas-muted text-xs font-semibold rounded border border-border-beige shadow-crisp-sm transition-colors flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5 text-amber-600" />
                <span>Reopen Schedule for Revision</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsAddSlotModalOpen(true)}
                  className="px-3 py-1.5 bg-surface text-primary hover:bg-canvas-muted text-xs font-semibold rounded border border-primary/20 shadow-crisp-sm transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Fixed Slot</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsLockModalOpen(true)}
                  className="px-3.5 py-1.5 bg-primary text-white hover:bg-primary-dark text-xs font-semibold rounded shadow-crisp transition-colors flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock &amp; Enforce Schedule</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Lock metadata strip */}
        <div className="mt-3 pt-2.5 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2 text-xs text-ink-muted">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>
              {isLocked ? (
                <>
                  Master lock active since <strong>{deanLockedTimestamp}</strong>. Certified by Principal/Dean Academics.
                </>
              ) : (
                'Draft editing active. Changes are staging until Master Lock is ratified.'
              )}
            </span>
          </div>
          <span className="text-[10px] font-mono text-ink-light">
            Immutable constraint for all 5 Engineering Streams
          </span>
        </div>
      </div>

      {feedbackBanner && (
        <div
          className={`p-3 rounded-card border text-xs flex items-center justify-between animate-fade-in ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-amber-50 border-amber-300 text-amber-800'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{feedbackBanner.msg}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackBanner(null)}
            className="hover:opacity-75"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* CLASH VALIDATION STRIP */}
      <div className="bg-surface rounded-card border border-border-beige p-3 shadow-crisp-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono font-bold text-xs flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Zero Cross-Department Clashes Verified
          </span>
          <span className="text-ink-muted text-[11px]">
            Institutional venues (Auditorium, Seminar Halls, Grounds) and common faculty are conflict-free.
          </span>
        </div>

        <div className="text-[11px] font-mono text-ink-light">
          Validated across 5 Departments &amp; 1st Year Basic Science
        </div>
      </div>

      {/* MASTER INSTITUTIONAL TIMETABLE GRID (VTU Table 0 format) */}
      <div className="bg-white p-3 sm:p-4 rounded-card border border-border-beige shadow-crisp space-y-3">
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="font-headline text-sm font-bold text-primary">
              Institutional Master Slot Grid (VTU Table 0 Format)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-ink-light uppercase">
            Reserved Common Instructional Hours
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-black text-xs select-none">
            <thead>
              <tr className="bg-[#993366] text-white font-mono text-[11px] border border-black">
                <th className="py-2 px-1 text-center font-bold border border-black bg-[#993366] text-white w-[80px] uppercase text-[10px]">
                  DAY/TIME
                </th>
                <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[85px]">
                  <div className="font-bold text-[10px]">I</div>
                  <div className="text-[8px] opacity-90 font-mono">9:00–9:55</div>
                </th>
                <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[85px]">
                  <div className="font-bold text-[10px]">II</div>
                  <div className="text-[8px] opacity-90 font-mono">9:55–10:50</div>
                </th>
                <th className="py-2 px-0.5 text-center font-bold border border-black bg-[#EFCDDE] text-black w-[40px] text-[9px] uppercase tracking-wider">
                  TEA
                </th>
                <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[85px]">
                  <div className="font-bold text-[10px]">III</div>
                  <div className="text-[8px] opacity-90 font-mono">11:10–12:05</div>
                </th>
                <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[85px]">
                  <div className="font-bold text-[10px]">IV</div>
                  <div className="text-[8px] opacity-90 font-mono">12:05–1:00</div>
                </th>
                <th className="py-2 px-0.5 text-center font-bold border border-black bg-[#EFCDDE] text-black w-[40px] text-[9px] uppercase tracking-wider">
                  LUNCH
                </th>
                <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[85px]">
                  <div className="font-bold text-[10px]">V</div>
                  <div className="text-[8px] opacity-90 font-mono">1:55–2:50</div>
                </th>
                <th className="py-2 px-0.5 text-center font-bold border border-black bg-[#EFCDDE] text-black w-[40px] text-[9px] uppercase tracking-wider">
                  BREAK
                </th>
                <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[85px]">
                  <div className="font-bold text-[10px]">VI</div>
                  <div className="text-[8px] opacity-90 font-mono">3:00–3:55</div>
                </th>
                <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[85px]">
                  <div className="font-bold text-[10px]">VII</div>
                  <div className="text-[8px] opacity-90 font-mono">3:55–4:45</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => {
                const daySlots = institutionalSlots.filter((s) => s.day === day);

                const renderCell = (period: number) => {
                  const covered = daySlots.find(
                    (s) => s.startPeriod < period && s.startPeriod + s.duration > period
                  );
                  if (covered) return null;

                  const slot = daySlots.find((s) => s.startPeriod === period);
                  const colSpan = slot ? slot.duration : 1;

                  if (slot) {
                    return (
                      <td
                        key={period}
                        colSpan={colSpan}
                        className="p-1.5 text-center border border-black align-middle bg-amber-50/80 border-amber-300"
                      >
                        <div className="flex flex-col items-center justify-center leading-tight">
                          <span className="font-bold font-mono text-[10px] text-primary">
                            {slot.name}
                          </span>
                          <span className="text-[8px] font-mono text-ink-light">
                            {slot.venue} • {slot.assignedFaculty}
                          </span>
                          <span className="text-[8px] font-mono text-amber-800 font-semibold">
                            [Institutional Lock: {slot.category}]
                          </span>
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={period}
                      className="p-1 text-center border border-black align-middle bg-white text-zinc-300 font-mono text-[10px]"
                    >
                      <span className="opacity-40 text-[9px]">Department Time</span>
                    </td>
                  );
                };

                return (
                  <tr key={day} className="border border-black h-[50px]">
                    <td className="py-1 px-1 text-center font-bold font-mono text-[10px] uppercase border border-black bg-canvas-paper text-ink">
                      {day.substring(0, 3)}
                    </td>

                    {renderCell(1)}
                    {renderCell(2)}

                    {day === 'Monday' && (
                      <td
                        rowSpan={6}
                        className="p-0 border border-black bg-[#EFCDDE] text-black text-center align-middle w-[40px]"
                      >
                        <div className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold text-center mx-auto tracking-widest uppercase text-black py-2">
                          TEA BREAK
                        </div>
                      </td>
                    )}

                    {renderCell(3)}
                    {renderCell(4)}

                    {day === 'Monday' && (
                      <td
                        rowSpan={6}
                        className="p-0 border border-black bg-[#EFCDDE] text-black text-center align-middle w-[40px]"
                      >
                        <div className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold text-center mx-auto tracking-widest uppercase text-black py-2">
                          LUNCH
                        </div>
                      </td>
                    )}

                    {renderCell(5)}

                    {day === 'Monday' && (
                      <td
                        rowSpan={6}
                        className="p-0 border border-black bg-[#EFCDDE] text-black text-center align-middle w-[40px]"
                      >
                        <div className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold text-center mx-auto tracking-widest uppercase text-black py-2">
                          LEISURE
                        </div>
                      </td>
                    )}

                    {renderCell(6)}
                    {renderCell(7)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FIXED ACTIVITY ROSTER TABLE */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <h3 className="font-headline text-sm font-bold text-primary">
              Fixed Institutional Activity Allocations
            </h3>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-primary text-white shadow-crisp-sm font-semibold'
                    : 'bg-canvas-paper text-ink-muted hover:text-ink border border-border-subtle'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-canvas-paper border-b border-border-subtle text-[10px] font-mono uppercase tracking-wider text-ink-light">
                <th className="p-2.5">Activity &amp; Category</th>
                <th className="p-2.5">Scheduled Day &amp; Time</th>
                <th className="p-2.5">Applicable Semesters</th>
                <th className="p-2.5">Assigned Lead / Faculty</th>
                <th className="p-2.5">Venue</th>
                <th className="p-2.5 text-center">Status</th>
                {!isLocked && <th className="p-2.5 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredSlots.map((slot) => (
                <tr key={slot.id} className="hover:bg-canvas-muted/20 transition-colors">
                  <td className="p-2.5">
                    <div className="font-semibold text-ink">{slot.name}</div>
                    <span className="text-[10px] font-mono text-primary font-semibold">
                      {slot.category}
                    </span>
                  </td>

                  <td className="p-2.5">
                    <div className="font-medium text-ink flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>{slot.day}</span>
                    </div>
                    <div className="text-[10px] text-ink-muted font-mono mt-0.5">
                      Period {slot.startPeriod}–{slot.startPeriod + slot.duration - 1} ({slot.duration} hrs)
                    </div>
                  </td>

                  <td className="p-2.5">
                    <div className="flex flex-wrap gap-1">
                      {slot.applicableSemesters.map((sem) => (
                        <span
                          key={sem}
                          className="px-1.5 py-0.5 rounded bg-canvas-muted text-ink font-mono text-[9px] border border-border-subtle"
                        >
                          {sem}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="p-2.5 font-medium text-ink">
                    {slot.assignedFaculty}
                  </td>

                  <td className="p-2.5 font-mono text-ink-muted">
                    {slot.venue}
                  </td>

                  <td className="p-2.5 text-center">
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold">
                      <Lock className="w-3 h-3" />
                      <span>LOCKED</span>
                    </span>
                  </td>

                  {!isLocked && (
                    <td className="p-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => removeInstitutionalSlot(slot.id)}
                        className="p-1 text-accent-red hover:bg-accent-red/10 rounded transition-colors"
                        title="Delete slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* LOCK CONFIRMATION MODAL */}
      {isLockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp max-w-md w-full overflow-hidden text-xs text-ink space-y-4">
            <div className="p-4 bg-canvas-paper border-b border-border-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-ink-light block">
                  Institutional Governance
                </span>
                <h3 className="font-headline text-base font-bold text-primary">
                  Lock Master Institutional Schedule
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsLockModalOpen(false)}
                className="p-1 text-ink-muted hover:text-ink rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-ink leading-relaxed">
                Locking the institutional schedule certifies all fixed slots. These slots become strictly read-only and immutable for the Basic Science Coordinator and all Department Coordinators.
              </p>

              <div>
                <label className="text-[10px] font-mono text-ink-light block mb-1">
                  Certification Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={lockRemarks}
                  onChange={(e) => setLockRemarks(e.target.value)}
                  placeholder="e.g. Master institutional slots verified for Academic Year 2026–27."
                  className="w-full bg-white border border-border-beige rounded p-2 text-xs focus:outline-hidden focus:border-primary"
                />
              </div>
            </div>

            <div className="p-3.5 bg-canvas-paper border-t border-border-subtle flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsLockModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLock}
                className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded shadow-crisp hover:bg-primary-dark transition-colors flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Confirm &amp; Lock Schedule</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REOPEN CONFIRMATION MODAL */}
      {isReopenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp max-w-md w-full overflow-hidden text-xs text-ink space-y-4">
            <div className="p-4 bg-canvas-paper border-b border-border-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-800 block font-semibold">
                  Schedule Reopening Notice
                </span>
                <h3 className="font-headline text-base font-bold text-primary">
                  Reopen Institutional Schedule
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(false)}
                className="p-1 text-ink-muted hover:text-ink rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-ink leading-relaxed">
                Reopening the schedule transitions status to <strong className="text-amber-800">DRAFT</strong>. Dependent timetables generated downstream will be marked for revalidation.
              </p>

              <div>
                <label className="text-[10px] font-mono text-ink-light block mb-1">
                  Reason for Reopening <span className="text-accent-red">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  placeholder="e.g. Rescheduling open elective slots to accommodate new university seminar requirements."
                  className="w-full bg-white border border-border-beige rounded p-2 text-xs focus:outline-hidden focus:border-primary"
                />
              </div>
            </div>

            <div className="p-3.5 bg-canvas-paper border-t border-border-subtle flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReopen}
                disabled={!reopenReason.trim()}
                className="px-4 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded shadow-crisp hover:bg-amber-700 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Reopen Schedule</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD FIXED SLOT MODAL */}
      {isAddSlotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp max-w-lg w-full overflow-hidden text-xs text-ink space-y-4">
            <div className="p-4 bg-canvas-paper border-b border-border-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-ink-light block">
                  New Institutional Slot
                </span>
                <h3 className="font-headline text-base font-bold text-primary">
                  Add Fixed Institutional Period
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSlotModalOpen(false)}
                className="p-1 text-ink-muted hover:text-ink rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSlotSubmit} className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-ink-light block mb-1">
                    Activity Name
                  </label>
                  <input
                    type="text"
                    required
                    value={slotName}
                    onChange={(e) => setSlotName(e.target.value)}
                    placeholder="e.g. Placement Training"
                    className="w-full bg-white border border-border-beige rounded px-2.5 py-1 text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-ink-light block mb-1">
                    Category
                  </label>
                  <select
                    value={slotCategory}
                    onChange={(e) => setSlotCategory(e.target.value as InstitutionalSlot['category'])}
                    className="w-full bg-white border border-border-beige rounded px-2.5 py-1 text-xs focus:outline-hidden focus:border-primary"
                  >
                    <option value="Placement">Placement</option>
                    <option value="Open Elective">Open Elective</option>
                    <option value="NSS">NSS</option>
                    <option value="Basic Science">Basic Science</option>
                    <option value="Co-Curricular">Co-Curricular</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-mono text-ink-light block mb-1">
                    Day
                  </label>
                  <select
                    value={slotDay}
                    onChange={(e) => setSlotDay(e.target.value as InstitutionalSlot['day'])}
                    className="w-full bg-white border border-border-beige rounded px-2 py-1 text-xs focus:outline-hidden focus:border-primary"
                  >
                    {DAYS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-ink-light block mb-1">
                    Start Period
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={slotStartPeriod}
                    onChange={(e) => setSlotStartPeriod(Number(e.target.value))}
                    className="w-full bg-white border border-border-beige rounded px-2 py-1 text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-ink-light block mb-1">
                    Duration (Hrs)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={4}
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(Number(e.target.value))}
                    className="w-full bg-white border border-border-beige rounded px-2 py-1 text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono text-ink-light block mb-1">
                    Assigned Faculty / Officer
                  </label>
                  <input
                    type="text"
                    required
                    value={slotFaculty}
                    onChange={(e) => setSlotFaculty(e.target.value)}
                    className="w-full bg-white border border-border-beige rounded px-2.5 py-1 text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-mono text-ink-light block mb-1">
                    Designated Venue
                  </label>
                  <input
                    type="text"
                    required
                    value={slotVenue}
                    onChange={(e) => setSlotVenue(e.target.value)}
                    className="w-full bg-white border border-border-beige rounded px-2.5 py-1 text-xs focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono text-ink-light block mb-1">
                  Applicable Semesters (Comma-separated)
                </label>
                <input
                  type="text"
                  value={slotSemesters}
                  onChange={(e) => setSlotSemesters(e.target.value)}
                  className="w-full bg-white border border-border-beige rounded px-2.5 py-1 text-xs focus:outline-hidden focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-ink-light block mb-1">
                  Institutional Remarks / Description (Optional)
                </label>
                <input
                  type="text"
                  value={slotRemarks}
                  onChange={(e) => setSlotRemarks(e.target.value)}
                  placeholder="e.g. University required placement training modules."
                  className="w-full bg-white border border-border-beige rounded px-2.5 py-1 text-xs focus:outline-hidden focus:border-primary"
                />
              </div>

              <div className="p-3.5 bg-canvas-paper border-t border-border-subtle flex items-center justify-end gap-2 -mx-4 -mb-4 mt-4">
                <button
                  type="button"
                  onClick={() => setIsAddSlotModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded shadow-crisp hover:bg-primary-dark transition-colors"
                >
                  Save Fixed Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

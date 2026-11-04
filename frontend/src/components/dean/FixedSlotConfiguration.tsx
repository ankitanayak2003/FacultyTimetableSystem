import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Lock,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { InstitutionalSlot } from '../../data/workflowDemoData';

export const FixedSlotConfiguration: React.FC = () => {
  const {
    institutionalSlots,
    deanStatus,
    addInstitutionalSlot,
    removeInstitutionalSlot,
  } = useWorkflow();

  const isLocked = deanStatus === 'LOCKED';

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InstitutionalSlot['category']>('Placement');
  const [day, setDay] = useState<InstitutionalSlot['day']>('Friday');
  const [startPeriod, setStartPeriod] = useState<number>(5);
  const [duration, setDuration] = useState<number>(3);
  const [semesterText, setSemesterText] = useState('5th Sem, 7th Sem');
  const [assignedFaculty, setAssignedFaculty] = useState('');
  const [venue, setVenue] = useState('');
  const [remarks, setRemarks] = useState('');
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setFormError('Cannot add slots while schedule is locked. Reopen the schedule first.');
      return;
    }

    if (!name.trim() || !assignedFaculty.trim() || !venue.trim()) {
      setFormError('Please fill in Activity Name, Assigned Faculty, and Venue.');
      return;
    }

    const applicableSemesters = semesterText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    addInstitutionalSlot({
      name,
      category,
      day,
      startPeriod,
      duration,
      applicableSemesters,
      assignedFaculty,
      venue,
      remarks,
    });

    // Reset form
    setName('');
    setAssignedFaculty('');
    setVenue('');
    setRemarks('');
    setFormError('');
    setSuccessMsg('Institutional slot added successfully to draft!');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Stage 1 • Fixed Slot Architecture
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                  isLocked
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border border-amber-300'
                }`}
              >
                {isLocked ? 'Immutable (Locked)' : 'Draft Editing Enabled'}
              </span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
              Institutional Fixed Slot Configuration
            </h2>
            <p className="text-xs text-ink-muted mt-1 max-w-xl leading-relaxed">
              Designate recurring slots reserved across academic streams. These hours automatically propagate to Basic Science and all Department timetable grids.
            </p>
          </div>

          {isLocked && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-card flex items-center gap-2 text-xs text-amber-900 max-w-sm">
              <Lock className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                Schedule is locked. To modify or delete activities, navigate to <strong>Lock / Reopen Schedule</strong> tab.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Form (Left) & Current Slots List (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column (5 Cols) */}
        <div className="lg:col-span-5 bg-surface rounded-card border border-border-beige p-5 shadow-crisp">
          <div className="pb-3 mb-4 border-b border-border-subtle">
            <h3 className="font-headline text-base font-semibold text-primary">
              Add New Institutional Slot
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Configure activity attributes, time window, and target cohorts.
            </p>
          </div>

          {formError && (
            <div className="p-3 mb-4 bg-error-container border border-error/30 rounded-card text-xs text-error flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 mb-4 bg-success-container border border-success/30 rounded-card text-xs text-success flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleAddSlot} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-medium text-ink mb-1">Activity Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Industry Expert Lecture Series"
                disabled={isLocked}
                className="w-full p-2 bg-canvas-paper border border-border-beige rounded text-xs text-ink placeholder:text-ink-light focus:outline-none focus:border-primary disabled:opacity-60"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-ink mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  disabled={isLocked}
                  className="w-full p-2 bg-canvas-paper border border-border-beige rounded text-xs text-ink focus:outline-none focus:border-primary disabled:opacity-60"
                >
                  <option value="Placement">Placement</option>
                  <option value="NSS">NSS / YRC</option>
                  <option value="Open Elective">Open Elective</option>
                  <option value="Basic Science">Basic Science</option>
                  <option value="Co-Curricular">Co-Curricular</option>
                  <option value="Institutional">Institutional</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Day of Week</label>
                <select
                  value={day}
                  onChange={(e) => setDay(e.target.value as any)}
                  disabled={isLocked}
                  className="w-full p-2 bg-canvas-paper border border-border-beige rounded text-xs text-ink focus:outline-none focus:border-primary disabled:opacity-60"
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-medium text-ink mb-1">Start Period</label>
                <select
                  value={startPeriod}
                  onChange={(e) => setStartPeriod(Number(e.target.value))}
                  disabled={isLocked}
                  className="w-full p-2 bg-canvas-paper border border-border-beige rounded text-xs text-ink focus:outline-none focus:border-primary disabled:opacity-60"
                >
                  {[1, 2, 3, 4, 5, 6, 7].map((p) => (
                    <option key={p} value={p}>
                      Period {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-ink mb-1">Duration (Periods)</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  disabled={isLocked}
                  className="w-full p-2 bg-canvas-paper border border-border-beige rounded text-xs text-ink focus:outline-none focus:border-primary disabled:opacity-60"
                >
                  <option value={1}>1 Hour (1 Period)</option>
                  <option value={2}>2 Hours (2 Periods)</option>
                  <option value={3}>3 Hours (3 Periods)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-medium text-ink mb-1">
                Applicable Semesters / Cohorts
              </label>
              <input
                type="text"
                value={semesterText}
                onChange={(e) => setSemesterText(e.target.value)}
                placeholder="e.g. 5th Sem, 7th Sem"
                disabled={isLocked}
                className="w-full p-2 bg-canvas-paper border border-border-beige rounded text-xs text-ink placeholder:text-ink-light focus:outline-none focus:border-primary disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block font-medium text-ink mb-1">
                Assigned Faculty / Lead *
              </label>
              <input
                type="text"
                value={assignedFaculty}
                onChange={(e) => setAssignedFaculty(e.target.value)}
                placeholder="e.g. Dr. Raghavendra / Training Team"
                disabled={isLocked}
                className="w-full p-2 bg-canvas-paper border border-border-beige rounded text-xs text-ink placeholder:text-ink-light focus:outline-none focus:border-primary disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block font-medium text-ink mb-1">Venue / Hall *</label>
              <input
                type="text"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. Main Auditorium / AB-204"
                disabled={isLocked}
                className="w-full p-2 bg-canvas-paper border border-border-beige rounded text-xs text-ink placeholder:text-ink-light focus:outline-none focus:border-primary disabled:opacity-60"
              />
            </div>

            <div>
              <label className="block font-medium text-ink mb-1">Remarks</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Administrative notes, VTU mandates..."
                disabled={isLocked}
                className="w-full p-2 bg-canvas-paper border border-border-beige rounded text-xs text-ink placeholder:text-ink-light focus:outline-none focus:border-primary disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={isLocked}
              className="w-full py-2.5 px-4 bg-primary text-white hover:bg-primary-dark disabled:opacity-50 text-xs font-semibold rounded-card transition-colors shadow-crisp-sm flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Fixed Slot to Draft</span>
            </button>
          </form>
        </div>

        {/* Existing Slots List (7 Cols) */}
        <div className="lg:col-span-7 bg-surface rounded-card border border-border-beige p-5 shadow-crisp flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-subtle">
              <div>
                <h3 className="font-headline text-base font-semibold text-primary">
                  Active Fixed Slots ({institutionalSlots.length})
                </h3>
                <p className="text-xs text-ink-muted mt-0.5">
                  Slots currently established in the institutional master schedule.
                </p>
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-canvas-muted text-ink-muted">
                {isLocked ? 'Locked v1.0' : 'Draft'}
              </span>
            </div>

            <div className="space-y-3 max-h-[580px] overflow-y-auto pr-1">
              {institutionalSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="p-3.5 bg-canvas-paper rounded-card border border-border-subtle text-xs space-y-2 flex flex-col justify-between hover:border-primary/30 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-primary-subtle text-primary font-mono text-[10px] font-semibold">
                          {slot.category}
                        </span>
                        <span className="font-semibold text-ink text-sm">
                          {slot.name}
                        </span>
                      </div>
                      <p className="text-ink-muted text-[11px] mt-1 leading-relaxed">
                        {slot.remarks}
                      </p>
                    </div>

                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => removeInstitutionalSlot(slot.id)}
                        className="p-1.5 text-ink-light hover:text-error hover:bg-error/10 rounded transition-colors"
                        title="Remove Slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border-subtle flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-ink-light">
                    <div className="flex items-center gap-2">
                      <span className="text-ink font-medium">
                        {slot.day} (P{slot.startPeriod} - P{slot.startPeriod + slot.duration - 1})
                      </span>
                      <span>•</span>
                      <span>{slot.venue}</span>
                    </div>
                    <span className="text-primary font-medium">{slot.assignedFaculty}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-border-subtle mt-4 flex items-center justify-between text-xs text-ink-muted">
            <span className="flex items-center gap-1.5 font-medium text-primary">
              <ShieldCheck className="w-4 h-4" />
              <span>AICTE Normative Verification Passed</span>
            </span>
            <span className="font-mono text-[10px] text-ink-light">
              Autonomous Governance
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

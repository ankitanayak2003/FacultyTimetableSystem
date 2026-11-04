import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const LockReopenSchedule: React.FC = () => {
  const {
    deanStatus,
    deanVersion,
    deanLockedTimestamp,
    deanLockedBy,
    institutionalSlots,
    lockDeanSchedule,
    reopenDeanSchedule,
  } = useWorkflow();

  const isLocked = deanStatus === 'LOCKED';

  // Modal states
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warn'; msg: string } | null>(null);

  const handleConfirmLock = (remarks: string) => {
    lockDeanSchedule(remarks);
    setIsLockModalOpen(false);
    setFeedback({
      type: 'success',
      msg: 'Institutional schedule locked successfully! Stage 2 (Basic Science Coordinator) is now unlocked.',
    });
    setTimeout(() => setFeedback(null), 5000);
  };

  const handleConfirmReopen = (reason: string) => {
    reopenDeanSchedule(reason);
    setIsReopenModalOpen(false);
    setFeedback({
      type: 'warn',
      msg: 'Institutional schedule reopened for editing. Downstream schedules are flagged for revalidation.',
    });
    setTimeout(() => setFeedback(null), 5000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      {/* Banner */}
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
            Stage 1 Governance Control
          </span>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
              isLocked
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                : 'bg-amber-50 text-amber-800 border border-amber-300'
            }`}
          >
            {deanStatus} ({deanVersion})
          </span>
        </div>
        <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
          Institutional Schedule Lock &amp; Audit Control
        </h2>
        <p className="text-xs text-ink-muted mt-1 leading-relaxed">
          The Dean Academics enforces the institutional timetable freeze. Locking certifies fixed slots and unblocks the Basic Science Coordinator. Reopening creates an audited draft revision.
        </p>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-4 rounded-card border text-xs flex items-start gap-2.5 shadow-crisp-sm animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-amber-50 text-amber-900 border-amber-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          )}
          <div>
            <div className="font-semibold">{feedback.msg}</div>
            <div className="text-[11px] opacity-80 mt-0.5">
              Reflected instantly across the demonstration session.
            </div>
          </div>
        </div>
      )}

      {/* State Card */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light block">
              Current Governance State
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-headline text-2xl font-bold text-ink">
                {isLocked ? 'Schedule is Certified & Locked' : 'Schedule is in Draft Mode'}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-canvas-muted text-ink-light">
                {deanVersion}
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-1">
              {isLocked
                ? `Certified by ${deanLockedBy} on ${deanLockedTimestamp}.`
                : 'Editing enabled. Downstream Basic Science scheduling is currently paused.'}
            </p>
          </div>

          <div>
            {isLocked ? (
              <button
                type="button"
                onClick={() => setIsReopenModalOpen(true)}
                className="px-5 py-2.5 bg-amber-600 text-white hover:bg-amber-700 text-xs font-semibold rounded-card transition-colors shadow-crisp-sm flex items-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                <span>Reopen Institutional Schedule</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsLockModalOpen(true)}
                className="px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold rounded-card transition-colors shadow-crisp-sm flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Lock Institutional Schedule</span>
              </button>
            )}
          </div>
        </div>

        {/* Lock Summary Checklist */}
        <div className="space-y-3">
          <h4 className="font-headline text-sm font-semibold text-primary">
            Institutional Baseline Checklist
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-canvas-paper rounded-card border border-border-subtle flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-ink">Fixed Activities Configured</span>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  {institutionalSlots.length} institution-level slots verified across all semesters.
                </p>
              </div>
            </div>

            <div className="p-3 bg-canvas-paper rounded-card border border-border-subtle flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-ink">Zero Scheduling Clashes</span>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  Auditorium, Seminar Halls, and venue overlap check completed.
                </p>
              </div>
            </div>

            <div className="p-3 bg-canvas-paper rounded-card border border-border-subtle flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-ink">Downstream Propagation</span>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  Basic Science Coordinator receives immutable slots upon lock.
                </p>
              </div>
            </div>

            <div className="p-3 bg-canvas-paper rounded-card border border-border-subtle flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-ink">Audit Trail Logging</span>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  All actions record user timestamp and explicit institutional rationale.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-canvas-muted rounded-card border border-border-subtle text-xs text-ink-muted flex items-start gap-2.5">
          <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Demonstration Workflow Safety:</strong> Reopening an earlier schedule never silently overwrites previous versions. Downstream Basic Science and Department timetables are immediately flagged with a revalidation requirement warning.
          </p>
        </div>
      </div>

      {/* Confirmation Modals */}
      <ConfirmationModal
        isOpen={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        onConfirm={handleConfirmLock}
        title="Lock Institutional Timetable"
        description="Locking certifies that all institutional slots (Placement, NSS, Open Electives, and Induction) are officially finalized. Downstream Basic Science and Department Coordinators will receive these assignments as read-only blocks."
        warningNote="Once locked, slot parameters cannot be edited without performing an audited Reopen action."
        confirmLabel="Lock Institutional Timetable"
        confirmVariant="success"
        requireReason={false}
        reasonPlaceholder="Optional version remarks (e.g. All slots approved by Academic Council)"
      />

      <ConfirmationModal
        isOpen={isReopenModalOpen}
        onClose={() => setIsReopenModalOpen(false)}
        onConfirm={handleConfirmReopen}
        title="Reopen Institutional Schedule"
        description="Reopening returns Stage 1 to Draft status, allowing you to edit or add fixed slots. This will mark downstream Basic Science and Departmental schedules as requiring revalidation."
        warningNote="Downstream coordinators will be notified of the reopening. Please provide an explicit rationale."
        confirmLabel="Reopen for Revision"
        confirmVariant="danger"
        requireReason={true}
        reasonPlaceholder="State rationale for reopening (e.g. Rescheduling Placement training slot per recruiter request)..."
      />
    </div>
  );
};

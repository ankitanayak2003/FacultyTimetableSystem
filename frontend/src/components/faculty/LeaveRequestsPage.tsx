import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  Clock,
  X,
  FileText,
  Upload,
  ShieldAlert,
  Send,
  RotateCcw,
  Info,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import {
  FacultyLeaveApplication,
  AffectedTimetableSlot,
} from '../../data/workflowDemoData';

const LEAVE_TYPES: FacultyLeaveApplication['leaveType'][] = [
  'Casual Leave',
  'Medical Leave',
  'On Duty',
  'Other',
];

const SESSIONS: FacultyLeaveApplication['session'][] = [
  'Full Day',
  'Half Day (Forenoon)',
  'Half Day (Afternoon)',
];

export const LeaveRequestsPage: React.FC = () => {
  const {
    facultyLeaves,
    applyFacultyLeave,
    cancelFacultyLeave,
    departmentFaculty,
  } = useWorkflow();

  // Logged-in faculty: Dr. Ananya Rao
  const currentFaculty = useMemo(() => {
    return (
      departmentFaculty.find((f) => f.name.includes('Ananya Rao') || f.empId === 'FAC102') ||
      departmentFaculty[0]
    );
  }, [departmentFaculty]);

  // Form State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [leaveType, setLeaveType] = useState<FacultyLeaveApplication['leaveType']>('Casual Leave');
  const [fromDate, setFromDate] = useState('2026-11-26');
  const [toDate, setToDate] = useState('2026-11-26');
  const [session, setSession] = useState<FacultyLeaveApplication['session']>('Full Day');
  const [reason, setReason] = useState('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Selected leave to inspect affected timetable slots
  const [selectedLeaveForImpact, setSelectedLeaveForImpact] = useState<FacultyLeaveApplication | null>(
    facultyLeaves[0] || null
  );

  // Date validation & days calculation
  const calculateDays = (start: string, end: string, sess: FacultyLeaveApplication['session']) => {
    if (!start || !end) return 1;
    const s = new Date(start);
    const e = new Date(end);
    if (e < s) return 0;
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return sess === 'Full Day' ? diffDays : 0.5;
  };

  const handleResetForm = () => {
    setLeaveType('Casual Leave');
    setFromDate(new Date().toISOString().split('T')[0]);
    setToDate(new Date().toISOString().split('T')[0]);
    setSession('Full Day');
    setReason('');
    setAttachmentName('');
    setFormError('');
  };

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromDate || !toDate) {
      setFormError('Please select valid From and To dates.');
      return;
    }
    if (new Date(toDate) < new Date(fromDate)) {
      setFormError('To Date cannot precede From Date.');
      return;
    }
    if (!reason.trim()) {
      setFormError('Please provide a specific justification for leave.');
      return;
    }

    const calculatedDays = calculateDays(fromDate, toDate, session);

    // Mock detection of affected timetable periods on that day
    const dayName = new Date(fromDate).toLocaleDateString('en-US', { weekday: 'long' });
    const affected: AffectedTimetableSlot[] = [];

    if (dayName === 'Thursday') {
      affected.push(
        {
          day: 'Thursday',
          period: 1,
          time: '9:00–9:55',
          subjectCode: '21AIL37',
          subjectTitle: 'Data Structures Laboratory',
          section: 'AIDS - 3A',
          room: 'AI Computing Lab 1',
          type: 'Department',
          substituteFaculty: 'Pending Coordinator Allocation',
          substituteStatus: 'Pending Arrangement',
        },
        {
          day: 'Thursday',
          period: 2,
          time: '9:55–10:50',
          subjectCode: '21AIL37',
          subjectTitle: 'Data Structures Laboratory',
          section: 'AIDS - 3A',
          room: 'AI Computing Lab 1',
          type: 'Department',
          substituteFaculty: 'Pending Coordinator Allocation',
          substituteStatus: 'Pending Arrangement',
        }
      );
    } else {
      affected.push({
        day: (dayName as AffectedTimetableSlot['day']) || 'Monday',
        period: 2,
        time: '9:55–10:50',
        subjectCode: '21AI32',
        subjectTitle: 'Data Structures & Applications',
        section: 'AIDS - 3A',
        room: 'LH-201',
        type: 'Department',
        substituteFaculty: 'Pending Coordinator Allocation',
        substituteStatus: 'Pending Arrangement',
      });
    }

    applyFacultyLeave({
      facultyId: currentFaculty?.empId || 'FAC102',
      facultyName: currentFaculty?.name || 'Dr. Ananya Rao',
      department: currentFaculty?.department || 'Artificial Intelligence & Data Science',
      leaveType,
      fromDate,
      toDate,
      session,
      daysCount: calculatedDays,
      reason: reason.trim(),
      attachmentName: attachmentName || undefined,
      substituteStatus: 'Pending Arrangement',
      affectedSlots: affected,
    });

    setShowApplyModal(false);
    handleResetForm();
    setSuccessToast(
      'Leave application submitted successfully! Department Coordinator Prof. Rajesh Shetty has been alerted for substitute planning.'
    );
    setTimeout(() => setSuccessToast(''), 5000);
  };

  const handleCancelLeave = (id: string) => {
    if (window.confirm('Are you sure you want to cancel this pending leave application?')) {
      cancelFacultyLeave(id);
      setSuccessToast('Leave application cancelled.');
      setTimeout(() => setSuccessToast(''), 3000);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in text-ink">
      {/* Top Banner */}
      <div className="p-3.5 sm:p-4 bg-surface rounded-card border border-border-beige shadow-crisp space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-border-beige">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Faculty Absence &amp; Timetable Coordination
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-primary-subtle text-primary border border-primary/20">
                Institutional Workflow
              </span>
            </div>
            <h2 className="font-headline text-xl sm:text-2xl font-semibold text-primary">
              Leave Requests &amp; Substitute Coordination
            </h2>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              Submit casual, medical, or on-duty leaves with date validation and inspect automated timetable clash detection and substitute arrangements.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              handleResetForm();
              setShowApplyModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded bg-primary hover:bg-primary-hover text-white shadow-crisp transition-colors flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Apply for Leave</span>
          </button>
        </div>

        {successToast && (
          <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
        )}
      </div>

      {/* Leave Applications History Table */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden text-xs">
        <div className="py-2.5 px-3.5 bg-canvas-muted border-b border-border-beige flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary" />
            <h3 className="font-headline text-sm sm:text-base font-semibold text-primary">
              Leave Application History &amp; Status Tracking
            </h3>
          </div>
          <span className="text-[10px] font-mono text-ink-muted">
            {facultyLeaves.length} Records on File
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-canvas-paper border-b border-border-subtle text-[11px] font-mono uppercase tracking-wider text-ink-light">
                <th className="py-2.5 px-3">Application Date</th>
                <th className="py-2.5 px-3">Leave Type</th>
                <th className="py-2.5 px-3">Leave Period</th>
                <th className="py-2.5 px-3 text-center">Duration</th>
                <th className="py-2.5 px-3">Reason &amp; Attachment</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3">Approver Remarks</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {facultyLeaves.map((leave) => {
                const isSelected = selectedLeaveForImpact?.id === leave.id;
                return (
                  <tr
                    key={leave.id}
                    onClick={() => setSelectedLeaveForImpact(leave)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-primary/5' : 'hover:bg-canvas-muted/20'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-ink">
                      {leave.appliedDate}
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-primary">{leave.leaveType}</span>
                      <span className="text-[10px] text-ink-muted block font-mono">
                        {leave.session}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-mono">
                      {leave.fromDate}
                      {leave.toDate !== leave.fromDate && ` to ${leave.toDate}`}
                    </td>

                    <td className="py-2.5 px-3 text-center font-mono font-bold text-ink">
                      {leave.daysCount} {leave.daysCount === 1 ? 'day' : 'days'}
                    </td>

                    <td className="py-2.5 px-3 max-w-[220px]">
                      <p className="truncate text-ink font-medium" title={leave.reason}>
                        {leave.reason}
                      </p>
                      {leave.attachmentName && (
                        <span className="text-[10px] text-primary font-mono inline-flex items-center gap-1 mt-0.5">
                          <FileText className="w-3 h-3" />
                          <span className="truncate max-w-[140px]">{leave.attachmentName}</span>
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider ${
                          leave.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : leave.status === 'Pending'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : leave.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-zinc-100 text-zinc-600 border border-zinc-300'
                        }`}
                      >
                        {leave.status}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-ink-muted text-[11px] max-w-[200px]">
                      {leave.approverRemarks || '—'}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      {leave.status === 'Pending' ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelLeave(leave.id);
                          }}
                          className="px-2 py-1 text-[10px] font-semibold text-crimson hover:bg-crimson/10 rounded transition-colors"
                        >
                          Cancel
                        </button>
                      ) : (
                        <span className="text-[10px] text-ink-light font-mono">Completed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Timetable Integration & Absence Impact Section */}
      {selectedLeaveForImpact && (
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-border-beige">
            <div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="font-headline font-semibold text-sm sm:text-base text-primary">
                  Timetable Integration: Absence Impact Analysis
                </h3>
              </div>
              <p className="text-xs text-ink-muted mt-0.5">
                Inspecting periods affected during leave from <strong>{selectedLeaveForImpact.fromDate}</strong> to <strong>{selectedLeaveForImpact.toDate}</strong> ({selectedLeaveForImpact.leaveType}).
              </p>
            </div>

            {/* Coordinator Notification Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-primary-subtle text-primary border border-primary/20 font-semibold">
                AIDS Dept Coordinator Alerted: Prof. Rajesh Shetty
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-100 text-purple-900 border border-purple-200 font-semibold">
                Basic Science: Verified (0 Conflicts)
              </span>
            </div>
          </div>

          {selectedLeaveForImpact.affectedSlots && selectedLeaveForImpact.affectedSlots.length > 0 ? (
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light font-bold">
                Affected Timetable Periods &amp; Substitute Status
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {selectedLeaveForImpact.affectedSlots.map((slot, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-canvas-paper rounded-card border border-border-subtle text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-primary">{slot.day}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-primary text-white font-bold">
                          Period {slot.period} ({slot.time})
                        </span>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-canvas-muted text-ink-muted">
                        {slot.type}
                      </span>
                    </div>

                    <div>
                      <span className="font-mono font-bold text-primary mr-1.5">{slot.subjectCode}</span>
                      <span className="font-medium text-ink">{slot.subjectTitle}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-ink-muted pt-1 border-t border-border-beige">
                      <span>{slot.section} • {slot.room}</span>
                      <span
                        className={`font-semibold font-mono text-[10px] ${
                          slot.substituteStatus === 'Arranged'
                            ? 'text-emerald-800'
                            : 'text-amber-800'
                        }`}
                      >
                        {slot.substituteFaculty
                          ? `Substitute: ${slot.substituteFaculty}`
                          : 'Pending Arrangement'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-ink-muted py-2 italic">
              No direct teaching slots are scheduled on the selected leave date.
            </p>
          )}

          <div className="p-2.5 bg-canvas-paper rounded border border-border-beige text-[11px] text-ink-muted flex items-center gap-2">
            <Info className="w-4 h-4 text-primary flex-shrink-0" />
            <span>
              <strong>AQS Timetable Rule:</strong> Master institutional timetable cells are protected. When leave is certified, coordinators assign substitutes who receive notification; schedules update upon official coordinator re-publication.
            </span>
          </div>
        </div>
      )}

      {/* Apply for Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp max-w-lg w-full p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-beige">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                <h3 className="font-headline text-base font-semibold text-primary">
                  New Faculty Leave Application
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowApplyModal(false)}
                className="p-1 text-ink-muted hover:text-ink hover:bg-canvas-muted rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-2.5 bg-rose-50 border border-rose-300 rounded text-xs text-rose-800 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitLeave} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                    Leave Type *
                  </label>
                  <select
                    value={leaveType}
                    onChange={(e) =>
                      setLeaveType(e.target.value as FacultyLeaveApplication['leaveType'])
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
                  >
                    {LEAVE_TYPES.map((lt) => (
                      <option key={lt} value={lt}>
                        {lt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                    Day Session *
                  </label>
                  <select
                    value={session}
                    onChange={(e) =>
                      setSession(e.target.value as FacultyLeaveApplication['session'])
                    }
                    className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
                  >
                    {SESSIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                    From Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      if (new Date(e.target.value) > new Date(toDate)) {
                        setToDate(e.target.value);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink font-mono focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                    To Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={toDate}
                    min={fromDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink font-mono focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                  Reason for Absence *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="State the academic, medical, or personal necessity for leave..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                  Supporting Document Attachment (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Conference_Acceptance.pdf / Medical_Cert.pdf"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink font-mono"
                  />
                  <label className="px-3 py-1.5 rounded border border-border-beige bg-canvas-paper hover:bg-canvas text-ink cursor-pointer font-semibold flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5 text-primary" />
                    <span>Upload</span>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setAttachmentName(file.name);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-beige">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-3 py-1.5 text-xs font-medium rounded border border-border-beige hover:bg-canvas-muted text-ink flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded border border-border-beige hover:bg-canvas-muted text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold rounded bg-primary hover:bg-primary-hover text-white shadow-crisp flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Leave Application</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

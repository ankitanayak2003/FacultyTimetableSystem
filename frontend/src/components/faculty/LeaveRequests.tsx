import React, { useState } from 'react';
import {
  CalendarDays,
  Send,
  CheckCircle2,
} from 'lucide-react';
import {
  INITIAL_LEAVE_REQUESTS,
  LeaveRequestItem,
} from '../../data/facultyDemoData';

export const LeaveRequests: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequestItem[]>(INITIAL_LEAVE_REQUESTS);
  const [leaveType, setLeaveType] = useState<LeaveRequestItem['leaveType']>('Casual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [substituteFaculty, setSubstituteFaculty] = useState('');
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!startDate) {
      newErrors.startDate = 'Start date is required.';
    }
    if (!endDate) {
      newErrors.endDate = 'End date is required.';
    }
    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = 'End date cannot be earlier than start date.';
    }
    if (!reason.trim()) {
      newErrors.reason = 'Please state the reason for leave.';
    } else if (reason.trim().length < 5) {
      newErrors.reason = 'Reason must be at least 5 characters.';
    }
    if (!substituteFaculty.trim()) {
      newErrors.substituteFaculty = 'Please specify substitute faculty arrangement.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // Calculate approximate days count
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newRequest: LeaveRequestItem = {
      id: `leave-${Date.now()}`,
      leaveType,
      startDate,
      endDate,
      daysCount: diffDays,
      reason,
      substituteFaculty,
      remarks,
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0],
    };

    setRequests([newRequest, ...requests]);
    setConfirmation(
      `Your request for ${diffDays} day(s) of ${leaveType} has been submitted for Department HOD approval.`
    );

    // Reset form fields
    setStartDate('');
    setEndDate('');
    setReason('');
    setSubstituteFaculty('');
    setRemarks('');
    setErrors({});
  };

  const getStatusBadge = (status: LeaveRequestItem['status']) => {
    switch (status) {
      case 'Approved':
        return 'bg-success-container text-success border-success/30';
      case 'Pending':
        return 'bg-primary-subtle text-primary border-primary/30';
      case 'Rejected':
        return 'bg-error-container text-error border-error/30';
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-ink-light">
            Academic Administration
          </span>
          <span className="text-xs font-mono text-primary font-semibold">
            • Leave Portal
          </span>
        </div>
        <h2 className="font-headline text-2xl font-semibold text-primary">
          Faculty Leave Management
        </h2>
        <p className="text-xs text-ink-muted mt-1 leading-relaxed max-w-2xl">
          Apply for institutional leaves, record class substitution arrangements, and track HOD endorsement status.
        </p>
      </div>

      {/* Confirmation Notification */}
      {confirmation && (
        <div className="p-4 rounded-card bg-success-container/70 border border-success/30 text-success text-xs flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{confirmation}</span>
          </div>
          <button
            type="button"
            onClick={() => setConfirmation(null)}
            className="text-[11px] font-semibold underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Submit Leave Request Form */}
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border-subtle">
          <CalendarDays className="w-4 h-4 text-primary" />
          <h3 className="font-headline text-lg font-semibold text-primary">
            Submit New Leave Application
          </h3>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Leave Type */}
            <div>
              <label htmlFor="leaveType" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                Leave Type <span className="text-primary">*</span>
              </label>
              <select
                id="leaveType"
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveRequestItem['leaveType'])}
                className="w-full px-3 py-2 bg-surface text-ink text-xs font-medium rounded-card border border-border-beige focus:border-primary shadow-crisp-sm"
              >
                <option value="Casual Leave">Casual Leave (CL)</option>
                <option value="Duty Leave (OOD)">Duty Leave / On Official Duty (OOD)</option>
                <option value="Medical Leave">Medical Leave (ML)</option>
                <option value="Restricted Holiday">Restricted Holiday (RH)</option>
                <option value="Earned Leave">Earned Leave (EL)</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label htmlFor="startDate" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                Start Date <span className="text-primary">*</span>
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={`w-full px-3 py-2 bg-surface text-ink text-xs rounded-card border transition-all ${
                  errors.startDate ? 'border-error ring-1 ring-error' : 'border-border-beige focus:border-primary shadow-crisp-sm'
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-xs text-error font-medium">{errors.startDate}</p>
              )}
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="endDate" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                End Date <span className="text-primary">*</span>
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={`w-full px-3 py-2 bg-surface text-ink text-xs rounded-card border transition-all ${
                  errors.endDate ? 'border-error ring-1 ring-error' : 'border-border-beige focus:border-primary shadow-crisp-sm'
                }`}
              />
              {errors.endDate && (
                <p className="mt-1 text-xs text-error font-medium">{errors.endDate}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Reason */}
            <div>
              <label htmlFor="reason" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                Reason for Leave <span className="text-primary">*</span>
              </label>
              <textarea
                id="reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="State academic reason or official conference/personal justification..."
                className={`w-full px-3 py-2 bg-surface text-ink text-xs rounded-card border transition-all ${
                  errors.reason ? 'border-error ring-1 ring-error' : 'border-border-beige focus:border-primary shadow-crisp-sm'
                }`}
              />
              {errors.reason && (
                <p className="mt-1 text-xs text-error font-medium">{errors.reason}</p>
              )}
            </div>

            {/* Class Substitution / Substitute Faculty */}
            <div>
              <label htmlFor="substituteFaculty" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
                Class Substitution Arrangement <span className="text-primary">*</span>
              </label>
              <textarea
                id="substituteFaculty"
                rows={3}
                value={substituteFaculty}
                onChange={(e) => setSubstituteFaculty(e.target.value)}
                placeholder="e.g. Prof. Manoj Kumar will handle 4th Sem Algorithms lecture on LH-201."
                className={`w-full px-3 py-2 bg-surface text-ink text-xs rounded-card border transition-all ${
                  errors.substituteFaculty ? 'border-error ring-1 ring-error' : 'border-border-beige focus:border-primary shadow-crisp-sm'
                }`}
              />
              {errors.substituteFaculty && (
                <p className="mt-1 text-xs text-error font-medium">{errors.substituteFaculty}</p>
              )}
            </div>
          </div>

          {/* Remarks */}
          <div>
            <label htmlFor="remarks" className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1.5">
              Additional Remarks (Optional)
            </label>
            <input
              id="remarks"
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. Attached conference invitation / syllabus covered in advance"
              className="w-full px-3 py-2 bg-surface text-ink text-xs rounded-card border border-border-beige focus:border-primary shadow-crisp-sm"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white text-xs font-semibold rounded-card hover:bg-primary-hover transition-colors shadow-crisp"
            >
              <Send className="w-4 h-4" />
              <span>Submit Leave Request</span>
            </button>
          </div>
        </form>
      </div>

      {/* Previous Leave Requests History Table */}
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
          <div>
            <h3 className="font-headline text-lg font-semibold text-primary">
              Leave Application History
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Previous applications submitted during the active academic year.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-canvas-muted text-ink border border-border-subtle">
            {requests.length} Total Requests
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-canvas-paper border-b border-border-beige text-[11px] font-mono uppercase tracking-wider text-ink-light">
                <th className="p-3">Reference</th>
                <th className="p-3">Leave Type</th>
                <th className="p-3">Period &amp; Duration</th>
                <th className="p-3">Reason &amp; Substitution</th>
                <th className="p-3">Applied On</th>
                <th className="p-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-canvas-muted/20 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">
                    {req.id.slice(-8)}
                  </td>
                  <td className="p-3 font-medium text-ink">
                    {req.leaveType}
                  </td>
                  <td className="p-3 font-mono text-ink-muted">
                    <div>{req.startDate} to {req.endDate}</div>
                    <span className="text-[10px] text-ink-light font-semibold">({req.daysCount} Day{req.daysCount > 1 ? 's' : ''})</span>
                  </td>
                  <td className="p-3 text-ink-muted max-w-xs">
                    <div className="font-medium text-ink truncate">{req.reason}</div>
                    <div className="text-[10px] text-ink-light truncate mt-0.5">Sub: {req.substituteFaculty}</div>
                  </td>
                  <td className="p-3 font-mono text-ink-light">
                    {req.appliedDate}
                  </td>
                  <td className="p-3 text-right">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${getStatusBadge(
                        req.status
                      )}`}
                    >
                      {req.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

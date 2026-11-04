import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Info,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';

export const FacultyPreferencesReview: React.FC = () => {
  const { facultyPreferences, updatePreferenceStatus } = useWorkflow();
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPreferences = facultyPreferences.filter((pref) => {
    const matchesStatus = filterStatus === 'All' || pref.status === filterStatus;
    const matchesSearch =
      pref.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pref.subjectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pref.subjectCode.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Stage 3 Preference Portal
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-300 font-semibold">
                Actionable Feedback
              </span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
              Review Faculty Subject Preferences
            </h2>
            <p className="text-xs text-ink-muted mt-1 max-w-xl leading-relaxed">
              Examine subject preferences and justifications submitted by instructors. Coordinator can accept or reject requests before finalizing allocations.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-canvas-muted text-ink border border-border-subtle">
              {facultyPreferences.length} Submissions Logged
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-card border border-border-beige p-4 shadow-crisp-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-ink-light" />
          <input
            type="text"
            placeholder="Search faculty or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-canvas-paper border border-border-beige rounded-card text-xs text-ink placeholder:text-ink-light focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['All', 'Accepted', 'Reviewed', 'Pending', 'Rejected'].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                filterStatus === st
                  ? 'bg-primary text-white shadow-crisp-sm'
                  : 'bg-canvas-paper text-ink-muted hover:text-ink border border-border-subtle'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Preferences List */}
      <div className="space-y-3">
        {filteredPreferences.map((pref) => {
          const isAccepted = pref.status === 'Accepted';
          const isRejected = pref.status === 'Rejected';
          const isReviewed = pref.status === 'Reviewed';

          return (
            <div
              key={pref.id}
              className="p-5 bg-surface rounded-card border border-border-beige shadow-crisp-sm text-xs space-y-3 hover:border-primary/30 transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-subtle text-primary font-bold text-xs flex items-center justify-center font-mono">
                    {pref.facultyName.split(' ')[1]?.[0] || 'F'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink text-sm">
                        {pref.facultyName}
                      </span>
                      <span className="text-[10px] font-mono text-ink-light">
                        ({pref.empId})
                      </span>
                    </div>
                    <span className="text-[11px] text-ink-muted">
                      {pref.department} • Submitted on {pref.submittedDate}
                    </span>
                  </div>
                </div>

                {/* Priority & Status */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary font-semibold">
                    {pref.priority}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2.5 py-1 rounded font-semibold uppercase ${
                      isAccepted
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                        : isRejected
                        ? 'bg-red-50 text-red-800 border border-red-300'
                        : 'bg-teal-50 text-teal-800 border border-teal-300'
                    }`}
                  >
                    {pref.status}
                  </span>
                </div>
              </div>

              {/* Course Title & Details */}
              <div className="p-3 bg-canvas-paper rounded-card border border-border-subtle space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-primary">
                    {pref.subjectCode}
                  </span>
                  <span className="font-medium text-ink text-xs">
                    {pref.subjectTitle}
                  </span>
                  <span className="text-[10px] text-ink-light font-mono">
                    ({pref.category})
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted leading-relaxed">
                  <strong>Instructor Justification:</strong> "{pref.justification}"
                </p>
                {pref.remarks && (
                  <p className="text-[11px] text-primary leading-relaxed pt-1">
                    <strong>Coordinator Note:</strong> {pref.remarks}
                  </p>
                )}
              </div>

              {/* Action Buttons for Coordinator */}
              <div className="pt-2 border-t border-border-subtle flex items-center justify-between">
                <span className="text-[11px] font-mono text-ink-light">
                  Actionable Decision:
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updatePreferenceStatus(pref.id, 'Accepted', 'Allocated for Odd Sem 2026–27.')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                      isAccepted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-canvas-paper text-emerald-700 hover:bg-emerald-50 border border-emerald-300'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Accept</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updatePreferenceStatus(pref.id, 'Reviewed', 'Reviewed by Timetable Committee.')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                      isReviewed
                        ? 'bg-teal-700 text-white'
                        : 'bg-canvas-paper text-teal-700 hover:bg-teal-50 border border-teal-300'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Mark Reviewed</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updatePreferenceStatus(pref.id, 'Rejected', 'Alternate course assigned due to curriculum balance.')}
                    className={`px-3 py-1 rounded text-xs font-semibold transition-colors flex items-center gap-1 ${
                      isRejected
                        ? 'bg-red-600 text-white'
                        : 'bg-canvas-paper text-red-700 hover:bg-red-50 border border-red-300'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-3.5 bg-canvas-muted rounded-card border border-border-subtle text-xs text-ink-muted flex items-start gap-2.5">
        <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Academic Transparency:</strong> Faculty preferences represent instructors' preferred choices. Confirmed allocations are reflected in the Subject Allocation Mapping and Timetable Builder.
        </p>
      </div>
    </div>
  );
};

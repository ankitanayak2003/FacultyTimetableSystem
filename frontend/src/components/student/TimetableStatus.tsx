import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ShieldAlert,
  Clock,
  Sparkles,
} from 'lucide-react';
import { TIMETABLE_METADATA } from '../../data/studentDemoData';

interface TimetableStatusProps {
  isPublished: boolean;
  onToggleStatus?: () => void;
}

export const TimetableStatus: React.FC<TimetableStatusProps> = ({
  isPublished,
  onToggleStatus,
}) => {
  return (
    <div className="w-full bg-surface rounded-card border border-border-beige shadow-crisp p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Indicator */}
        <div className="flex items-start gap-3.5">
          <div
            className={`p-2 rounded-card flex-shrink-0 mt-0.5 ${
              isPublished
                ? 'bg-success-container/70 text-success border border-success/30'
                : 'bg-error-container/70 text-error border border-error/30'
            }`}
          >
            {isPublished ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`text-xs font-mono font-semibold uppercase px-2 py-0.5 rounded ${
                  isPublished
                    ? 'bg-success-container text-success'
                    : 'bg-error-container text-error'
                }`}
              >
                {isPublished ? 'Status: Officially Published' : 'Status: Unpublished / In Review'}
              </span>
              <span className="text-[11px] font-mono text-ink-light">
                {TIMETABLE_METADATA.version}
              </span>
            </div>

            <h3 className="font-headline text-lg font-semibold text-ink leading-snug">
              {isPublished
                ? `${TIMETABLE_METADATA.department} • ${TIMETABLE_METADATA.semester} (${TIMETABLE_METADATA.section})`
                : 'Final Department Timetable Not Yet Ratified'}
            </h3>

            <p className="text-xs text-ink-muted mt-1 leading-relaxed">
              {isPublished
                ? `Ratified by HOD (${TIMETABLE_METADATA.ratifiedByHOD}) & Academic Dean. Valid for Odd Semester ${TIMETABLE_METADATA.academicYear}.`
                : 'The academic office and department coordinators are currently scheduling lab allocations and room reservations. Please check back shortly.'}
            </p>
          </div>
        </div>

        {/* Action / Meta Column */}
        <div className="flex flex-col sm:items-end justify-between gap-2.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
          <div className="flex items-center gap-2 text-xs font-mono text-ink-light">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>Effective: {TIMETABLE_METADATA.effectiveDate}</span>
          </div>

          {/* Interactive Demo Switcher */}
          {onToggleStatus && (
            <button
              type="button"
              onClick={onToggleStatus}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-canvas-muted hover:bg-canvas-dim text-ink text-xs font-mono border border-border-beige transition-colors"
              title="Demonstration button to inspect Published vs Unpublished student views"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>
                Demo: Switch to {isPublished ? 'Unpublished View' : 'Published View'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Institutional Student Limitation Notice */}
      <div className="mt-3.5 pt-3 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-ink-light gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span>
            Students view only final, ratified schedules. Workload statistics and editing controls are restricted to faculty coordinators.
          </span>
        </div>
        <div className="flex items-center gap-1 font-mono text-ink-muted flex-shrink-0">
          <FileCheck className="w-3.5 h-3.5 text-accent-teal" />
          <span>VTU CBCS Scheme 2021</span>
        </div>
      </div>
    </div>
  );
};

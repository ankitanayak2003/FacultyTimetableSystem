import React from 'react';
import {
  CheckCircle2,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import {
  FACULTY_WORKLOAD_BREAKDOWN,
  FacultyProfileData,
} from '../../data/facultyDemoData';

interface WorkloadOverviewProps {
  faculty: FacultyProfileData;
}

export const WorkloadOverview: React.FC<WorkloadOverviewProps> = ({ faculty }) => {
  const {
    maxHours,
    assignedHours,
    availableHours,
    theoryHours,
    labHours,
    otherResponsibilitiesHours,
    courses,
  } = FACULTY_WORKLOAD_BREAKDOWN;

  const percentage = Math.round((assignedHours / maxHours) * 100);

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Top Banner with Workload Gauge */}
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border-subtle">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-ink-light">
                VTU Normative Baseline
              </span>
              <span className="text-xs font-mono text-accent-teal font-semibold">
                • Equilibrium Certified
              </span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
              Faculty Workload Distribution
            </h2>
            <p className="text-xs text-ink-muted mt-1 max-w-xl leading-relaxed">
              Official teaching credit hours and lab batch allocations for {faculty.fullName} ({faculty.designation}) for Odd Semester 2026–27.
            </p>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center gap-4 bg-canvas-paper p-4 rounded-card border border-border-beige shadow-crisp-sm flex-shrink-0">
            <div className="text-center">
              <span className="text-[10px] font-mono uppercase text-ink-light block">
                Total Assigned
              </span>
              <span className="font-headline text-2xl font-bold text-primary">
                {assignedHours} <span className="text-xs font-sans font-normal text-ink-muted">Hrs</span>
              </span>
            </div>
            <div className="h-8 w-px bg-border-subtle" />
            <div className="text-center">
              <span className="text-[10px] font-mono uppercase text-ink-light block">
                Maximum Cap
              </span>
              <span className="font-headline text-2xl font-bold text-ink">
                {maxHours} <span className="text-xs font-sans font-normal text-ink-muted">Hrs</span>
              </span>
            </div>
            <div className="h-8 w-px bg-border-subtle" />
            <div className="text-center">
              <span className="text-[10px] font-mono uppercase text-ink-light block">
                Available
              </span>
              <span className="font-headline text-2xl font-bold text-accent-teal">
                {availableHours} <span className="text-xs font-sans font-normal text-ink-muted">Hrs</span>
              </span>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar & Breakdown */}
        <div className="pt-6 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-ink flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Overall Utilization Capacity</span>
            </span>
            <span className="font-mono font-semibold text-primary">
              {percentage}% ({assignedHours} of {maxHours} Hours Allocated)
            </span>
          </div>

          {/* Multi-segmented Progress Bar */}
          <div className="w-full h-3 bg-canvas-muted rounded-full overflow-hidden border border-border-subtle flex">
            {/* Theory Segment */}
            <div
              style={{ width: `${(theoryHours / maxHours) * 100}%` }}
              className="bg-primary h-full transition-all"
              title={`Theory: ${theoryHours} Hours`}
            />
            {/* Lab Segment */}
            <div
              style={{ width: `${(labHours / maxHours) * 100}%` }}
              className="bg-accent-teal h-full transition-all"
              title={`Laboratory: ${labHours} Hours`}
            />
            {/* Mentorship Segment */}
            <div
              style={{ width: `${(otherResponsibilitiesHours / maxHours) * 100}%` }}
              className="bg-accent-violet h-full transition-all"
              title={`Mentorship: ${otherResponsibilitiesHours} Hour`}
            />
          </div>

          {/* Segmented Legend */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-primary" />
                <span className="text-ink-muted">Theory Lectures: <strong className="text-ink">{theoryHours}h/wk</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-accent-teal" />
                <span className="text-ink-muted">Laboratories: <strong className="text-ink">{labHours}h/wk</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-accent-violet" />
                <span className="text-ink-muted">Proctorial/Mentoring: <strong className="text-ink">{otherResponsibilitiesHours}h/wk</strong></span>
              </div>
            </div>

            <span className="text-success text-xs font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Within VTU Normative Limits</span>
            </span>
          </div>
        </div>
      </div>

      {/* Subject-Wise Workload Table */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-6">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-border-subtle">
          <div>
            <h3 className="font-headline text-lg font-semibold text-primary">
              Subject-Wise Allocation Breakdown
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Individual contact hours approved by the Department Timetable Committee.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-canvas-muted text-ink border border-border-subtle">
            6 Instructional Commitments
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-canvas-paper border-b border-border-beige text-[11px] font-mono uppercase tracking-wider text-ink-light">
                <th className="p-3">Course Code</th>
                <th className="p-3">Course Title</th>
                <th className="p-3">Class / Batch</th>
                <th className="p-3">Component Type</th>
                <th className="p-3">VTU Credits</th>
                <th className="p-3 text-right">Weekly Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {courses.map((course, idx) => {
                const isLab = course.type === 'Laboratory';
                const isMentorship = course.type === 'Mentorship';
                return (
                  <tr key={`${course.code}-${idx}`} className="hover:bg-canvas-muted/20 transition-colors">
                    <td className="p-3 font-mono font-bold text-primary">
                      {course.code}
                    </td>
                    <td className="p-3 font-medium text-ink">
                      {course.title}
                    </td>
                    <td className="p-3 text-ink-muted font-mono">
                      {course.classSection}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                          isLab
                            ? 'bg-accent-teal/15 text-accent-teal'
                            : isMentorship
                            ? 'bg-accent-violet/15 text-accent-violet'
                            : 'bg-primary-subtle text-primary'
                        }`}
                      >
                        {course.type}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-ink-muted">
                      {course.credits}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-ink">
                      {course.hoursPerWeek} Hrs/Wk
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-canvas-paper/70 font-semibold text-xs border-t-2 border-border-beige text-ink">
                <td colSpan={5} className="p-3 text-right font-headline text-sm text-primary">
                  Total Allocated Teaching Load:
                </td>
                <td className="p-3 text-right font-mono font-bold text-sm text-primary">
                  {assignedHours} Hours / Week
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Read-Only Notice */}
        <div className="mt-4 p-3 bg-canvas-muted rounded-card border border-border-subtle text-xs text-ink-muted flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-primary font-semibold">Institutional Governance Notice:</strong>{' '}
            Faculty workload calculations are system-governed in accordance with AICTE &amp; VTU norms. Allocations cannot be self-edited and must be amended via the Department Head.
          </p>
        </div>
      </div>
    </div>
  );
};

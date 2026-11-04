import React from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';

export const DepartmentsMonitoring: React.FC = () => {
  const { departments } = useWorkflow();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner */}
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
            Academic Monitoring &amp; Timetable Progress
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary font-semibold">
            Institutional Oversight
          </span>
        </div>
        <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
          Engineering Department Status &amp; Leadership
        </h2>
        <p className="text-xs text-ink-muted mt-1 max-w-2xl leading-relaxed">
          Comprehensive roster of department coordinators, heads of department (HODs), student enrollment, and live timetable preparation progress for Odd Semester 2026–27.
        </p>
      </div>

      {/* Departments Table */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden">
        <div className="p-4 bg-canvas-paper border-b border-border-subtle flex items-center justify-between">
          <h3 className="font-headline text-base font-semibold text-primary">
            Department Timetable Preparation Tracker
          </h3>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-canvas-muted text-ink-muted">
            5 Active Departments
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-canvas-paper/70 border-b border-border-subtle text-[11px] font-mono uppercase tracking-wider text-ink-light">
                <th className="p-3.5">Department</th>
                <th className="p-3.5">HOD &amp; Timetable Coordinator</th>
                <th className="p-3.5">Faculty / Students</th>
                <th className="p-3.5">Odd Sem Completion</th>
                <th className="p-3.5">Even Sem Readiness</th>
                <th className="p-3.5 text-right">Publication Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {departments.map((dept) => {
                const isPublished = dept.status === 'Published';
                const isFinalized = dept.status === 'Finalized';

                return (
                  <tr key={dept.id} className="hover:bg-canvas-muted/20 transition-colors">
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary px-1.5 py-0.5 rounded bg-primary-subtle border border-primary/20 text-[11px]">
                          {dept.code}
                        </span>
                        <div>
                          <div className="font-semibold text-ink">{dept.name}</div>
                          <span className="text-[10px] text-ink-light font-mono">
                            Engineering Division
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="font-medium text-ink flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                        <span>HOD: {dept.hod}</span>
                      </div>
                      <div className="text-[11px] text-ink-muted mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-ink-light" />
                        <span>Coord: {dept.coordinator}</span>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono">
                      <div className="text-ink font-semibold flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-ink-light" />
                        <span>{dept.facultyCount} Faculty</span>
                      </div>
                      <div className="text-[11px] text-ink-muted mt-0.5">
                        {dept.studentCount} Students Enrolled
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-ink">
                          {dept.oddSemCompletion}%
                        </span>
                        <span className="text-[10px] text-ink-muted">Prepared</span>
                      </div>
                      <div className="w-28 bg-canvas-muted h-2 rounded-full overflow-hidden border border-border-subtle">
                        <div
                          style={{ width: `${dept.oddSemCompletion}%` }}
                          className={`h-full ${
                            dept.oddSemCompletion === 100 ? 'bg-emerald-600' : 'bg-primary'
                          }`}
                        />
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-ink">
                          {dept.evenSemCompletion}%
                        </span>
                        <span className="text-[10px] text-ink-muted">Drafted</span>
                      </div>
                      <div className="w-28 bg-canvas-muted h-2 rounded-full overflow-hidden border border-border-subtle">
                        <div
                          style={{ width: `${dept.evenSemCompletion}%` }}
                          className="h-full bg-accent-teal"
                        />
                      </div>
                    </td>

                    <td className="p-3.5 text-right">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded font-semibold uppercase ${
                          isPublished
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : isFinalized
                            ? 'bg-teal-50 text-teal-800 border border-teal-300'
                            : 'bg-amber-50 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {isPublished ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        ) : isFinalized ? (
                          <ShieldCheck className="w-3 h-3 text-teal-600" />
                        ) : (
                          <AlertCircle className="w-3 h-3 text-amber-600" />
                        )}
                        <span>{dept.status}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

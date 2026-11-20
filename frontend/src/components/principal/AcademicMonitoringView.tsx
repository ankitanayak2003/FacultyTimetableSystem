import React, { useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
  Atom,
  FileCheck2,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';

export const AcademicMonitoringView: React.FC = () => {
  const {
    departments,
    basicScienceStatus,
  } = useWorkflow();

  // Basic Science Cycle Progress items
  const basicScienceCycles = [
    {
      id: 'bs-phy',
      cycle: 'Physics Cycle (1st Year)',
      sections: 'Section A & Section B',
      coordinator: 'Dr. Ravindra Shenoy (Dept of Physics)',
      studentCount: 124,
      allocationStatus: '100% Completed',
      clashStatus: 'Zero Clashes (Verified)',
      governanceStatus: basicScienceStatus === 'LOCKED' ? 'Locked & Propagated' : 'Draft In Progress',
      completionPercent: basicScienceStatus === 'LOCKED' ? 100 : 70,
    },
    {
      id: 'bs-chem',
      cycle: 'Chemistry Cycle (1st Year)',
      sections: 'Section C & Section D',
      coordinator: 'Dr. K. K. Srinivasan (Dept of Chemistry)',
      studentCount: 118,
      allocationStatus: '100% Completed',
      clashStatus: 'Zero Clashes (Verified)',
      governanceStatus: basicScienceStatus === 'LOCKED' ? 'Locked & Propagated' : 'Draft In Progress',
      completionPercent: basicScienceStatus === 'LOCKED' ? 100 : 70,
    },
  ];

  // Actionable Pending Approvals & Milestones across departments
  const pendingApprovals = useMemo(() => {
    return [
      {
        id: 'pend-1',
        department: 'Artificial Intelligence & Data Science',
        section: '3rd Year (Section 5A)',
        coordinator: 'Prof. Rajesh Shetty',
        hod: 'Dr. Vasudeva',
        stage: 'Awaiting HOD Review',
        clashes: 'Zero Clashes Verified',
        actionRequired: 'HOD Ratification and Dean Sign-Off',
        priority: 'High',
      },
      {
        id: 'pend-2',
        department: 'Computer Science & Engineering',
        section: '4th Year (Section 7B)',
        coordinator: 'Prof. Manoj T',
        hod: 'Dr. Shantharama Rai C',
        stage: 'Open Elective Pool Allocation',
        clashes: 'Zero Clashes Verified',
        actionRequired: 'Cross-Stream Elective Slot Verification',
        priority: 'Medium',
      },
      {
        id: 'pend-3',
        department: 'Information Science & Engineering',
        section: '2nd Year (Section 3A)',
        coordinator: 'Prof. Sudhir Nayak',
        hod: 'Dr. Sowmya J',
        stage: 'Lab Session Batching',
        clashes: 'In Verification',
        actionRequired: 'Hardware Lab Batch 2 Allocation',
        priority: 'Medium',
      },
    ];
  }, []);

  // Institutional Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalDepts = departments.length;
    const publishedDepts = departments.filter((d) => d.status === 'Published').length;
    const finalizedDepts = departments.filter((d) => d.status === 'Finalized').length;
    const avgOddCompletion = Math.round(
      departments.reduce((acc, d) => acc + d.oddSemCompletion, 0) / (totalDepts || 1)
    );

    return {
      totalDepts,
      publishedDepts,
      finalizedDepts,
      avgOddCompletion,
    };
  }, [departments]);

  return (
    <div className="space-y-6 animate-fade-in text-ink">
      {/* Header Banner */}
      <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Institutional Quality &amp; Progress Oversight
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary border border-primary/20 font-semibold">
                Odd Semester 2026–27
              </span>
            </div>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-primary">
              Academic Timetable Monitoring
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Live tracking of timetable preparation across all 5 engineering streams, Basic Science cycles, HOD ratifications, and pending institutional approvals.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 rounded-card bg-canvas-paper border border-border-subtle text-xs font-mono">
              <span className="text-ink-muted block text-[10px] uppercase">Institution Readiness</span>
              <span className="font-bold text-primary text-sm">{summaryMetrics.avgOddCompletion}% Scheduled</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: DEPARTMENT-WISE TIMETABLE PREPARATION TRACKER */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-primary" />
            <div>
              <h3 className="font-headline text-sm font-bold text-primary">
                Engineering Department Timetable Progress
              </h3>
              <p className="text-[11px] text-ink-muted">
                Audit scheduling stages, HOD endorsements, and official publication status across departments.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono text-ink-light">
            Published: {summaryMetrics.publishedDepts} | Finalized: {summaryMetrics.finalizedDepts} | In Progress: {summaryMetrics.totalDepts - summaryMetrics.publishedDepts - summaryMetrics.finalizedDepts}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-canvas-paper border-b border-border-subtle text-[10px] font-mono uppercase tracking-wider text-ink-light">
                <th className="p-2.5">Department</th>
                <th className="p-2.5">Leadership</th>
                <th className="p-2.5 text-center">Faculty / Students</th>
                <th className="p-2.5">Odd Sem Completion</th>
                <th className="p-2.5 text-center">HOD Endorsement</th>
                <th className="p-2.5 text-right">Publication Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {departments.map((dept) => {
                const isPublished = dept.status === 'Published';
                const isFinalized = dept.status === 'Finalized';

                return (
                  <tr key={dept.id} className="hover:bg-canvas-muted/20 transition-colors">
                    <td className="p-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-primary px-1.5 py-0.5 rounded bg-primary-subtle border border-primary/20 text-[10px]">
                          {dept.code}
                        </span>
                        <div>
                          <div className="font-semibold text-ink">{dept.name}</div>
                          <span className="text-[10px] text-ink-light font-mono">
                            VTU Scheme 2021/22
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="p-2.5">
                      <div className="font-medium text-ink flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span>HOD: {dept.hod}</span>
                      </div>
                      <div className="text-[10px] text-ink-muted flex items-center gap-1 mt-0.5 font-mono">
                        <Clock className="w-3 h-3 text-ink-light flex-shrink-0" />
                        <span>Coord: {dept.coordinator}</span>
                      </div>
                    </td>

                    <td className="p-2.5 text-center font-mono">
                      <span className="font-semibold text-ink block">{dept.facultyCount} Faculty</span>
                      <span className="text-[10px] text-ink-light">{dept.studentCount} Students</span>
                    </td>

                    <td className="p-2.5 min-w-[140px]">
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                        <span className="text-ink-muted font-medium">{dept.oddSemCompletion}%</span>
                        <span className="text-[10px] text-ink-light">Odd Sem</span>
                      </div>
                      <div className="w-full h-1.5 bg-canvas-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            dept.oddSemCompletion === 100
                              ? 'bg-emerald-600'
                              : 'bg-primary'
                          }`}
                          style={{ width: `${dept.oddSemCompletion}%` }}
                        />
                      </div>
                    </td>

                    <td className="p-2.5 text-center">
                      {isPublished || isFinalized ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Ratified
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Under Review
                        </span>
                      )}
                    </td>

                    <td className="p-2.5 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        isPublished
                          ? 'bg-purple-50 text-purple-800 border border-purple-300'
                          : isFinalized
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-50 text-amber-800 border border-amber-300'
                      }`}>
                        {dept.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: BASIC SCIENCE 1ST YEAR TIMETABLE PROGRESS */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-4 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
          <Atom className="w-4 h-4 text-primary" />
          <div>
            <h3 className="font-headline text-sm font-bold text-primary">
              Basic Science (1st Year) Timetable Progress
            </h3>
            <p className="text-[11px] text-ink-muted">
              Monitoring Physics &amp; Chemistry cycle section schedules shared with downstream engineering streams.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {basicScienceCycles.map((cycle) => (
            <div
              key={cycle.id}
              className="p-3.5 bg-canvas-paper/70 rounded-card border border-border-subtle space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-ink block">{cycle.cycle}</span>
                  <span className="text-[10px] font-mono text-ink-light">{cycle.sections}</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {cycle.governanceStatus}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 bg-canvas-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${cycle.completionPercent}%` }}
                />
              </div>

              {/* Details strip */}
              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                <div className="p-2 rounded bg-white border border-border-subtle">
                  <span className="text-[10px] text-ink-light font-mono block">Coordinator</span>
                  <span className="font-semibold text-ink truncate block">{cycle.coordinator}</span>
                </div>
                <div className="p-2 rounded bg-white border border-border-subtle">
                  <span className="text-[10px] text-ink-light font-mono block">Enrollment</span>
                  <span className="font-semibold text-ink block">{cycle.studentCount} Students</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: PENDING INSTITUTIONAL APPROVALS & ACTION ITEMS */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-primary" />
            <div>
              <h3 className="font-headline text-sm font-bold text-primary">
                Pending Institutional Approvals &amp; Critical Milestones
              </h3>
              <p className="text-[11px] text-ink-muted">
                Actionable scheduling items requiring Principal, Dean, or departmental sign-off prior to official publication.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono px-2 py-0.5 rounded bg-canvas-paper border border-border-subtle text-ink-muted">
            {pendingApprovals.length} Action Items
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-canvas-paper border-b border-border-subtle text-[10px] font-mono uppercase tracking-wider text-ink-light">
                <th className="p-2.5">Department &amp; Section</th>
                <th className="p-2.5">Responsible Officials</th>
                <th className="p-2.5">Current Stage</th>
                <th className="p-2.5">Clash Status</th>
                <th className="p-2.5">Action Required</th>
                <th className="p-2.5 text-right">Priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {pendingApprovals.map((item) => (
                <tr key={item.id} className="hover:bg-canvas-muted/20 transition-colors">
                  <td className="p-2.5">
                    <span className="font-semibold text-ink block">{item.department}</span>
                    <span className="text-[10px] font-mono text-primary font-bold">{item.section}</span>
                  </td>

                  <td className="p-2.5">
                    <div className="font-medium text-ink">HOD: {item.hod}</div>
                    <div className="text-[10px] text-ink-light font-mono">Coord: {item.coordinator}</div>
                  </td>

                  <td className="p-2.5 font-mono text-[11px] text-ink-muted">
                    {item.stage}
                  </td>

                  <td className="p-2.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {item.clashes}
                    </span>
                  </td>

                  <td className="p-2.5 font-medium text-ink text-[11px]">
                    {item.actionRequired}
                  </td>

                  <td className="p-2.5 text-right">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      item.priority === 'High'
                        ? 'bg-rose-50 text-rose-800 border border-rose-300'
                        : 'bg-amber-50 text-amber-800 border border-amber-300'
                    }`}>
                      {item.priority}
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

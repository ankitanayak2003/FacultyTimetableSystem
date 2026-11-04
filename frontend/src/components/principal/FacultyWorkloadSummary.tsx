import React, { useState } from 'react';
import {
  CheckCircle2,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';

export const FacultyWorkloadSummary: React.FC = () => {
  const { facultyWorkload } = useWorkflow();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');

  const departmentsList = [
    'All',
    'Artificial Intelligence & Data Science',
    'Physics (Basic Science)',
    'Mathematics (Basic Science)',
    'Chemistry (Basic Science)',
  ];

  const filteredFaculty = facultyWorkload.filter((fac) => {
    const matchesDept = selectedDept === 'All' || fac.department === selectedDept;
    const matchesSearch =
      fac.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fac.empId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fac.department.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const totalAssigned = facultyWorkload.reduce((acc, f) => acc + f.assignedHours, 0);
  const avgWorkload = (totalAssigned / facultyWorkload.length).toFixed(1);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Institutional Workload Oversight
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>100% VTU Limit Compliance</span>
              </span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
              Institution-Wide Faculty Workload Distribution
            </h2>
            <p className="text-xs text-ink-muted mt-1 max-w-xl leading-relaxed">
              Read-only aggregate teaching credit hours and laboratory contact periods across all departments. Governed strictly in adherence with AICTE norms.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-canvas-paper p-3.5 rounded-card border border-border-beige shadow-crisp-sm flex-shrink-0">
            <div className="text-center">
              <span className="text-[10px] font-mono uppercase text-ink-light block">
                Avg Contact Load
              </span>
              <span className="font-headline text-xl font-bold text-primary">
                {avgWorkload} <span className="text-xs font-normal text-ink-muted">h/wk</span>
              </span>
            </div>
            <div className="h-7 w-px bg-border-subtle" />
            <div className="text-center">
              <span className="text-[10px] font-mono uppercase text-ink-light block">
                Workload Cap
              </span>
              <span className="font-headline text-xl font-bold text-ink">
                20 <span className="text-xs font-normal text-ink-muted">h/wk</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-card border border-border-beige p-4 shadow-crisp-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-ink-light" />
          <input
            type="text"
            placeholder="Search faculty name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-canvas-paper border border-border-beige rounded-card text-xs text-ink placeholder:text-ink-light focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {departmentsList.map((dept) => (
            <button
              key={dept}
              type="button"
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                selectedDept === dept
                  ? 'bg-primary text-white shadow-crisp-sm'
                  : 'bg-canvas-paper text-ink-muted hover:text-ink border border-border-subtle'
              }`}
            >
              {dept === 'All' ? 'All Units' : dept.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Faculty Workload Table */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden">
        <div className="p-4 bg-canvas-paper border-b border-border-subtle flex items-center justify-between">
          <h3 className="font-headline text-base font-semibold text-primary">
            Faculty Teaching Credit Breakdown
          </h3>
          <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-canvas-muted text-ink-muted">
            {filteredFaculty.length} Instructors Monitored
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-canvas-paper/70 border-b border-border-subtle text-[11px] font-mono uppercase tracking-wider text-ink-light">
                <th className="p-3.5">Faculty Member</th>
                <th className="p-3.5">Department</th>
                <th className="p-3.5">Theory Load</th>
                <th className="p-3.5">Lab Load</th>
                <th className="p-3.5">Mentoring/Other</th>
                <th className="p-3.5">Total Assigned</th>
                <th className="p-3.5 text-right">Quota Adherence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {filteredFaculty.map((fac) => {
                const percentage = Math.round((fac.assignedHours / fac.maxHours) * 100);
                return (
                  <tr key={fac.id} className="hover:bg-canvas-muted/20 transition-colors">
                    <td className="p-3.5">
                      <div className="font-semibold text-ink">{fac.name}</div>
                      <div className="text-[11px] text-ink-muted mt-0.5 font-mono">
                        {fac.empId} • {fac.designation}
                      </div>
                    </td>

                    <td className="p-3.5 text-ink-muted">
                      {fac.department}
                    </td>

                    <td className="p-3.5 font-mono text-ink">
                      {fac.theoryHours} hrs/wk
                    </td>

                    <td className="p-3.5 font-mono text-accent-teal">
                      {fac.labHours} hrs/wk
                    </td>

                    <td className="p-3.5 font-mono text-ink-muted">
                      {fac.otherHours} hrs/wk
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-ink">
                          {fac.assignedHours} / {fac.maxHours}h
                        </span>
                        <span className="text-[10px] font-mono text-ink-light">
                          ({percentage}%)
                        </span>
                      </div>
                      <div className="w-24 bg-canvas-muted h-1.5 rounded-full overflow-hidden border border-border-subtle mt-1">
                        <div
                          style={{ width: `${percentage}%` }}
                          className={`h-full ${
                            percentage > 95 ? 'bg-amber-500' : 'bg-primary'
                          }`}
                        />
                      </div>
                    </td>

                    <td className="p-3.5 text-right">
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>VTU Balanced</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Read-only notification banner */}
        <div className="p-3.5 bg-canvas-muted border-t border-border-subtle text-xs text-ink-muted flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <span>
            <strong>Institutional Oversight Notice:</strong> Faculty allocations are certified by respective Department Coordinators and HODs. The Principal dashboard retains read-only oversight to prevent unintentional scheduling divergence.
          </span>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Building,
  Mail,
} from 'lucide-react';
import { HODSidebar, HODTab } from '../components/hod/HODSidebar';
import { HODHeader } from '../components/hod/HODHeader';
import { HODOverview } from '../components/hod/HODOverview';
import { HODDepartmentTimetableView } from '../components/hod/HODDepartmentTimetableView';
import { PublishedTimetablesView } from '../components/principal/PublishedTimetablesView';
import { WorkflowProgress } from '../components/common/WorkflowProgress';
import { useWorkflow } from '../context/WorkflowContext';

interface HODDashboardProps {
  onLogout: () => void;
}

export const HODDashboard: React.FC<HODDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<HODTab>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const {
    facultyWorkload,
    facultyPreferences,
    subjectAllocations,
  } = useWorkflow();

  const aidsFaculty = facultyWorkload.filter(
    (f) => f.department === 'Artificial Intelligence & Data Science'
  );

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      <HODSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={onLogout}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <HODHeader
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onLogout={onLogout}
          onSelectTab={setActiveTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'overview' && <HODOverview onNavigate={setActiveTab} />}

          {activeTab === 'timetable' && <HODDepartmentTimetableView />}

          {activeTab === 'faculty' && (
            <div className="space-y-6 animate-fade-in max-w-5xl">
              <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                    AIDS Department Roster
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary font-semibold">
                    14 Faculty Members
                  </span>
                </div>
                <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
                  Faculty Profiles, Courses &amp; Workload
                </h2>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Active academic staff in Artificial Intelligence &amp; Data Science, subject allocations, and preference submission status.
                </p>
              </div>

              <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden text-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-canvas-paper border-b border-border-subtle text-[11px] font-mono uppercase tracking-wider text-ink-light">
                        <th className="p-3.5">Faculty Member</th>
                        <th className="p-3.5">Designation</th>
                        <th className="p-3.5">Assigned Courses</th>
                        <th className="p-3.5">Weekly Load</th>
                        <th className="p-3.5 text-right">Pref Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-subtle">
                      {aidsFaculty.map((fac) => (
                        <tr key={fac.id} className="hover:bg-canvas-muted/20 transition-colors">
                          <td className="p-3.5 font-semibold text-ink">
                            <div>{fac.name}</div>
                            <span className="text-[10px] text-ink-light font-mono">{fac.empId}</span>
                          </td>
                          <td className="p-3.5 text-ink-muted">{fac.designation}</td>
                          <td className="p-3.5">
                            <div className="space-y-0.5">
                              {fac.assignedCourses.map((c) => (
                                <div key={c} className="font-mono text-[11px] text-ink">
                                  {c}
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="p-3.5 font-mono">
                            <span className="font-bold text-ink">
                              {fac.assignedHours} / {fac.maxHours}h
                            </span>
                            <span className="text-[10px] text-ink-light block">
                              ({Math.round((fac.assignedHours / fac.maxHours) * 100)}% load)
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold">
                              {fac.preferenceStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'allocations' && (
            <div className="space-y-6 animate-fade-in max-w-5xl">
              <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                    Coordinator Allocation Tracker
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-300 font-semibold">
                    Submitted by Prof. Rajesh Shetty
                  </span>
                </div>
                <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
                  Subject Allocation Oversight
                </h2>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Review course mappings submitted by the Timetable Coordinator. HOD provides academic alignment monitoring.
                </p>
              </div>

              <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-canvas-paper border-b border-border-subtle text-[11px] font-mono uppercase tracking-wider text-ink-light">
                      <th className="p-3.5">Course Code &amp; Title</th>
                      <th className="p-3.5">Cohort</th>
                      <th className="p-3.5">Faculty Lead</th>
                      <th className="p-3.5">Contact Hours</th>
                      <th className="p-3.5">Type</th>
                      <th className="p-3.5 text-right">Venue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {subjectAllocations.map((alloc) => (
                      <tr key={alloc.id} className="hover:bg-canvas-muted/20">
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-primary">{alloc.courseCode}</div>
                          <div className="text-ink text-[11px]">{alloc.courseTitle}</div>
                        </td>
                        <td className="p-3.5 font-mono text-ink-muted">
                          {alloc.semester} ({alloc.section})
                        </td>
                        <td className="p-3.5 font-medium text-ink">
                          {alloc.facultyName}
                        </td>
                        <td className="p-3.5 font-mono text-ink">
                          {alloc.hoursPerWeek} hrs/wk
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded bg-canvas-muted text-ink-muted font-mono text-[10px]">
                            {alloc.type}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono text-ink-light">
                          {alloc.venue}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'workload' && (
            <div className="space-y-6 animate-fade-in max-w-5xl">
              <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
                <h2 className="font-headline text-2xl font-semibold text-primary">
                  Faculty Workload Distribution (AICTE Norms)
                </h2>
                <p className="text-xs text-ink-muted mt-1">
                  100% of AIDS faculty are within the 16–20 hours/week normative teaching capacity.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aidsFaculty.map((fac) => {
                  const pct = Math.round((fac.assignedHours / fac.maxHours) * 100);
                  return (
                    <div
                      key={fac.id}
                      className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm text-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-ink text-sm">{fac.name}</h4>
                          <span className="text-[10px] text-ink-light font-mono">
                            {fac.designation}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-primary text-sm">
                          {fac.assignedHours} / {fac.maxHours}h
                        </span>
                      </div>

                      <div className="w-full bg-canvas-muted h-2 rounded-full overflow-hidden border border-border-subtle">
                        <div style={{ width: `${pct}%` }} className="h-full bg-primary" />
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-ink-light pt-1">
                        <span>Theory: {fac.theoryHours}h</span>
                        <span>Lab: {fac.labHours}h</span>
                        <span className="text-emerald-700 font-semibold">Compliant</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6 animate-fade-in max-w-5xl">
              <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
                <h2 className="font-headline text-2xl font-semibold text-primary">
                  Faculty Course Preferences
                </h2>
                <p className="text-xs text-ink-muted mt-1">
                  Subject preferences submitted by department instructors.
                </p>
              </div>

              <div className="space-y-3">
                {facultyPreferences.map((pref) => (
                  <div
                    key={pref.id}
                    className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm text-xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink text-sm">{pref.facultyName}</span>
                        <span className="font-mono text-[10px] text-ink-light">({pref.empId})</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold">
                        {pref.status}
                      </span>
                    </div>

                    <div className="font-mono text-xs text-primary font-bold">
                      {pref.subjectCode} — {pref.subjectTitle}
                    </div>

                    <p className="text-ink-muted text-[11px] leading-relaxed">
                      "{pref.justification}"
                    </p>

                    <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[10px] font-mono text-ink-light">
                      <span>Priority: {pref.priority}</span>
                      <span>Submitted: {pref.submittedDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <WorkflowProgress currentStage="Department" />
            </div>
          )}

          {activeTab === 'published' && <PublishedTimetablesView />}

          {activeTab === 'notifications' && (
            <div className="space-y-4 animate-fade-in max-w-4xl">
              <div className="p-5 bg-surface rounded-card border border-border-beige shadow-crisp">
                <h2 className="font-headline text-xl font-semibold text-primary">
                  AIDS Department Announcements
                </h2>
                <p className="text-xs text-ink-muted mt-1">
                  Academic notifications dispatched within the department.
                </p>
              </div>

              <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px] font-mono text-ink-light">
                  <span className="px-2 py-0.5 rounded bg-primary-subtle text-primary font-semibold">
                    Timetable Release
                  </span>
                  <span>Nov 03, 2026</span>
                </div>
                <h4 className="font-semibold text-ink text-sm">
                  AIDS Odd Semester Timetable Certified
                </h4>
                <p className="text-ink-muted mt-1 leading-relaxed">
                  Coordinator Prof. Rajesh Shetty has compiled the departmental timetable with 0 clashes. All lab batches and classroom slots are mapped to LH-201 and AI Lab 1.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-6">
                <div className="flex items-center gap-5 pb-6 border-b border-border-subtle">
                  <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl font-mono shadow-crisp flex-shrink-0">
                    VD
                  </div>
                  <div>
                    <h2 className="font-headline text-2xl font-bold text-primary">
                      Dr. Vasudeva
                    </h2>
                    <p className="text-xs text-ink-muted font-medium mt-0.5">
                      Professor &amp; Head of Department (AI &amp; DS) • SMVITM Bantakal
                    </p>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary border border-primary/20 mt-2 inline-block">
                      Employee ID: FAC101
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs">
                  <div className="p-3.5 bg-canvas-paper rounded-card border border-border-subtle">
                    <span className="text-[10px] font-mono uppercase text-ink-light block">Email</span>
                    <div className="font-semibold text-ink flex items-center gap-1.5 mt-1">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      <span>vasudeva.aids@sode-edu.in</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-canvas-paper rounded-card border border-border-subtle">
                    <span className="text-[10px] font-mono uppercase text-ink-light block">HOD Cabin</span>
                    <div className="font-semibold text-ink flex items-center gap-1.5 mt-1">
                      <Building className="w-3.5 h-3.5 text-primary" />
                      <span>AIDS Department Block, 2nd Floor Room 204</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

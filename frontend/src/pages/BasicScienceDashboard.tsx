import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Building,
  Mail,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import {
  BasicScienceSidebar,
  BasicScienceTab,
} from '../components/basic-science/BasicScienceSidebar';
import { BasicScienceHeader } from '../components/basic-science/BasicScienceHeader';
import { BasicScienceOverview } from '../components/basic-science/BasicScienceOverview';
import { CycleAllocationManager } from '../components/basic-science/CycleAllocationManager';
import { BasicScienceClashValidation } from '../components/basic-science/BasicScienceClashValidation';
import { BasicScienceTimetablePreview } from '../components/basic-science/BasicScienceTimetablePreview';
import { InstitutionalTimetableView } from '../components/principal/InstitutionalTimetableView';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { useWorkflow } from '../context/WorkflowContext';

interface BasicScienceDashboardProps {
  onLogout: () => void;
}

export const BasicScienceDashboard: React.FC<BasicScienceDashboardProps> = ({
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<BasicScienceTab>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);

  const {
    deanStatus,
    basicScienceStatus,
    basicScienceVersion,
    firstYearSections,
    lockBasicScienceSchedule,
    reopenBasicScienceSchedule,
    auditLogs,
  } = useWorkflow();

  const isDeanLocked = deanStatus === 'LOCKED';
  const isBsLocked = basicScienceStatus === 'LOCKED';

  const handleConfirmLock = (remarks: string) => {
    lockBasicScienceSchedule(remarks);
    setIsLockModalOpen(false);
  };

  const handleConfirmReopen = (reason: string) => {
    reopenBasicScienceSchedule(reason);
    setIsReopenModalOpen(false);
  };

  const bsLogs = auditLogs.filter(
    (l) => l.stage === 'Basic Science' || l.role === 'Basic Science Coordinator'
  );

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      <BasicScienceSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={onLogout}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <BasicScienceHeader
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onLogout={onLogout}
          onSelectTab={setActiveTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'overview' && (
            <BasicScienceOverview onNavigate={setActiveTab} />
          )}

          {activeTab === 'institutional' && <InstitutionalTimetableView />}

          {activeTab === 'sections' && (
            <div className="space-y-6 animate-fade-in max-w-5xl">
              <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                    Cohort Roster
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary font-semibold">
                    First-Year Intake
                  </span>
                </div>
                <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
                  First-Year Student Sections &amp; Classrooms
                </h2>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Academic cohort details for first-year engineering students across Section A, B, C, and D.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {firstYearSections.map((sec) => (
                  <div
                    key={sec.id}
                    className="p-5 bg-surface rounded-card border border-border-beige shadow-crisp-sm text-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-headline text-base font-semibold text-primary">
                        {sec.sectionName}
                      </span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-primary-subtle text-primary font-semibold uppercase">
                        {sec.cycle} Cycle
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-subtle text-[11px] font-mono">
                      <div>
                        <span className="text-ink-light">Classroom:</span>
                        <div className="font-semibold text-ink">{sec.room}</div>
                      </div>
                      <div>
                        <span className="text-ink-light">Students:</span>
                        <div className="font-semibold text-ink">{sec.studentCount} Registered</div>
                      </div>
                    </div>

                    <div className="p-3 bg-canvas-paper rounded border border-border-subtle space-y-1 text-[11px]">
                      <div>
                        <span className="text-ink-light">Maths:</span>{' '}
                        <span className="text-ink font-medium">{sec.mathsTeacher}</span>
                      </div>
                      <div>
                        <span className="text-ink-light">Science Lead:</span>{' '}
                        <span className="text-ink font-medium">
                          {sec.cycle === 'Physics' ? sec.physicsTeacher : sec.chemistryTeacher}
                        </span>
                      </div>
                      <div>
                        <span className="text-ink-light">Labs:</span>{' '}
                        <span className="text-ink-muted">{sec.assignedLabs.join(', ')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'cycles' && <CycleAllocationManager />}

          {activeTab === 'faculty' && (
            <div className="space-y-6 animate-fade-in max-w-5xl">
              <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
                <h2 className="font-headline text-2xl font-semibold text-primary">
                  Basic Science Faculty Allocation Roster
                </h2>
                <p className="text-xs text-ink-muted mt-1">
                  Instructors assigned from Physics, Chemistry, Mathematics, and Humanities.
                </p>
              </div>

              <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-canvas-paper border-b border-border-subtle text-[11px] font-mono uppercase tracking-wider text-ink-light">
                      <th className="p-3.5">Faculty Member</th>
                      <th className="p-3.5">Discipline</th>
                      <th className="p-3.5">Courses Taught</th>
                      <th className="p-3.5">Weekly Workload</th>
                      <th className="p-3.5 text-right">Quota Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    <tr className="hover:bg-canvas-muted/20">
                      <td className="p-3.5 font-semibold text-ink">Dr. Ravindra</td>
                      <td className="p-3.5 text-ink-muted">Physics</td>
                      <td className="p-3.5 font-mono">22PHY12, 22PHYL16</td>
                      <td className="p-3.5 font-mono text-ink">18 / 20 hrs</td>
                      <td className="p-3.5 text-right">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold">
                          Optimal
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-canvas-muted/20">
                      <td className="p-3.5 font-semibold text-ink">Dr. Subrahmanya</td>
                      <td className="p-3.5 text-ink-muted">Mathematics</td>
                      <td className="p-3.5 font-mono">22MAT11 Calculus</td>
                      <td className="p-3.5 font-mono text-ink">17 / 20 hrs</td>
                      <td className="p-3.5 text-right">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold">
                          Optimal
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-canvas-muted/20">
                      <td className="p-3.5 font-semibold text-ink">Dr. K. K. Srinivasan</td>
                      <td className="p-3.5 text-ink-muted">Chemistry</td>
                      <td className="p-3.5 font-mono">22CHE12, 22CHEL16</td>
                      <td className="p-3.5 font-mono text-ink">18 / 20 hrs</td>
                      <td className="p-3.5 text-right">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold">
                          Optimal
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'preview' && <BasicScienceTimetablePreview />}

          {activeTab === 'clashes' && <BasicScienceClashValidation />}

          {activeTab === 'lock' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                    Stage 2 Governance
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold">
                    {basicScienceStatus} ({basicScienceVersion})
                  </span>
                </div>
                <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
                  Lock Basic Science Timetable
                </h2>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Finalize first-year cycle timetables and lock laboratory allocations. Locking certifies Stage 2 and unblocks Department Coordinators to create departmental timetables.
                </p>
              </div>

              {!isDeanLocked && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-card text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong>Action Disabled:</strong> Dean institutional timetable is not locked yet. Stage 2 cannot be locked until Stage 1 is officially certified.
                  </div>
                </div>
              )}

              <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-6 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light block">
                      Lock Status
                    </span>
                    <div className="font-headline text-2xl font-bold text-ink mt-1">
                      {isBsLocked ? 'Basic Science Timetable is Locked' : 'Timetable is in Draft State'}
                    </div>
                    <p className="text-xs text-ink-muted mt-1">
                      {isBsLocked
                        ? 'Department Coordinators across all 5 streams are now unblocked to build their timetables.'
                        : 'Department timetable creation remains gated until this schedule is locked.'}
                    </p>
                  </div>

                  <div>
                    {isBsLocked ? (
                      <button
                        type="button"
                        onClick={() => setIsReopenModalOpen(true)}
                        className="px-5 py-2.5 bg-amber-600 text-white hover:bg-amber-700 text-xs font-semibold rounded-card transition-colors shadow-crisp-sm flex items-center gap-2"
                      >
                        <Unlock className="w-4 h-4" />
                        <span>Reopen Basic Science Timetable</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={!isDeanLocked}
                        onClick={() => setIsLockModalOpen(true)}
                        className="px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold rounded-card transition-colors shadow-crisp-sm flex items-center gap-2 disabled:opacity-50"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Lock Basic Science Timetable</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-canvas-paper rounded-card border border-border-subtle flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-ink">4 First-Year Sections Assigned</span>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        Physics &amp; Chemistry cycles assigned without classroom conflicts.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-canvas-paper rounded-card border border-border-subtle flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-ink">Dean Locked Slots Respected</span>
                      <p className="text-[11px] text-ink-muted mt-0.5">
                        Zero conflicts with institutional Induction, Placement, or NSS.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modals */}
              <ConfirmationModal
                isOpen={isLockModalOpen}
                onClose={() => setIsLockModalOpen(false)}
                onConfirm={handleConfirmLock}
                title="Lock Basic Science Timetable"
                description="Locking certifies the first-year Physics and Chemistry cycle schedule. This officially unlocks Stage 3, allowing Department Coordinators to begin creating departmental schedules."
                confirmLabel="Lock Basic Science Timetable"
                confirmVariant="success"
                requireReason={false}
              />

              <ConfirmationModal
                isOpen={isReopenModalOpen}
                onClose={() => setIsReopenModalOpen(false)}
                onConfirm={handleConfirmReopen}
                title="Reopen Basic Science Schedule"
                description="Reopening returns Stage 2 to Draft status. Downstream Department Coordinators will be notified that schedules require revalidation."
                confirmLabel="Reopen for Revision"
                confirmVariant="danger"
                requireReason={true}
                reasonPlaceholder="Rationale for reopening (e.g. Laboratory batch capacity adjustment)..."
              />
            </div>
          )}

          {activeTab === 'versions' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
                <h2 className="font-headline text-2xl font-semibold text-primary">
                  Basic Science Version History
                </h2>
                <p className="text-xs text-ink-muted mt-1">
                  Audit logs of first-year schedule locks and revisions.
                </p>
              </div>

              <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-6 space-y-4">
                {bsLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 bg-canvas-paper rounded border border-border-subtle text-xs"
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] text-ink-light mb-1">
                      <span className="font-bold text-primary">{log.version} • {log.action}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <p className="text-ink-muted">{log.remarks}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4 animate-fade-in max-w-4xl">
              <div className="p-5 bg-surface rounded-card border border-border-beige shadow-crisp">
                <h2 className="font-headline text-xl font-semibold text-primary">
                  First-Year Academic Circulars
                </h2>
                <p className="text-xs text-ink-muted mt-1">
                  Notices on induction orientation and foundational laboratory setups.
                </p>
              </div>

              <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm text-xs">
                <div className="flex items-center justify-between text-[11px] font-mono text-ink-light mb-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-300">
                    Stage 1 Certified
                  </span>
                  <span>Nov 01, 2026</span>
                </div>
                <h4 className="font-semibold text-ink text-sm">
                  Dean Academics Locks Master Institutional Schedule
                </h4>
                <p className="text-ink-muted mt-1 leading-relaxed">
                  The Dean has finalized institutional fixed slots. Basic Science is cleared to schedule first-year engineering physics and chemistry rotations.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-6">
                <div className="flex items-center gap-5 pb-6 border-b border-border-subtle">
                  <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl font-mono shadow-crisp flex-shrink-0">
                    RK
                  </div>
                  <div>
                    <h2 className="font-headline text-2xl font-bold text-primary">
                      Dr. Ravindra
                    </h2>
                    <p className="text-xs text-ink-muted font-medium mt-0.5">
                      Basic Science Coordinator &amp; Professor of Physics • SMVITM Bantakal
                    </p>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary border border-primary/20 mt-2 inline-block">
                      Employee ID: FAC201
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs">
                  <div className="p-3.5 bg-canvas-paper rounded-card border border-border-subtle">
                    <span className="text-[10px] font-mono uppercase text-ink-light block">Email</span>
                    <div className="font-semibold text-ink flex items-center gap-1.5 mt-1">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      <span>ravindra.physics@sode-edu.in</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-canvas-paper rounded-card border border-border-subtle">
                    <span className="text-[10px] font-mono uppercase text-ink-light block">Cabin</span>
                    <div className="font-semibold text-ink flex items-center gap-1.5 mt-1">
                      <Building className="w-3.5 h-3.5 text-primary" />
                      <span>Basic Science Block, Ground Floor Room 008</span>
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

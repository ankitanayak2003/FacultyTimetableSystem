import React, { useState } from 'react';
import {
  Building,
  Mail,
  CheckCircle2,
  Download,
} from 'lucide-react';
import {
  DeptCoordinatorSidebar,
  DeptCoordinatorTab,
} from '../components/department-coordinator/DeptCoordinatorSidebar';
import { DeptCoordinatorHeader } from '../components/department-coordinator/DeptCoordinatorHeader';
import { DeptCoordinatorOverview } from '../components/department-coordinator/DeptCoordinatorOverview';
import { FacultyPreferencesReview } from '../components/department-coordinator/FacultyPreferencesReview';
import { TimetableBuilder } from '../components/department-coordinator/TimetableBuilder';
import { CoordinatorClashValidation } from '../components/department-coordinator/CoordinatorClashValidation';
import { InstitutionalTimetableView } from '../components/principal/InstitutionalTimetableView';
import { BasicScienceTimetablePreview } from '../components/basic-science/BasicScienceTimetablePreview';
import { ConfirmationModal } from '../components/common/ConfirmationModal';
import { useWorkflow } from '../context/WorkflowContext';

interface DepartmentCoordinatorDashboardProps {
  onLogout: () => void;
}

export const DepartmentCoordinatorDashboard: React.FC<
  DepartmentCoordinatorDashboardProps
> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<DeptCoordinatorTab>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const {
    departmentStatus,
    publishDepartmentTimetable,
    facultyWorkload,
    subjectAllocations,
  } = useWorkflow();

  const aidsFaculty = facultyWorkload.filter(
    (f) => f.department === 'Artificial Intelligence & Data Science'
  );

  const handleConfirmPublish = () => {
    publishDepartmentTimetable('AIDS');
    setIsPublishModalOpen(false);
    setPublishSuccess(true);
    setTimeout(() => setPublishSuccess(false), 5000);
  };

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      <DeptCoordinatorSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={onLogout}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <DeptCoordinatorHeader
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onLogout={onLogout}
          onSelectTab={setActiveTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'overview' && (
            <DeptCoordinatorOverview onNavigate={setActiveTab} />
          )}

          {activeTab === 'institutional' && <InstitutionalTimetableView />}

          {activeTab === 'basic-science' && <BasicScienceTimetablePreview />}

          {activeTab === 'faculty' && (
            <div className="space-y-6 animate-fade-in max-w-5xl">
              <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                    Department Faculty Records
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary font-semibold">
                    14 Faculty Members
                  </span>
                </div>
                <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
                  Manage Department Faculty Records
                </h2>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  View and manage department faculty quotas, verified email credentials, and preference statuses for AI &amp; Data Science.
                </p>
              </div>

              <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-canvas-paper border-b border-border-subtle text-[11px] font-mono uppercase tracking-wider text-ink-light">
                      <th className="p-3.5">Faculty Member</th>
                      <th className="p-3.5">Designation</th>
                      <th className="p-3.5">Max Quota</th>
                      <th className="p-3.5">Assigned Courses</th>
                      <th className="p-3.5 text-right">Pref Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {aidsFaculty.map((fac) => (
                      <tr key={fac.id} className="hover:bg-canvas-muted/20">
                        <td className="p-3.5 font-semibold text-ink">
                          <div>{fac.name}</div>
                          <span className="text-[10px] text-ink-light font-mono">{fac.empId}</span>
                        </td>
                        <td className="p-3.5 text-ink-muted">{fac.designation}</td>
                        <td className="p-3.5 font-mono text-ink">
                          {fac.maxHours} hrs/wk max
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-primary">
                          {fac.assignedCourses.join(', ')}
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
          )}

          {activeTab === 'preferences' && <FacultyPreferencesReview />}

          {activeTab === 'workload' && (
            <div className="space-y-6 animate-fade-in max-w-5xl">
              <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                    Teaching Load Balancer
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>0 Quota Overages</span>
                  </span>
                </div>
                <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
                  Faculty Workload Management &amp; Limits
                </h2>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Monitor allocated hours across theory lectures, laboratory batches, and project mentoring to ensure faculty remain within VTU limits.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {aidsFaculty.map((fac) => {
                  const pct = Math.round((fac.assignedHours / fac.maxHours) * 100);
                  const isViolation = fac.assignedHours > fac.maxHours;
                  return (
                    <div
                      key={fac.id}
                      className={`p-4 bg-surface rounded-card border shadow-crisp-sm space-y-3 ${
                        isViolation
                          ? 'border-error ring-1 ring-error/30'
                          : 'border-border-beige'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-ink text-sm">{fac.name}</h4>
                          <span className="text-[10px] text-ink-light font-mono">
                            {fac.designation} ({fac.empId})
                          </span>
                        </div>
                        <span className="font-mono font-bold text-primary text-sm">
                          {fac.assignedHours} / {fac.maxHours}h
                        </span>
                      </div>

                      <div className="w-full bg-canvas-muted h-2 rounded-full overflow-hidden border border-border-subtle">
                        <div
                          style={{ width: `${pct}%` }}
                          className={`h-full ${isViolation ? 'bg-error' : 'bg-primary'}`}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-ink-light pt-1">
                        <span>Theory: {fac.theoryHours}h/wk</span>
                        <span>Lab: {fac.labHours}h/wk</span>
                        <span className="text-emerald-700 font-semibold">
                          {fac.maxHours - fac.assignedHours}h Available
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'allocations' && (
            <div className="space-y-6 animate-fade-in max-w-5xl">
              <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                    Curriculum Mapping
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary font-semibold">
                    VTU 2021/22 Scheme
                  </span>
                </div>
                <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
                  Subject Allocation Mapping
                </h2>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Map courses, sections, and laboratories to certified teaching faculty and physical venues.
                </p>
              </div>

              <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-canvas-paper border-b border-border-subtle text-[11px] font-mono uppercase tracking-wider text-ink-light">
                      <th className="p-3.5">Course Code &amp; Title</th>
                      <th className="p-3.5">Section</th>
                      <th className="p-3.5">Faculty Lead</th>
                      <th className="p-3.5">Hours</th>
                      <th className="p-3.5">Component</th>
                      <th className="p-3.5 text-right">Venue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {subjectAllocations.map((alloc) => (
                      <tr key={alloc.id} className="hover:bg-canvas-muted/20">
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-primary block">
                            {alloc.courseCode}
                          </span>
                          <span className="text-ink">{alloc.courseTitle}</span>
                        </td>
                        <td className="p-3.5 font-mono text-ink-muted">
                          {alloc.section}
                        </td>
                        <td className="p-3.5 font-medium text-ink">
                          {alloc.facultyName}
                        </td>
                        <td className="p-3.5 font-mono text-ink font-semibold">
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

          {activeTab === 'builder' && <TimetableBuilder />}

          {activeTab === 'clashes' && <CoordinatorClashValidation />}

          {activeTab === 'final' && (
            <div className="space-y-6 animate-fade-in max-w-5xl">
              <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                        Finalization Portal
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold">
                        Status: {departmentStatus}
                      </span>
                    </div>
                    <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
                      Final Timetable Verification &amp; Release
                    </h2>
                    <p className="text-xs text-ink-muted mt-1 max-w-xl leading-relaxed">
                      Verify that all courses, lab sessions, and locked institutional blocks are in place. Once published, the schedule becomes visible to students.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsPublishModalOpen(true)}
                      className="px-5 py-2.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold rounded-card transition-colors shadow-crisp-sm flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Publish Final Timetable</span>
                    </button>
                  </div>
                </div>
              </div>

              {publishSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-card text-xs text-emerald-900 flex items-center gap-2.5 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    <strong>AIDS Timetable Published Successfully!</strong> Students and faculty can now access the official Odd Semester 2026–27 timetable.
                  </span>
                </div>
              )}

              {/* Timetable Component Preview */}
              <TimetableBuilder />

              <ConfirmationModal
                isOpen={isPublishModalOpen}
                onClose={() => setIsPublishModalOpen(false)}
                onConfirm={handleConfirmPublish}
                title="Publish Final Department Timetable"
                description="Publishing will release this timetable to all enrolled students and faculty members in Artificial Intelligence & Data Science. Downstream views will immediately reflect the schedule."
                confirmLabel="Authorize & Publish Timetable"
                confirmVariant="success"
                requireReason={false}
              />
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                        Document Generation
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary font-semibold">
                        VTU Format
                      </span>
                    </div>
                    <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
                      Export Timetable (PDF / Print)
                    </h2>
                    <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                      Download high-resolution print-ready PDF schedules for department display boards and academic records.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-5 py-2.5 bg-primary text-white hover:bg-primary-dark text-xs font-semibold rounded-card transition-colors shadow-crisp-sm flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download / Print PDF</span>
                  </button>
                </div>
              </div>

              <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp text-xs space-y-4">
                <h3 className="font-headline text-base font-semibold text-primary">
                  Export Document Specification
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-ink-muted">
                  <div className="p-3 bg-canvas-paper rounded border border-border-subtle">
                    <span className="font-mono text-[10px] uppercase text-ink-light block">
                      Target Paper Size
                    </span>
                    <span className="font-semibold text-ink">ISO A4 Landscape</span>
                  </div>
                  <div className="p-3 bg-canvas-paper rounded border border-border-subtle">
                    <span className="font-mono text-[10px] uppercase text-ink-light block">
                      Institutional Header
                    </span>
                    <span className="font-semibold text-ink">SMVITM Bantakal Official Crest</span>
                  </div>
                  <div className="p-3 bg-canvas-paper rounded border border-border-subtle">
                    <span className="font-mono text-[10px] uppercase text-ink-light block">
                      Compliance Endorsement
                    </span>
                    <span className="font-semibold text-ink">VTU Statute 2021/22</span>
                  </div>
                  <div className="p-3 bg-canvas-paper rounded border border-border-subtle">
                    <span className="font-mono text-[10px] uppercase text-ink-light block">
                      Signatories
                    </span>
                    <span className="font-semibold text-ink">Coordinator, HOD &amp; Principal</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-4 animate-fade-in max-w-4xl">
              <div className="p-5 bg-surface rounded-card border border-border-beige shadow-crisp">
                <h2 className="font-headline text-xl font-semibold text-primary">
                  Coordinator Notifications
                </h2>
                <p className="text-xs text-ink-muted mt-1">
                  Alerts from Dean, Basic Science Coordinator, and HOD.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
                  <div className="flex items-center justify-between text-[11px] font-mono text-ink-light mb-1">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-300">
                      Stage 2 Unlocked
                    </span>
                    <span>Nov 02, 2026</span>
                  </div>
                  <h4 className="font-semibold text-ink text-sm">
                    Basic Science Timetable Locked by Dr. Ravindra
                  </h4>
                  <p className="text-ink-muted mt-1 leading-relaxed">
                    First-year cycles have been certified. Stage 3 department timetable builders across AIDS, CSE, ECE, ISE, and MECH are now active.
                  </p>
                </div>

                <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
                  <div className="flex items-center justify-between text-[11px] font-mono text-ink-light mb-1">
                    <span className="px-2 py-0.5 rounded bg-primary-subtle text-primary font-semibold">
                      Faculty Submissions
                    </span>
                    <span>Oct 28, 2026</span>
                  </div>
                  <h4 className="font-semibold text-ink text-sm">
                    Dr. Ananya Rao Submitted Course Preferences
                  </h4>
                  <p className="text-ink-muted mt-1 leading-relaxed">
                    Requested 21AI52 Machine Learning (1st Priority) and 21AI32 Data Structures (2nd Priority). Reviewed and allocated.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-6">
                <div className="flex items-center gap-5 pb-6 border-b border-border-subtle">
                  <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl font-mono shadow-crisp flex-shrink-0">
                    RS
                  </div>
                  <div>
                    <h2 className="font-headline text-2xl font-bold text-primary">
                      Prof. Rajesh Shetty
                    </h2>
                    <p className="text-xs text-ink-muted font-medium mt-0.5">
                      Assistant Professor (Sr) &amp; Department Timetable Coordinator • AI &amp; DS
                    </p>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary border border-primary/20 mt-2 inline-block">
                      Employee ID: FAC103
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs">
                  <div className="p-3.5 bg-canvas-paper rounded-card border border-border-subtle">
                    <span className="text-[10px] font-mono uppercase text-ink-light block">Email</span>
                    <div className="font-semibold text-ink flex items-center gap-1.5 mt-1">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      <span>rajesh.shetty@sode-edu.in</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-canvas-paper rounded-card border border-border-subtle">
                    <span className="text-[10px] font-mono uppercase text-ink-light block">Office</span>
                    <div className="font-semibold text-ink flex items-center gap-1.5 mt-1">
                      <Building className="w-3.5 h-3.5 text-primary" />
                      <span>Department of AI &amp; DS, Room 202</span>
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

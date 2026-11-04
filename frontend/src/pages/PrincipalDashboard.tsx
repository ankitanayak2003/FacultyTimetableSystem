import React, { useState } from 'react';
import {
  Building,
  Mail,
  Phone,
  GraduationCap,
} from 'lucide-react';
import {
  PrincipalSidebar,
  PrincipalTab,
} from '../components/principal/PrincipalSidebar';
import { PrincipalHeader } from '../components/principal/PrincipalHeader';
import { PrincipalOverview } from '../components/principal/PrincipalOverview';
import { InstitutionalTimetableView } from '../components/principal/InstitutionalTimetableView';
import { DepartmentsMonitoring } from '../components/principal/DepartmentsMonitoring';
import { FacultyWorkloadSummary } from '../components/principal/FacultyWorkloadSummary';
import { PublishedTimetablesView } from '../components/principal/PublishedTimetablesView';
import { WorkflowProgress } from '../components/common/WorkflowProgress';
import { useWorkflow } from '../context/WorkflowContext';

interface PrincipalDashboardProps {
  onLogout: () => void;
}

export const PrincipalDashboard: React.FC<PrincipalDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<PrincipalTab>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { auditLogs } = useWorkflow();

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      {/* Sidebar */}
      <PrincipalSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={onLogout}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <PrincipalHeader
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onLogout={onLogout}
          onSelectTab={setActiveTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'overview' && (
            <PrincipalOverview onNavigate={setActiveTab} />
          )}

          {activeTab === 'institutional' && <InstitutionalTimetableView />}

          {activeTab === 'departments' && <DepartmentsMonitoring />}

          {activeTab === 'faculty' && <FacultyWorkloadSummary />}

          {activeTab === 'workflow' && (
            <div className="space-y-6 animate-fade-in">
              <WorkflowProgress currentStage="Publication" />

              {/* Version History & Audit Trail */}
              <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-5">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-subtle">
                  <div>
                    <h3 className="font-headline text-base font-semibold text-primary">
                      Institutional Timetable Audit Trail &amp; Version History
                    </h3>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Immutable log of locks, revisions, and approvals across all 4 stages.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-canvas-muted text-ink-muted">
                    {auditLogs.length} Audit Entries
                  </span>
                </div>

                <div className="space-y-3">
                  {auditLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3.5 bg-canvas-paper rounded-card border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-primary">
                            {log.stage}
                          </span>
                          <span className="font-semibold text-ink">{log.action}</span>
                          <span className="px-1.5 py-0.5 rounded bg-canvas-muted text-ink-light font-mono text-[10px]">
                            {log.version}
                          </span>
                        </div>
                        <p className="text-ink-muted mt-1 leading-relaxed">
                          {log.remarks}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0 text-[11px] font-mono text-ink-light">
                        <div className="font-medium text-ink">{log.user} ({log.role})</div>
                        <div>{log.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'published' && <PublishedTimetablesView />}

          {activeTab === 'notifications' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-5 bg-surface rounded-card border border-border-beige shadow-crisp">
                <h2 className="font-headline text-xl font-semibold text-primary">
                  Institutional Circulars &amp; Directives
                </h2>
                <p className="text-xs text-ink-muted mt-1">
                  Official communications dispatched from the Principal &amp; Academic Senate.
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm text-xs">
                  <div className="flex items-center justify-between text-[11px] font-mono text-ink-light mb-1">
                    <span className="px-2 py-0.5 rounded bg-primary-subtle text-primary font-semibold">
                      VTU Circular
                    </span>
                    <span>Nov 02, 2026</span>
                  </div>
                  <h4 className="font-semibold text-ink text-sm">
                    Commencement of Odd Semester 2026–27 Academic Classes
                  </h4>
                  <p className="text-ink-muted mt-1 leading-relaxed">
                    All department timetable coordinators are instructed to finalize teaching workloads and release student schedules by November 10th. AICTE faculty workload norms of max 20 hours/week must be strictly honored.
                  </p>
                </div>

                <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm text-xs">
                  <div className="flex items-center justify-between text-[11px] font-mono text-ink-light mb-1">
                    <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-semibold border border-teal-200">
                      Dean Academics Notice
                    </span>
                    <span>Nov 01, 2026</span>
                  </div>
                  <h4 className="font-semibold text-ink text-sm">
                    Institutional Fixed Slots Frozen for Odd Semester
                  </h4>
                  <p className="text-ink-muted mt-1 leading-relaxed">
                    Placement &amp; Training (Friday P5-P7), NSS (Thursday P6-P7), and Open Electives (Wednesday P4-P5) are locked across all 5 engineering streams. No department may schedule conflicting departmental lectures during these periods.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-6 animate-fade-in max-w-4xl">
              <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 pb-6 border-b border-border-subtle">
                  <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xl font-mono shadow-crisp flex-shrink-0">
                    TB
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-headline text-2xl font-bold text-primary">
                      Dr. Thirumaleshwara Bhat
                    </h2>
                    <p className="text-xs text-ink-muted font-medium mt-0.5">
                      Principal &amp; Professor of Mechanical Engineering • SMVITM Bantakal
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary border border-primary/20">
                        Employee ID: PRN001
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300">
                        Chief Academic Officer
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs">
                  <div className="p-3.5 bg-canvas-paper rounded-card border border-border-subtle space-y-1">
                    <span className="text-[10px] font-mono uppercase text-ink-light">Official Email</span>
                    <div className="font-semibold text-ink flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      <span>principal@sode-edu.in</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-canvas-paper rounded-card border border-border-subtle space-y-1">
                    <span className="text-[10px] font-mono uppercase text-ink-light">Principal Office Extn</span>
                    <div className="font-semibold text-ink flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <span>+91 820 2589182 (Ext. 101)</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-canvas-paper rounded-card border border-border-subtle space-y-1">
                    <span className="text-[10px] font-mono uppercase text-ink-light">Institution Affiliation</span>
                    <div className="font-semibold text-ink flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-primary" />
                      <span>Shri Madhwa Vadiraja Institute of Technology &amp; Management</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-canvas-paper rounded-card border border-border-subtle space-y-1">
                    <span className="text-[10px] font-mono uppercase text-ink-light">Accreditation Oversight</span>
                    <div className="font-semibold text-ink flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-primary" />
                      <span>NAAC 'A' Grade • VTU Belagavi</span>
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

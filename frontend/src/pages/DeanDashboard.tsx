import React, { useState } from 'react';
import {
  Building,
  Mail,
  Phone,
  GraduationCap,
  Users,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { DeanSidebar, DeanTab } from '../components/dean/DeanSidebar';
import { DeanHeader } from '../components/dean/DeanHeader';
import { DeanOverview } from '../components/dean/DeanOverview';
import { FixedSlotConfiguration } from '../components/dean/FixedSlotConfiguration';
import { InstitutionalGridPreview } from '../components/dean/InstitutionalGridPreview';
import { LockReopenSchedule } from '../components/dean/LockReopenSchedule';
import { DeanVersionHistory } from '../components/dean/DeanVersionHistory';
import { InstitutionalTimetableView } from '../components/principal/InstitutionalTimetableView';
import { useWorkflow } from '../context/WorkflowContext';

interface DeanDashboardProps {
  onLogout: () => void;
}

export const DeanDashboard: React.FC<DeanDashboardProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<DeanTab>('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { institutionalSlots } = useWorkflow();

  return (
    <div className="min-h-screen flex bg-canvas text-ink">
      {/* Sidebar */}
      <DeanSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onLogout={onLogout}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <DeanHeader
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onLogout={onLogout}
          onSelectTab={setActiveTab}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {activeTab === 'overview' && <DeanOverview onNavigate={setActiveTab} />}

          {activeTab === 'institutional' && <InstitutionalTimetableView />}

          {activeTab === 'fixed-slots' && <FixedSlotConfiguration />}

          {activeTab === 'faculty' && (
            <div className="space-y-6 animate-fade-in max-w-5xl">
              <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                    Institutional Lead Roster
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary font-semibold">
                    Common Activity Facilitators
                  </span>
                </div>
                <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
                  Faculty Assignments for Institutional Slots
                </h2>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Designated department faculties and administrative heads tasked with conducting campus-wide training, open electives, and community service.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {institutionalSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm text-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase font-bold text-primary px-2 py-0.5 rounded bg-primary-subtle">
                        {slot.category}
                      </span>
                      <span className="text-[11px] font-mono text-ink-light">
                        {slot.day} (Periods {slot.startPeriod}-{slot.startPeriod + slot.duration - 1})
                      </span>
                    </div>

                    <div>
                      <h4 className="font-semibold text-ink text-sm">{slot.name}</h4>
                      <p className="text-ink-muted text-[11px] mt-0.5">{slot.venue}</p>
                    </div>

                    <div className="p-2.5 bg-canvas-paper rounded border border-border-subtle flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-ink-light block">
                          Assigned Faculty / Lead
                        </span>
                        <span className="font-medium text-ink">{slot.assignedFaculty}</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Assigned</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'activities' && (
            <div className="space-y-6 animate-fade-in max-w-5xl">
              <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                    Activity Classifications
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-300 font-semibold">
                    VTU Mandated Non-Departmental Pool
                  </span>
                </div>
                <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
                  Academic Activities Governance
                </h2>
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">
                  Institutional categories managed exclusively at the Dean level before department timetable creation.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm space-y-2">
                  <div className="p-2 w-fit rounded bg-primary-subtle text-primary">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-ink text-sm">Placement &amp; Employability</h4>
                  <p className="text-ink-muted text-[11px] leading-relaxed">
                    Soft skills, technical mock tests, industry trainer sessions for 5th &amp; 7th semester students.
                  </p>
                  <div className="text-[10px] font-mono text-primary font-medium pt-2 border-t border-border-subtle">
                    Slot: Friday Periods 5–7 (3 Hours)
                  </div>
                </div>

                <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm space-y-2">
                  <div className="p-2 w-fit rounded bg-emerald-50 text-emerald-700">
                    <Users className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-ink text-sm">NSS &amp; Community Service</h4>
                  <p className="text-ink-muted text-[11px] leading-relaxed">
                    AICTE mandatory social immersion, environmental cleanliness drives, and Red Cross first-aid modules.
                  </p>
                  <div className="text-[10px] font-mono text-emerald-700 font-medium pt-2 border-t border-border-subtle">
                    Slot: Thursday Periods 6–7 (2 Hours)
                  </div>
                </div>

                <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm space-y-2">
                  <div className="p-2 w-fit rounded bg-amber-50 text-amber-700">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h4 className="font-semibold text-ink text-sm">Open Elective Multidisciplinary</h4>
                  <p className="text-ink-muted text-[11px] leading-relaxed">
                    Inter-departmental elective pool allowing students to study courses offered across other disciplines.
                  </p>
                  <div className="text-[10px] font-mono text-amber-700 font-medium pt-2 border-t border-border-subtle">
                    Slot: Wednesday Periods 4–5 (2 Hours)
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && <InstitutionalGridPreview />}

          {activeTab === 'lock-reopen' && <LockReopenSchedule />}

          {activeTab === 'versions' && <DeanVersionHistory />}

          {activeTab === 'notifications' && (
            <div className="space-y-4 animate-fade-in max-w-4xl">
              <div className="p-5 bg-surface rounded-card border border-border-beige shadow-crisp">
                <h2 className="font-headline text-xl font-semibold text-primary">
                  Dean Academic Notifications &amp; Alerts
                </h2>
                <p className="text-xs text-ink-muted mt-1">
                  Updates on institutional schedule governance, committee decisions, and downstream readiness.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
                  <div className="flex items-center justify-between text-[11px] font-mono text-ink-light mb-1">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-300">
                      System Broadcast
                    </span>
                    <span>Nov 01, 2026</span>
                  </div>
                  <h4 className="font-semibold text-ink text-sm">
                    Institutional Fixed Slots Locked — Version v1.0
                  </h4>
                  <p className="text-ink-muted mt-1 leading-relaxed">
                    You have successfully certified and locked the Stage 1 master schedule. The Basic Science Coordinator has been notified and granted access to prepare first-year Physics and Chemistry cycle timetables.
                  </p>
                </div>

                <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
                  <div className="flex items-center justify-between text-[11px] font-mono text-ink-light mb-1">
                    <span className="px-2 py-0.5 rounded bg-primary-subtle text-primary font-semibold">
                      Training &amp; Placement Cell
                    </span>
                    <span>Oct 28, 2026</span>
                  </div>
                  <h4 className="font-semibold text-ink text-sm">
                    Request for 3-Hour Placement Training Block
                  </h4>
                  <p className="text-ink-muted mt-1 leading-relaxed">
                    Confirmed that Friday Periods 5 to 7 have been assigned exclusively for senior placement training in the main auditorium.
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
                    SR
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-headline text-2xl font-bold text-primary">
                      Dr. Sudarshan Rao
                    </h2>
                    <p className="text-xs text-ink-muted font-medium mt-0.5">
                      Dean (Academic Affairs) &amp; Professor • SMVITM Bantakal
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary border border-primary/20">
                        Employee ID: FAC004
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-800 border border-teal-300">
                        Stage 1 Timetable Authority
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 text-xs">
                  <div className="p-3.5 bg-canvas-paper rounded-card border border-border-subtle space-y-1">
                    <span className="text-[10px] font-mono uppercase text-ink-light">Official Email</span>
                    <div className="font-semibold text-ink flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-primary" />
                      <span>dean.academic@sode-edu.in</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-canvas-paper rounded-card border border-border-subtle space-y-1">
                    <span className="text-[10px] font-mono uppercase text-ink-light">Direct Contact</span>
                    <div className="font-semibold text-ink flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      <span>+91 820 2589182 (Ext. 104)</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-canvas-paper rounded-card border border-border-subtle space-y-1">
                    <span className="text-[10px] font-mono uppercase text-ink-light">Department Office</span>
                    <div className="font-semibold text-ink flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-primary" />
                      <span>Deanery, Central Administrative Block 1st Floor</span>
                    </div>
                  </div>

                  <div className="p-3.5 bg-canvas-paper rounded-card border border-border-subtle space-y-1">
                    <span className="text-[10px] font-mono uppercase text-ink-light">Academic Governance</span>
                    <div className="font-semibold text-ink flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-primary" />
                      <span>VTU Curricular Regulations &amp; NEP 2020 Compliance</span>
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

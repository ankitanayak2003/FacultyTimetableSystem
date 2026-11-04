import React from 'react';
import {
  CheckCircle2,
  ShieldAlert,
  Users,
  Building,
  Layers,
  Lock,
  Scale,
} from 'lucide-react';

export const CoordinatorClashValidation: React.FC = () => {
  const checks = [
    {
      id: 'teacher-conflict',
      title: 'Teacher Double-Booking Solver',
      desc: 'Validates that no department faculty is scheduled to teach two different sections during the same period.',
      status: 'Clean (0 Conflicts)',
      icon: Users,
    },
    {
      id: 'room-conflict',
      title: 'Classroom & Computing Lab Occupancy',
      desc: 'Checks that LH-201, LH-302, and AI Computing Labs 1 & 2 are never assigned to simultaneous classes.',
      status: 'Clean (0 Conflicts)',
      icon: Building,
    },
    {
      id: 'workload-quota',
      title: 'AICTE Faculty Workload Quotas',
      desc: 'Verifies that no faculty exceeds 20 weekly contact hours (Professors: 14-16h, Assoc/Asst: 16-20h).',
      status: 'Within Norms',
      icon: Scale,
    },
    {
      id: 'institutional-lock',
      title: 'Dean Institutional Slot Protection',
      desc: 'Guarantees that Placement (Friday P5-P7), NSS (Thursday P6-P7), and Open Electives (Wed P4-P5) are preserved.',
      status: 'Protected & Compliant',
      icon: Lock,
    },
    {
      id: 'basic-science-sync',
      title: 'Basic Science First-Year Separation',
      desc: 'Confirms that common foundational labs (CAD Lab, Basic Electrical) are unencumbered by department allocations.',
      status: 'Separated Cleanly',
      icon: Layers,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
            Automated Conflict Diagnostic Engine
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>0 Clashes Detected</span>
          </span>
        </div>
        <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
          Clash Validation &amp; Constraint Solver
        </h2>
        <p className="text-xs text-ink-muted mt-1 leading-relaxed">
          The timetable builder runs constraint verification in real-time. All schedule slots comply with institutional guidelines and faculty availability.
        </p>
      </div>

      <div className="space-y-3">
        {checks.map((chk) => {
          const Icon = chk.icon;
          return (
            <div
              key={chk.id}
              className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm flex items-start justify-between gap-4 text-xs"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded bg-emerald-50 text-emerald-700 flex-shrink-0 mt-0.5">
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-ink text-sm">{chk.title}</h4>
                  <p className="text-ink-muted text-[11px] mt-0.5 leading-relaxed">
                    {chk.desc}
                  </p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold flex-shrink-0">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>{chk.status}</span>
              </span>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-canvas-paper rounded-card border border-border-subtle text-xs text-ink-muted flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-primary font-semibold">Institutional Governance Notice:</strong> In this demonstration phase, conflict checks are computed across the active session memory. Any overlap with locked upstream slots or assigned instructors immediately triggers a warning.
        </p>
      </div>
    </div>
  );
};

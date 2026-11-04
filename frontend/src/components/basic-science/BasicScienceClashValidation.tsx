import React from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Lock,
  Layers,
  Users,
  Building,
} from 'lucide-react';

export const BasicScienceClashValidation: React.FC = () => {

  const validationChecks = [
    {
      id: 'faculty',
      title: 'Faculty Double-Booking Verification',
      desc: 'Ensures no mathematics, physics, or chemistry faculty is scheduled across two sections simultaneously.',
      status: 'Passed',
      icon: Users,
    },
    {
      id: 'section',
      title: 'Section Period Overlap Check',
      desc: 'Confirms that sections A, B, C, and D have exactly one assigned instructional activity per teaching period.',
      status: 'Passed',
      icon: Layers,
    },
    {
      id: 'labs',
      title: 'Laboratory Capacity & Batch Rotation',
      desc: 'Checks Physics Lab and Chemistry Lab occupancy against maximum student batch limits (32 students/batch).',
      status: 'Passed',
      icon: Building,
    },
    {
      id: 'dean-lock',
      title: 'Dean Institutional Slot Adherence',
      desc: 'Verifies that zero Basic Science activities encroach upon the Dean\'s locked common slots (e.g. Induction & NSS).',
      status: 'Passed',
      icon: Lock,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
            Automated Resource Validator
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>0 Clashes Detected</span>
          </span>
        </div>
        <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
          First-Year Conflict &amp; Constraint Validation
        </h2>
        <p className="text-xs text-ink-muted mt-1 leading-relaxed">
          Validation diagnostics running against instructor calendars, first-year classroom halls, and Stage 1 locked institutional commitments.
        </p>
      </div>

      <div className="space-y-3">
        {validationChecks.map((chk) => {
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
        <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-primary font-semibold">Institutional Governance Rule:</strong> The Basic Science Coordinator cannot modify or override the Dean's locked institutional assignments. All first-year cycle timetables strictly respect upstream Stage 1 allocations.
        </p>
      </div>
    </div>
  );
};

import React from 'react';
import {
  Lock,
  Unlock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building,
  GraduationCap,
  Sparkles,
} from 'lucide-react';
import { useWorkflow, WorkflowStageStatus } from '../../context/WorkflowContext';

interface WorkflowProgressProps {
  currentStage?: 'Institutional' | 'Basic Science' | 'Department' | 'Publication';
  compact?: boolean;
}

export const WorkflowProgress: React.FC<WorkflowProgressProps> = ({
  currentStage,
  compact = false,
}) => {
  const {
    deanStatus,
    deanVersion,
    basicScienceStatus,
    basicScienceVersion,
    departmentStatus,
    requiresRevalidation,
  } = useWorkflow();

  const getStageBadge = (status: WorkflowStageStatus | 'DRAFT' | 'LOCKED') => {
    switch (status) {
      case 'LOCKED':
        return {
          label: 'Locked',
          icon: Lock,
          bgColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dotColor: 'bg-emerald-600',
        };
      case 'PUBLISHED':
        return {
          label: 'Published',
          icon: CheckCircle2,
          bgColor: 'bg-primary-subtle text-primary border-primary/30',
          dotColor: 'bg-primary',
        };
      case 'FINALIZED':
        return {
          label: 'Finalized',
          icon: ShieldCheck,
          bgColor: 'bg-teal-50 text-teal-800 border-teal-300',
          dotColor: 'bg-teal-600',
        };
      case 'DRAFT':
        return {
          label: 'In Progress (Draft)',
          icon: Unlock,
          bgColor: 'bg-amber-50 text-amber-800 border-amber-300',
          dotColor: 'bg-amber-500',
        };
      case 'BLOCKED':
      default:
        return {
          label: 'Gated / Pending Upstream',
          icon: Lock,
          bgColor: 'bg-canvas-muted text-ink-light border-border-subtle',
          dotColor: 'bg-ink-light',
        };
    }
  };

  const stages = [
    {
      id: 'Institutional',
      title: 'Stage 1: Institutional',
      role: 'Dean Academics',
      status: deanStatus,
      version: deanVersion,
      icon: Building,
    },
    {
      id: 'Basic Science',
      title: 'Stage 2: Basic Science',
      role: 'Basic Science Coordinator',
      status: basicScienceStatus,
      version: basicScienceVersion,
      icon: GraduationCap,
    },
    {
      id: 'Department',
      title: 'Stage 3: Departments',
      role: 'Department Coordinators',
      status: departmentStatus,
      version: 'v1.0',
      icon: ShieldCheck,
    },
    {
      id: 'Publication',
      title: 'Stage 4: Publication',
      role: 'Principal Approval',
      status: departmentStatus === 'PUBLISHED' ? ('PUBLISHED' as const) : ('DRAFT' as const),
      version: 'Official',
      icon: Sparkles,
    },
  ];

  if (compact) {
    return (
      <div className="bg-surface rounded-card border border-border-beige p-3 shadow-crisp-sm">
        <div className="flex items-center justify-between gap-2 overflow-x-auto text-xs py-1">
          {stages.map((stg, idx) => {
            const badge = getStageBadge(stg.status);
            const isCurrent = currentStage === stg.id;
            return (
              <React.Fragment key={stg.id}>
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-colors whitespace-nowrap ${
                    isCurrent
                      ? 'bg-canvas-paper border-primary text-primary font-semibold shadow-crisp-sm'
                      : badge.bgColor
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${badge.dotColor}`} />
                  <span className="font-mono text-[11px]">{stg.title}:</span>
                  <span className="text-[11px] font-medium">{badge.label}</span>
                </div>
                {idx < stages.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-ink-light flex-shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Revalidation Banner if earlier stage was reopened */}
      {requiresRevalidation && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-card flex items-start gap-3 shadow-crisp-sm animate-fade-in text-xs text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold text-amber-950">
              Downstream Revalidation Alert:
            </strong>{' '}
            An upstream institutional schedule was reopened for editing. All downstream Basic Science and departmental schedules must be reviewed and re-verified against modified slots.
          </div>
        </div>
      )}

      {/* Main Workflow Progression Stepper */}
      <div className="bg-surface rounded-card border border-border-beige p-4 sm:p-5 shadow-crisp">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-border-subtle">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Institutional Workflow Engine
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary font-semibold">
                VTU Normative Standard
              </span>
            </div>
            <h3 className="font-headline text-base font-semibold text-primary mt-0.5">
              Four-Stage Timetable Governance Pipeline
            </h3>
          </div>
          <div className="text-xs text-ink-muted font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Workflow Active</span>
          </div>
        </div>

        {/* Horizontal Pipeline Steps */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
          {stages.map((stg, idx) => {
            const badge = getStageBadge(stg.status);
            const isCurrent = currentStage === stg.id;
            const Icon = stg.icon;

            return (
              <div
                key={stg.id}
                className={`p-3.5 rounded-card border transition-all ${
                  isCurrent
                    ? 'bg-canvas-paper border-primary ring-1 ring-primary/30 shadow-crisp'
                    : 'bg-surface border-border-subtle'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="p-1.5 rounded bg-canvas-muted text-primary">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border ${badge.bgColor}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dotColor}`} />
                    <span>{badge.label}</span>
                  </span>
                </div>

                <div className="text-xs font-semibold text-ink leading-tight">
                  {stg.title}
                </div>
                <div className="text-[11px] text-ink-muted mt-0.5">
                  {stg.role}
                </div>

                <div className="mt-2.5 pt-2 border-t border-border-subtle flex items-center justify-between text-[10px] font-mono text-ink-light">
                  <span>Version: {stg.version}</span>
                  <span className="font-medium text-ink">Step {idx + 1} of 4</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

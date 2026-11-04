import React from 'react';
import {
  Building,
  CalendarPlus,
  Users,
  CheckCircle2,
  Lock,
  Unlock,
  ArrowRight,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { WorkflowProgress } from '../common/WorkflowProgress';
import { DeanTab } from './DeanSidebar';

interface DeanOverviewProps {
  onNavigate: (tab: DeanTab) => void;
}

export const DeanOverview: React.FC<DeanOverviewProps> = ({ onNavigate }) => {
  const { deanStatus, deanVersion, institutionalSlots } = useWorkflow();

  const isLocked = deanStatus === 'LOCKED';
  const completionPercentage = isLocked ? 100 : 85;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Stage 1 • Institutional Lead Role
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                  isLocked
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-50 text-amber-800 border border-amber-300'
                }`}
              >
                {isLocked ? 'Institutional Schedule Locked' : 'Draft In Progress'}
              </span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
              Institutional Slot Governance &amp; Allocations
            </h2>
            <p className="text-xs text-ink-muted mt-1 max-w-2xl leading-relaxed">
              Define and freeze institution-wide slots (Placement, NSS, Open Electives, and Basic Science common periods) to establish the immutable baseline for downstream department coordinators.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('lock-reopen')}
              className={`px-4 py-2 text-xs font-semibold rounded-card transition-all shadow-crisp-sm flex items-center gap-2 ${
                isLocked
                  ? 'bg-amber-600 text-white hover:bg-amber-700'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isLocked ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Reopen Schedule</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock Schedule ({deanVersion})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Configured Slots */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
              Configured Slots
            </span>
            <div className="p-1.5 rounded bg-primary-subtle text-primary">
              <CalendarPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-bold text-primary">
            {institutionalSlots.length} <span className="text-xs font-normal text-ink-muted">Slots</span>
          </div>
          <div className="text-[11px] text-ink-muted mt-1">
            Placement, NSS, Open Elec.
          </div>
        </div>

        {/* Card 2: Faculty Assignments */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
              Assigned Leads
            </span>
            <div className="p-1.5 rounded bg-teal-50 text-teal-700">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-bold text-teal-800">
            8 <span className="text-xs font-normal text-ink-muted">Facilitators</span>
          </div>
          <div className="text-[11px] text-ink-muted mt-1">
            TPO, NSS &amp; Elective Teams
          </div>
        </div>

        {/* Card 3: Pending Activities */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
              Pending Items
            </span>
            <div className="p-1.5 rounded bg-amber-50 text-amber-700">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-bold text-amber-800">
            {isLocked ? 0 : 1} <span className="text-xs font-normal text-ink-muted">Pending</span>
          </div>
          <div className="text-[11px] text-ink-muted mt-1">
            {isLocked ? 'Zero conflicts flagged' : 'Awaiting lock review'}
          </div>
        </div>

        {/* Card 4: Schedule Completion */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
              Stage 1 Progress
            </span>
            <div className="p-1.5 rounded bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="font-headline text-2xl sm:text-3xl font-bold text-emerald-800">
            {completionPercentage}%
          </div>
          <div className="text-[11px] text-ink-muted mt-1">
            {isLocked ? 'Locked & certified' : 'Draft configuration'}
          </div>
        </div>

        {/* Card 5: Lock Status */}
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp-sm col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono uppercase text-ink-light tracking-wider">
              Lock Status
            </span>
            <div className="p-1.5 rounded bg-primary-subtle text-primary">
              {isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </div>
          </div>
          <div className="font-headline text-xl sm:text-2xl font-bold text-ink">
            {deanStatus}
          </div>
          <div className="text-[11px] text-ink-muted mt-1 font-mono">
            Version: {deanVersion}
          </div>
        </div>
      </div>

      {/* Workflow Stepper */}
      <WorkflowProgress currentStage="Institutional" />

      {/* Fixed Slots Quick List */}
      <div className="bg-surface rounded-card border border-border-beige p-5 shadow-crisp">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-subtle">
          <div>
            <h3 className="font-headline text-base font-semibold text-primary">
              Configured Institutional Fixed Slots ({institutionalSlots.length})
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              These recurring slots are automatically injected as read-only blocks in all downstream timetables.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('fixed-slots')}
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            <span>Manage Slots</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {institutionalSlots.map((slot) => (
            <div
              key={slot.id}
              className="p-3.5 bg-canvas-paper rounded-card border border-border-subtle text-xs space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-primary-subtle text-primary font-mono text-[10px] font-semibold">
                    {slot.category}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-700 font-semibold flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>LOCKED</span>
                  </span>
                </div>
                <h4 className="font-semibold text-ink text-sm mt-1.5">
                  {slot.name}
                </h4>
                <p className="text-ink-muted text-[11px] mt-1 line-clamp-2">
                  {slot.remarks}
                </p>
              </div>

              <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-ink-light">
                <span>{slot.day} • Periods {slot.startPeriod}-{slot.startPeriod + slot.duration - 1}</span>
                <span className="text-primary font-medium">{slot.venue.split('/')[0]}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

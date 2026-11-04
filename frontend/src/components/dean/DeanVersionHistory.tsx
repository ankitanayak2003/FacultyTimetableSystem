import React from 'react';
import { User, Clock } from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';

export const DeanVersionHistory: React.FC = () => {
  const { auditLogs } = useWorkflow();

  const deanLogs = auditLogs.filter(
    (log) => log.stage === 'Institutional' || log.role === 'Dean'
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
            Stage 1 Audit Roster
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary font-semibold">
            Institutional Accountability
          </span>
        </div>
        <h2 className="font-headline text-2xl sm:text-3xl font-semibold text-primary">
          Institutional Timetable Version History
        </h2>
        <p className="text-xs text-ink-muted mt-1 leading-relaxed">
          Complete audit trail tracking locks, unlock events, fixed slot modifications, and reasons entered by the Dean Academics.
        </p>
      </div>

      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-6">
        <div className="space-y-4">
          {deanLogs.length > 0 ? (
            deanLogs.map((log) => (
              <div
                key={log.id}
                className="relative pl-6 pb-4 border-l-2 border-border-beige last:border-l-0 last:pb-0 text-xs"
              >
                {/* Dot */}
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-surface border-2 border-primary flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] font-mono text-ink-light mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-primary px-1.5 py-0.5 rounded bg-primary-subtle">
                      {log.version}
                    </span>
                    <span className="font-semibold text-ink">{log.action}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-ink-light" />
                    <span>{log.timestamp}</span>
                  </div>
                </div>

                <p className="text-ink-muted text-xs leading-relaxed mt-1">
                  {log.remarks}
                </p>

                <div className="mt-2 text-[10px] font-mono text-ink-light flex items-center gap-1.5">
                  <User className="w-3 h-3" />
                  <span>Authorized by: {log.user} ({log.role})</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-ink-muted text-center py-6">
              No version modifications recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

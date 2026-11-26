import React, { useState, useMemo, useRef } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Check,
  Eye,
  X,
  FileCheck2,
  Send,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { DownloadPdfButton } from '../common/DownloadPdfButton';
import { getTimetablePdfFilename } from '../../utils/timetablePdfExport';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const HODTimetableProgressView: React.FC = () => {
  const modalTimetableRef = useRef<HTMLDivElement>(null);
  const {
    sectionProgressList,
    deptTimetables,
    approveSectionTimetable,
    returnSectionTimetableForCorrection,
  } = useWorkflow();

  // Review Modal state
  const [reviewingSectionId, setReviewingSectionId] = useState<string | null>(null);

  // Approve Modal state
  const [approvingSectionId, setApprovingSectionId] = useState<string | null>(null);
  const [approvalRemarks, setApprovalRemarks] = useState<string>('');

  // Return for Correction Modal state
  const [returningSectionId, setReturningSectionId] = useState<string | null>(null);
  const [correctionReason, setCorrectionReason] = useState<string>('');
  const [returnError, setReturnError] = useState<string | null>(null);

  // Success banner
  const [statusActionMessage, setStatusActionMessage] = useState<string | null>(null);

  // Get active item being reviewed in modal
  const reviewingItem = useMemo(() => {
    if (!reviewingSectionId) return null;
    return sectionProgressList.find((p) => p.id === reviewingSectionId) || null;
  }, [sectionProgressList, reviewingSectionId]);

  // Find corresponding timetable in deptTimetables for the reviewing section
  const reviewingTimetable = useMemo(() => {
    if (!reviewingItem) return null;
    const key = Object.keys(deptTimetables).find(
      (k) =>
        k.includes(reviewingItem.year) &&
        k.includes(reviewingItem.section)
    );
    return key ? deptTimetables[key] : null;
  }, [deptTimetables, reviewingItem]);

  // Year-wise aggregated statistics for Section A
  const yearWiseStats = useMemo(() => {
    const years = ['Second Year', 'Third Year', 'Fourth Year'] as const;
    return years.map((yr) => {
      const items = sectionProgressList.filter((p) => p.year === yr);
      const total = items.length;
      const approvedCount = items.filter(
        (p) => p.overallStatus === 'Approved' || p.overallStatus === 'Published'
      ).length;
      const publishedCount = items.filter((p) => p.overallStatus === 'Published').length;
      const awaitingCount = items.filter((p) => p.overallStatus === 'Awaiting HOD Review').length;
      const revisionCount = items.filter((p) => p.overallStatus === 'Returned for Correction').length;

      let semName = '3rd Sem (Odd)';
      if (yr === 'Third Year') semName = '5th Sem (Odd)';
      if (yr === 'Fourth Year') semName = '7th Sem (Odd)';

      return {
        year: yr,
        semester: semName,
        totalSections: total,
        approvedCount,
        publishedCount,
        awaitingCount,
        revisionCount,
        percent: total > 0 ? Math.round((approvedCount / total) * 100) : 0,
      };
    });
  }, [sectionProgressList]);

  // Handle Approve Confirm
  const handleConfirmApprove = () => {
    if (!approvingSectionId) return;
    const item = sectionProgressList.find((p) => p.id === approvingSectionId);
    if (item) {
      approveSectionTimetable(
        item.id,
        approvalRemarks.trim() || 'Approved by HOD. Verified zero clashes and VTU syllabus distribution.'
      );
      setStatusActionMessage(`Successfully ratified and approved timetable for ${item.year} - ${item.section}!`);
      setTimeout(() => setStatusActionMessage(null), 4000);
    }
    setApprovingSectionId(null);
    setApprovalRemarks('');
  };

  // Handle Return Confirm
  const handleConfirmReturn = () => {
    if (!correctionReason.trim()) {
      setReturnError('Please provide specific correction remarks for the Timetable Coordinator.');
      return;
    }
    if (!returningSectionId) return;
    const item = sectionProgressList.find((p) => p.id === returningSectionId);
    if (item) {
      returnSectionTimetableForCorrection(item.id, correctionReason.trim());
      setStatusActionMessage(`Returned timetable for ${item.year} - ${item.section} for revision.`);
      setTimeout(() => setStatusActionMessage(null), 4000);
    }
    setReturningSectionId(null);
    setCorrectionReason('');
    setReturnError(null);
  };

  return (
    <div className="space-y-6 animate-fade-in text-ink">
      {/* Title & Banner */}
      <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
            Department Scheduling Governance
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary border border-primary/20 font-semibold">
            Odd Sem 2026–27
          </span>
        </div>
        <h2 className="font-headline text-xl sm:text-2xl font-bold text-primary">
          Timetable Progress &amp; Approval Governance
        </h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Monitor year-wise scheduling milestones, verify clash validation certificates, and administer HOD ratification workflows.
        </p>
      </div>

      {statusActionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-card flex items-center justify-between text-xs animate-fade-in">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{statusActionMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setStatusActionMessage(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION A: YEAR-WISE PROGRESS TRACKER */}
      {/* ========================================================================= */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-4 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border-subtle">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <div>
            <h3 className="font-headline text-sm sm:text-base font-bold text-primary">
              Section A: Year-wise Progress Milestones
            </h3>
            <p className="text-[11px] text-ink-muted">
              Live progression metrics across 2nd, 3rd, and 4th year curricular schedules.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {yearWiseStats.map((st) => (
            <div
              key={st.year}
              className="p-3 bg-canvas-paper/70 rounded-card border border-border-subtle space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-ink block">{st.year}</span>
                  <span className="text-[10px] font-mono text-ink-light">{st.semester}</span>
                </div>
                <span className="text-xs font-mono font-bold text-primary">
                  {st.percent}% Ratified
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 bg-canvas-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${st.percent}%` }}
                />
              </div>

              {/* Status pills breakdown */}
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-[10px] font-mono">
                <div className="p-1 rounded bg-white border border-border-subtle flex items-center justify-between">
                  <span className="text-ink-muted">Sections:</span>
                  <span className="font-bold text-ink">{st.totalSections}</span>
                </div>
                <div className="p-1 rounded bg-white border border-border-subtle flex items-center justify-between">
                  <span className="text-emerald-700">Approved:</span>
                  <span className="font-bold text-emerald-800">{st.approvedCount}</span>
                </div>
                <div className="p-1 rounded bg-white border border-border-subtle flex items-center justify-between">
                  <span className="text-amber-700">Awaiting:</span>
                  <span className="font-bold text-amber-800">{st.awaitingCount}</span>
                </div>
                <div className="p-1 rounded bg-white border border-border-subtle flex items-center justify-between">
                  <span className="text-purple-700">Published:</span>
                  <span className="font-bold text-purple-800">{st.publishedCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION B: SECTION-WISE PROGRESS & APPROVAL TABLE */}
      {/* ========================================================================= */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-primary" />
            <div>
              <h3 className="font-headline text-sm sm:text-base font-bold text-primary">
                Section B: Section Schedules &amp; HOD Ratification
              </h3>
              <p className="text-[11px] text-ink-muted">
                Inspect section schedules, verify clash certificates, and approve or return timetables for adjustments.
              </p>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded bg-canvas-paper border border-border-subtle text-[11px] font-mono text-ink-muted">
            Coordinator: <strong className="text-ink font-semibold">Prof. Rajesh Shetty</strong>
          </div>
        </div>

        {/* Section Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-canvas-paper border-b border-border-subtle text-[10px] font-mono uppercase tracking-wider text-ink-light">
                <th className="p-2.5">Section</th>
                <th className="p-2.5">Year &amp; Semester</th>
                <th className="p-2.5">Allocations</th>
                <th className="p-2.5">Clash Validation</th>
                <th className="p-2.5 text-center">HOD Review Status</th>
                <th className="p-2.5 text-center">Overall Stage</th>
                <th className="p-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {sectionProgressList.map((item) => {
                const isApproved = item.hodReviewStatus === 'Approved';
                const isReturned = item.hodReviewStatus === 'Returned for Correction';
                const isAwaiting = item.hodReviewStatus === 'Awaiting HOD Review';

                return (
                  <tr key={item.id} className="hover:bg-canvas-muted/20 transition-colors">
                    <td className="p-2.5 font-bold font-mono text-primary text-[11px]">
                      {item.section}
                    </td>
                    <td className="p-2.5">
                      <span className="font-semibold text-ink block">{item.year}</span>
                      <span className="text-[10px] font-mono text-ink-light">{item.semester}</span>
                    </td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                        {item.subjectAllocationStatus}
                      </span>
                    </td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {item.clashValidationStatus}
                      </span>
                    </td>
                    <td className="p-2.5 text-center">
                      {isApproved ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Approved
                        </span>
                      ) : isReturned ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          Returned
                        </span>
                      ) : isAwaiting ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Awaiting Review
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono text-ink-muted bg-canvas-muted border border-border-subtle">
                          Drafting
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        item.overallStatus === 'Published'
                          ? 'bg-purple-50 text-purple-800 border border-purple-300'
                          : item.overallStatus === 'Approved'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                          : 'bg-canvas-muted text-ink-muted border border-border-subtle'
                      }`}>
                        {item.overallStatus}
                      </span>
                    </td>
                    <td className="p-2.5 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* Review Modal Trigger */}
                        <button
                          type="button"
                          onClick={() => setReviewingSectionId(item.id)}
                          className="px-2.5 py-1 text-[11px] font-medium text-ink bg-surface hover:bg-canvas-muted border border-border-beige rounded shadow-crisp-sm transition-colors flex items-center gap-1"
                          title="Preview full timetable"
                        >
                          <Eye className="w-3 h-3 text-primary" />
                          <span>Review</span>
                        </button>

                        {/* Approve Trigger */}
                        {!isApproved && item.overallStatus !== 'Published' && (
                          <button
                            type="button"
                            onClick={() => {
                              setApprovingSectionId(item.id);
                              setApprovalRemarks('Approved by HOD. Ready for final verification and publication.');
                            }}
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-primary hover:bg-primary-dark rounded shadow-crisp-sm transition-colors flex items-center gap-1"
                            title="Approve this timetable"
                          >
                            <Check className="w-3 h-3" />
                            <span>Approve</span>
                          </button>
                        )}

                        {/* Return for Correction Trigger */}
                        {item.overallStatus !== 'Published' && (
                          <button
                            type="button"
                            onClick={() => {
                              setReturningSectionId(item.id);
                              setCorrectionReason('');
                              setReturnError(null);
                            }}
                            className="px-2.5 py-1 text-[11px] font-medium text-accent-red hover:bg-accent-red/10 border border-accent-red/20 rounded transition-colors flex items-center gap-1"
                            title="Return for adjustments"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Return</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION C: TIMETABLE REVIEW MODAL */}
      {/* ========================================================================= */}
      {reviewingSectionId && reviewingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-3 sm:p-5 animate-fade-in">
          <div className="bg-white rounded-card border border-border-beige shadow-crisp max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden text-xs text-ink">
            {/* Modal Header */}
            <div className="p-3.5 bg-canvas-paper border-b border-border-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-ink-light block">
                  Timetable Audit &amp; Inspection
                </span>
                <h3 className="font-headline text-base font-bold text-primary">
                  Review Schedule — {reviewingItem.year} ({reviewingItem.section})
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <DownloadPdfButton
                  targetRef={modalTimetableRef}
                  filename={() =>
                    getTimetablePdfFilename({
                      department: 'AIDS',
                      studentYear: reviewingItem.year,
                      semester: 'Odd Semester',
                      section: reviewingItem.section,
                    })
                  }
                  label="Download PDF"
                />
                <button
                  type="button"
                  onClick={() => setReviewingSectionId(null)}
                  className="p-1 text-ink-muted hover:text-ink rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable Table 0 View */}
            <div ref={modalTimetableRef} className="p-4 space-y-4 overflow-y-auto flex-1 bg-white">
              {/* Compliance & Clash Strip */}
              <div className="p-3 bg-canvas-paper rounded border border-border-subtle flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Zero Clashes Verified
                  </span>
                  <span className="text-ink-muted">
                    Total Placements: <strong>{reviewingTimetable?.placements?.length || 0} slots</strong>
                  </span>
                </div>
                <div className="text-[11px] font-mono text-ink-light">
                  Last Updated: {reviewingItem.lastUpdated}
                </div>
              </div>

              {/* Table 0 Timetable Grid */}
              <div className="overflow-x-auto border border-black rounded">
                <table className="w-full border-collapse border border-black text-xs select-none">
                  <thead>
                    <tr className="bg-[#993366] text-white font-mono text-[11px] border border-black">
                      <th className="py-2 px-1 text-center font-bold border border-black bg-[#993366] text-white w-[75px] uppercase text-[10px]">
                        DAY/TIME
                      </th>
                      <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[80px]">
                        <div className="font-bold text-[10px]">I</div>
                        <div className="text-[8px] opacity-90 font-mono">9:00–9:55</div>
                      </th>
                      <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[80px]">
                        <div className="font-bold text-[10px]">II</div>
                        <div className="text-[8px] opacity-90 font-mono">9:55–10:50</div>
                      </th>
                      <th className="py-2 px-0.5 text-center font-bold border border-black bg-[#EFCDDE] text-black w-[36px] text-[8px] uppercase tracking-wider">
                        TEA
                      </th>
                      <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[80px]">
                        <div className="font-bold text-[10px]">III</div>
                        <div className="text-[8px] opacity-90 font-mono">11:10–12:05</div>
                      </th>
                      <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[80px]">
                        <div className="font-bold text-[10px]">IV</div>
                        <div className="text-[8px] opacity-90 font-mono">12:05–1:00</div>
                      </th>
                      <th className="py-2 px-0.5 text-center font-bold border border-black bg-[#EFCDDE] text-black w-[36px] text-[8px] uppercase tracking-wider">
                        LUNCH
                      </th>
                      <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[80px]">
                        <div className="font-bold text-[10px]">V</div>
                        <div className="text-[8px] opacity-90 font-mono">1:55–2:50</div>
                      </th>
                      <th className="py-2 px-0.5 text-center font-bold border border-black bg-[#EFCDDE] text-black w-[36px] text-[8px] uppercase tracking-wider">
                        LEISURE
                      </th>
                      <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[80px]">
                        <div className="font-bold text-[10px]">VI</div>
                        <div className="text-[8px] opacity-90 font-mono">3:00–3:55</div>
                      </th>
                      <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[80px]">
                        <div className="font-bold text-[10px]">VII</div>
                        <div className="text-[8px] opacity-90 font-mono">3:55–4:45</div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day) => {
                      const dayPlacements = reviewingTimetable?.placements?.filter((p) => p.day === day) || [];

                      const renderSlotCell = (period: number) => {
                        const covered = dayPlacements.find(
                          (p) => p.startPeriod < period && p.startPeriod + p.duration > period
                        );
                        if (covered) return null;

                        const slot = dayPlacements.find((p) => p.startPeriod === period);
                        const colSpan = slot ? slot.duration : 1;

                        if (slot) {
                          return (
                            <td
                              key={period}
                              colSpan={colSpan}
                              className="p-1 text-center border border-black align-middle bg-white hover:bg-canvas-muted/20"
                            >
                              <div className="font-bold font-mono text-[10px] text-primary">
                                {slot.subjectCode}
                              </div>
                              <div className="text-[8px] text-ink-muted truncate max-w-[120px] mx-auto">
                                {slot.facultyName}
                              </div>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={period}
                            className="p-1 text-center border border-black align-middle bg-white text-zinc-300 font-mono text-[10px]"
                          >
                            —
                          </td>
                        );
                      };

                      return (
                        <tr key={day} className="border border-black h-[48px]">
                          <td className="py-1 px-1 text-center font-bold font-mono text-[10px] uppercase border border-black bg-canvas-paper text-ink">
                            {day.substring(0, 3)}
                          </td>
                          {renderSlotCell(1)}
                          {renderSlotCell(2)}

                          {day === 'Monday' && (
                            <td
                              rowSpan={6}
                              className="p-0 border border-black bg-[#EFCDDE] text-black text-center align-middle w-[36px]"
                            >
                              <div className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold text-center mx-auto tracking-widest uppercase py-2">
                                TEA BREAK
                              </div>
                            </td>
                          )}

                          {renderSlotCell(3)}
                          {renderSlotCell(4)}

                          {day === 'Monday' && (
                            <td
                              rowSpan={6}
                              className="p-0 border border-black bg-[#EFCDDE] text-black text-center align-middle w-[36px]"
                            >
                              <div className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold text-center mx-auto tracking-widest uppercase py-2">
                                LUNCH
                              </div>
                            </td>
                          )}

                          {renderSlotCell(5)}

                          {day === 'Monday' && (
                            <td
                              rowSpan={6}
                              className="p-0 border border-black bg-[#EFCDDE] text-black text-center align-middle w-[36px]"
                            >
                              <div className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold text-center mx-auto tracking-widest uppercase py-2">
                                LEISURE
                              </div>
                            </td>
                          )}

                          {renderSlotCell(6)}
                          {renderSlotCell(7)}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* HOD Remarks / Audit record if present */}
              {reviewingItem.hodRemarks && (
                <div className="p-3 bg-canvas-paper rounded border border-border-subtle text-xs space-y-1">
                  <span className="font-semibold text-ink text-[11px] block uppercase">
                    Current HOD Remarks / Log:
                  </span>
                  <p className="text-ink-muted text-xs leading-relaxed italic">
                    &ldquo;{reviewingItem.hodRemarks}&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-canvas-paper border-t border-border-subtle flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setReviewingSectionId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-ink hover:bg-canvas-muted rounded transition-colors"
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION D: APPROVAL CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {approvingSectionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp max-w-md w-full overflow-hidden text-xs text-ink space-y-4">
            <div className="p-4 bg-canvas-paper border-b border-border-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-ink-light block">
                  HOD Official Endorsement
                </span>
                <h3 className="font-headline text-base font-bold text-primary">
                  Approve Section Timetable
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setApprovingSectionId(null)}
                className="p-1 text-ink-muted hover:text-ink rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-ink leading-relaxed">
                You are ratifying this section timetable as the Head of Department. This endorses the faculty teaching schedule, subject allocation compliance, and verified zero-clash state.
              </p>

              <div className="p-2.5 bg-canvas-paper rounded border border-border-subtle text-[11px] text-ink-muted">
                <strong>Notice:</strong> HOD endorsement marks the schedule as <span className="text-emerald-800 font-bold">Approved</span>. The Timetable Coordinator or Principal/Dean retains official authority to publish the timetable for student viewing.
              </div>

              <div>
                <label className="text-[10px] font-mono text-ink-light block mb-1">
                  Endorsement Remarks (Optional)
                </label>
                <textarea
                  rows={2}
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  placeholder="e.g. Approved by HOD. Verified zero clashes and load equity."
                  className="w-full bg-white border border-border-beige rounded p-2 text-xs focus:outline-hidden focus:border-primary"
                />
              </div>
            </div>

            <div className="p-3.5 bg-canvas-paper border-t border-border-subtle flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setApprovingSectionId(null)}
                className="px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                className="px-4 py-1.5 bg-primary text-white text-xs font-semibold rounded shadow-crisp hover:bg-primary-dark transition-colors flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Confirm HOD Approval</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION E: RETURN FOR CORRECTION MODAL */}
      {/* ========================================================================= */}
      {returningSectionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp max-w-md w-full overflow-hidden text-xs text-ink space-y-4">
            <div className="p-4 bg-canvas-paper border-b border-border-subtle flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-accent-red block font-semibold">
                  Revision Request
                </span>
                <h3 className="font-headline text-base font-bold text-primary">
                  Return Timetable for Correction
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReturningSectionId(null);
                  setReturnError(null);
                }}
                className="p-1 text-ink-muted hover:text-ink rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-ink leading-relaxed">
                Please specify the required adjustments for the Timetable Coordinator. The status will transition to <span className="font-bold text-rose-800">Returned for Correction</span> and the coordinator will be notified.
              </p>

              <div>
                <label className="text-[10px] font-mono text-ink-light block mb-1">
                  Required Adjustments / Specific Remarks <span className="text-accent-red">*</span>
                </label>
                <textarea
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => {
                    setCorrectionReason(e.target.value);
                    if (returnError) setReturnError(null);
                  }}
                  placeholder="e.g. Please swap Tuesday Period 3 DSA with Period 4 Java to optimize lab equipment availability."
                  className="w-full bg-white border border-border-beige rounded p-2 text-xs focus:outline-hidden focus:border-primary"
                />
                {returnError && (
                  <p className="text-[10px] text-accent-red mt-1">{returnError}</p>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-canvas-paper border-t border-border-subtle flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setReturningSectionId(null);
                  setReturnError(null);
                }}
                className="px-3 py-1.5 text-xs font-medium text-ink-muted hover:text-ink rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                className="px-4 py-1.5 bg-accent-red text-white text-xs font-semibold rounded shadow-crisp hover:bg-accent-red/90 transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Return with Remarks</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

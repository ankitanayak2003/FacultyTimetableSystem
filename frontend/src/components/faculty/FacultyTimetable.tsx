import React, { useState } from 'react';
import {
  Printer,
  MapPin,
  CheckCircle2,
  Calendar,
  Building,
  GraduationCap,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import {
  FACULTY_ODD_TIMETABLE,
  FACULTY_EVEN_TIMETABLE,
  FacultyScheduleSlot,
} from '../../data/facultyDemoData';
import { ClassTimetableView } from './ClassTimetableView';

export const FacultyTimetable: React.FC = () => {
  const [semesterTerm, setSemesterTerm] = useState<'Odd' | 'Even'>('Odd');
  const [timetableMode, setTimetableMode] = useState<'personal' | 'classwise'>('personal');

  const slots: FacultyScheduleSlot[] =
    semesterTerm === 'Odd' ? FACULTY_ODD_TIMETABLE : FACULTY_EVEN_TIMETABLE;

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

  const getSlot = (day: string, period: number) => {
    return slots.find((s) => s.day === day && s.period === period);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Top Header & Controls */}
      <div className="p-5 bg-surface rounded-card border border-border-beige shadow-crisp flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-ink-light">
              Academic Schedule Engine
            </span>
            <span className="text-xs font-mono text-[#993366] font-semibold">• {semesterTerm} Semester</span>
          </div>
          <h3 className="font-headline text-xl font-bold text-[#993366]">
            Instructional Timetable Portal
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Institutional timetable based on accredited Data Science curriculum format.
          </p>
        </div>

        {/* Action Controls: Mode Switcher & Semester Selector */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Personal vs Class-Wise Mode Switcher */}
          <div className="flex items-center bg-canvas-muted p-1 rounded-card border border-border-subtle text-xs">
            <button
              type="button"
              onClick={() => setTimetableMode('personal')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                timetableMode === 'personal'
                  ? 'bg-[#993366] text-white shadow-crisp-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              My Teaching Timetable
            </button>
            <button
              type="button"
              onClick={() => setTimetableMode('classwise')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                timetableMode === 'classwise'
                  ? 'bg-[#993366] text-white shadow-crisp-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Class-Wise (DS-3rd Sem Reference)
            </button>
          </div>

          {/* Odd vs Even Semester Selector */}
          <div className="flex items-center bg-canvas-muted p-1 rounded-card border border-border-subtle text-xs">
            <button
              type="button"
              onClick={() => setSemesterTerm('Odd')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                semesterTerm === 'Odd'
                  ? 'bg-primary text-white shadow-crisp-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Odd Sem
            </button>
            <button
              type="button"
              onClick={() => setSemesterTerm('Even')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                semesterTerm === 'Even'
                  ? 'bg-primary text-white shadow-crisp-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Even Sem
            </button>
          </div>

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            aria-label="Print timetable"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-card bg-surface hover:bg-canvas-muted text-ink text-xs font-semibold border border-border-beige transition-colors shadow-crisp-sm"
          >
            <Printer className="w-3.5 h-3.5 text-primary" />
            <span className="hidden sm:inline">Print Schedule</span>
          </button>
        </div>
      </div>

      {/* Main View: Personal vs Class-Wise */}
      {timetableMode === 'classwise' ? (
        <ClassTimetableView />
      ) : (
        <div className="space-y-6">
          {/* Institutional Status & Compliance Strip */}
          <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span className="font-semibold text-ink">
                  Ratified Faculty Allocation — Department of Artificial Intelligence &amp; Data Science
                </span>
              </div>
              <div className="flex items-center gap-3 font-mono text-[11px] text-ink-light">
                <span>AY 2025–26</span>
                <span>•</span>
                <span>Scheme: 2022</span>
                <span>•</span>
                <span className="text-[#993366] font-bold">16 Teaching Hours</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border-subtle grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#993366]" />
                <div>
                  <span className="text-[10px] font-mono text-ink-light block uppercase">Academic Cycle</span>
                  <strong className="text-ink font-semibold">{semesterTerm} Semester</strong>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-[#993366]" />
                <div>
                  <span className="text-[10px] font-mono text-ink-light block uppercase">Faculty In-Charge</span>
                  <strong className="text-ink font-semibold">Dr. Ashwini Rao (F-042)</strong>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#993366]" />
                <div>
                  <span className="text-[10px] font-mono text-ink-light block uppercase">Affiliation</span>
                  <strong className="text-ink font-semibold">VTU Belagavi</strong>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#993366]" />
                <div>
                  <span className="text-[10px] font-mono text-ink-light block uppercase">Working Days</span>
                  <strong className="text-ink font-semibold">Monday – Saturday</strong>
                </div>
              </div>
            </div>
          </div>

          {/* TABLE: Faculty Personal Timetable Matrix */}
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden">
            <div className="px-5 py-3 border-b border-border-beige bg-canvas-muted/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-[#993366]" />
                <h4 className="font-headline font-semibold text-sm text-[#993366]">
                  Faculty Teaching Schedule Grid
                </h4>
              </div>
              <span className="text-[11px] font-mono text-ink-light hidden sm:inline">
                Period Timings: 9:00 AM – 4:45 PM
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[1000px] text-xs">
                <thead>
                  <tr className="bg-[#993366] text-white">
                    <th className="p-3 border border-[#7a2851] text-center font-bold tracking-wide w-28 uppercase text-[11px]">
                      DAY / TIME
                    </th>
                    <th className="p-2.5 border border-[#7a2851] text-center font-bold min-w-[95px]">
                      <div>9.00 - 9.55</div>
                    </th>
                    <th className="p-2.5 border border-[#7a2851] text-center font-bold min-w-[95px]">
                      <div>9.55 - 10.50</div>
                    </th>
                    <th className="p-2 border border-[#7a2851] text-center font-bold w-12 bg-[#802450]">
                      <div>10.50 - 11.10</div>
                    </th>
                    <th className="p-2.5 border border-[#7a2851] text-center font-bold min-w-[95px]">
                      <div>11.10 - 12.05</div>
                    </th>
                    <th className="p-2.5 border border-[#7a2851] text-center font-bold min-w-[95px]">
                      <div>12.05 - 1.00</div>
                    </th>
                    <th className="p-2 border border-[#7a2851] text-center font-bold w-12 bg-[#802450]">
                      <div>1.00 - 1.55</div>
                    </th>
                    <th className="p-2.5 border border-[#7a2851] text-center font-bold min-w-[95px]">
                      <div>1.55 - 2.50</div>
                    </th>
                    <th className="p-2 border border-[#7a2851] text-center font-bold w-10 bg-[#802450]">
                      <div>2.50 - 3.00</div>
                    </th>
                    <th className="p-2.5 border border-[#7a2851] text-center font-bold min-w-[95px]">
                      <div>3.00 - 3.55</div>
                    </th>
                    <th className="p-2.5 border border-[#7a2851] text-center font-bold min-w-[95px]">
                      <div>3.55 - 4.45</div>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {DAYS.map((day, dayIndex) => {
                    const isSaturday = day === 'Saturday';

                    return (
                      <tr key={day} className="border-b border-border-subtle hover:bg-canvas-muted/20">
                        {/* Day Column with Burgundy Header */}
                        <th className="p-3 bg-[#993366] text-white font-bold text-center border border-[#7a2851] uppercase text-[11px]">
                          {day}
                        </th>

                        {/* Period 1 */}
                        {(() => {
                          const slot = getSlot(day, 1);
                          return (
                            <td className="p-2 border border-border-subtle text-center align-middle">
                              {slot ? (
                                <div className="p-1.5 rounded bg-surface border border-border-beige shadow-crisp-sm">
                                  <div className="font-mono font-bold text-[#993366] text-[11px]">
                                    {slot.courseCode}
                                  </div>
                                  <div className="text-[10px] text-ink truncate font-medium">
                                    {slot.classSection}
                                  </div>
                                  <div className="text-[9px] font-mono text-ink-muted flex items-center justify-center gap-0.5 mt-0.5">
                                    <MapPin className="w-2.5 h-2.5 text-primary" />
                                    {slot.room}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-ink-light/40 font-mono text-xs">—</span>
                              )}
                            </td>
                          );
                        })()}

                        {/* Period 2 */}
                        {(() => {
                          const slot = getSlot(day, 2);
                          return (
                            <td className="p-2 border border-border-subtle text-center align-middle">
                              {slot ? (
                                <div className="p-1.5 rounded bg-surface border border-border-beige shadow-crisp-sm">
                                  <div className="font-mono font-bold text-[#993366] text-[11px]">
                                    {slot.courseCode}
                                  </div>
                                  <div className="text-[10px] text-ink truncate font-medium">
                                    {slot.classSection}
                                  </div>
                                  <div className="text-[9px] font-mono text-ink-muted flex items-center justify-center gap-0.5 mt-0.5">
                                    <MapPin className="w-2.5 h-2.5 text-primary" />
                                    {slot.room}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-ink-light/40 font-mono text-xs">—</span>
                              )}
                            </td>
                          );
                        })()}

                        {/* TEA BREAK (rowSpan 6 on dayIndex === 0) */}
                        {dayIndex === 0 && (
                          <td
                            rowSpan={6}
                            className="p-1 border border-[#d6a5bc] bg-[#EFCDDE] text-[#993366] font-bold text-center align-middle select-none"
                          >
                            <div className="[writing-mode:vertical-rl] tracking-widest text-xs uppercase font-extrabold mx-auto py-2">
                              TEA BREAK
                            </div>
                          </td>
                        )}

                        {/* Period 3 */}
                        {(() => {
                          const slot = getSlot(day, 3);
                          return (
                            <td className="p-2 border border-border-subtle text-center align-middle">
                              {slot ? (
                                <div className="p-1.5 rounded bg-surface border border-border-beige shadow-crisp-sm">
                                  <div className="font-mono font-bold text-[#993366] text-[11px]">
                                    {slot.courseCode}
                                  </div>
                                  <div className="text-[10px] text-ink truncate font-medium">
                                    {slot.classSection}
                                  </div>
                                  <div className="text-[9px] font-mono text-ink-muted flex items-center justify-center gap-0.5 mt-0.5">
                                    <MapPin className="w-2.5 h-2.5 text-primary" />
                                    {slot.room}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-ink-light/40 font-mono text-xs">—</span>
                              )}
                            </td>
                          );
                        })()}

                        {/* Period 4 */}
                        {(() => {
                          const slot = getSlot(day, 4);
                          return (
                            <td className="p-2 border border-border-subtle text-center align-middle">
                              {slot ? (
                                <div className="p-1.5 rounded bg-surface border border-border-beige shadow-crisp-sm">
                                  <div className="font-mono font-bold text-[#993366] text-[11px]">
                                    {slot.courseCode}
                                  </div>
                                  <div className="text-[10px] text-ink truncate font-medium">
                                    {slot.classSection}
                                  </div>
                                  <div className="text-[9px] font-mono text-ink-muted flex items-center justify-center gap-0.5 mt-0.5">
                                    <MapPin className="w-2.5 h-2.5 text-primary" />
                                    {slot.room}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-ink-light/40 font-mono text-xs">—</span>
                              )}
                            </td>
                          );
                        })()}

                        {/* LUNCH BREAK (rowSpan 6 on dayIndex === 0) */}
                        {dayIndex === 0 && (
                          <td
                            rowSpan={6}
                            className="p-1 border border-[#d6a5bc] bg-[#F0D0E0] text-[#993366] font-bold text-center align-middle select-none"
                          >
                            <div className="[writing-mode:vertical-rl] tracking-widest text-xs uppercase font-extrabold mx-auto py-2">
                              LUNCH BREAK
                            </div>
                          </td>
                        )}

                        {/* Period 5 */}
                        {(() => {
                          if (isSaturday) {
                            return (
                              <td className="p-2 border border-border-subtle text-center text-ink-light/40 font-mono text-xs">
                                —
                              </td>
                            );
                          }
                          const slot = getSlot(day, 5);
                          return (
                            <td className="p-2 border border-border-subtle text-center align-middle">
                              {slot ? (
                                <div className="p-1.5 rounded bg-surface border border-border-beige shadow-crisp-sm">
                                  <div className="font-mono font-bold text-[#993366] text-[11px]">
                                    {slot.courseCode}
                                  </div>
                                  <div className="text-[10px] text-ink truncate font-medium">
                                    {slot.classSection}
                                  </div>
                                  <div className="text-[9px] font-mono text-ink-muted flex items-center justify-center gap-0.5 mt-0.5">
                                    <MapPin className="w-2.5 h-2.5 text-primary" />
                                    {slot.room}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-ink-light/40 font-mono text-xs">—</span>
                              )}
                            </td>
                          );
                        })()}

                        {/* LEISURE (rowSpan 6 on dayIndex === 0) */}
                        {dayIndex === 0 && (
                          <td
                            rowSpan={6}
                            className="p-1 border border-[#d6a5bc] bg-[#F0D0E0] text-[#993366] font-bold text-center align-middle select-none"
                          >
                            <div className="[writing-mode:vertical-rl] tracking-widest text-xs uppercase font-extrabold mx-auto py-2">
                              LEISURE
                            </div>
                          </td>
                        )}

                        {/* Period 6 */}
                        {(() => {
                          if (isSaturday) {
                            return (
                              <td className="p-2 border border-border-subtle text-center text-ink-light/40 font-mono text-xs">
                                —
                              </td>
                            );
                          }
                          const slot = getSlot(day, 6);
                          const isLab = slot?.type === 'Laboratory';
                          return (
                            <td className="p-2 border border-border-subtle text-center align-middle">
                              {slot ? (
                                <div
                                  className={`p-1.5 rounded border shadow-crisp-sm ${
                                    isLab
                                      ? 'bg-accent-teal/10 border-accent-teal/40'
                                      : 'bg-surface border-border-beige'
                                  }`}
                                >
                                  <div className="font-mono font-bold text-[#993366] text-[11px]">
                                    {slot.courseCode}
                                  </div>
                                  <div className="text-[10px] text-ink truncate font-medium">
                                    {slot.classSection}
                                  </div>
                                  <div className="text-[9px] font-mono text-ink-muted flex items-center justify-center gap-0.5 mt-0.5">
                                    <MapPin className="w-2.5 h-2.5 text-primary" />
                                    {slot.room}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-ink-light/40 font-mono text-xs">—</span>
                              )}
                            </td>
                          );
                        })()}

                        {/* Period 7 */}
                        {(() => {
                          if (isSaturday) {
                            return (
                              <td className="p-2 border border-border-subtle text-center text-ink-light/40 font-mono text-xs">
                                —
                              </td>
                            );
                          }
                          const slot = getSlot(day, 7);
                          const isLab = slot?.type === 'Laboratory';
                          return (
                            <td className="p-2 border border-border-subtle text-center align-middle">
                              {slot ? (
                                <div
                                  className={`p-1.5 rounded border shadow-crisp-sm ${
                                    isLab
                                      ? 'bg-accent-teal/10 border-accent-teal/40'
                                      : 'bg-surface border-border-beige'
                                  }`}
                                >
                                  <div className="font-mono font-bold text-[#993366] text-[11px]">
                                    {slot.courseCode}
                                  </div>
                                  <div className="text-[10px] text-ink truncate font-medium">
                                    {slot.classSection}
                                  </div>
                                  <div className="text-[9px] font-mono text-ink-muted flex items-center justify-center gap-0.5 mt-0.5">
                                    <MapPin className="w-2.5 h-2.5 text-primary" />
                                    {slot.room}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-ink-light/40 font-mono text-xs">—</span>
                              )}
                            </td>
                          );
                        })()}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE 2: Faculty Assigned Courses Reference Table */}
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden">
            <div className="px-5 py-3 border-b border-border-beige bg-canvas-muted/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#993366]" />
                <h4 className="font-headline font-semibold text-sm text-[#993366]">
                  Assigned Course Details &amp; Workload Mapping
                </h4>
              </div>
              <span className="text-[11px] font-mono text-ink-light">
                Faculty: Dr. Ashwini Rao (F-042)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[850px] text-xs">
                <thead>
                  <tr className="bg-[#993366] text-white">
                    <th className="p-2.5 border border-[#7a2851] text-center font-bold w-16">
                      Sl. No.
                    </th>
                    <th className="p-2.5 border border-[#7a2851] text-left font-bold w-28">
                      Course Code
                    </th>
                    <th className="p-2.5 border border-[#7a2851] text-left font-bold min-w-[220px]">
                      Course Title
                    </th>
                    <th className="p-2.5 border border-[#7a2851] text-center font-bold w-20">
                      L:T:P
                    </th>
                    <th className="p-2.5 border border-[#7a2851] text-center font-bold w-24">
                      Course Type
                    </th>
                    <th className="p-2.5 border border-[#7a2851] text-center font-bold w-16">
                      Credit
                    </th>
                    <th className="p-2.5 border border-[#7a2851] text-left font-bold min-w-[200px]">
                      Class &amp; Laboratory Batches
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  <tr className="hover:bg-canvas-muted/30 transition-colors">
                    <td className="p-2.5 text-center font-mono font-bold text-ink border-r border-border-subtle">
                      1
                    </td>
                    <td className="p-2.5 font-mono font-bold text-[#993366] border-r border-border-subtle">
                      BCS303
                    </td>
                    <td className="p-2.5 font-semibold text-ink border-r border-border-subtle">
                      Operating Systems
                    </td>
                    <td className="p-2.5 text-center font-mono text-ink-muted border-r border-border-subtle">
                      3:1:2
                    </td>
                    <td className="p-2.5 text-center font-mono text-xs border-r border-border-subtle">
                      <span className="px-1.5 py-0.5 rounded bg-canvas-muted border border-border-subtle text-ink">
                        IPCC
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-primary border-r border-border-subtle">
                      4
                    </td>
                    <td className="p-2.5 text-ink text-xs font-medium">
                      Sem 3 DS • Batches B1 &amp; B2 (With NF1)
                    </td>
                  </tr>
                  <tr className="hover:bg-canvas-muted/30 transition-colors">
                    <td className="p-2.5 text-center font-mono font-bold text-ink border-r border-border-subtle">
                      2
                    </td>
                    <td className="p-2.5 font-mono font-bold text-[#993366] border-r border-border-subtle">
                      BCS304
                    </td>
                    <td className="p-2.5 font-semibold text-ink border-r border-border-subtle">
                      Data Structures and Applications
                    </td>
                    <td className="p-2.5 text-center font-mono text-ink-muted border-r border-border-subtle">
                      3:0:0
                    </td>
                    <td className="p-2.5 text-center font-mono text-xs border-r border-border-subtle">
                      <span className="px-1.5 py-0.5 rounded bg-canvas-muted border border-border-subtle text-ink">
                        PCC
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-primary border-r border-border-subtle">
                      3
                    </td>
                    <td className="p-2.5 text-ink text-xs font-medium">
                      Sem 3 DS • Theory Lecture
                    </td>
                  </tr>
                  <tr className="hover:bg-canvas-muted/30 transition-colors">
                    <td className="p-2.5 text-center font-mono font-bold text-ink border-r border-border-subtle">
                      3
                    </td>
                    <td className="p-2.5 font-mono font-bold text-[#993366] border-r border-border-subtle">
                      BCSL305
                    </td>
                    <td className="p-2.5 font-semibold text-ink border-r border-border-subtle">
                      Data Structures Laboratory
                    </td>
                    <td className="p-2.5 text-center font-mono text-ink-muted border-r border-border-subtle">
                      0:0:2
                    </td>
                    <td className="p-2.5 text-center font-mono text-xs border-r border-border-subtle">
                      <span className="px-1.5 py-0.5 rounded bg-canvas-muted border border-border-subtle text-ink">
                        PCCL
                      </span>
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-primary border-r border-border-subtle">
                      1
                    </td>
                    <td className="p-2.5 text-ink text-xs font-medium">
                      Lab 2 • Batch B2 (SL, AK)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footnote matching Reference Document */}
            <div className="p-3.5 bg-canvas-muted/50 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-ink-muted">
              <div>
                <strong className="text-ink font-semibold">Explanatory Notes: </strong>
                <span>
                  L: Lecture, T: Tutorial, P: Practical, IPCC: Integrated Professional Core Course, PCC: Professional Core Course, ESC: Engineering Science Course
                </span>
              </div>
              <span className="font-mono text-ink-light flex-shrink-0">
                Department of AI &amp; DS • SMVITM
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

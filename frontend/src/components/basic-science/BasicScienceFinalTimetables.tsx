import React, { useState, useMemo } from 'react';
import { Printer, ShieldCheck, Lock, AlertCircle } from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';

const ACADEMIC_YEARS = ['2026–2027', '2025–2026', '2027–2028'];
const STUDENT_YEARS = ['First Year'];
const SEMESTERS = ['Odd Semester', 'Even Semester'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const BasicScienceFinalTimetables: React.FC = () => {
  const {
    physicsSubjects,
    chemistrySubjects,
    physicsSections,
    chemistrySections,
    cycleTimetables,
  } = useWorkflow();

  // Selectors
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026–2027');
  const [selectedStudentYear] = useState('First Year');
  const [selectedSemester, setSelectedSemester] = useState('Odd Semester');
  const [selectedCycle, setSelectedCycle] = useState<'Chemistry' | 'Physics'>('Physics');

  const activeSections = selectedCycle === 'Chemistry' ? chemistrySections : physicsSections;
  const [selectedSection, setSelectedSection] = useState(activeSections[0] || 'Section A');

  // Sync section if cycle changes
  React.useEffect(() => {
    if (!activeSections.includes(selectedSection) && activeSections.length > 0) {
      setSelectedSection(activeSections[0]);
    }
  }, [selectedCycle, activeSections, selectedSection]);

  const timetableKey = `${selectedCycle}_${selectedAcademicYear}_${selectedSemester}_${selectedSection}`;
  const currentTimetable = cycleTimetables[timetableKey];
  const placements = currentTimetable?.placements || [];
  const isFinalized = currentTimetable?.isLocked || false;

  const subjects = selectedCycle === 'Chemistry' ? chemistrySubjects : physicsSubjects;

  // Auto-generate course table (Table 1 of reference document)
  const courseSummary = useMemo(() => {
    const map = new Map<
      string,
      { code: string; name: string; facultySet: Set<string>; type: string; hours: number }
    >();

    placements.forEach((p) => {
      const code = p.subjectCode.trim();
      const existing = map.get(code);

      const orig = subjects.find((s) => s.code && s.code.toLowerCase() === code.toLowerCase());
      const type = orig?.type || (p.isDeanLocked ? 'Institutional Slot' : 'Theory');

      if (!existing) {
        const set = new Set<string>();
        if (p.facultyName) {
          p.facultyName.split(/[,/&]/).forEach((f) => set.add(f.trim()));
        }
        map.set(code, {
          code,
          name: p.subjectName || code,
          facultySet: set,
          type,
          hours: p.duration,
        });
      } else {
        if (p.facultyName) {
          p.facultyName.split(/[,/&]/).forEach((f) => existing.facultySet.add(f.trim()));
        }
        existing.hours += p.duration;
      }
    });

    return Array.from(map.values()).map((c) => ({
      code: c.code,
      name: c.name,
      type: c.type,
      facultyList: Array.from(c.facultySet).filter(Boolean).join(', '),
      hours: c.hours,
    }));
  }, [placements, subjects]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 animate-fade-in text-ink">
      {/* Selector Card (Hidden on Print) */}
      <div className="p-3.5 sm:p-4 bg-surface rounded-card border border-border-beige shadow-crisp space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-border-beige">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Institutional Schedule Review
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                Official Finalized Timetables
              </span>
            </div>
            <h2 className="font-headline text-xl sm:text-2xl font-semibold text-primary">
              Final Timetables
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Read-only view of finalized first-year foundational class schedules following the VTU academic blueprint.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-canvas-paper hover:bg-canvas text-primary border border-primary hover:border-primary-hover transition-colors shadow-crisp-sm"
          >
            <Printer className="w-3.5 h-3.5 text-primary" />
            <span>Download PDF</span>
          </button>
        </div>

        {/* 5 Selectors Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-0.5">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Academic Year
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
            >
              {ACADEMIC_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Student Year
            </label>
            <select
              value={selectedStudentYear}
              disabled
              className="w-full px-2.5 py-1 text-xs bg-canvas-muted rounded border border-border-beige text-ink-muted font-semibold cursor-not-allowed"
            >
              {STUDENT_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
            >
              {SEMESTERS.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Instructional Cycle
            </label>
            <select
              value={selectedCycle}
              onChange={(e) => {
                const nextCycle = e.target.value as 'Chemistry' | 'Physics';
                setSelectedCycle(nextCycle);
                const nextSecs = nextCycle === 'Chemistry' ? chemistrySections : physicsSections;
                setSelectedSection(nextSecs[0] || 'Section A');
              }}
              className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
            >
              <option value="Physics">Physics Cycle</option>
              <option value="Chemistry">Chemistry Cycle</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
            >
              {activeSections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Draft Notification if Not Yet Finalized */}
      {!isFinalized && (
        <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-card flex items-center justify-between text-xs text-amber-950">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>
              This timetable for <strong>{selectedCycle} Cycle ({selectedSection})</strong> is currently in <strong>Draft (Editable)</strong> state.
              To certify and view here as official, use <strong>Lock &amp; Finalize</strong> on the {selectedCycle} Cycle Timetable Editor.
            </span>
          </div>
          <span className="text-[10px] font-mono text-amber-800 uppercase font-semibold">
            Draft Preview
          </span>
        </div>
      )}

      {/* Official Timetable Document Container (Styled for Screen and Clean Print) */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-4 sm:p-5 space-y-4 print:border-none print:shadow-none print:p-0">
        {/* Document Institutional Header (Reproducing Class Timetable DS-3rd sem.docx) */}
        <div className="text-center pb-3 border-b-2 border-primary space-y-0.5">
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-light">
            SHRI SODE VADIRAJA MUTT EDUCATION TRUST (R)
          </div>
          <h1 className="font-headline text-lg sm:text-xl font-bold text-primary uppercase tracking-tight">
            SHRI MADHWA VADIRAJA INSTITUTE OF TECHNOLOGY &amp; MANAGEMENT
          </h1>
          <div className="text-[11px] text-ink-muted">
            Vishwothama Nagar, Bantakal, Udupi - 574 115, Karnataka
          </div>
          <div className="pt-1.5">
            <h2 className="font-headline text-xs sm:text-sm font-semibold text-ink uppercase tracking-wider">
              DEPARTMENT OF BASIC SCIENCE &amp; FOUNDATIONAL ENGINEERING
            </h2>
            <div className="inline-block mt-0.5 px-2.5 py-0.5 bg-canvas-muted rounded text-[11px] font-mono font-semibold text-primary">
              CLASS TIMETABLE — ACADEMIC YEAR {selectedAcademicYear} ({selectedCycle.toUpperCase()} CYCLE — {selectedSemester.toUpperCase()})
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-ink-muted pt-1.5">
            <span>Class: <strong>First Year</strong></span>
            <span>•</span>
            <span>Cycle: <strong>{selectedCycle}</strong></span>
            <span>•</span>
            <span>Section: <strong>{selectedSection}</strong></span>
            <span>•</span>
            <span>Room: <strong>{selectedSection === 'Section C' ? 'AB-103' : 'AB-101'}</strong></span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Approved by Basic Science Coordinator &amp; Dean
            </span>
          </div>
        </div>

        {/* Timetable Grid (Table 0 of reference document) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-[#4A1525] uppercase">
              Table 0: Master Weekly Schedule ({selectedCycle} Cycle — {selectedSection})
            </span>
            <span className="text-ink-muted">7 Periods • 3 Breaks</span>
          </div>

          <div className="overflow-x-auto bg-white p-2 sm:p-2.5 rounded border border-black">
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-[#993366] text-white font-mono text-[11px] border border-black">
                  <th className="py-2 px-1.5 text-center font-bold border border-black bg-[#993366] text-white w-[84px] min-w-[80px] uppercase text-[10px]">
                    DAY/TIME
                  </th>
                  <th className="py-1.5 px-1 text-center border border-black bg-[#993366] text-white min-w-[88px]">
                    <div className="font-bold text-xs">Period 1</div>
                    <div className="text-[10px] text-white/90 font-normal">9:00 - 9:55</div>
                  </th>
                  <th className="py-1.5 px-1 text-center border border-black bg-[#993366] text-white min-w-[88px]">
                    <div className="font-bold text-xs">Period 2</div>
                    <div className="text-[10px] text-white/90 font-normal">9:55 - 10:50</div>
                  </th>
                  <th className="py-1.5 px-0.5 text-center border border-black bg-[#EFCDDE] text-[#4A1525] w-[42px] min-w-[40px] max-w-[46px] uppercase font-bold text-[9px] tracking-wider">
                    <div className="[writing-mode:vertical-rl] rotate-180 mx-auto whitespace-nowrap leading-none py-1">
                      TEA BREAK
                    </div>
                    <div className="text-[8px] font-semibold text-[#4A1525]/85 [writing-mode:vertical-rl] rotate-180 mx-auto whitespace-nowrap leading-none mt-1">
                      10:50-11:10
                    </div>
                  </th>
                  <th className="py-1.5 px-1 text-center border border-black bg-[#993366] text-white min-w-[88px]">
                    <div className="font-bold text-xs">Period 3</div>
                    <div className="text-[10px] text-white/90 font-normal">11:10 - 12:05</div>
                  </th>
                  <th className="py-1.5 px-1 text-center border border-black bg-[#993366] text-white min-w-[88px]">
                    <div className="font-bold text-xs">Period 4</div>
                    <div className="text-[10px] text-white/90 font-normal">12:05 - 1:00</div>
                  </th>
                  <th className="py-1.5 px-0.5 text-center border border-black bg-[#F0D0E0] text-[#4A1525] w-[42px] min-w-[40px] max-w-[46px] uppercase font-bold text-[9px] tracking-wider">
                    <div className="[writing-mode:vertical-rl] rotate-180 mx-auto whitespace-nowrap leading-none py-1">
                      LUNCH BREAK
                    </div>
                    <div className="text-[8px] font-semibold text-[#4A1525]/85 [writing-mode:vertical-rl] rotate-180 mx-auto whitespace-nowrap leading-none mt-1">
                      1:00 - 1:55
                    </div>
                  </th>
                  <th className="py-1.5 px-1 text-center border border-black bg-[#993366] text-white min-w-[88px]">
                    <div className="font-bold text-xs">Period 5</div>
                    <div className="text-[10px] text-white/90 font-normal">1:55 - 2:50</div>
                  </th>
                  <th className="py-1.5 px-0.5 text-center border border-black bg-[#F0D0E0] text-[#4A1525] w-[42px] min-w-[40px] max-w-[46px] uppercase font-bold text-[9px] tracking-wider">
                    <div className="[writing-mode:vertical-rl] rotate-180 mx-auto whitespace-nowrap leading-none py-1">
                      LEISURE
                    </div>
                    <div className="text-[8px] font-semibold text-[#4A1525]/85 [writing-mode:vertical-rl] rotate-180 mx-auto whitespace-nowrap leading-none mt-1">
                      2:50 - 3:00
                    </div>
                  </th>
                  <th className="py-1.5 px-1 text-center border border-black bg-[#993366] text-white min-w-[88px]">
                    <div className="font-bold text-xs">Period 6</div>
                    <div className="text-[10px] text-white/90 font-normal">3:00 - 3:55</div>
                  </th>
                  <th className="py-1.5 px-1 text-center border border-black bg-[#993366] text-white min-w-[88px]">
                    <div className="font-bold text-xs">Period 7</div>
                    <div className="text-[10px] text-white/90 font-normal">3:55 - 4:45</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => {
                  const dayPlacements = placements.filter((p) => p.day === day);

                  const getPlacementAt = (period: number) => {
                    return dayPlacements.find((p) => p.startPeriod === period);
                  };

                  const isCoveredByPrevious = (period: number) => {
                    return dayPlacements.some(
                      (p) => p.startPeriod < period && period < p.startPeriod + p.duration
                    );
                  };

                  const renderPeriodCell = (period: number) => {
                    if (isCoveredByPrevious(period)) {
                      return null;
                    }

                    const placement = getPlacementAt(period);
                    const colSpan = placement?.duration || 1;

                    if (placement) {
                      return (
                        <td
                          key={period}
                          colSpan={colSpan}
                          className="p-1.5 border border-black align-middle text-center bg-white"
                        >
                          <div className="font-mono font-bold text-[#4A1525] text-xs leading-tight flex items-center justify-center gap-1">
                            <span>{placement.subjectCode}</span>
                            {placement.isDeanLocked && (
                              <span className="text-[8px] px-1 py-0.2 rounded bg-amber-100 text-amber-900 font-mono font-bold uppercase tracking-wider">
                                <Lock className="w-2.5 h-2.5 inline" /> Dean
                              </span>
                            )}
                          </div>
                          <div
                            className="text-[10px] text-black leading-tight line-clamp-2 mt-0.5 font-medium"
                            title={placement.subjectName}
                          >
                            {placement.subjectName}
                          </div>
                          <div className="text-[9px] font-mono text-neutral-700 font-semibold mt-0.5">
                            {placement.facultyName}
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={period}
                        className="p-1 border border-black align-middle text-center text-neutral-400 font-mono text-xs bg-white h-[54px]"
                      >
                        —
                      </td>
                    );
                  };

                  return (
                    <tr key={day} className="border border-black">
                      <td className="py-2 px-1 font-mono font-bold text-white bg-[#993366] border border-black uppercase text-[10px] whitespace-nowrap text-center w-[84px] min-w-[80px]">
                        {day}
                      </td>

                      {renderPeriodCell(1)}
                      {renderPeriodCell(2)}

                      {/* Tea Break (#EFCDDE) */}
                      <td className="w-[42px] min-w-[40px] max-w-[46px] bg-[#EFCDDE] border border-black text-center align-middle p-0.5 text-[#4A1525] font-mono select-none">
                        <span className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold tracking-widest uppercase inline-block whitespace-nowrap py-1">
                          Tea Break
                        </span>
                      </td>

                      {renderPeriodCell(3)}
                      {renderPeriodCell(4)}

                      {/* Lunch Break (#F0D0E0) */}
                      <td className="w-[42px] min-w-[40px] max-w-[46px] bg-[#F0D0E0] border border-black text-center align-middle p-0.5 text-[#4A1525] font-mono select-none">
                        <span className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold tracking-widest uppercase inline-block whitespace-nowrap py-1">
                          Lunch Break
                        </span>
                      </td>

                      {renderPeriodCell(5)}

                      {/* Leisure Break (#F0D0E0) */}
                      <td className="w-[42px] min-w-[40px] max-w-[46px] bg-[#F0D0E0] border border-black text-center align-middle p-0.5 text-[#4A1525] font-mono select-none">
                        <span className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold tracking-widest uppercase inline-block whitespace-nowrap py-1">
                          Leisure
                        </span>
                      </td>

                      {renderPeriodCell(6)}
                      {renderPeriodCell(7)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Automatically Generated Subject & Faculty Table (Table 1 of reference document) */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-[#4A1525] uppercase">
              Table 1: Course &amp; Faculty Allocation Registry
            </span>
            <span className="text-ink-muted">{courseSummary.length} Courses Allocated</span>
          </div>

          <div className="overflow-x-auto bg-white p-2 sm:p-2.5 rounded border border-black">
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-[#993366] text-white font-mono text-[11px] border border-black text-left">
                  <th className="py-1.5 px-2.5 font-bold border border-black bg-[#993366] text-white w-12 text-center">
                    Sl. No.
                  </th>
                  <th className="py-1.5 px-2.5 font-bold border border-black bg-[#993366] text-white w-28">
                    Course Code
                  </th>
                  <th className="py-1.5 px-2.5 font-bold border border-black bg-[#993366] text-white">
                    Course Name
                  </th>
                  <th className="py-1.5 px-2.5 font-bold border border-black bg-[#993366] text-white w-40">
                    Course Type
                  </th>
                  <th className="py-1.5 px-2.5 font-bold border border-black bg-[#993366] text-white">
                    Name of the Faculty Member
                  </th>
                  <th className="py-1.5 px-2.5 font-bold border border-black bg-[#993366] text-white text-center w-24">
                    Weekly Hours
                  </th>
                </tr>
              </thead>
              <tbody>
                {courseSummary.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-3 text-center text-ink-muted italic border border-black">
                      No timetable placements found for this section.
                    </td>
                  </tr>
                ) : (
                  courseSummary.map((c, i) => (
                    <tr key={c.code} className="border border-black bg-white hover:bg-neutral-50">
                      <td className="py-1.5 px-2.5 font-mono text-center text-neutral-700 border border-black">
                        {i + 1}
                      </td>
                      <td className="py-1.5 px-2.5 font-mono font-bold text-[#4A1525] border border-black">
                        {c.code}
                      </td>
                      <td className="py-1.5 px-2.5 font-medium text-black border border-black">
                        {c.name}
                      </td>
                      <td className="py-1.5 px-2.5 font-mono text-[11px] text-neutral-800 border border-black">
                        {c.type}
                      </td>
                      <td className="py-1.5 px-2.5 font-semibold text-black border border-black">
                        {c.facultyList || 'Unassigned'}
                      </td>
                      <td className="py-1.5 px-2.5 font-mono font-bold text-center text-[#4A1525] border border-black">
                        {c.hours}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Official Institutional Sign-Off Section */}
        <div className="pt-4 sm:pt-5 border-t border-border-beige grid grid-cols-3 gap-3 text-center text-xs font-mono text-ink">
          <div className="space-y-0.5">
            <div className="font-semibold text-ink">Dr. Ravindra Shenoy</div>
            <div className="text-[10px] text-ink-light">Basic Science Coordinator</div>
          </div>
          <div className="space-y-0.5">
            <div className="font-semibold text-ink">Dr. Sudarshan Rao</div>
            <div className="text-[10px] text-ink-light">Dean (Academic Affairs)</div>
          </div>
          <div className="space-y-0.5">
            <div className="font-bold text-primary">Dr. Thirumaleshwara Bhat</div>
            <div className="text-[10px] text-ink-light">Principal</div>
          </div>
        </div>
      </div>
    </div>
  );
};

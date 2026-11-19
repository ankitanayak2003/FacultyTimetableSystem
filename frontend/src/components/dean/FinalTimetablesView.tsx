import React, { useState, useMemo } from 'react';
import { Printer, ShieldCheck } from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import {
  DEAN_DEPARTMENTS,
} from '../../data/workflowDemoData';

const ACADEMIC_YEARS = ['2026–2027', '2025–2026', '2027–2028'];
const STUDENT_YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];
const SEMESTERS = ['Odd Semester', 'Even Semester'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const FinalTimetablesView: React.FC = () => {
  const { deanTimetables, deanSubjects } = useWorkflow();

  // Selectors
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026–2027');
  const [selectedStudentYear, setSelectedStudentYear] = useState('Second Year');
  const [selectedSemester, setSelectedSemester] = useState('Odd Semester');
  const [selectedDepartment, setSelectedDepartment] = useState('DS');
  const [selectedSection, setSelectedSection] = useState('Section A');

  // Composite key
  const timetableKey = `${selectedAcademicYear}_${selectedStudentYear}_${selectedSemester}_${selectedDepartment}_${selectedSection}`;
  const currentTimetable = deanTimetables[timetableKey];
  const placements = currentTimetable?.placements || [];

  const departmentObj = DEAN_DEPARTMENTS.find((d) => d.code === selectedDepartment);
  const departmentFullName = departmentObj ? departmentObj.name : selectedDepartment;

  // Auto-generate course table (Table 1 of reference document)
  const courseSummary = useMemo(() => {
    const map = new Map<
      string,
      { code: string; name: string; facultySet: Set<string>; type: string; hours: number }
    >();

    placements.forEach((p) => {
      const code = p.subjectCode.trim();
      const existing = map.get(code);

      // Find original subject in deanSubjects if available
      const orig = deanSubjects.find((s) => s.code.toLowerCase() === code.toLowerCase());
      const type = orig?.type || 'Theory (PCC/BSC)';

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
  }, [placements, deanSubjects]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in text-ink">
      {/* Selector Card (Hidden on Print) */}
      <div className="p-5 bg-surface rounded-card border border-border-beige shadow-crisp space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border-beige">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Institutional Schedule Review
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                Official Finalized Timetables
              </span>
            </div>
            <h2 className="font-headline text-2xl font-semibold text-primary">
              Final Timetables
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Read-only view of finalized institutional class schedules following the VTU academic blueprint.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded bg-canvas-paper hover:bg-canvas text-primary border border-primary hover:border-primary-hover transition-colors shadow-crisp-sm"
          >
            <Printer className="w-4 h-4 text-primary" />
            <span>Print / Save PDF</span>
          </button>
        </div>

        {/* 5 Selectors Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
              Academic Year
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
            >
              {ACADEMIC_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
              Student Year
            </label>
            <select
              value={selectedStudentYear}
              onChange={(e) => setSelectedStudentYear(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
            >
              {STUDENT_YEARS.map((sy) => (
                <option key={sy} value={sy}>
                  {sy}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
            >
              {SEMESTERS.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
            >
              {DEAN_DEPARTMENTS.map((dept) => (
                <option key={dept.code} value={dept.code}>
                  {dept.code} — {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
            >
              <option value="Section A">Section A</option>
              <option value="Section B">Section B</option>
              <option value="Section C">Section C</option>
            </select>
          </div>
        </div>
      </div>

      {/* Official Timetable Document Container (Styled for Screen and Clean Print) */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Document Institutional Header (Reproducing Class Timetable DS-3rd sem.docx) */}
        <div className="text-center pb-5 border-b-2 border-primary space-y-1">
          <div className="text-[11px] font-mono uppercase tracking-widest text-ink-light">
            SHRI SODE VADIRAJA MUTT EDUCATION TRUST (R)
          </div>
          <h1 className="font-headline text-xl sm:text-2xl font-bold text-primary uppercase tracking-tight">
            SHRI MADHWA VADIRAJA INSTITUTE OF TECHNOLOGY & MANAGEMENT
          </h1>
          <div className="text-xs text-ink-muted">
            Vishwothama Nagar, Bantakal, Udupi - 574 115, Karnataka
          </div>
          <div className="pt-2">
            <h2 className="font-headline text-sm sm:text-base font-semibold text-ink uppercase tracking-wider">
              DEPARTMENT OF {departmentFullName.toUpperCase()}
            </h2>
            <div className="inline-block mt-1 px-3 py-1 bg-canvas-muted rounded text-xs font-mono font-semibold text-primary">
              CLASS TIMETABLE — ACADEMIC YEAR {selectedAcademicYear} ({selectedSemester.toUpperCase()})
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-ink-muted pt-2">
            <span>Class: <strong>{selectedStudentYear}</strong></span>
            <span>•</span>
            <span>Section: <strong>{selectedSection}</strong></span>
            <span>•</span>
            <span>Room: <strong>LH-201 / Hardware Lab</strong></span>
            <span>•</span>
            <span className="text-emerald-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Approved by Dean
            </span>
          </div>
        </div>

        {/* Timetable Grid (Table 0 of reference document) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-[#4A1525] uppercase">Table 0: Master Weekly Schedule</span>
            <span className="text-ink-muted">7 Periods • 3 Breaks</span>
          </div>

          <div className="overflow-x-auto bg-white p-2 sm:p-4 rounded border border-black">
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-[#993366] text-white font-mono text-[11px] border border-black">
                  <th className="py-2.5 px-3 text-center font-bold border border-black bg-[#993366] text-white w-28 uppercase">
                    DAY/TIME
                  </th>
                  <th className="py-2 px-2 text-center border border-black bg-[#993366] text-white min-w-[95px]">
                    <div className="font-bold">Period 1</div>
                    <div className="text-[10px] text-white/90 font-normal">9:00 - 9:55</div>
                  </th>
                  <th className="py-2 px-2 text-center border border-black bg-[#993366] text-white min-w-[95px]">
                    <div className="font-bold">Period 2</div>
                    <div className="text-[10px] text-white/90 font-normal">9:55 - 10:50</div>
                  </th>
                  <th className="py-2 px-1 text-center border border-black bg-[#EFCDDE] text-[#4A1525] min-w-[65px] uppercase font-bold text-[10px] tracking-wider">
                    <div>TEA BREAK</div>
                    <div className="text-[9px] font-semibold text-[#4A1525]/85">10:50 - 11:10</div>
                  </th>
                  <th className="py-2 px-2 text-center border border-black bg-[#993366] text-white min-w-[95px]">
                    <div className="font-bold">Period 3</div>
                    <div className="text-[10px] text-white/90 font-normal">11:10 - 12:05</div>
                  </th>
                  <th className="py-2 px-2 text-center border border-black bg-[#993366] text-white min-w-[95px]">
                    <div className="font-bold">Period 4</div>
                    <div className="text-[10px] text-white/90 font-normal">12:05 - 1:00</div>
                  </th>
                  <th className="py-2 px-1 text-center border border-black bg-[#F0D0E0] text-[#4A1525] min-w-[75px] uppercase font-bold text-[10px] tracking-wider">
                    <div>LUNCH BREAK</div>
                    <div className="text-[9px] font-semibold text-[#4A1525]/85">1:00 - 1:55</div>
                  </th>
                  <th className="py-2 px-2 text-center border border-black bg-[#993366] text-white min-w-[95px]">
                    <div className="font-bold">Period 5</div>
                    <div className="text-[10px] text-white/90 font-normal">1:55 - 2:50</div>
                  </th>
                  <th className="py-2 px-1 text-center border border-black bg-[#F0D0E0] text-[#4A1525] min-w-[60px] uppercase font-bold text-[10px] tracking-wider">
                    <div>LEISURE</div>
                    <div className="text-[9px] font-semibold text-[#4A1525]/85">2:50 - 3:00</div>
                  </th>
                  <th className="py-2 px-2 text-center border border-black bg-[#993366] text-white min-w-[95px]">
                    <div className="font-bold">Period 6</div>
                    <div className="text-[10px] text-white/90 font-normal">3:00 - 3:55</div>
                  </th>
                  <th className="py-2 px-2 text-center border border-black bg-[#993366] text-white min-w-[95px]">
                    <div className="font-bold">Period 7</div>
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
                          className="p-2 border border-black align-middle text-center bg-white"
                        >
                          <div className="font-mono font-bold text-[#4A1525] text-xs leading-tight">
                            {placement.subjectCode}
                          </div>
                          <div className="text-[10px] text-black truncate mt-0.5 font-medium" title={placement.subjectName}>
                            {placement.subjectName}
                          </div>
                          <div className="text-[10px] font-mono text-neutral-700 font-semibold mt-1">
                            {placement.facultyName}
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td
                        key={period}
                        className="p-2 border border-black align-middle text-center text-neutral-400 font-mono text-xs bg-white"
                      >
                        —
                      </td>
                    );
                  };

                  return (
                    <tr key={day} className="border border-black">
                      <td className="py-3 px-3 font-mono font-bold text-white bg-[#993366] border border-black uppercase text-[11px] whitespace-nowrap text-center">
                        {day}
                      </td>

                      {renderPeriodCell(1)}
                      {renderPeriodCell(2)}

                      {/* Tea Break (#EFCDDE) */}
                      <td className="bg-[#EFCDDE] border border-black text-center align-middle p-1 text-[#4A1525] font-mono text-[9px] font-bold tracking-wider uppercase select-none">
                        Tea Break
                      </td>

                      {renderPeriodCell(3)}
                      {renderPeriodCell(4)}

                      {/* Lunch Break (#F0D0E0) */}
                      <td className="bg-[#F0D0E0] border border-black text-center align-middle p-1 text-[#4A1525] font-mono text-[9px] font-bold tracking-wider uppercase select-none">
                        Lunch Break
                      </td>

                      {renderPeriodCell(5)}

                      {/* Leisure Break (#F0D0E0) */}
                      <td className="bg-[#F0D0E0] border border-black text-center align-middle p-1 text-[#4A1525] font-mono text-[9px] font-bold tracking-wider uppercase select-none">
                        Leisure
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
              Table 1: Course & Faculty Allocation Registry
            </span>
            <span className="text-ink-muted">{courseSummary.length} Courses Allocated</span>
          </div>

          <div className="overflow-x-auto bg-white p-2 sm:p-4 rounded border border-black">
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-[#993366] text-white font-mono text-[11px] border border-black text-left">
                  <th className="py-2 px-3 font-bold border border-black bg-[#993366] text-white w-12 text-center">
                    Sl. No.
                  </th>
                  <th className="py-2 px-3 font-bold border border-black bg-[#993366] text-white w-28">
                    Course Code
                  </th>
                  <th className="py-2 px-3 font-bold border border-black bg-[#993366] text-white">
                    Course Name
                  </th>
                  <th className="py-2 px-3 font-bold border border-black bg-[#993366] text-white w-40">
                    Course Type
                  </th>
                  <th className="py-2 px-3 font-bold border border-black bg-[#993366] text-white">
                    Name of the Faculty Member
                  </th>
                  <th className="py-2 px-3 font-bold border border-black bg-[#993366] text-white text-center w-24">
                    Weekly Hours
                  </th>
                </tr>
              </thead>
              <tbody>
                {courseSummary.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-ink-muted italic border border-black">
                      No timetable placements found for this section.
                    </td>
                  </tr>
                ) : (
                  courseSummary.map((c, i) => (
                    <tr key={c.code} className="border border-black bg-white hover:bg-neutral-50">
                      <td className="py-2 px-3 font-mono text-center text-neutral-700 border border-black">
                        {i + 1}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-[#4A1525] border border-black">
                        {c.code}
                      </td>
                      <td className="py-2 px-3 font-medium text-black border border-black">
                        {c.name}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-neutral-800 border border-black">
                        {c.type}
                      </td>
                      <td className="py-2 px-3 font-semibold text-black border border-black">
                        {c.facultyList || 'Unassigned'}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-center text-[#4A1525] border border-black">
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
        <div className="pt-8 border-t border-border-beige grid grid-cols-3 gap-4 text-center text-xs font-mono text-ink">
          <div className="space-y-1">
            <div className="font-semibold text-ink">Department Coordinator</div>
            <div className="text-[10px] text-ink-light">Class Timetable In-charge</div>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-ink">Head of the Department</div>
            <div className="text-[10px] text-ink-light">Dept. of {departmentFullName}</div>
          </div>
          <div className="space-y-1">
            <div className="font-bold text-primary">Dr. Sudarshan Rao</div>
            <div className="text-[10px] text-ink-light">Dean (Academic Affairs)</div>
          </div>
        </div>
      </div>
    </div>
  );
};

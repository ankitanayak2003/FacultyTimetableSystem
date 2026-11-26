import React, { useState, useMemo, useRef } from 'react';
import {
  Users,
  Layers,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { DeptPlacement } from '../../data/workflowDemoData';
import { DownloadPdfButton } from '../common/DownloadPdfButton';
import { getTimetablePdfFilename } from '../../utils/timetablePdfExport';
import smvitmLogo from '../../assets/smvitm_logo.webp';
import sodeLogo from '../../assets/sode_group_logo.png';

const ACADEMIC_YEARS = ['2026–2027', '2025–2026', '2027–2028'];
const STUDENT_YEARS = ['Second Year', 'Third Year', 'Fourth Year'];
const SEMESTERS = ['Odd Semester', 'Even Semester'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const DeptTimetableViewer: React.FC = () => {
  const {
    departmentFaculty,
    deptTimetables,
    deptSubjects,
  } = useWorkflow();

  // Mode toggle: 'class-wise' | 'faculty-wise' | 'semester-wise'
  const [viewMode, setViewMode] = useState<'class-wise' | 'faculty-wise' | 'semester-wise'>('class-wise');

  // Class-wise Selectors
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026–2027');
  const [selectedSemester, setSelectedSemester] = useState('Odd Semester');
  const [selectedStudentYear, setSelectedStudentYear] = useState('Second Year');
  const [selectedSection, setSelectedSection] = useState('Section A');

  // Faculty-wise Selector
  const [selectedFacultyId, setSelectedFacultyId] = useState(
    departmentFaculty[0]?.id || 'dept-fac-1'
  );

  // Active timetable data for class-wise
  const timetableKey = `${selectedAcademicYear}_${selectedStudentYear}_${selectedSemester}_AIDS_${selectedSection}`;
  const currentTimetable = deptTimetables[timetableKey];
  const isPublished = currentTimetable ? currentTimetable.isPublished : false;
  const placements: DeptPlacement[] = currentTimetable?.placements || [];

  // Selected faculty record
  const selectedFaculty = useMemo(() => {
    return departmentFaculty.find((f) => f.id === selectedFacultyId) || departmentFaculty[0];
  }, [departmentFaculty, selectedFacultyId]);

  // Aggregate placements for selected faculty across ALL department sections
  const facultyWeeklyPlacements = useMemo(() => {
    if (!selectedFaculty) return [];
    const results: Array<DeptPlacement & { sectionName: string }> = [];

    // Check all timetables in context
    Object.entries(deptTimetables).forEach(([key, tt]) => {
      const parts = key.split('_');
      const secName = parts[parts.length - 1] || 'Sec';
      const yearName = parts[1] || '';
      (tt.placements || []).forEach((p) => {
        if (p.facultyName && p.facultyName.includes(selectedFaculty.name)) {
          results.push({
            ...p,
            sectionName: `${yearName.replace(' Year', '')} ${secName}`,
          });
        }
      });
    });

    return results;
  }, [selectedFaculty, deptTimetables, selectedAcademicYear, selectedStudentYear, selectedSemester]);

  // Table 1 Course Mapping calculation for Class-wise view
  const courseSummary = useMemo(() => {
    const map = new Map<
      string,
      { code: string; title: string; facultyName: string; type: string; hours: number }
    >();

    placements.forEach((p) => {
      const code = (p.subjectCode || '').trim();
      if (!code) return;
      const codeKey = code.toUpperCase();
      const existing = map.get(codeKey);
      const originalSubject = deptSubjects.find(
        (s) => (s.courseCode || '').trim().toUpperCase() === codeKey
      );
      const type = originalSubject?.type || 'Theory';

      if (!existing) {
        map.set(codeKey, {
          code,
          title: p.subjectTitle || originalSubject?.courseTitle || code,
          facultyName: p.facultyName || originalSubject?.assignedFaculty || 'Staff',
          type,
          hours: p.duration || 1,
        });
      } else {
        existing.hours += (p.duration || 1);
      }
    });

    return Array.from(map.values());
  }, [placements, deptSubjects]);

  const classTimetableRef = useRef<HTMLDivElement>(null);
  const facultyTimetableRef = useRef<HTMLDivElement>(null);
  const semesterTimetableRef = useRef<HTMLDivElement>(null);

  const activeTargetRef =
    viewMode === 'class-wise'
      ? classTimetableRef
      : viewMode === 'faculty-wise'
      ? facultyTimetableRef
      : semesterTimetableRef;

  const getDynamicFilename = () => {
    if (viewMode === 'class-wise') {
      return getTimetablePdfFilename({
        department: 'AIDS',
        studentYear: selectedStudentYear,
        semester: selectedSemester,
        section: selectedSection,
      });
    }
    if (viewMode === 'faculty-wise') {
      return `Class Timetable AIDS - ${selectedFaculty?.name || 'Faculty'}.pdf`;
    }
    return `Class Timetable AIDS - ${selectedSemester}.pdf`;
  };

  return (
    <div className="space-y-4 animate-fade-in text-ink">
      {/* Top Banner & Mode Toggle (Hidden on Print) */}
      <div className="p-3.5 sm:p-4 bg-surface rounded-card border border-border-beige shadow-crisp space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-border-beige">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Department Class &amp; Faculty Schedules
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                Official Department Timetables
              </span>
            </div>
            <h2 className="font-headline text-xl sm:text-2xl font-semibold text-primary">
              Timetable Viewer
            </h2>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              Examine finalized timetables across Class-wise VTU blueprints, Faculty-wise multi-section schedules, and Semester-wise section comparison views.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-card bg-canvas-muted p-1 border border-border-beige">
              <button
                type="button"
                onClick={() => setViewMode('class-wise')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                  viewMode === 'class-wise'
                    ? 'bg-primary text-white shadow-crisp-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Class-wise
              </button>
              <button
                type="button"
                onClick={() => setViewMode('faculty-wise')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                  viewMode === 'faculty-wise'
                    ? 'bg-primary text-white shadow-crisp-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Faculty-wise
              </button>
              <button
                type="button"
                onClick={() => setViewMode('semester-wise')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                  viewMode === 'semester-wise'
                    ? 'bg-primary text-white shadow-crisp-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                Semester Comparison
              </button>
            </div>

            <DownloadPdfButton
              targetRef={activeTargetRef}
              filename={getDynamicFilename}
              label="Download PDF"
            />
          </div>
        </div>

        {/* Dynamic Selectors depending on Mode */}
        {viewMode === 'class-wise' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-0.5">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
                Academic Year
              </label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
              >
                {ACADEMIC_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
                Semester Type
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
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
                Student Year
              </label>
              <select
                value={selectedStudentYear}
                onChange={(e) => setSelectedStudentYear(e.target.value)}
                className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
              >
                {STUDENT_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
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
                <option value="Section A">Section A</option>
                <option value="Section B">Section B</option>
              </select>
            </div>
          </div>
        )}

        {viewMode === 'faculty-wise' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
                Select Department Faculty Member
              </label>
              <select
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
              >
                {departmentFaculty.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} — {fac.designation} ({fac.empId})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3 pt-4 text-xs">
              <span className="text-ink-muted">
                Showing all teaching hours across department sections for <strong>{selectedFaculty?.name}</strong>.
              </span>
            </div>
          </div>
        )}

        {viewMode === 'semester-wise' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
                Academic Year
              </label>
              <select
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
                className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold"
              >
                {ACADEMIC_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
                Semester Type
              </label>
              <select
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold"
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
                Student Year
              </label>
              <select
                value={selectedStudentYear}
                onChange={(e) => setSelectedStudentYear(e.target.value)}
                className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold"
              >
                {STUDENT_YEARS.map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: CLASS-WISE TIMETABLE (Full VTU Blueprint)                         */}
      {/* ========================================================================= */}
      {viewMode === 'class-wise' && (
        <div ref={classTimetableRef} className="bg-white p-4 sm:p-6 rounded-card border border-border-beige shadow-crisp space-y-4 print:p-0 print:border-none print:shadow-none">
          {/* Institutional Header */}
          <div className="pb-3 border-b-2 border-primary space-y-1">
            <div className="flex items-center justify-between gap-4">
              <img
                src={smvitmLogo}
                alt="SMVITM Logo"
                className="h-14 sm:h-16 w-auto object-contain flex-shrink-0"
              />
              <div className="text-center flex-1 min-w-0">
                <div className="text-[10px] font-mono uppercase tracking-widest text-ink-light font-semibold">
                  SHRI SODE VADIRAJA MUTT EDUCATION TRUST (R)
                </div>
                <h2 className="font-headline font-bold text-base sm:text-lg text-[#530e21] tracking-wide uppercase leading-tight">
                  Shri Madhwa Vadiraja Institute of Technology &amp; Management
                </h2>
                <p className="text-[10px] text-ink-muted">
                  Vishwothama Nagar, Bantakal, Udupi – 574 115, Karnataka
                </p>
                <div className="pt-0.5">
                  <p className="text-xs sm:text-sm font-bold text-primary uppercase">
                    Department of Artificial Intelligence &amp; Data Science
                  </p>
                  <div className="inline-block mt-0.5 px-2.5 py-0.5 bg-canvas-muted rounded text-[10px] sm:text-[11px] font-mono font-semibold text-primary border border-border-subtle">
                    CLASS TIMETABLE — ACADEMIC YEAR {selectedAcademicYear} ({selectedSemester.toUpperCase()})
                  </div>
                </div>
              </div>
              <img
                src={sodeLogo}
                alt="Sode Group Logo"
                className="h-12 sm:h-14 w-auto object-contain flex-shrink-0"
              />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-ink-muted pt-1 border-t border-border-subtle/50">
              <span>Class: <strong>{selectedStudentYear}</strong></span>
              <span>•</span>
              <span>Section: <strong>{selectedSection}</strong></span>
              {(() => {
                const assignedRoom = placements.find((p) => p.room && p.room.trim() && p.room !== 'LH-201' && !p.room.toLowerCase().includes('provisional'))?.room;
                return assignedRoom ? (
                  <>
                    <span>•</span>
                    <span>Room: <strong>{assignedRoom}</strong></span>
                  </>
                ) : null;
              })()}
              <span>•</span>
              <span className="text-emerald-700 font-semibold">Official Timetable</span>
            </div>
          </div>

          {/* Status notice */}
          {!isPublished && (
            <div className="p-2 bg-amber-50 border border-amber-300 rounded text-xs text-amber-900 font-medium text-center print:hidden">
              ⚠️ Notice: This timetable is currently in <strong>DRAFT</strong> mode and has not yet been locked for public dissemination.
            </div>
          )}

          {/* Table 0: VTU Weekly Schedule Grid */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-black text-xs select-none">
              <thead>
                <tr className="bg-[#993366] text-white font-mono text-[11px] border border-black">
                  <th className="py-2 px-1.5 text-center font-bold border border-black bg-[#993366] text-white w-[84px] min-w-[80px] uppercase text-[10px]">
                    DAY/TIME
                  </th>
                  <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[88px]">
                    <div className="font-bold text-[10px]">I</div>
                    <div className="text-[8px] opacity-90 font-mono">9:00–9:55</div>
                  </th>
                  <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[88px]">
                    <div className="font-bold text-[10px]">II</div>
                    <div className="text-[8px] opacity-90 font-mono">9:55–10:50</div>
                  </th>
                  <th className="py-2 px-0.5 text-center font-bold border border-black bg-[#EFCDDE] text-black w-[42px] min-w-[40px] text-[9px] uppercase tracking-wider">
                    <div className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold text-center mx-auto tracking-widest uppercase text-black">
                      TEA BREAK
                    </div>
                  </th>
                  <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[88px]">
                    <div className="font-bold text-[10px]">III</div>
                    <div className="text-[8px] opacity-90 font-mono">11:10–12:05</div>
                  </th>
                  <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[88px]">
                    <div className="font-bold text-[10px]">IV</div>
                    <div className="text-[8px] opacity-90 font-mono">12:05–1:00</div>
                  </th>
                  <th className="py-2 px-0.5 text-center font-bold border border-black bg-[#EFCDDE] text-black w-[42px] min-w-[40px] text-[9px] uppercase tracking-wider">
                    <div className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold text-center mx-auto tracking-widest uppercase text-black">
                      LUNCH
                    </div>
                  </th>
                  <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[88px]">
                    <div className="font-bold text-[10px]">V</div>
                    <div className="text-[8px] opacity-90 font-mono">1:55–2:50</div>
                  </th>
                  <th className="py-2 px-0.5 text-center font-bold border border-black bg-[#EFCDDE] text-black w-[42px] min-w-[40px] text-[9px] uppercase tracking-wider">
                    <div className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold text-center mx-auto tracking-widest uppercase text-black">
                      LEISURE
                    </div>
                  </th>
                  <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[88px]">
                    <div className="font-bold text-[10px]">VI</div>
                    <div className="text-[8px] opacity-90 font-mono">3:00–3:55</div>
                  </th>
                  <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[88px]">
                    <div className="font-bold text-[10px]">VII</div>
                    <div className="text-[8px] opacity-90 font-mono">3:55–4:45</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => {
                  return (
                    <tr key={day} className="border border-black h-[52px]">
                      {/* Day Column */}
                      <td className="py-1 px-1.5 text-center font-bold font-mono text-[10px] uppercase border border-black bg-canvas-paper text-ink">
                        {day.substring(0, 3)}
                      </td>

                      {/* Period 1 */}
                      {renderGridCell(day, 1)}

                      {/* Period 2 */}
                      {renderGridCell(day, 2)}

                      {/* Tea Break */}
                      <td className="p-0 border border-black bg-[#EFCDDE] text-center" />

                      {/* Period 3 */}
                      {renderGridCell(day, 3)}

                      {/* Period 4 */}
                      {renderGridCell(day, 4)}

                      {/* Lunch Break */}
                      <td className="p-0 border border-black bg-[#EFCDDE] text-center" />

                      {/* Period 5 */}
                      {renderGridCell(day, 5)}

                      {/* Leisure Break */}
                      <td className="p-0 border border-black bg-[#EFCDDE] text-center" />

                      {/* Period 6 */}
                      {renderGridCell(day, 6)}

                      {/* Period 7 */}
                      {renderGridCell(day, 7)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table 1: Course and Faculty Mapping Table */}
          <div className="pt-2">
            <h4 className="font-headline font-bold text-xs uppercase tracking-wider text-primary mb-1">
              Table 1: Course &amp; Faculty Mapping
            </h4>
            <table className="w-full border-collapse border border-black text-xs text-left">
              <thead>
                <tr className="bg-[#993366] text-white font-mono text-[10px] border border-black">
                  <th className="py-1.5 px-2 border border-black w-10 text-center">SL</th>
                  <th className="py-1.5 px-2 border border-black w-24">COURSE CODE</th>
                  <th className="py-1.5 px-2 border border-black">COURSE TITLE</th>
                  <th className="py-1.5 px-2 border border-black">FACULTY IN-CHARGE</th>
                  <th className="py-1.5 px-2 border border-black w-28">TYPE</th>
                  <th className="py-1.5 px-2 border border-black w-16 text-center">HRS/WK</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black font-mono text-[11px]">
                {courseSummary.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-3 text-center text-ink-muted italic border border-black">
                      No eligible subjects added to this class timetable yet.
                    </td>
                  </tr>
                ) : (
                  courseSummary.map((item, idx) => (
                    <tr key={item.code} className="border border-black">
                      <td className="py-1 px-2 border border-black text-center">{idx + 1}</td>
                      <td className="py-1 px-2 border border-black font-bold text-primary">{item.code}</td>
                      <td className="py-1 px-2 border border-black font-sans font-medium text-ink">{item.title}</td>
                      <td className="py-1 px-2 border border-black font-sans">{item.facultyName}</td>
                      <td className="py-1 px-2 border border-black text-ink-muted">{item.type}</td>
                      <td className="py-1 px-2 border border-black text-center font-bold">{item.hours}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Signatures Footer */}
          <div className="grid grid-cols-3 gap-4 pt-8 text-center text-xs font-semibold text-ink border-t border-border-subtle mt-4">
            <div>
              <span className="block font-bold">Prof. Rajesh Shetty</span>
              <span className="text-[10px] text-ink-muted">Timetable Coordinator</span>
            </div>
            <div>
              <span className="block font-bold">Dr. Vasudeva</span>
              <span className="text-[10px] text-ink-muted">Head of Department (AIDS)</span>
            </div>
            <div>
              <span className="block font-bold">Dr. Thirumaleshwara Bhat</span>
              <span className="text-[10px] text-ink-muted">Principal, SMVITM</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: FACULTY-WISE TIMETABLE                                            */}
      {/* ========================================================================= */}
      {viewMode === 'faculty-wise' && selectedFaculty && (
        <div ref={facultyTimetableRef} className="space-y-4 bg-white p-4 rounded-card">
          {/* Faculty Header Card */}
          <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h3 className="font-headline text-lg font-bold text-primary">
                  {selectedFaculty.name}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-primary-subtle text-primary">
                  {selectedFaculty.empId}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-canvas-muted text-ink-muted">
                  {selectedFaculty.designation}
                </span>
              </div>
              <p className="text-xs text-ink-muted mt-1">
                Institutional Email: <span className="font-mono text-ink">{selectedFaculty.email}</span> • Teaching Scope: {selectedFaculty.eligibleYears.join(', ')}
              </p>
            </div>

            {/* Workload metric pill */}
            <div className="flex items-center gap-3 text-xs bg-canvas-paper px-3 py-2 rounded border border-border-beige">
              <div>
                <span className="text-[10px] text-ink-light block font-mono uppercase">Assigned Dept Load</span>
                <span className="font-bold text-primary font-mono text-sm">
                  {selectedFaculty.theoryHours + selectedFaculty.labHours} hrs/wk
                </span>
              </div>
              <div className="border-l border-border-beige pl-3">
                <span className="text-[10px] text-ink-light block font-mono uppercase">Basic Science</span>
                <span className="font-bold text-purple-900 font-mono text-sm">
                  {selectedFaculty.basicScienceHours} hrs/wk
                </span>
              </div>
              <div className="border-l border-border-beige pl-3">
                <span className="text-[10px] text-ink-light block font-mono uppercase">Max Quota</span>
                <span className="font-bold text-ink font-mono text-sm">
                  {selectedFaculty.maxHours} hrs/wk
                </span>
              </div>
            </div>
          </div>

          {/* Weekly Faculty Grid */}
          <div className="bg-white p-3.5 sm:p-5 rounded-card border border-border-beige shadow-crisp overflow-x-auto">
            <h4 className="font-headline font-semibold text-xs text-primary uppercase tracking-wider mb-2">
              Weekly Teaching &amp; Laboratory Engagements
            </h4>
            <table className="w-full border-collapse border border-black text-xs">
              <thead>
                <tr className="bg-[#993366] text-white font-mono text-[11px] border border-black">
                  <th className="py-2 px-2 border border-black w-20 text-center">DAY</th>
                  <th className="py-2 px-1 border border-black text-center min-w-[80px]">P1 (9:00)</th>
                  <th className="py-2 px-1 border border-black text-center min-w-[80px]">P2 (9:55)</th>
                  <th className="py-2 px-0.5 border border-black bg-[#EFCDDE] text-black w-8 text-[8px] font-bold">TEA</th>
                  <th className="py-2 px-1 border border-black text-center min-w-[80px]">P3 (11:10)</th>
                  <th className="py-2 px-1 border border-black text-center min-w-[80px]">P4 (12:05)</th>
                  <th className="py-2 px-0.5 border border-black bg-[#EFCDDE] text-black w-8 text-[8px] font-bold">LUNCH</th>
                  <th className="py-2 px-1 border border-black text-center min-w-[80px]">P5 (1:55)</th>
                  <th className="py-2 px-0.5 border border-black bg-[#EFCDDE] text-black w-8 text-[8px] font-bold">LEISURE</th>
                  <th className="py-2 px-1 border border-black text-center min-w-[80px]">P6 (3:00)</th>
                  <th className="py-2 px-1 border border-black text-center min-w-[80px]">P7 (3:55)</th>
                </tr>
              </thead>
              <tbody>
                {DAYS.map((day) => (
                  <tr key={day} className="border border-black h-[50px]">
                    <td className="py-1 px-2 border border-black font-bold font-mono text-[10px] text-center bg-canvas-paper">
                      {day.substring(0, 3)}
                    </td>
                    {[1, 2].map((p) => renderFacultySlot(day, p))}
                    <td className="p-0 border border-black bg-[#EFCDDE]" />
                    {[3, 4].map((p) => renderFacultySlot(day, p))}
                    <td className="p-0 border border-black bg-[#EFCDDE]" />
                    {[5].map((p) => renderFacultySlot(day, p))}
                    <td className="p-0 border border-black bg-[#EFCDDE]" />
                    {[6, 7].map((p) => renderFacultySlot(day, p))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: SEMESTER-WISE COMPARISON (Section A vs Section B)                 */}
      {/* ========================================================================= */}
      {viewMode === 'semester-wise' && (
        <div ref={semesterTimetableRef} className="space-y-4 bg-white p-4 rounded-card">
          <div className="p-3 bg-canvas-muted rounded-card border border-border-beige text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>
                Comparative view of parallel sections for <strong>{selectedStudentYear}</strong> ({selectedSemester}). Use this to audit load distribution, avoid faculty conflicts, and synchronize lab schedules.
              </span>
            </div>
            <span className="font-mono text-[10px] font-semibold text-primary">
              Section A &amp; Section B Parallel Review
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Section A Column */}
            <div className="p-3.5 bg-surface rounded-card border border-border-beige shadow-crisp space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-border-beige">
                <h4 className="font-headline font-bold text-sm text-primary">
                  AIDS — Section A
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold">
                  Published Schedule
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-black text-[10px]">
                  <thead>
                    <tr className="bg-[#993366] text-white font-mono">
                      <th className="p-1 border border-black">Day</th>
                      <th className="p-1 border border-black">P1</th>
                      <th className="p-1 border border-black">P2</th>
                      <th className="p-1 border border-black">P3</th>
                      <th className="p-1 border border-black">P4</th>
                      <th className="p-1 border border-black">P5</th>
                      <th className="p-1 border border-black">P6</th>
                      <th className="p-1 border border-black">P7</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.slice(0, 5).map((d) => (
                      <tr key={d} className="border border-black h-8 text-center">
                        <td className="p-1 font-bold border border-black bg-canvas-paper">{d.slice(0, 3)}</td>
                        {[1, 2, 3, 4, 5, 6, 7].map((p) => {
                          const pl = (deptTimetables['2026–2027_Second Year_Odd Semester_AIDS_Section A']?.placements || []).find(
                            (x: DeptPlacement) => x.day === d && p >= x.startPeriod && p < x.startPeriod + x.duration
                          );
                          return (
                            <td key={p} className="p-0.5 border border-black">
                              {pl ? (
                                <div className="leading-tight">
                                  <strong className="text-primary">{pl.subjectCode}</strong>
                                  <span className="block text-[8px] text-ink-muted truncate max-w-[65px]">{pl.facultyName.split(' ').pop()}</span>
                                </div>
                              ) : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section B Column */}
            <div className="p-3.5 bg-surface rounded-card border border-border-beige shadow-crisp space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-border-beige">
                <h4 className="font-headline font-bold text-sm text-primary">
                  AIDS — Section B
                </h4>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold">
                  Published Schedule
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-black text-[10px]">
                  <thead>
                    <tr className="bg-[#993366] text-white font-mono">
                      <th className="p-1 border border-black">Day</th>
                      <th className="p-1 border border-black">P1</th>
                      <th className="p-1 border border-black">P2</th>
                      <th className="p-1 border border-black">P3</th>
                      <th className="p-1 border border-black">P4</th>
                      <th className="p-1 border border-black">P5</th>
                      <th className="p-1 border border-black">P6</th>
                      <th className="p-1 border border-black">P7</th>
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.slice(0, 5).map((d) => (
                      <tr key={d} className="border border-black h-8 text-center">
                        <td className="p-1 font-bold border border-black bg-canvas-paper">{d.slice(0, 3)}</td>
                        {[1, 2, 3, 4, 5, 6, 7].map((p) => {
                          const pl = (deptTimetables['2026–2027_Second Year_Odd Semester_AIDS_Section B']?.placements || []).find(
                            (x: DeptPlacement) => x.day === d && p >= x.startPeriod && p < x.startPeriod + x.duration
                          );
                          return (
                            <td key={p} className="p-0.5 border border-black">
                              {pl ? (
                                <div className="leading-tight">
                                  <strong className="text-primary">{pl.subjectCode}</strong>
                                  <span className="block text-[8px] text-ink-muted truncate max-w-[65px]">{pl.facultyName.split(' ').pop()}</span>
                                </div>
                              ) : '—'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper to render grid cell for Class-wise table
  function renderGridCell(day: (typeof DAYS)[number], period: number) {
    const placement = placements.find(
      (p) => p.day === day && period >= p.startPeriod && period < p.startPeriod + p.duration
    );

    if (placement && placement.startPeriod !== period) {
      return null;
    }

    const colSpan = placement ? placement.duration : 1;

    if (placement) {
      return (
        <td
          key={`${day}-${period}`}
          colSpan={colSpan}
          className={`p-1 border border-black text-center align-middle ${
            placement.isLockedSlot ? 'bg-amber-50/70' : 'bg-white'
          }`}
        >
          <div className="flex flex-col items-center justify-center p-0.5 min-h-[44px]">
            <span className="font-mono font-bold text-primary text-[10px] leading-tight block">
              {placement.subjectCode}
            </span>
            <span className="text-[9px] text-ink font-semibold truncate max-w-[120px] block leading-tight">
              {placement.subjectTitle}
            </span>
            <span className="text-[8px] text-ink-muted font-mono truncate max-w-[120px] block leading-tight">
              {placement.facultyName} • {placement.room}
            </span>
          </div>
        </td>
      );
    }

    return (
      <td key={`${day}-${period}`} className="p-1 border border-black text-center align-middle bg-white">
        <span className="text-[10px] text-ink-light/50">—</span>
      </td>
    );
  }

  // Helper to render faculty slot
  function renderFacultySlot(day: (typeof DAYS)[number], period: number) {
    const item = facultyWeeklyPlacements.find(
      (p) => p.day === day && period >= p.startPeriod && period < p.startPeriod + p.duration
    );

    return (
      <td key={`${day}-${period}`} className="p-1 border border-black text-center align-middle bg-white min-w-[80px]">
        {item ? (
          <div className="p-0.5">
            <span className="font-mono font-bold text-primary text-[10px] block leading-tight">
              {item.subjectCode}
            </span>
            <span className="text-[9px] font-semibold text-emerald-800 bg-emerald-50 px-1 rounded block truncate">
              {item.sectionName}
            </span>
            <span className="text-[8px] text-ink-muted font-mono block">
              {item.room}
            </span>
          </div>
        ) : (
          <span className="text-[10px] text-ink-light/40">—</span>
        )}
      </td>
    );
  }
};

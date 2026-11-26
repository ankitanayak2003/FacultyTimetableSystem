import React, { useState, useMemo, useRef } from 'react';
import {
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BookOpen,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { DownloadPdfButton } from '../common/DownloadPdfButton';
import { getTimetablePdfFilename } from '../../utils/timetablePdfExport';
import smvitmLogo from '../../assets/smvitm_logo.webp';
import sodeLogo from '../../assets/sode_group_logo.png';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

interface UnifiedFacultyScheduleSlot {
  id: string;
  day: (typeof DAYS)[number];
  startPeriod: number;
  duration: number;
  subjectCode: string;
  subjectTitle: string;
  section: string;
  room: string;
  category: 'Department' | 'Basic Science' | 'Institutional';
}

export const HODDepartmentTimetableView: React.FC = () => {
  const {
    deptTimetables,
    cycleTimetables,
    deanTimetables,
    departmentFaculty,
    deptSubjects,
  } = useWorkflow();

  // Mode: Class-wise vs Faculty-wise
  const [viewMode, setViewMode] = useState<'class-wise' | 'faculty-wise'>('class-wise');
  const classTimetableRef = useRef<HTMLDivElement>(null);
  const facultyTimetableRef = useRef<HTMLDivElement>(null);

  // Class-wise state
  const [selectedYear, setSelectedYear] = useState<'Second Year' | 'Third Year' | 'Final Year'>('Second Year');
  const [selectedSection, setSelectedSection] = useState<'Section A' | 'Section B'>('Section A');

  // Faculty-wise state
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>(
    departmentFaculty[0]?.id || 'dept-fac-1'
  );

  // Available sections based on selected year
  const availableSections = useMemo((): string[] => {
    if (selectedYear === 'Second Year') {
      return ['Section A', 'Section B'];
    }
    return ['Section A'];
  }, [selectedYear]);

  // Adjust section if switched to Year 3 or 4
  const activeSection = availableSections.includes(selectedSection)
    ? selectedSection
    : 'Section A';

  // Construct key to find timetable in deptTimetables
  const timetableKey = `2026–2027_${selectedYear}_Odd Semester_AIDS_${activeSection}`;
  const currentTimetable = deptTimetables[timetableKey];

  // Selected faculty object for faculty-wise view
  const currentFaculty = useMemo(() => {
    return (
      departmentFaculty.find((f) => f.id === selectedFacultyId) ||
      departmentFaculty[0]
    );
  }, [departmentFaculty, selectedFacultyId]);

  // Metadata for the active class
  const classMetadata = useMemo(() => {
    let advisor = 'Dr. Ananya Rao';
    let room = '';
    let semesterCode = '3rd Semester';

    if (selectedYear === 'Second Year') {
      semesterCode = '3rd Semester';
      if (activeSection === 'Section B') {
        advisor = 'Prof. Sneha Kamath';
      }
    } else if (selectedYear === 'Third Year') {
      semesterCode = '5th Semester';
      advisor = 'Prof. Rajesh Shetty';
    } else {
      semesterCode = '7th Semester';
      advisor = 'Dr. Vasudeva';
    }

    if (currentTimetable?.placements) {
      const assigned = currentTimetable.placements.find(
        (p) => p.room && p.room.trim() && !p.room.startsWith('LH-20') && p.room !== 'LH-201' && !p.room.toLowerCase().includes('provisional')
      );
      if (assigned && assigned.room) {
        room = assigned.room.trim();
      }
    }

    return {
      department: 'Artificial Intelligence & Data Science',
      academicYear: '2026–2027',
      semester: semesterCode,
      studentYear: selectedYear,
      section: activeSection,
      advisor,
      room,
    };
  }, [selectedYear, activeSection, currentTimetable]);

  // Subjects belonging to this class (derived strictly from active timetable placements)
  const classSubjects = useMemo(() => {
    if (!currentTimetable?.placements || currentTimetable.placements.length === 0) {
      return [];
    }

    const map = new Map<string, {
      id: string;
      courseCode: string;
      courseTitle: string;
      type: string;
      venue: string;
      assignedFaculty: string;
      hoursPerWeek: number;
    }>();

    currentTimetable.placements.forEach((p) => {
      const code = (p.subjectCode || '').trim();
      if (!code) return;
      const codeKey = code.toUpperCase();
      const matched = deptSubjects.find(
        (s) => (s.courseCode || '').trim().toUpperCase() === codeKey || s.courseTitle === p.subjectTitle
      );

      const existing = map.get(codeKey);
      if (!existing) {
        map.set(codeKey, {
          id: matched?.id || p.id,
          courseCode: code,
          courseTitle: matched?.courseTitle || p.subjectTitle || code,
          type: matched?.type || (p.isLockedSlot ? 'Institutional' : 'Core'),
          venue: matched?.venue || p.room || classMetadata.room,
          assignedFaculty: p.facultyName || matched?.assignedFaculty || 'Staff',
          hoursPerWeek: p.duration || 1,
        });
      } else {
        existing.hoursPerWeek += (p.duration || 1);
        if (p.facultyName && !existing.assignedFaculty.includes(p.facultyName)) {
          existing.assignedFaculty += `, ${p.facultyName}`;
        }
      }
    });

    return Array.from(map.values());
  }, [currentTimetable, deptSubjects, classMetadata.room]);

  // Unified Faculty Schedule aggregator (Mode B)
  const facultySlots = useMemo(() => {
    if (!currentFaculty) return [];
    const facultyName = currentFaculty.name;
    const slots: UnifiedFacultyScheduleSlot[] = [];

    // 1. Department Timetables (both published and drafts for HOD visibility)
    Object.entries(deptTimetables).forEach(([, tt]) => {
      if (tt && tt.placements) {
        tt.placements.forEach((p) => {
          if (p.facultyName && p.facultyName.includes(facultyName)) {
            slots.push({
              id: `dept-${p.id}`,
              day: p.day as (typeof DAYS)[number],
              startPeriod: p.startPeriod,
              duration: p.duration,
              subjectCode: p.subjectCode,
              subjectTitle: p.subjectTitle,
              section: `${tt.studentYear.replace(' Year', '')} Sem - ${tt.section}`,
              room: (p.room && p.room.trim() && p.room !== 'LH-201' && !p.room.toLowerCase().includes('provisional')) ? p.room : '',
              category: 'Department',
            });
          }
        });
      }
    });

    // 2. Basic Science Cycle Timetables
    Object.entries(cycleTimetables).forEach(([, ct]) => {
      if (ct && ct.placements) {
        ct.placements.forEach((p) => {
          if (p.facultyName && p.facultyName.includes(facultyName)) {
            slots.push({
              id: `bs-${p.id}`,
              day: p.day as (typeof DAYS)[number],
              startPeriod: p.startPeriod,
              duration: p.duration,
              subjectCode: p.subjectCode,
              subjectTitle: p.subjectName,
              section: `1st Yr (${ct.cycle} - ${ct.section})`,
              room: (p.room && p.room !== 'AB-101' && p.room !== 'AB-103' && !p.room.toLowerCase().includes('provisional')) ? p.room : '',
              category: 'Basic Science',
            });
          }
        });
      }
    });

    // 3. Dean Institutional Timetables
    Object.entries(deanTimetables).forEach(([, dt]) => {
      if (dt && dt.placements) {
        dt.placements.forEach((p) => {
          if (p.facultyName && p.facultyName.includes(facultyName)) {
            slots.push({
              id: `dean-${p.id}`,
              day: p.day as (typeof DAYS)[number],
              startPeriod: p.startPeriod,
              duration: p.duration,
              subjectCode: p.subjectCode,
              subjectTitle: p.subjectName,
              section: `Inst (${dt.section})`,
              room: (p.room && p.room !== 'Auditorium' && !p.room.toLowerCase().includes('provisional')) ? p.room : '',
              category: 'Institutional',
            });
          }
        });
      }
    });

    return slots;
  }, [currentFaculty, deptTimetables, cycleTimetables, deanTimetables]);

  // Total teaching contact hours for selected faculty
  const facultyTotalTeachingHours = useMemo(() => {
    return facultySlots.reduce((acc, slot) => acc + slot.duration, 0);
  }, [facultySlots]);

  return (
    <div className="space-y-4 animate-fade-in text-ink">
      {/* Top Controls Header */}
      <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                HOD Oversight • Department of AI &amp; DS
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary border border-primary/20 font-semibold">
                Table 0 VTU Standard
              </span>
            </div>
            <h2 className="font-headline text-xl sm:text-2xl font-bold text-primary">
              Department Timetable
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Comprehensive institutional timetable oversight for all academic years and faculty teaching schedules.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-card border border-border-subtle p-0.5 bg-canvas-muted">
              <button
                type="button"
                onClick={() => setViewMode('class-wise')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                  viewMode === 'class-wise'
                    ? 'bg-primary text-white shadow-crisp'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Class-wise</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('faculty-wise')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                  viewMode === 'faculty-wise'
                    ? 'bg-primary text-white shadow-crisp'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Faculty-wise</span>
              </button>
            </div>

            {/* Download PDF Button */}
            <DownloadPdfButton
              targetRef={viewMode === 'class-wise' ? classTimetableRef : facultyTimetableRef}
              filename={() =>
                viewMode === 'class-wise'
                  ? getTimetablePdfFilename({
                      department: 'AIDS',
                      studentYear: selectedYear,
                      semester: classMetadata.semester,
                      section: activeSection,
                    })
                  : `Class Timetable AIDS - ${currentFaculty?.name || 'Faculty'}.pdf`
              }
              label="Download PDF"
            />
          </div>
        </div>
      </div>

      {/* MODE A: CLASS-WISE TIMETABLE */}
      {viewMode === 'class-wise' && (
        <div className="space-y-4">
          {/* Class Selectors Bar */}
          <div className="bg-surface rounded-card border border-border-beige p-3 shadow-crisp-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Year Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-ink-muted font-medium text-[11px]">Academic Year:</span>
                <select
                  aria-label="Filter by Academic Year"
                  value={selectedYear}
                  onChange={(e) => {
                    const y = e.target.value as 'Second Year' | 'Third Year' | 'Final Year';
                    setSelectedYear(y);
                    setSelectedSection('Section A');
                  }}
                  className="bg-white border border-border-beige rounded px-2.5 py-1 text-xs font-semibold text-ink focus:outline-hidden focus:border-primary"
                >
                  <option value="Second Year">2nd Year (3rd Sem)</option>
                  <option value="Third Year">3rd Year (5th Sem)</option>
                  <option value="Final Year">4th Year (7th Sem)</option>
                </select>
              </div>

              {/* Section Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-ink-muted font-medium text-[11px]">Section:</span>
                <div className="inline-flex rounded border border-border-subtle p-0.5 bg-canvas-muted">
                  {availableSections.map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setSelectedSection(sec as 'Section A' | 'Section B')}
                      className={`px-2.5 py-0.5 rounded text-xs font-semibold transition-all ${
                        activeSection === sec
                          ? 'bg-primary text-white shadow-crisp-sm'
                          : 'text-ink-muted hover:text-ink'
                      }`}
                    >
                      {sec}
                    </button>
                  ))}
                </div>
              </div>

              {/* Semester Cycle Badge */}
              <span className="px-2 py-0.5 rounded bg-canvas-muted text-ink-light text-[11px] font-mono border border-border-subtle">
                Odd Sem 2026–27
              </span>
            </div>

            {/* Timetable Status Badge */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-ink-muted font-mono">Status:</span>
              {currentTimetable?.isPublished ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Published
                </span>
              ) : currentTimetable && !currentTimetable.isDraft ? (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-purple-50 text-purple-800 border border-purple-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-purple-600" />
                  Approved by HOD
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-600" />
                  Draft / In Progress
                </span>
              )}
            </div>
          </div>

          {/* Timetable Details Header */}
          <div className="bg-surface rounded-card border border-border-beige p-3 shadow-crisp-sm">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-canvas-paper rounded border border-border-subtle">
                <span className="text-[10px] font-mono text-ink-light block uppercase">Class / Section</span>
                <span className="font-semibold text-ink text-xs">{classMetadata.studentYear} — {classMetadata.section}</span>
              </div>
              <div className="p-2 bg-canvas-paper rounded border border-border-subtle">
                <span className="text-[10px] font-mono text-ink-light block uppercase">Semester</span>
                <span className="font-semibold text-ink text-xs">{classMetadata.semester} (Odd 2026–27)</span>
              </div>
              <div className="p-2 bg-canvas-paper rounded border border-border-subtle">
                <span className="text-[10px] font-mono text-ink-light block uppercase">Class Advisor</span>
                <span className="font-semibold text-primary text-xs">{classMetadata.advisor}</span>
              </div>
              {classMetadata.room && (
                <div className="p-2 bg-canvas-paper rounded border border-border-subtle">
                  <span className="text-[10px] font-mono text-ink-light block uppercase">Lecture Hall</span>
                  <span className="font-semibold text-ink text-xs">{classMetadata.room} (Academic Block)</span>
                </div>
              )}
            </div>
          </div>

          {/* Table 0 VTU Grid Container */}
          <div
            ref={classTimetableRef}
            className="bg-white p-3 sm:p-5 rounded-card border border-border-beige shadow-crisp overflow-hidden print:p-0 print:border-none print:shadow-none space-y-3"
          >
            {/* Document Institutional Header with Logos */}
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
                      Department of Artificial Intelligence &amp; Data Science — Class Timetable
                    </p>
                    <div className="inline-block mt-0.5 px-2.5 py-0.5 bg-canvas-muted rounded text-[10px] sm:text-[11px] font-mono font-semibold text-primary border border-border-subtle">
                      CLASS TIMETABLE — {classMetadata.studentYear.toUpperCase()} ({classMetadata.semester.toUpperCase()})
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
                <span>Class: <strong>{classMetadata.studentYear}</strong></span>
                <span>•</span>
                <span>Section: <strong>{classMetadata.section}</strong></span>
                {classMetadata.room && (
                  <>
                    <span>•</span>
                    <span>Room: <strong>{classMetadata.room}</strong></span>
                  </>
                )}
                <span>•</span>
                <span>Advisor: <strong>{classMetadata.advisor}</strong></span>
              </div>
            </div>

            {/* Table 0 Grid */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-xs select-none">
                <thead>
                  <tr className="bg-[#993366] text-white font-mono text-[11px] border border-black">
                    <th className="py-2 px-1 text-center font-bold border border-black bg-[#993366] text-white w-[80px] min-w-[75px] uppercase text-[10px]">
                      DAY/TIME
                    </th>
                    <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[85px]">
                      <div className="font-bold text-[10px]">I</div>
                      <div className="text-[8px] opacity-90 font-mono">9:00–9:55</div>
                    </th>
                    <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[85px]">
                      <div className="font-bold text-[10px]">II</div>
                      <div className="text-[8px] opacity-90 font-mono">9:55–10:50</div>
                    </th>
                    <th className="py-2 px-0.5 text-center font-bold border border-black bg-[#EFCDDE] text-black w-[40px] min-w-[38px] text-[9px] uppercase tracking-wider">
                      <div className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold text-center mx-auto tracking-widest uppercase text-black">
                        TEA BREAK
                      </div>
                    </th>
                    <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[85px]">
                      <div className="font-bold text-[10px]">III</div>
                      <div className="text-[8px] opacity-90 font-mono">11:10–12:05</div>
                    </th>
                    <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[85px]">
                      <div className="font-bold text-[10px]">IV</div>
                      <div className="text-[8px] opacity-90 font-mono">12:05–1:00</div>
                    </th>
                    <th className="py-2 px-0.5 text-center font-bold border border-black bg-[#EFCDDE] text-black w-[40px] min-w-[38px] text-[9px] uppercase tracking-wider">
                      <div className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold text-center mx-auto tracking-widest uppercase text-black">
                        LUNCH
                      </div>
                    </th>
                    <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[85px]">
                      <div className="font-bold text-[10px]">V</div>
                      <div className="text-[8px] opacity-90 font-mono">1:55–2:50</div>
                    </th>
                    <th className="py-2 px-0.5 text-center font-bold border border-black bg-[#EFCDDE] text-black w-[40px] min-w-[38px] text-[9px] uppercase tracking-wider">
                      <div className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold text-center mx-auto tracking-widest uppercase text-black">
                        LEISURE
                      </div>
                    </th>
                    <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[85px]">
                      <div className="font-bold text-[10px]">VI</div>
                      <div className="text-[8px] opacity-90 font-mono">3:00–3:55</div>
                    </th>
                    <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[85px]">
                      <div className="font-bold text-[10px]">VII</div>
                      <div className="text-[8px] opacity-90 font-mono">3:55–4:45</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => {
                    const placementsForDay = currentTimetable?.placements?.filter((p) => p.day === day) || [];

                    const renderClassPeriodCell = (period: number) => {
                      // Check if covered by a previous multi-period slot
                      const coveredByPrev = placementsForDay.find(
                        (p) => p.startPeriod < period && p.startPeriod + p.duration > period
                      );
                      if (coveredByPrev) return null;

                      const placement = placementsForDay.find((p) => p.startPeriod === period);
                      const colSpan = placement ? placement.duration : 1;

                      if (placement) {
                        const isInstitutional =
                          placement.subjectCode === 'NSS-YRC' ||
                          placement.subjectCode === 'OPEN-EL' ||
                          placement.subjectCode === 'TPO-TRN';

                        return (
                          <td
                            key={period}
                            colSpan={colSpan}
                            className={`p-1.5 text-center border border-black align-middle h-[52px] ${
                              isInstitutional
                                ? 'bg-amber-50/70 border-amber-300'
                                : 'bg-white hover:bg-canvas-muted/20'
                            }`}
                          >
                            <div className="flex flex-col items-center justify-center leading-tight">
                              <span className="font-bold font-mono text-[10px] text-primary">
                                {placement.subjectCode}
                              </span>
                              <span className="text-[9px] font-medium text-ink line-clamp-1 max-w-[140px]">
                                {placement.subjectTitle}
                              </span>
                              <span className="text-[8px] text-ink-muted line-clamp-1 max-w-[140px]">
                                {placement.facultyName}
                              </span>
                              {placement.room && placement.room.trim() && !placement.room.startsWith('LH-20') && !placement.room.toLowerCase().includes('provisional') && (
                                <span className="text-[8px] font-mono text-ink-light">
                                  [{placement.room}]
                                </span>
                              )}
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
                      <tr key={day} className="border border-black h-[52px]">
                        {/* Day Column */}
                        <td className="py-1 px-1 text-center font-bold font-mono text-[10px] uppercase border border-black bg-canvas-paper text-ink">
                          {day.substring(0, 3)}
                        </td>

                        {/* Period I & II */}
                        {renderClassPeriodCell(1)}
                        {renderClassPeriodCell(2)}

                        {/* TEA BREAK (Rendered once on Monday with rowSpan 6) */}
                        {day === 'Monday' && (
                          <td
                            rowSpan={6}
                            className="p-0 border border-black bg-[#EFCDDE] text-black text-center align-middle w-[40px] select-none"
                          >
                            <div className="[writing-mode:vertical-rl] rotate-180 text-[9px] font-bold text-center mx-auto tracking-widest uppercase text-black py-4">
                              TEA BREAK (10:50–11:10)
                            </div>
                          </td>
                        )}

                        {/* Period III & IV */}
                        {renderClassPeriodCell(3)}
                        {renderClassPeriodCell(4)}

                        {/* LUNCH BREAK (Rendered once on Monday with rowSpan 6) */}
                        {day === 'Monday' && (
                          <td
                            rowSpan={6}
                            className="p-0 border border-black bg-[#EFCDDE] text-black text-center align-middle w-[40px] select-none"
                          >
                            <div className="[writing-mode:vertical-rl] rotate-180 text-[9px] font-bold text-center mx-auto tracking-widest uppercase text-black py-4">
                              LUNCH BREAK (1:00–1:55)
                            </div>
                          </td>
                        )}

                        {/* Period V */}
                        {renderClassPeriodCell(5)}

                        {/* LEISURE BREAK (Rendered once on Monday with rowSpan 6) */}
                        {day === 'Monday' && (
                          <td
                            rowSpan={6}
                            className="p-0 border border-black bg-[#EFCDDE] text-black text-center align-middle w-[40px] select-none"
                          >
                            <div className="[writing-mode:vertical-rl] rotate-180 text-[9px] font-bold text-center mx-auto tracking-widest uppercase text-black py-4">
                              BREAK (2:50–3:00)
                            </div>
                          </td>
                        )}

                        {/* Period VI & VII */}
                        {renderClassPeriodCell(6)}
                        {renderClassPeriodCell(7)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Subject Allocation Roster Table */}
            <div className="pt-2">
              <div className="flex items-center gap-1.5 mb-2">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <h4 className="font-headline text-xs font-semibold text-primary">
                  Course &amp; Faculty Allocation Roster — {classMetadata.semester} ({classMetadata.section})
                </h4>
              </div>

              <div className="overflow-x-auto border border-border-beige rounded">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-canvas-paper border-b border-border-subtle text-[10px] font-mono uppercase text-ink-light">
                      <th className="p-2">Course Code</th>
                      <th className="p-2">Course Title</th>
                      <th className="p-2">Category</th>
                      <th className="p-2">Venue</th>
                      <th className="p-2">Assigned Faculty</th>
                      <th className="p-2 text-right">Hrs/Wk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {classSubjects.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-3 text-center text-ink-muted italic">
                          No eligible subjects added to this class timetable yet.
                        </td>
                      </tr>
                    ) : (
                      classSubjects.map((sub) => (
                        <tr key={sub.id} className="hover:bg-canvas-muted/20">
                          <td className="p-2 font-mono font-semibold text-primary text-[11px]">
                            {sub.courseCode}
                          </td>
                          <td className="p-2 font-medium text-ink">{sub.courseTitle}</td>
                          <td className="p-2 text-ink-muted text-[11px]">{sub.type}</td>
                          <td className="p-2 font-mono text-[11px] text-ink-light">
                            {sub.venue && !sub.venue.startsWith('LH-20') && !sub.venue.toLowerCase().includes('provisional') ? sub.venue : (classMetadata.room || '—')}
                          </td>
                          <td className="p-2 text-ink font-semibold">
                            {sub.assignedFaculty || 'Prof. Rajesh Shetty'}
                          </td>
                          <td className="p-2 text-right font-mono font-semibold text-ink">
                            {sub.hoursPerWeek}h
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODE B: FACULTY-WISE TIMETABLE */}
      {viewMode === 'faculty-wise' && (
        <div className="space-y-4">
          {/* Faculty Selector Bar */}
          <div className="bg-surface rounded-card border border-border-beige p-3 shadow-crisp-sm flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-ink-muted font-medium text-[11px]">Select Faculty Member:</span>
              <select
                aria-label="Select Faculty Member"
                value={selectedFacultyId}
                onChange={(e) => setSelectedFacultyId(e.target.value)}
                className="bg-white border border-border-beige rounded px-3 py-1.5 text-xs font-semibold text-ink focus:outline-hidden focus:border-primary min-w-[240px]"
              >
                {departmentFaculty.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} ({fac.designation})
                  </option>
                ))}
              </select>
            </div>

            {/* Load compliance indicator */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-ink-muted font-mono">Workload Status:</span>
              {(() => {
                const total = facultyTotalTeachingHours;
                const min = currentFaculty?.minHours || 12;
                const max = currentFaculty?.maxHours || 16;
                const norm = currentFaculty?.normHours || 14;
                if (total > max) {
                  return (
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-rose-50 text-rose-800 border border-rose-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" />
                      Overloaded ({total}h &gt; {max}h)
                    </span>
                  );
                }
                if (total < min) {
                  return (
                    <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-300 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      Underloaded ({total}h &lt; {min}h)
                    </span>
                  );
                }
                return (
                  <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Optimal ({total}h / {norm}h)
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Faculty Summary Card */}
          <div className="bg-surface rounded-card border border-border-beige p-3 shadow-crisp-sm">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="p-2 bg-canvas-paper rounded border border-border-subtle">
                <span className="text-[10px] font-mono text-ink-light block uppercase">Faculty Member</span>
                <span className="font-semibold text-ink text-xs block truncate">{currentFaculty?.name}</span>
                <span className="text-[10px] font-mono text-ink-light">{currentFaculty?.empId}</span>
              </div>
              <div className="p-2 bg-canvas-paper rounded border border-border-subtle">
                <span className="text-[10px] font-mono text-ink-light block uppercase">Designation</span>
                <span className="font-semibold text-ink text-xs block truncate">{currentFaculty?.designation}</span>
                <span className="text-[10px] font-mono text-ink-light">VTU Norm: {currentFaculty?.normHours}h</span>
              </div>
              <div className="p-2 bg-canvas-paper rounded border border-border-subtle">
                <span className="text-[10px] font-mono text-ink-light block uppercase">Dept Teaching</span>
                <span className="font-semibold text-primary text-xs">
                  {currentFaculty?.theoryHours || 0}h Th + {currentFaculty?.labHours || 0}h Lab
                </span>
                <span className="text-[10px] font-mono text-ink-light block">AIDS Department</span>
              </div>
              <div className="p-2 bg-canvas-paper rounded border border-border-subtle">
                <span className="text-[10px] font-mono text-ink-light block uppercase">Basic Science (1st Yr)</span>
                <span className="font-semibold text-purple-800 text-xs">
                  {currentFaculty?.basicScienceHours || 0} Hrs/Wk
                </span>
                <span className="text-[10px] font-mono text-ink-light block">Cycle Sections</span>
              </div>
              <div className="p-2 bg-canvas-paper rounded border border-border-subtle">
                <span className="text-[10px] font-mono text-ink-light block uppercase">Total Contact Hours</span>
                <span className="font-bold text-ink text-sm">
                  {facultyTotalTeachingHours} Hrs/Wk
                </span>
                <span className="text-[10px] font-mono text-emerald-800 block">
                  Range: {currentFaculty?.minHours}–{currentFaculty?.maxHours}h
                </span>
              </div>
            </div>
          </div>

          {/* Table 0 VTU Grid for Faculty */}
          <div ref={facultyTimetableRef} className="bg-white p-3 sm:p-5 rounded-card border border-border-beige shadow-crisp overflow-hidden print:p-0 print:border-none print:shadow-none space-y-3">
            {/* Printable Institutional Header */}
            <div className="hidden print:block text-center pb-2 border-b-2 border-black space-y-0.5">
              <h2 className="font-headline font-bold text-sm text-[#530e21] tracking-wide uppercase">
                Shri Madhwa Vadiraja Institute of Technology &amp; Management
              </h2>
              <p className="text-[10px] font-medium text-ink">
                Vishwothama Nagar, Bantakal, Udupi – 574 115
              </p>
              <p className="text-[10px] font-bold text-primary uppercase">
                Faculty Teaching Schedule — {currentFaculty?.name} ({currentFaculty?.empId})
              </p>
              <div className="pt-1 flex items-center justify-between text-[11px] font-mono font-semibold px-2">
                <span>Designation: {currentFaculty?.designation}</span>
                <span>Department: {currentFaculty?.department}</span>
                <span>Total Contact: {facultyTotalTeachingHours} Hrs/Wk</span>
              </div>
            </div>

            {/* Table 0 Grid */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-black text-xs select-none">
                <thead>
                  <tr className="bg-[#993366] text-white font-mono text-[11px] border border-black">
                    <th className="py-2 px-1 text-center font-bold border border-black bg-[#993366] text-white w-[80px] min-w-[75px] uppercase text-[10px]">
                      DAY/TIME
                    </th>
                    <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[85px]">
                      <div className="font-bold text-[10px]">I</div>
                      <div className="text-[8px] opacity-90 font-mono">9:00–9:55</div>
                    </th>
                    <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[85px]">
                      <div className="font-bold text-[10px]">II</div>
                      <div className="text-[8px] opacity-90 font-mono">9:55–10:50</div>
                    </th>
                    <th className="py-2 px-0.5 text-center font-bold border border-black bg-[#EFCDDE] text-black w-[40px] min-w-[38px] text-[9px] uppercase tracking-wider">
                      <div className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold text-center mx-auto tracking-widest uppercase text-black">
                        TEA BREAK
                      </div>
                    </th>
                    <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[85px]">
                      <div className="font-bold text-[10px]">III</div>
                      <div className="text-[8px] opacity-90 font-mono">11:10–12:05</div>
                    </th>
                    <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[85px]">
                      <div className="font-bold text-[10px]">IV</div>
                      <div className="text-[8px] opacity-90 font-mono">12:05–1:00</div>
                    </th>
                    <th className="py-2 px-0.5 text-center font-bold border border-black bg-[#EFCDDE] text-black w-[40px] min-w-[38px] text-[9px] uppercase tracking-wider">
                      <div className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold text-center mx-auto tracking-widest uppercase text-black">
                        LUNCH
                      </div>
                    </th>
                    <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[85px]">
                      <div className="font-bold text-[10px]">V</div>
                      <div className="text-[8px] opacity-90 font-mono">1:55–2:50</div>
                    </th>
                    <th className="py-2 px-0.5 text-center font-bold border border-black bg-[#EFCDDE] text-black w-[40px] min-w-[38px] text-[9px] uppercase tracking-wider">
                      <div className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold text-center mx-auto tracking-widest uppercase text-black">
                        LEISURE
                      </div>
                    </th>
                    <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[85px]">
                      <div className="font-bold text-[10px]">VI</div>
                      <div className="text-[8px] opacity-90 font-mono">3:00–3:55</div>
                    </th>
                    <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[85px]">
                      <div className="font-bold text-[10px]">VII</div>
                      <div className="text-[8px] opacity-90 font-mono">3:55–4:45</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => {
                    const slotsForDay = facultySlots.filter((s) => s.day === day);

                    const renderFacultyPeriodCell = (period: number) => {
                      const coveredByPrev = slotsForDay.find(
                        (s) => s.startPeriod < period && s.startPeriod + s.duration > period
                      );
                      if (coveredByPrev) return null;

                      const slot = slotsForDay.find((s) => s.startPeriod === period);
                      const colSpan = slot ? slot.duration : 1;

                      if (slot) {
                        return (
                          <td
                            key={period}
                            colSpan={colSpan}
                            className={`p-1.5 text-center border border-black align-middle h-[52px] ${
                              slot.category === 'Basic Science'
                                ? 'bg-purple-50/70 border-purple-300'
                                : slot.category === 'Institutional'
                                ? 'bg-amber-50/70 border-amber-300'
                                : 'bg-primary-subtle/50 border-primary/40'
                            }`}
                          >
                            <div className="flex flex-col items-center justify-center leading-tight">
                              <span className="font-bold font-mono text-[10px] text-primary">
                                {slot.subjectCode}
                              </span>
                              <span className="text-[9px] font-semibold text-ink line-clamp-1 max-w-[140px]">
                                {slot.subjectTitle}
                              </span>
                              <span className="text-[8px] font-mono text-ink-light">
                                {slot.section}{slot.room && slot.room.trim() && !slot.room.startsWith('LH-20') && slot.room !== 'AB-101' && slot.room !== 'Auditorium' && !slot.room.toLowerCase().includes('provisional') ? ` • ${slot.room}` : ''}
                              </span>
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
                      <tr key={day} className="border border-black h-[52px]">
                        {/* Day Column */}
                        <td className="py-1 px-1 text-center font-bold font-mono text-[10px] uppercase border border-black bg-canvas-paper text-ink">
                          {day.substring(0, 3)}
                        </td>

                        {/* Period I & II */}
                        {renderFacultyPeriodCell(1)}
                        {renderFacultyPeriodCell(2)}

                        {/* TEA BREAK */}
                        {day === 'Monday' && (
                          <td
                            rowSpan={6}
                            className="p-0 border border-black bg-[#EFCDDE] text-black text-center align-middle w-[40px] select-none"
                          >
                            <div className="[writing-mode:vertical-rl] rotate-180 text-[9px] font-bold text-center mx-auto tracking-widest uppercase text-black py-4">
                              TEA BREAK (10:50–11:10)
                            </div>
                          </td>
                        )}

                        {/* Period III & IV */}
                        {renderFacultyPeriodCell(3)}
                        {renderFacultyPeriodCell(4)}

                        {/* LUNCH BREAK */}
                        {day === 'Monday' && (
                          <td
                            rowSpan={6}
                            className="p-0 border border-black bg-[#EFCDDE] text-black text-center align-middle w-[40px] select-none"
                          >
                            <div className="[writing-mode:vertical-rl] rotate-180 text-[9px] font-bold text-center mx-auto tracking-widest uppercase text-black py-4">
                              LUNCH BREAK (1:00–1:55)
                            </div>
                          </td>
                        )}

                        {/* Period V */}
                        {renderFacultyPeriodCell(5)}

                        {/* LEISURE BREAK */}
                        {day === 'Monday' && (
                          <td
                            rowSpan={6}
                            className="p-0 border border-black bg-[#EFCDDE] text-black text-center align-middle w-[40px] select-none"
                          >
                            <div className="[writing-mode:vertical-rl] rotate-180 text-[9px] font-bold text-center mx-auto tracking-widest uppercase text-black py-4">
                              BREAK (2:50–3:00)
                            </div>
                          </td>
                        )}

                        {/* Period VI & VII */}
                        {renderFacultyPeriodCell(6)}
                        {renderFacultyPeriodCell(7)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

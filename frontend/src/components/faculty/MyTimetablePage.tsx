import React, { useMemo, useRef } from 'react';
import {
  Calendar,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { DownloadPdfButton } from '../common/DownloadPdfButton';
import smvitmLogo from '../../assets/smvitm_logo.webp';
import sodeLogo from '../../assets/sode_group_logo.png';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

interface UnifiedFacultyScheduleItem {
  id: string;
  day: (typeof DAYS)[number];
  startPeriod: number;
  duration: number;
  subjectCode: string;
  subjectTitle: string;
  section: string;
  room: string;
  department: string;
  category: 'Department' | 'Basic Science' | 'Institutional';
  academicYear: string;
  semester: string;
  studentYear: string;
}

export const MyTimetablePage: React.FC = () => {
  const scheduleRef = useRef<HTMLDivElement>(null);
  const {
    deptTimetables,
    cycleTimetables,
    deanTimetables,
    departmentFaculty,
  } = useWorkflow();

  // Logged-in faculty: Dr. Ananya Rao (FAC102)
  const currentFaculty = useMemo(() => {
    return (
      departmentFaculty.find((f) => f.name.includes('Ananya Rao') || f.empId === 'FAC102') ||
      departmentFaculty[0]
    );
  }, [departmentFaculty]);

  // Aggregate ALL published assignments across Department, Basic Science, and Institutional
  // Unpublished drafts (isPublished === false or isLocked === false) are strictly excluded!
  const publishedAssignments = useMemo(() => {
    if (!currentFaculty) return [];
    const facultyName = currentFaculty.name;
    const items: UnifiedFacultyScheduleItem[] = [];

    // 1. Department Timetables (only published ones!)
    Object.entries(deptTimetables).forEach(([, tt]) => {
      if (tt && tt.isPublished) {
        (tt.placements || []).forEach((p) => {
          if (p.facultyName && p.facultyName.includes(facultyName)) {
            items.push({
              id: `dept-${p.id}`,
              day: p.day as (typeof DAYS)[number],
              startPeriod: p.startPeriod,
              duration: p.duration,
              subjectCode: p.subjectCode,
              subjectTitle: p.subjectTitle,
              section: `${tt.department} - ${tt.section}`,
              room: (p.room && p.room.trim() && p.room !== 'LH-201' && !p.room.toLowerCase().includes('provisional')) ? p.room : '',
              department: tt.department,
              category: 'Department',
              academicYear: tt.academicYear,
              semester: tt.semester,
              studentYear: tt.studentYear,
            });
          }
        });
      }
    });

    // 2. Basic Science Cycle Timetables (only locked/published ones!)
    Object.entries(cycleTimetables).forEach(([, ct]) => {
      if (ct && ct.isLocked) {
        (ct.placements || []).forEach((p) => {
          if (p.facultyName && p.facultyName.includes(facultyName)) {
            items.push({
              id: `bs-${p.id}`,
              day: p.day as (typeof DAYS)[number],
              startPeriod: p.startPeriod,
              duration: p.duration,
              subjectCode: p.subjectCode,
              subjectTitle: p.subjectName,
              section: `1st Yr (${ct.cycle} Cycle - ${ct.section})`,
              room: (p.room && p.room !== 'AB-101' && p.room !== 'AB-103' && !p.room.toLowerCase().includes('provisional')) ? p.room : '',
              department: `${ct.cycle} (Basic Science)`,
              category: 'Basic Science',
              academicYear: ct.academicYear,
              semester: ct.semester,
              studentYear: ct.studentYear,
            });
          }
        });
      }
    });

    // 3. Dean Institutional Timetables (only locked ones!)
    Object.entries(deanTimetables).forEach(([, dt]) => {
      if (dt && dt.isLocked) {
        (dt.placements || []).forEach((p) => {
          if (p.facultyName && p.facultyName.includes(facultyName)) {
            items.push({
              id: `dean-${p.id}`,
              day: p.day as (typeof DAYS)[number],
              startPeriod: p.startPeriod,
              duration: p.duration,
              subjectCode: p.subjectCode,
              subjectTitle: p.subjectName,
              section: `${dt.department || 'First Year'} - ${dt.section}`,
              room: (p.room && p.room !== 'Seminar Hall' && !p.room.toLowerCase().includes('provisional')) ? p.room : '',
              department: dt.department || 'Institutional',
              category: 'Institutional',
              academicYear: dt.academicYear,
              semester: dt.semester,
              studentYear: dt.studentYear,
            });
          }
        });
      }
    });

    return items;
  }, [currentFaculty, deptTimetables, cycleTimetables, deanTimetables]);

  // Total weekly teaching hours
  const totalWeeklyTeachingHours = useMemo(() => {
    return publishedAssignments.reduce((acc, curr) => acc + curr.duration, 0);
  }, [publishedAssignments]);

  const deptHours = useMemo(() => {
    return publishedAssignments
      .filter((a) => a.category === 'Department')
      .reduce((acc, curr) => acc + curr.duration, 0);
  }, [publishedAssignments]);

  const basicScienceHours = useMemo(() => {
    return publishedAssignments
      .filter((a) => a.category === 'Basic Science')
      .reduce((acc, curr) => acc + curr.duration, 0);
  }, [publishedAssignments]);


  // Grid cell helper
  const getSlotAt = (day: (typeof DAYS)[number], period: number) => {
    return publishedAssignments.find(
      (s) => s.day === day && period >= s.startPeriod && period < s.startPeriod + s.duration
    );
  };

  return (
    <div className="space-y-4 animate-fade-in text-ink">
      {/* Top Banner (Hidden during Print) */}
      <div className="p-3.5 sm:p-4 bg-surface rounded-card border border-border-beige shadow-crisp space-y-3 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-border-beige">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Individual Faculty Schedule
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                Official Published Assignments
              </span>
            </div>
            <h2 className="font-headline text-xl sm:text-2xl font-semibold text-primary">
              My Teaching Timetable — {currentFaculty?.name}
            </h2>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              Consolidated weekly teaching schedule integrating published assignments across Department, Basic Science, and Institutional courses. Unpublished drafts are strictly hidden.
            </p>
          </div>

          <DownloadPdfButton
            targetRef={scheduleRef}
            filename={`Class Timetable AIDS - Teaching Schedule (${currentFaculty?.name || 'Faculty'}).pdf`}
            label="Download PDF"
          />
        </div>

        {/* 4 Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-0.5">
          <div className="p-2.5 bg-canvas-paper rounded-card border border-border-beige">
            <span className="text-[10px] font-mono text-ink-light block uppercase tracking-wider">
              Total Teaching Load
            </span>
            <span className="text-base font-bold text-primary font-mono">
              {totalWeeklyTeachingHours} Periods/Wk
            </span>
          </div>

          <div className="p-2.5 bg-canvas-paper rounded-card border border-border-beige">
            <span className="text-[10px] font-mono text-ink-light block uppercase tracking-wider">
              Department Core
            </span>
            <span className="text-base font-bold text-ink font-mono">
              {deptHours} Hours
            </span>
          </div>

          <div className="p-2.5 bg-canvas-paper rounded-card border border-border-beige">
            <span className="text-[10px] font-mono text-ink-light block uppercase tracking-wider">
              Basic Science Cycle
            </span>
            <span className="text-base font-bold text-purple-900 font-mono">
              {basicScienceHours} Hours
            </span>
          </div>

          <div className="p-2.5 bg-canvas-paper rounded-card border border-border-beige">
            <span className="text-[10px] font-mono text-ink-light block uppercase tracking-wider">
              Workload Status
            </span>
            <span className="text-xs font-semibold text-emerald-800 block mt-1">
              Norm: {currentFaculty?.normHours}h ({currentFaculty?.minHours}–{currentFaculty?.maxHours}h Max)
            </span>
          </div>
        </div>
      </div>

      {/* Timetable Grid Container (Class Timetable DS-3rd sem.docx format) */}
      <div
        ref={scheduleRef}
        className="bg-white p-4 sm:p-5 rounded-card border border-border-beige shadow-crisp overflow-hidden print:p-0 print:border-none print:shadow-none space-y-3"
      >
        {/* Institutional Header with Logos */}
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
                  Faculty Teaching Schedule — {currentFaculty?.name} ({currentFaculty?.empId})
                </p>
                <div className="inline-block mt-0.5 px-2.5 py-0.5 bg-canvas-muted rounded text-[10px] sm:text-[11px] font-mono font-semibold text-primary border border-border-subtle">
                  ACADEMIC YEAR 2026–2027 (ODD SEMESTER)
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
            <span>Department: <strong>{currentFaculty?.department}</strong></span>
            <span>•</span>
            <span>Designation: <strong>{currentFaculty?.designation}</strong></span>
            <span>•</span>
            <span>Contact Hours: <strong>{totalWeeklyTeachingHours} Hrs/Wk</strong></span>
          </div>
        </div>

        {/* Legend for subtle visual indicators */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1 print:hidden">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="font-headline text-sm sm:text-base font-semibold text-primary">
              Weekly Master Teaching Schedule
            </h3>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary/20 border border-primary/60 inline-block" />
              <span className="text-[11px] text-ink-muted">Department Assignment</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-200 border border-purple-500 inline-block" />
              <span className="text-[11px] text-ink-muted">Basic Science 1st Year</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-200 border border-zinc-400 inline-block" />
              <span className="text-[11px] text-ink-muted">Vacant Period</span>
            </div>
          </div>
        </div>

        {/* Table 0 Grid Layout */}
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
                  <tr key={day} className="border border-black h-[54px]">
                    {/* Day Column */}
                    <td className="py-1 px-1.5 text-center font-bold font-mono text-[10px] uppercase border border-black bg-canvas-paper text-ink">
                      {day.substring(0, 3)}
                    </td>

                    {/* Period 1 */}
                    {renderPeriodCell(day, 1)}

                    {/* Period 2 */}
                    {renderPeriodCell(day, 2)}

                    {/* Tea Break */}
                    <td className="p-0 border border-black bg-[#EFCDDE] text-center" />

                    {/* Period 3 */}
                    {renderPeriodCell(day, 3)}

                    {/* Period 4 */}
                    {renderPeriodCell(day, 4)}

                    {/* Lunch Break */}
                    <td className="p-0 border border-black bg-[#EFCDDE] text-center" />

                    {/* Period 5 */}
                    {renderPeriodCell(day, 5)}

                    {/* Leisure Break */}
                    <td className="p-0 border border-black bg-[#EFCDDE] text-center" />

                    {/* Period 6 */}
                    {renderPeriodCell(day, 6)}

                    {/* Period 7 */}
                    {renderPeriodCell(day, 7)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Helper function to render each period slot
  function renderPeriodCell(day: (typeof DAYS)[number], period: number) {
    const slot = getSlotAt(day, period);
    const cellKey = `${day}-${period}`;

    // If slot starts at an earlier period, don't re-render
    if (slot && slot.startPeriod !== period) {
      return null;
    }

    const colSpan = slot ? slot.duration : 1;

    if (slot) {
      const isBasicScience = slot.category === 'Basic Science';
      return (
        <td
          key={cellKey}
          colSpan={colSpan}
          className={`p-1 border border-black text-center align-middle transition-colors ${
            isBasicScience
              ? 'bg-purple-50/70 border-purple-300'
              : 'bg-white'
          }`}
        >
          <div className="flex flex-col items-center justify-center p-0.5 min-h-[46px]">
            <div className="flex items-center gap-1 mb-0.5">
              <span className="font-mono font-bold text-primary text-[10px] leading-tight">
                {slot.subjectCode}
              </span>
              <span
                className={`px-1 py-0.2 rounded text-[8px] font-mono font-bold uppercase tracking-wider ${
                  isBasicScience
                    ? 'bg-purple-200 text-purple-900 border border-purple-300'
                    : 'bg-primary-subtle text-primary border border-primary/20'
                }`}
              >
                {isBasicScience ? 'Basic Science' : 'Dept Core'}
              </span>
            </div>
            <span className="text-[9px] text-ink font-semibold truncate max-w-[130px] block leading-tight">
              {slot.subjectTitle}
            </span>
            <span className="text-[8px] text-ink-muted font-mono truncate max-w-[130px] block leading-tight">
              {slot.section}{slot.room && slot.room.trim() ? ` • ${slot.room}` : ''}
            </span>
          </div>
        </td>
      );
    }

    // Vacant Period
    return (
      <td
        key={cellKey}
        className="p-1 border border-black text-center align-middle bg-zinc-50/40 hover:bg-zinc-50 transition-colors"
      >
        <div className="h-full min-h-[44px] flex items-center justify-center text-[10px] text-ink-light/40 font-mono">
          Vacant
        </div>
      </td>
    );
  }
};

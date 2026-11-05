import React, { useState } from 'react';
import {
  Building,
  GraduationCap,
  Calendar,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';

interface CourseReference {
  slNo: number;
  code: string;
  name: string;
  ltp: string;
  type: string;
  credit: number;
  faculty: string;
}

const DS_3RD_SEM_COURSES: CourseReference[] = [
  {
    slNo: 1,
    code: 'BCS301',
    name: 'Mathematics for Computer Science',
    ltp: '3:2:0',
    type: 'PCC/BSC',
    credit: 4,
    faculty: 'Dr. Bhagya (Dept. of Mathematics)',
  },
  {
    slNo: 2,
    code: 'BCS302',
    name: 'Digital Design & Computer Organization',
    ltp: '3:0:2',
    type: 'IPCC',
    credit: 4,
    faculty: 'Balachandra (B1&B2 BJ,VS)',
  },
  {
    slNo: 3,
    code: 'BCS303',
    name: 'Operating Systems',
    ltp: '3:1:2',
    type: 'IPCC',
    credit: 4,
    faculty: 'Ashwini (B1&B2 AK,NF1)',
  },
  {
    slNo: 4,
    code: 'BCS304',
    name: 'Data Structures and Applications',
    ltp: '3:0:0',
    type: 'PCC',
    credit: 3,
    faculty: 'Shalaka',
  },
  {
    slNo: 5,
    code: 'BCSL305',
    name: 'Data Structures Lab',
    ltp: '0:0:2',
    type: 'PCCL',
    credit: 1,
    faculty: 'Shalaka (B1: SL,MS B2: SL,AK)',
  },
  {
    slNo: 6,
    code: 'BCS306A',
    name: 'Object Oriented Programming with Java',
    ltp: '2:0:2',
    type: 'ESC',
    credit: 3,
    faculty: 'Shabhana (B1: SH,NF1 & B2: SH,NF1)',
  },
  {
    slNo: 7,
    code: 'BSCK307',
    name: 'Social Connect and Responsibility',
    ltp: '0:0:2',
    type: 'UHV',
    credit: 1,
    faculty: 'Sarvesh',
  },
  {
    slNo: 8,
    code: 'BCS358A',
    name: 'Data Analytics with Excel',
    ltp: '0:0:2',
    type: 'AEC/ SEC',
    credit: 1,
    faculty: 'BJ, SR, SH',
  },
  {
    slNo: 9,
    code: 'BNSK359',
    name: 'National Service Scheme (NSS)',
    ltp: '0:0:2',
    type: 'MC',
    credit: 0,
    faculty: 'Ranjan',
  },
];

export const ClassTimetableView: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<'DS-3' | 'AI-5' | 'CS-7'>('DS-3');

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Top Academic Context Header */}
      <div className="p-5 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-ink-light">
                Institutional Master Schedule
              </span>
              <span className="text-xs font-mono text-primary font-semibold">
                • Reference Document Model
              </span>
            </div>
            <h3 className="font-headline text-xl font-bold text-[#993366]">
              Class Timetable — Department of Data Science
            </h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Accredited layout reproduced faithfully from official institutional records.
            </p>
          </div>

          {/* Section Selection */}
          <div className="flex items-center gap-2">
            <label htmlFor="class-selector" className="text-xs font-semibold text-ink-muted">
              Select Section:
            </label>
            <select
              id="class-selector"
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value as 'DS-3' | 'AI-5' | 'CS-7')}
              className="px-3 py-1.5 rounded-card bg-surface border border-border-beige text-xs font-semibold text-ink focus:outline-none focus:border-primary shadow-crisp-sm cursor-pointer"
            >
              <option value="DS-3">Semester III — Section DS (Reference Document)</option>
              <option value="AI-5">Semester V — Section AI</option>
              <option value="CS-7">Semester VII — Section CS</option>
            </select>
          </div>
        </div>

        {/* Official Metadata Bar from Reference Document */}
        <div className="mt-4 pt-3 border-t border-border-subtle grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#993366]" />
            <div>
              <span className="text-[10px] font-mono text-ink-light block uppercase">Semester</span>
              <strong className="text-ink font-semibold">III</strong>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-[#993366]" />
            <div>
              <span className="text-[10px] font-mono text-ink-light block uppercase">Section</span>
              <strong className="text-ink font-semibold">DS (Data Science)</strong>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#993366]" />
            <div>
              <span className="text-[10px] font-mono text-ink-light block uppercase">Scheme</span>
              <strong className="text-ink font-semibold">2022 Scheme</strong>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#993366]" />
            <div>
              <span className="text-[10px] font-mono text-ink-light block uppercase">Academic Year</span>
              <strong className="text-ink font-semibold">2025-26</strong>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE 1: Main Timetable Matrix */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden">
        <div className="px-5 py-3 border-b border-border-beige bg-canvas-muted/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-[#993366]" />
            <h4 className="font-headline font-semibold text-sm text-[#993366]">
              Table 1: Weekly Instructional Schedule Grid
            </h4>
          </div>
          <span className="text-[11px] font-mono text-ink-light hidden sm:inline">
            Class Hours: 9:00 AM – 4:45 PM
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
              {/* MONDAY */}
              <tr className="border-b border-border-subtle hover:bg-canvas-muted/20">
                <th className="p-3 bg-[#993366] text-white font-bold text-center border border-[#7a2851] uppercase text-[11px]">
                  MONDAY
                </th>
                <td
                  colSpan={2}
                  className="p-3 border border-border-subtle bg-primary-subtle/30 text-center font-mono font-semibold text-primary"
                >
                  &lt;---Technical Training---&gt;
                </td>
                {/* TEA BREAK (rowSpan 6) */}
                <td
                  rowSpan={6}
                  className="p-1 border border-[#d6a5bc] bg-[#EFCDDE] text-[#993366] font-bold text-center align-middle select-none"
                >
                  <div className="[writing-mode:vertical-rl] tracking-widest text-xs uppercase font-extrabold mx-auto py-2">
                    TEA BREAK
                  </div>
                </td>
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  BCS301
                </td>
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  BCS302
                </td>
                {/* LUNCH BREAK (rowSpan 6) */}
                <td
                  rowSpan={6}
                  className="p-1 border border-[#d6a5bc] bg-[#F0D0E0] text-[#993366] font-bold text-center align-middle select-none"
                >
                  <div className="[writing-mode:vertical-rl] tracking-widest text-xs uppercase font-extrabold mx-auto py-2">
                    LUNCH BREAK
                  </div>
                </td>
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  BCS304
                </td>
                {/* LEISURE (rowSpan 6) */}
                <td
                  rowSpan={6}
                  className="p-1 border border-[#d6a5bc] bg-[#F0D0E0] text-[#993366] font-bold text-center align-middle select-none"
                >
                  <div className="[writing-mode:vertical-rl] tracking-widest text-xs uppercase font-extrabold mx-auto py-2">
                    LEISURE
                  </div>
                </td>
                <td
                  colSpan={2}
                  className="p-3 border border-border-subtle bg-accent-teal/10 text-center font-mono font-semibold text-accent-teal"
                >
                  &lt;-------EXCEL LAB------&gt;
                </td>
              </tr>

              {/* TUESDAY */}
              <tr className="border-b border-border-subtle hover:bg-canvas-muted/20">
                <th className="p-3 bg-[#993366] text-white font-bold text-center border border-[#7a2851] uppercase text-[11px]">
                  TUESDAY
                </th>
                <td
                  colSpan={2}
                  className="p-3 border border-border-subtle bg-accent-teal/10 text-center font-mono font-semibold text-accent-teal"
                >
                  &lt;--DDCO/OOPS LAB--&gt;
                </td>
                {/* TEA BREAK skipped (rowSpan) */}
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  BCS306A
                </td>
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  BCS304
                </td>
                {/* LUNCH BREAK skipped (rowSpan) */}
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  BCS303
                </td>
                {/* LEISURE skipped (rowSpan) */}
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  BCS303
                </td>
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  BCS301
                </td>
              </tr>

              {/* WEDNESDAY */}
              <tr className="border-b border-border-subtle hover:bg-canvas-muted/20">
                <th className="p-3 bg-[#993366] text-white font-bold text-center border border-[#7a2851] uppercase text-[11px]">
                  WEDNESDAY
                </th>
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  BCS303
                </td>
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  BCS306A
                </td>
                {/* TEA BREAK skipped (rowSpan) */}
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  BCS304
                </td>
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  BCS301
                </td>
                {/* LUNCH BREAK skipped (rowSpan) */}
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  BCS302
                </td>
                {/* LEISURE skipped (rowSpan) */}
                <td
                  colSpan={2}
                  className="p-3 border border-border-subtle bg-accent-teal/10 text-center font-mono font-semibold text-accent-teal"
                >
                  &lt;--DS/DDCO LAB--&gt;
                </td>
              </tr>

              {/* THURSDAY */}
              <tr className="border-b border-border-subtle hover:bg-canvas-muted/20">
                <th className="p-3 bg-[#993366] text-white font-bold text-center border border-[#7a2851] uppercase text-[11px]">
                  THURSDAY
                </th>
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  BCS301
                </td>
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  BCS303
                </td>
                {/* TEA BREAK skipped (rowSpan) */}
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  BCS302
                </td>
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  BCS306A
                </td>
                {/* LUNCH BREAK skipped (rowSpan) */}
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  BCS304
                </td>
                {/* LEISURE skipped (rowSpan) */}
                <td
                  colSpan={2}
                  className="p-3 border border-border-subtle bg-accent-teal/10 text-center font-mono font-semibold text-accent-teal"
                >
                  &lt;--OOPS/DS LAB--&gt;
                </td>
              </tr>

              {/* FRIDAY */}
              <tr className="border-b border-border-subtle hover:bg-canvas-muted/20">
                <th className="p-3 bg-[#993366] text-white font-bold text-center border border-[#7a2851] uppercase text-[11px]">
                  FRIDAY
                </th>
                <td
                  colSpan={2}
                  className="p-3 border border-border-subtle bg-accent-teal/10 text-center font-mono font-semibold text-accent-teal"
                >
                  &lt;-------OS LAB------&gt;
                </td>
                {/* TEA BREAK skipped (rowSpan) */}
                <td
                  colSpan={2}
                  className="p-3 border border-border-subtle bg-primary-subtle/30 text-center font-mono font-semibold text-primary"
                >
                  &lt;---Technical Training---&gt;
                </td>
                {/* LUNCH BREAK skipped (rowSpan) */}
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  BCS301
                </td>
                {/* LEISURE skipped (rowSpan) */}
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  BSCK307
                </td>
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  BNSK359
                </td>
              </tr>

              {/* SATURDAY */}
              <tr className="hover:bg-canvas-muted/20">
                <th className="p-3 bg-[#993366] text-white font-bold text-center border border-[#7a2851] uppercase text-[11px]">
                  SATURDAY
                </th>
                <td
                  colSpan={2}
                  className="p-3 border border-border-subtle bg-accent-violet/10 text-center font-mono font-semibold text-accent-violet"
                >
                  VAC
                </td>
                {/* TEA BREAK skipped (rowSpan) */}
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-accent-violet">
                  VAC
                </td>
                <td className="p-3 border border-border-subtle text-center font-mono font-bold text-ink">
                  MMM
                </td>
                {/* LUNCH BREAK skipped (rowSpan) */}
                <td className="p-3 border border-border-subtle text-center text-ink-light/50 font-mono">
                  —
                </td>
                {/* LEISURE skipped (rowSpan) */}
                <td className="p-3 border border-border-subtle text-center text-ink-light/50 font-mono">
                  —
                </td>
                <td className="p-3 border border-border-subtle text-center text-ink-light/50 font-mono">
                  —
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* TABLE 2: Course Reference and Faculty Allocation */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden">
        <div className="px-5 py-3 border-b border-border-beige bg-canvas-muted/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-[#993366]" />
            <h4 className="font-headline font-semibold text-sm text-[#993366]">
              Table 2: Course Reference &amp; Faculty Allocation
            </h4>
          </div>
          <span className="text-[11px] font-mono text-ink-light">
            9 Courses Registered (Odd Semester)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[850px] text-xs">
            <thead>
              <tr className="bg-[#993366] text-white">
                <th className="p-2.5 border border-[#7a2851] text-center font-bold w-16">
                  Sl. No.
                </th>
                <th className="p-2.5 border border-[#7a2851] text-left font-bold w-24">
                  Course Code
                </th>
                <th className="p-2.5 border border-[#7a2851] text-left font-bold min-w-[220px]">
                  Course Name
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
                  Name of the Faculty Member
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {DS_3RD_SEM_COURSES.map((course) => (
                <tr
                  key={course.slNo}
                  className="hover:bg-canvas-muted/30 transition-colors"
                >
                  <td className="p-2.5 text-center font-mono font-bold text-ink border-r border-border-subtle">
                    {course.slNo}
                  </td>
                  <td className="p-2.5 font-mono font-bold text-[#993366] border-r border-border-subtle">
                    {course.code}
                  </td>
                  <td className="p-2.5 font-semibold text-ink border-r border-border-subtle">
                    {course.name}
                  </td>
                  <td className="p-2.5 text-center font-mono text-ink-muted border-r border-border-subtle">
                    {course.ltp}
                  </td>
                  <td className="p-2.5 text-center font-mono text-xs border-r border-border-subtle">
                    <span className="px-1.5 py-0.5 rounded bg-canvas-muted border border-border-subtle text-ink">
                      {course.type}
                    </span>
                  </td>
                  <td className="p-2.5 text-center font-mono font-bold text-primary border-r border-border-subtle">
                    {course.credit}
                  </td>
                  <td className="p-2.5 text-ink text-xs font-medium">
                    {course.faculty}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footnote matching Reference Document */}
        <div className="p-3.5 bg-canvas-muted/50 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-ink-muted">
          <div>
            <strong className="text-ink font-semibold">Explanatory Notes: </strong>
            <span>
              L: Lecture, T: Tutorial, P: Practical, IPCC: Integrated Professional Core Course, PCC: Professional Core Course, ESC: Engineering Science Course, UHV: Universal Human Values, AEC/SEC: Ability Enhancement Course
            </span>
          </div>
          <span className="font-mono text-ink-light flex-shrink-0">
            Source: Class Timetable DS-3rd sem.docx
          </span>
        </div>
      </div>
    </div>
  );
};

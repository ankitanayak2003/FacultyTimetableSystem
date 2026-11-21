import React from 'react';

export interface GeneratorCourseItem {
  id: string;
  courseCode?: string;
  courseName: string;
  ltp: string;
  courseType: string;
  credit: number | string;
  facultyName: string;
}

export interface GeneratorCourseTableProps {
  courses: GeneratorCourseItem[];
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
}

/**
 * Automatic Timetable Generator Course/Subject Table
 *
 * Renders the exact 7-column VTU format required for timetable generation:
 * 1. Sl. No.
 * 2. Course Code (supports empty values without omitting subject)
 * 3. Course Name
 * 4. L:T:P
 * 5. Course Type
 * 6. Credit
 * 7. Name of the Faculty Member
 */
export const GeneratorCourseTable: React.FC<GeneratorCourseTableProps> = ({
  courses,
  title = 'Course & Faculty Allocation Registry (Automatic Timetable Generator)',
  subtitle,
  emptyMessage = 'No subjects defined yet for this timetable. Add subjects in Subject & Faculty Allocation.',
}) => {
  return (
    <div className="p-3.5 bg-surface rounded-card border border-border-beige shadow-crisp space-y-2.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-border-beige">
        <h3 className="font-headline text-base font-semibold text-primary">
          {title}
        </h3>
        <span className="text-xs font-mono text-ink-muted">
          {subtitle || `${courses.length} courses registered`}
        </span>
      </div>

      {courses.length === 0 ? (
        <div className="p-3.5 bg-canvas-muted rounded text-xs text-ink-muted text-center border border-dashed border-border-beige">
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto p-2 sm:p-2.5 bg-white rounded border border-black/10">
          <table className="w-full border-collapse border border-black text-xs select-none">
            <thead>
              <tr className="bg-[#993366] text-white font-mono text-[11px] border border-black text-left">
                <th className="py-2 px-2.5 font-bold border border-black bg-[#993366] text-white w-14 text-center">
                  Sl. No.
                </th>
                <th className="py-2 px-2.5 font-bold border border-black bg-[#993366] text-white w-28">
                  Course Code
                </th>
                <th className="py-2 px-2.5 font-bold border border-black bg-[#993366] text-white min-w-[200px]">
                  Course Name
                </th>
                <th className="py-2 px-2.5 font-bold border border-black bg-[#993366] text-white text-center w-24 min-w-[70px]">
                  L:T:P
                </th>
                <th className="py-2 px-2.5 font-bold border border-black bg-[#993366] text-white w-36 min-w-[120px]">
                  Course Type
                </th>
                <th className="py-2 px-2.5 font-bold border border-black bg-[#993366] text-white text-center w-16 min-w-[60px]">
                  Credit
                </th>
                <th className="py-2 px-2.5 font-bold border border-black bg-[#993366] text-white min-w-[180px]">
                  Name of the Faculty Member
                </th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c, idx) => (
                <tr
                  key={c.id || `${c.courseCode || 'nocode'}-${c.courseName}-${idx}`}
                  className="border border-black bg-white hover:bg-neutral-50 transition-colors"
                >
                  <td className="py-2 px-2.5 font-mono text-center text-neutral-700 border border-black font-medium">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-2.5 font-mono font-bold text-[#4A1525] border border-black">
                    {c.courseCode ? c.courseCode.trim() : ''}
                  </td>
                  <td className="py-2 px-2.5 font-medium text-black border border-black">
                    {c.courseName}
                  </td>
                  <td className="py-2 px-2.5 font-mono text-center text-neutral-800 border border-black">
                    {c.ltp || '3:0:0'}
                  </td>
                  <td className="py-2 px-2.5 font-mono text-[11px] text-neutral-800 border border-black">
                    {c.courseType}
                  </td>
                  <td className="py-2 px-2.5 font-mono font-bold text-center text-[#4A1525] border border-black">
                    {c.credit}
                  </td>
                  <td className="py-2 px-2.5 font-semibold text-black border border-black">
                    {c.facultyName || 'Unassigned'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

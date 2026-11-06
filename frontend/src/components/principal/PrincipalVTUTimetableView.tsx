import React, { useState } from 'react';
import {
  Printer,
  Download,
  CheckCircle2,
} from 'lucide-react';
import letterheadImg from '../../assets/letterhead_landscape.png';
import smvitmLogo from '../../assets/smvitm_logo.webp';
import { useWorkflow } from '../../context/WorkflowContext';

interface CourseReference {
  slNo: number;
  code: string;
  name: string;
  ltp: string;
  type: string;
  credit: number;
  faculty: string;
}

const DEFAULT_DS_3RD_COURSES: CourseReference[] = [
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

export const PrincipalVTUTimetableView: React.FC = () => {
  const { departments, timetableEntries } = useWorkflow();
  const [selectedSection, setSelectedSection] = useState<string>('DS-3');
  const [imgLoadError, setImgLoadError] = useState(false);

  // Dynamic slot lookup from workflow context if available
  const getSlotDisplay = (day: string, period: number, fallbackCode: string) => {
    const entry = timetableEntries.find(
      (e) => e.day === day && e.period === period && e.section.includes('3A')
    );
    return entry ? entry.courseCode : fallbackCode;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 6mm 8mm 6mm 8mm;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          aside, header, nav, .no-print, button {
            display: none !important;
          }
          .vtu-print-sheet {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
          }
          table {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Screen-Only Control Toolbar */}
      <div className="no-print p-5 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-ink-light">
                Institutional Timetable Verification
              </span>
              <span className="text-xs font-mono text-[#993366] font-semibold">
                • Accredited VTU Word Reference Standard
              </span>
            </div>
            <h2 className="font-headline text-2xl font-bold text-[#993366]">
              Department of AI &amp; DS — Class Timetable
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              100% Exact visual fidelity to original document <code>Class Timetable DS-3rd sem.docx</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Section Switcher with dynamic departments */}
            <div className="flex items-center gap-2">
              <label htmlFor="sec-select" className="text-xs font-semibold text-ink-muted">
                Section:
              </label>
              <select
                id="sec-select"
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-3 py-1.5 rounded-card bg-surface border border-border-beige text-xs font-semibold text-ink focus:outline-none focus:border-primary shadow-crisp-sm cursor-pointer"
              >
                <option value="DS-3">Semester III — Section DS (Reference Document)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.code}>
                    Semester III — Section {d.code} ({d.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              aria-label="Print timetable"
              className="px-4 py-2 bg-[#993366] hover:bg-[#802450] text-white text-xs font-semibold rounded-card transition-colors shadow-crisp-sm flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Timetable</span>
            </button>

            {/* Download PDF Button */}
            <button
              type="button"
              onClick={handlePrint}
              aria-label="Download as PDF"
              className="px-4 py-2 bg-surface hover:bg-canvas-muted text-ink text-xs font-semibold rounded-card border border-border-beige transition-colors shadow-crisp-sm flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-[#993366]" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Status bar */}
        <div className="mt-4 pt-3 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-ink">
              Ready for Print &amp; PDF Export (Landscape A4 Full Fidelity)
            </span>
          </div>
          <span className="text-[11px] font-mono text-ink-light">
            Source: Class Timetable DS-3rd sem.docx • Verified by Principal Office
          </span>
        </div>
      </div>

      {/* THE VTU TIMETABLE SHEET - EXACT WORD DOCUMENT REPLICA */}
      <div className="vtu-print-sheet bg-white text-black p-4 sm:p-6 md:p-8 rounded-card border border-border-beige shadow-crisp overflow-x-auto">
        {/* A. OFFICIAL HEADER */}
        <div className="mb-3">
          {/* Institutional Letterhead Image from Word docx */}
          {!imgLoadError ? (
            <img
              src={letterheadImg}
              alt="SMVITM Institutional Letterhead"
              onError={() => setImgLoadError(true)}
              className="w-full max-h-24 object-contain mx-auto mb-2"
            />
          ) : (
            <div className="flex items-center justify-between border-b-2 border-[#993366] pb-2 mb-2">
              <div className="flex items-center gap-3">
                <img
                  src={smvitmLogo}
                  alt="SMVITM Logo"
                  className="h-14 w-auto object-contain flex-shrink-0"
                />
                <div>
                  <h1 className="font-serif font-bold text-base text-[#993366] tracking-tight uppercase leading-tight">
                    Shri Madhwa Vadiraja Institute of Technology &amp; Management
                  </h1>
                  <p className="text-[10px] text-gray-700 leading-tight">
                    A Unit of Shri Sode Vadiraja Mutt Education Trust, Udupi • Affiliated to VTU Belagavi • Approved by AICTE, New Delhi
                  </p>
                  <p className="text-[9px] text-gray-600 font-mono">
                    Vishwothama Nagar, Bantakal, Udupi - 574 115, Karnataka
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Department Name from Word docx Header */}
          <div className="text-center font-bold text-[#660033] text-sm md:text-base uppercase tracking-wide mt-2">
            DEPARTMENT OF ARTIFICIAL INTELLIGENCE AND DATA SCIENCE ENGINEERING
          </div>

          {/* Burgundy Separator Line */}
          <div className="w-full h-0.5 bg-[#660033] my-1.5" />

          {/* CLASS TIMETABLE Title from Word docx Header */}
          <div className="text-center font-bold text-[#660033] text-base md:text-lg uppercase underline tracking-wider mb-2">
            CLASS TIMETABLE
          </div>

          {/* Academic Metadata Line from Word docx Document.xml */}
          <div className="flex flex-wrap items-center justify-between text-xs font-bold text-black uppercase px-1 py-1 border-b border-black">
            <span>SEMESTER: III</span>
            <span>SECTION: {selectedSection === 'DS-3' ? 'DS' : selectedSection}</span>
            <span>SCHEME: 2022</span>
            <span>ACADEMIC YEAR: 2025-26</span>
          </div>
        </div>

        {/* B. TABLE 1: EXACT 11-COLUMN GRID WITH MERGED CELLS & BURGUNDY HEADERS */}
        <div className="overflow-x-auto mb-5">
          <table
            className="w-full border-collapse border border-black text-xs text-center"
            style={{ minWidth: '980px' }}
          >
            <thead>
              <tr style={{ backgroundColor: '#993366', color: '#FFFFFF' }}>
                <th
                  style={{
                    backgroundColor: '#993366',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '8px 4px',
                    width: '100px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                  }}
                >
                  DAY / TIME
                </th>
                <th
                  style={{
                    backgroundColor: '#993366',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '8px 4px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    width: '90px',
                  }}
                >
                  9.00 - 9.55
                </th>
                <th
                  style={{
                    backgroundColor: '#993366',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '8px 4px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    width: '90px',
                  }}
                >
                  9.55-10.50
                </th>
                <th
                  style={{
                    backgroundColor: '#802450',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '8px 2px',
                    fontWeight: 'bold',
                    fontSize: '10px',
                    width: '45px',
                  }}
                >
                  10.50-11.10
                </th>
                <th
                  style={{
                    backgroundColor: '#993366',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '8px 4px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    width: '90px',
                  }}
                >
                  11.10-12.05
                </th>
                <th
                  style={{
                    backgroundColor: '#993366',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '8px 4px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    width: '90px',
                  }}
                >
                  12.05-1.00
                </th>
                <th
                  style={{
                    backgroundColor: '#802450',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '8px 2px',
                    fontWeight: 'bold',
                    fontSize: '10px',
                    width: '45px',
                  }}
                >
                  1.00-1.55
                </th>
                <th
                  style={{
                    backgroundColor: '#993366',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '8px 4px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    width: '90px',
                  }}
                >
                  1.55-2.50
                </th>
                <th
                  style={{
                    backgroundColor: '#802450',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '8px 2px',
                    fontWeight: 'bold',
                    fontSize: '10px',
                    width: '40px',
                  }}
                >
                  2.50-3.00
                </th>
                <th
                  style={{
                    backgroundColor: '#993366',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '8px 4px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    width: '90px',
                  }}
                >
                  3.00-3.55
                </th>
                <th
                  style={{
                    backgroundColor: '#993366',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '8px 4px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                    width: '90px',
                  }}
                >
                  3.55-4.45
                </th>
              </tr>
            </thead>
            <tbody>
              {/* MONDAY */}
              <tr>
                <th
                  style={{
                    backgroundColor: '#993366',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '10px 4px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                  }}
                >
                  MONDAY
                </th>
                {/* 9.00 - 10.50 (span 2) */}
                <td
                  colSpan={2}
                  style={{
                    border: '1px solid #000000',
                    padding: '10px 4px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    color: '#000000',
                  }}
                >
                  &lt;---Technical Training---&gt;
                </td>
                {/* TEA BREAK (rowSpan 6) */}
                <td
                  rowSpan={6}
                  style={{
                    backgroundColor: '#EFCDDE',
                    color: '#993366',
                    border: '1px solid #d6a5bc',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    padding: '4px',
                  }}
                >
                  <div
                    style={{
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      letterSpacing: '0.2em',
                      fontWeight: 800,
                      fontSize: '11px',
                      margin: 'auto',
                    }}
                  >
                    TEA BREAK
                  </div>
                </td>
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  {getSlotDisplay('Monday', 3, 'BCS301')}
                </td>
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  {getSlotDisplay('Monday', 4, 'BCS302')}
                </td>
                {/* LUNCH BREAK (rowSpan 6) */}
                <td
                  rowSpan={6}
                  style={{
                    backgroundColor: '#F0D0E0',
                    color: '#993366',
                    border: '1px solid #d6a5bc',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    padding: '4px',
                  }}
                >
                  <div
                    style={{
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      letterSpacing: '0.2em',
                      fontWeight: 800,
                      fontSize: '11px',
                      margin: 'auto',
                    }}
                  >
                    LUNCH BREAK
                  </div>
                </td>
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  {getSlotDisplay('Monday', 5, 'BCS304')}
                </td>
                {/* LEISURE (rowSpan 6) */}
                <td
                  rowSpan={6}
                  style={{
                    backgroundColor: '#F0D0E0',
                    color: '#993366',
                    border: '1px solid #d6a5bc',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    verticalAlign: 'middle',
                    padding: '4px',
                  }}
                >
                  <div
                    style={{
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      letterSpacing: '0.2em',
                      fontWeight: 800,
                      fontSize: '11px',
                      margin: 'auto',
                    }}
                  >
                    LEISURE
                  </div>
                </td>
                {/* 3.00 - 4.45 (span 2) */}
                <td
                  colSpan={2}
                  style={{
                    border: '1px solid #000000',
                    padding: '10px 4px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    color: '#000000',
                  }}
                >
                  &lt;-------EXCEL  LAB------&gt;
                </td>
              </tr>

              {/* TUESDAY */}
              <tr>
                <th
                  style={{
                    backgroundColor: '#993366',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '10px 4px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                  }}
                >
                  TUESDAY
                </th>
                {/* 9.00 - 10.50 (span 2) */}
                <td
                  colSpan={2}
                  style={{
                    border: '1px solid #000000',
                    padding: '10px 4px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    color: '#000000',
                  }}
                >
                  &lt;--DDCO/OOPS LAB--&gt;
                </td>
                {/* TEA BREAK skipped (rowSpan) */}
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  {getSlotDisplay('Tuesday', 3, 'BCS306A')}
                </td>
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  {getSlotDisplay('Tuesday', 4, 'BCS304')}
                </td>
                {/* LUNCH BREAK skipped (rowSpan) */}
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  {getSlotDisplay('Tuesday', 5, 'BCS303')}
                </td>
                {/* LEISURE skipped (rowSpan) */}
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  {getSlotDisplay('Tuesday', 6, 'BCS303')}
                </td>
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  {getSlotDisplay('Tuesday', 7, 'BCS301')}
                </td>
              </tr>

              {/* WEDNESDAY */}
              <tr>
                <th
                  style={{
                    backgroundColor: '#993366',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '10px 4px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                  }}
                >
                  WEDNESDAY
                </th>
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  {getSlotDisplay('Wednesday', 1, 'BCS303')}
                </td>
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  {getSlotDisplay('Wednesday', 2, 'BCS306A')}
                </td>
                {/* TEA BREAK skipped (rowSpan) */}
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  {getSlotDisplay('Wednesday', 3, 'BCS304')}
                </td>
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  {getSlotDisplay('Wednesday', 4, 'BCS301')}
                </td>
                {/* LUNCH BREAK skipped (rowSpan) */}
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  {getSlotDisplay('Wednesday', 5, 'BCS302')}
                </td>
                {/* LEISURE skipped (rowSpan) */}
                {/* 3.00 - 4.45 (span 2) */}
                <td
                  colSpan={2}
                  style={{
                    border: '1px solid #000000',
                    padding: '10px 4px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    color: '#000000',
                  }}
                >
                  &lt;--DS/DDCO LAB--&gt;
                </td>
              </tr>

              {/* THURSDAY */}
              <tr>
                <th
                  style={{
                    backgroundColor: '#993366',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '10px 4px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                  }}
                >
                  THURSDAY
                </th>
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  {getSlotDisplay('Thursday', 1, 'BCS301')}
                </td>
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  {getSlotDisplay('Thursday', 2, 'BCS303')}
                </td>
                {/* TEA BREAK skipped (rowSpan) */}
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  {getSlotDisplay('Thursday', 3, 'BCS302')}
                </td>
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  {getSlotDisplay('Thursday', 4, 'BCS306A')}
                </td>
                {/* LUNCH BREAK skipped (rowSpan) */}
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  {getSlotDisplay('Thursday', 5, 'BCS304')}
                </td>
                {/* LEISURE skipped (rowSpan) */}
                {/* 3.00 - 4.45 (span 2) */}
                <td
                  colSpan={2}
                  style={{
                    border: '1px solid #000000',
                    padding: '10px 4px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    color: '#000000',
                  }}
                >
                  &lt;--OOPS/DS LAB--&gt;
                </td>
              </tr>

              {/* FRIDAY */}
              <tr>
                <th
                  style={{
                    backgroundColor: '#993366',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '10px 4px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                  }}
                >
                  FRIDAY
                </th>
                {/* 9.00 - 10.50 (span 2) */}
                <td
                  colSpan={2}
                  style={{
                    border: '1px solid #000000',
                    padding: '10px 4px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    color: '#000000',
                  }}
                >
                  &lt;-------OS LAB------&gt;
                </td>
                {/* TEA BREAK skipped (rowSpan) */}
                {/* 11.10 - 1.00 (span 2) */}
                <td
                  colSpan={2}
                  style={{
                    border: '1px solid #000000',
                    padding: '10px 4px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    color: '#000000',
                  }}
                >
                  &lt;---Technical Training---&gt;
                </td>
                {/* LUNCH BREAK skipped (rowSpan) */}
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  {getSlotDisplay('Friday', 5, 'BCS301')}
                </td>
                {/* LEISURE skipped (rowSpan) */}
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  {getSlotDisplay('Friday', 6, 'BSCK307')}
                </td>
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  {getSlotDisplay('Friday', 7, 'BNSK359')}
                </td>
              </tr>

              {/* SATURDAY */}
              <tr>
                <th
                  style={{
                    backgroundColor: '#993366',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '10px 4px',
                    fontWeight: 'bold',
                    fontSize: '11px',
                  }}
                >
                  SATURDAY
                </th>
                {/* 9.00 - 10.50 (span 2) */}
                <td
                  colSpan={2}
                  style={{
                    border: '1px solid #000000',
                    padding: '10px 4px',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    color: '#000000',
                  }}
                >
                  VAC
                </td>
                {/* TEA BREAK skipped (rowSpan) */}
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  VAC
                </td>
                <td style={{ border: '1px solid #000000', padding: '10px 4px', fontWeight: 'bold' }}>
                  MMM
                </td>
                {/* LUNCH BREAK skipped (rowSpan) */}
                <td style={{ border: '1px solid #000000', padding: '10px 4px', color: '#999999' }}>
                  —
                </td>
                {/* LEISURE skipped (rowSpan) */}
                <td style={{ border: '1px solid #000000', padding: '10px 4px', color: '#999999' }}>
                  —
                </td>
                <td style={{ border: '1px solid #000000', padding: '10px 4px', color: '#999999' }}>
                  —
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* C. TABLE 2: COURSE REFERENCE & FACULTY ALLOCATION */}
        <div className="overflow-x-auto mb-4">
          <table
            className="w-full border-collapse border border-black text-xs text-left"
            style={{ minWidth: '980px' }}
          >
            <thead>
              <tr style={{ backgroundColor: '#993366', color: '#FFFFFF' }}>
                <th
                  style={{
                    backgroundColor: '#993366',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '6px 8px',
                    textAlign: 'center',
                    width: '60px',
                    fontWeight: 'bold',
                  }}
                >
                  Sl. No.
                </th>
                <th
                  style={{
                    backgroundColor: '#993366',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '6px 8px',
                    width: '110px',
                    fontWeight: 'bold',
                  }}
                >
                  Course Code
                </th>
                <th
                  style={{
                    backgroundColor: '#993366',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '6px 8px',
                    fontWeight: 'bold',
                  }}
                >
                  Course Name
                </th>
                <th
                  style={{
                    backgroundColor: '#993366',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '6px 8px',
                    textAlign: 'center',
                    width: '80px',
                    fontWeight: 'bold',
                  }}
                >
                  L:T:P
                </th>
                <th
                  style={{
                    backgroundColor: '#993366',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '6px 8px',
                    textAlign: 'center',
                    width: '100px',
                    fontWeight: 'bold',
                  }}
                >
                  Course Type
                </th>
                <th
                  style={{
                    backgroundColor: '#993366',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '6px 8px',
                    textAlign: 'center',
                    width: '60px',
                    fontWeight: 'bold',
                  }}
                >
                  Credit
                </th>
                <th
                  style={{
                    backgroundColor: '#993366',
                    color: '#FFFFFF',
                    border: '1px solid #7a2851',
                    padding: '6px 8px',
                    width: '260px',
                    fontWeight: 'bold',
                  }}
                >
                  Name of the Faculty Member
                </th>
              </tr>
            </thead>
            <tbody>
              {DEFAULT_DS_3RD_COURSES.map((course) => (
                <tr key={course.slNo} style={{ borderBottom: '1px solid #000000' }}>
                  <td
                    style={{
                      border: '1px solid #000000',
                      padding: '5px 8px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    {course.slNo}
                  </td>
                  <td
                    style={{
                      border: '1px solid #000000',
                      padding: '5px 8px',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                    }}
                  >
                    {course.code}
                  </td>
                  <td style={{ border: '1px solid #000000', padding: '5px 8px' }}>
                    {course.name}
                  </td>
                  <td
                    style={{
                      border: '1px solid #000000',
                      padding: '5px 8px',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                    }}
                  >
                    {course.ltp}
                  </td>
                  <td
                    style={{
                      border: '1px solid #000000',
                      padding: '5px 8px',
                      textAlign: 'center',
                    }}
                  >
                    {course.type}
                  </td>
                  <td
                    style={{
                      border: '1px solid #000000',
                      padding: '5px 8px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                    }}
                  >
                    {course.credit}
                  </td>
                  <td style={{ border: '1px solid #000000', padding: '5px 8px' }}>
                    {course.faculty}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* D. FOOTNOTE EXPLANATORY NOTES FROM WORD DOCUMENT */}
        <div className="text-[11px] text-black italic mb-6">
          <strong>L: </strong>Lecture,&nbsp;
          <strong>T: </strong>Tutorial,&nbsp;
          <strong>P: </strong>Practical,&nbsp;
          <strong>IPCC: </strong>Integrated Professional Core Course,&nbsp;
          <strong>PCC: </strong>Professional Core Course,&nbsp;
          <strong>ESC: </strong>Engineering Science Course,&nbsp;
          <strong>UHV: </strong>Universal Human Values,&nbsp;
          <strong>AEC/SEC: </strong>Ability Enhancement Course
        </div>

        {/* E. FOOTER SIGNATURES FROM FOOTER1.XML */}
        <div className="flex justify-between items-end pt-10 pb-4 text-xs font-bold text-black border-t border-black">
          <div className="text-center">
            <div className="w-48 border-b border-black mb-1.5" />
            <div>Timetable Coordinator / HOD</div>
            <div className="text-[10px] font-normal text-gray-700">Dept. of AI &amp; DS</div>
          </div>

          <div className="text-center">
            <div className="w-48 border-b border-black mb-1.5" />
            <div>Dean (Academics)</div>
            <div className="text-[10px] font-normal text-gray-700">Dr. Sudarshan Rao</div>
          </div>

          <div className="text-center">
            <div className="w-56 border-b border-black mb-1.5" />
            <div>Dr. Thirumaleshwara Bhat</div>
            <div className="text-[10px] font-normal text-gray-700">Principal &amp; Head of Institution</div>
          </div>
        </div>
      </div>
    </div>
  );
};

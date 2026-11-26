import React from 'react';
import smvitmLogo from '../../assets/smvitm_logo.webp';
import sodeLogo from '../../assets/sode_group_logo.png';

export interface TimetableDocumentHeaderProps {
  department: string;
  academicYear: string;
  semesterText: string;
  studentYear: string;
  section: string;
  room?: string;
  advisor?: string;
  approvalBadge?: React.ReactNode;
}

/**
 * Standard Institutional Timetable Header
 * Visually reproduces the official SMVITM VTU blueprint header with official logos.
 */
export const TimetableDocumentHeader: React.FC<TimetableDocumentHeaderProps> = ({
  department,
  academicYear,
  semesterText,
  studentYear,
  section,
  room,
  advisor,
  approvalBadge,
}) => {
  return (
    <div className="pb-3 border-b-2 border-primary space-y-1">
      <div className="flex items-center justify-between gap-4">
        {/* Left: SMVITM College Logo */}
        <img
          src={smvitmLogo}
          alt="SMVITM Logo"
          className="h-14 sm:h-16 w-auto object-contain flex-shrink-0"
        />

        {/* Center: Institutional Titles */}
        <div className="text-center flex-1 min-w-0">
          <div className="text-[10px] font-mono uppercase tracking-widest text-ink-light font-semibold">
            SHRI SODE VADIRAJA MUTT EDUCATION TRUST (R)
          </div>
          <h1 className="font-headline text-base sm:text-lg font-bold text-[#530e21] uppercase tracking-tight leading-tight">
            SHRI MADHWA VADIRAJA INSTITUTE OF TECHNOLOGY &amp; MANAGEMENT
          </h1>
          <div className="text-[10px] text-ink-muted">
            Vishwothama Nagar, Bantakal, Udupi – 574 115, Karnataka
          </div>
          <div className="pt-0.5">
            <h2 className="font-headline text-xs sm:text-sm font-bold text-primary uppercase tracking-wider">
              DEPARTMENT OF {department.toUpperCase()}
            </h2>
            <div className="inline-block mt-0.5 px-2.5 py-0.5 bg-canvas-muted rounded text-[10px] sm:text-[11px] font-mono font-semibold text-primary border border-border-subtle">
              CLASS TIMETABLE — ACADEMIC YEAR {academicYear} ({semesterText.toUpperCase()})
            </div>
          </div>
        </div>

        {/* Right: Sode Trust Logo */}
        <img
          src={sodeLogo}
          alt="Sode Group Logo"
          className="h-12 sm:h-14 w-auto object-contain flex-shrink-0"
        />
      </div>

      {/* Class & Section Meta Strip */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-xs font-mono text-ink-muted pt-1 border-t border-border-subtle/50">
        <span>Class: <strong>{studentYear}</strong></span>
        <span>•</span>
        <span>Section: <strong>{section}</strong></span>
        {room && room.trim() && room !== 'LH-201' && !room.toLowerCase().includes('provisional') && (
          <>
            <span>•</span>
            <span>Venue: <strong>{room}</strong></span>
          </>
        )}
        {advisor && (
          <>
            <span>•</span>
            <span>Advisor: <strong>{advisor}</strong></span>
          </>
        )}
        {approvalBadge && (
          <>
            <span>•</span>
            <span>{approvalBadge}</span>
          </>
        )}
      </div>
    </div>
  );
};

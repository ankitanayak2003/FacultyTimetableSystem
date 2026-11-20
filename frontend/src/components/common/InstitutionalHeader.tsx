import React from 'react';
import smvitmLogo from '../../assets/smvitm_logo.webp';
import sodeLogo from '../../assets/sode_group_logo.png';

export const InstitutionalHeader: React.FC = () => {
  return (
    <header className="sticky top-0 z-50 w-full bg-surface border-b border-border-beige py-2 px-4 sm:px-6 shadow-crisp-sm flex-shrink-0">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: SMVITM Logo & Name */}
        <div className="flex items-center gap-3">
          <img
            src={smvitmLogo}
            alt="SMVITM Logo"
            className="h-9 sm:h-10 w-auto object-contain flex-shrink-0"
          />
          <div className="min-w-0">
            <h1 className="font-headline font-semibold text-xs sm:text-sm text-primary tracking-tight uppercase leading-tight truncate">
              Shri Madhwa Vadiraja Institute of Technology &amp; Management
            </h1>
            <p className="text-[10px] sm:text-[11px] text-ink-muted truncate hidden xs:block">
              A Unit of Shri Sode Vadiraja Mutt Education Trust • Vishwothama Nagar, Bantakal, Udupi
            </p>
          </div>
        </div>

        {/* Right: Sode Group Logo & Accreditations */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="text-right hidden md:block">
            <span className="block text-[10px] font-mono text-ink-light uppercase tracking-wider">
              Affiliated to VTU, Belagavi
            </span>
            <span className="text-[9px] font-mono font-medium text-accent-teal uppercase">
              NAAC 'A' Grade • AICTE Approved
            </span>
          </div>
          <img
            src={sodeLogo}
            alt="Sode Group Logo"
            className="h-8 sm:h-9 w-auto object-contain flex-shrink-0"
          />
        </div>
      </div>
    </header>
  );
};

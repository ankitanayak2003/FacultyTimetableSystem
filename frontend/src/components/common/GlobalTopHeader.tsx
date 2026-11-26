import React from 'react';
import { AqsBrandLogo } from './AqsBrandLogo';
import { ScrambledText } from './ScrambledText';
import { useAuth } from '../../context/AuthContext';

export interface GlobalTopHeaderProps {
  userName: string;
  // Optional parameters preserved for interface compatibility
  breadcrumbCategory?: string;
  breadcrumbModule?: string;
  pageTitle?: string;
  academicYear?: string;
  onToggleMobileNav?: () => void;
}

/**
 * Global Top Header Bar (All AQS User Roles)
 * Fixed at the top of the viewport (position: fixed, top: 0, left: 0, right: 0, z-50).
 *
 * Left side:
 * - AQS Brand: Noticeably enlarged, preserving exact ROMUSA font from login branding without different animations.
 * - Divider: Subtle vertical separator (|).
 * - Tagline: "Where Every Academic Hour Finds Its Purpose and Every Schedule Finds Its Rhythm."
 *   Animated with official React Bits ScrambledText, completes within under 2s, settles to readable static text.
 *
 * Right side:
 * - Logged-in user's name only.
 *
 * No logos, avatars, icons, badges, breadcrumbs or page titles.
 */
export const GlobalTopHeader: React.FC<GlobalTopHeaderProps> = ({
  userName,
}) => {
  const { currentUser } = useAuth();
  const displayUserName = currentUser?.displayName || userName;
  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-surface border-b border-border-beige h-14 px-4 sm:px-6 shadow-crisp-sm transition-none">
      <div className="h-full flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* LEFT SIDE: AQS Brand Name & Animated Tagline */}
        <div className="flex items-center min-w-0 select-none">
          {/* AQS Brand Name – Enlarged and prominent, preserving exact login branding geometry */}
          <AqsBrandLogo
            className="h-8.5 sm:h-9.5 md:h-10 w-auto text-primary flex-shrink-0"
          />

          {/* Divider & Complete Tagline */}
          <div className="hidden md:flex items-center min-w-0 ml-3 sm:ml-4">
            <span
              className="text-border-beige font-light text-lg sm:text-xl lg:text-2xl mr-3 sm:mr-4 select-none flex-shrink-0"
              aria-hidden="true"
            >
              |
            </span>
            <ScrambledText
              radius={100}
              duration={1.2}
              speed={0.5}
              scrambleChars=".:"
              effect="scramble"
              strength={1}
              trail={0.6}
              clickBurst={false}
              intro={true}
              className="font-headline italic text-sm md:text-[14.5px] lg:text-[15.5px] text-ink-muted font-normal tracking-normal select-none truncate"
            >
              Where Every Academic Hour Finds Its Purpose and Every Schedule Finds Its Rhythm.
            </ScrambledText>
          </div>
        </div>

        {/* RIGHT SIDE: Logged-in User Name */}
        <div className="flex items-center select-none flex-shrink-0">
          <span className="font-semibold text-ink text-sm sm:text-base tracking-tight">
            {displayUserName}
          </span>
        </div>
      </div>
    </header>
  );
};

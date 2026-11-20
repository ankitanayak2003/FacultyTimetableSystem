import React, { useState, useRef, useEffect } from 'react';
import { LogOut, ChevronDown } from 'lucide-react';

export interface NavItem {
  id: string;
  label: string;
}

export interface RetractableNavBarProps {
  items: NavItem[];
  activeTab: string;
  onSelectTab: (id: string) => void;
  onLogout: () => void;
  isOpenControlled?: boolean;
  onToggleControlled?: () => void;
}

/**
 * Retractable Hidden Navigation Bar
 * Layering:
 * 1. Fixed top header – z-50 (highest, stays permanently fixed at top).
 * 2. Navigation bar – z-40 (directly underneath the header).
 * 3. Page content – z-0/z-10 (below both).
 *
 * Inactive state:
 * - Slides upwards behind the fixed header.
 * - Only a subtle ~10px bottom tab/indicator peeks out below the 56px header.
 *
 * Active state:
 * - Smoothly slides downwards from behind the fixed header to directly below it (y=56px).
 * - Stays expanded while hovering over the navbar or its activation area.
 * - Smoothly retracts behind the header when cursor leaves with a 250ms anti-flicker delay.
 */
export const RetractableNavBar: React.FC<RetractableNavBarProps> = ({
  items,
  activeTab,
  onSelectTab,
  onLogout,
  isOpenControlled,
  onToggleControlled,
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOpen =
    isOpenControlled !== undefined
      ? isOpenControlled || internalIsOpen
      : internalIsOpen;

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setInternalIsOpen(true);
  };

  const handleMouseLeave = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    // 250ms anti-flicker grace period prevents jitter on rapid cursor transitions
    closeTimeoutRef.current = setTimeout(() => {
      setInternalIsOpen(false);
    }, 250);
  };

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const handleTabClick = (id: string) => {
    onSelectTab(id);
    setInternalIsOpen(false);
    if (onToggleControlled && isOpenControlled) {
      onToggleControlled();
    }
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 z-40 flex justify-center pointer-events-none select-none"
      aria-label="Navigation dock"
    >
      {/* Outer hover wrapper covering the active docking area */}
      <div
        className="pointer-events-auto relative flex flex-col items-center max-w-[94vw] sm:max-w-4xl"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Deep maroon sliding pill panel genuinely positioned behind the 56px header */}
        <div
          className={`bg-[#530e21] text-white rounded-b-2xl border-b border-x border-[#702536] transition-transform duration-300 ease-out flex flex-col items-center ${
            isOpen
              ? 'translate-y-[56px] shadow-2xl shadow-primary-dark/40'
              : 'translate-y-[calc(66px-100%)] shadow-md shadow-primary-dark/20'
          }`}
        >
          {/* Main Navigation Bar Content */}
          <div className="px-4 py-2 sm:px-6 sm:py-2.5 flex items-center gap-1.5 sm:gap-2.5 flex-wrap justify-center">
            {/* Primary Navigation Links */}
            <nav className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
              {items.map((item) => {
                const isActive = item.id === activeTab;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-150 ${
                      isActive
                        ? 'bg-white/20 text-white font-semibold shadow-inner'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Subtle Divider */}
            <div className="h-4 w-px bg-white/25 mx-1 sm:mx-1.5 hidden sm:block" />

            {/* Sign Out / Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-rose-200 hover:text-white hover:bg-rose-950/70 border border-transparent hover:border-rose-400/30 transition-all duration-150"
              title="Sign Out of AQS"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          {/* Bottom Pull Edge / Visual Grab Indicator */}
          <button
            type="button"
            onClick={() => {
              if (onToggleControlled) {
                onToggleControlled();
              } else {
                setInternalIsOpen((prev) => !prev);
              }
            }}
            className="w-full flex items-center justify-center py-0.5 hover:bg-white/5 transition-colors rounded-b-2xl focus:outline-none cursor-pointer"
            aria-label={
              isOpen ? 'Retract navigation bar' : 'Expand navigation bar'
            }
          >
            <div className="flex items-center gap-1 py-0.5">
              <span
                className={`transition-all duration-300 rounded-full ${
                  isOpen
                    ? 'w-10 h-1 bg-white/30'
                    : 'w-14 h-1.5 bg-rose-200/80 shadow-xs'
                }`}
              />
              {!isOpen && (
                <ChevronDown className="w-3 h-3 text-rose-200/90 -ml-0.5 animate-pulse" />
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

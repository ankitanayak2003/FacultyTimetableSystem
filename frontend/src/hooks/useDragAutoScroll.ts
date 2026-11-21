import { useEffect, useRef } from 'react';

export interface DragAutoScrollOptions {
  /**
   * Distance in pixels from the top boundary where upward scrolling begins.
   * Default: 130
   */
  topThreshold?: number;

  /**
   * Distance in pixels from the bottom of the viewport (or container)
   * where downward scrolling begins.
   * Default: 130
   */
  bottomThreshold?: number;

  /**
   * Distance in pixels from the left/right edges for horizontal auto-scrolling
   * inside horizontally overflowing tables.
   * Default: 70
   */
  horizontalThreshold?: number;

  /**
   * Height in pixels of the fixed top navigation/header bar (e.g. 56px).
   * Used to offset the top boundary for window scrolling so content doesn't get stuck behind the header.
   * Default: 56
   */
  headerOffset?: number;

  /**
   * Minimum scroll step in pixels per frame.
   * Default: 3
   */
  minSpeed?: number;

  /**
   * Maximum scroll step in pixels per frame.
   * Default: 16
   */
  maxSpeed?: number;

  /**
   * Whether auto-scrolling is enabled.
   * Default: true
   */
  enabled?: boolean;
}

/**
 * Searches up the DOM tree from `element` for an ancestor that is scrollable in the specified direction.
 */
function findScrollableAncestor(
  element: HTMLElement | null,
  direction: 'vertical' | 'horizontal'
): HTMLElement | null {
  let curr = element;
  while (curr && curr !== document.body && curr !== document.documentElement) {
    const style = window.getComputedStyle(curr);
    if (direction === 'vertical') {
      const overflowY = style.overflowY;
      if (
        (overflowY === 'auto' || overflowY === 'scroll') &&
        curr.scrollHeight > curr.clientHeight + 4
      ) {
        return curr;
      }
    } else {
      const overflowX = style.overflowX;
      if (
        (overflowX === 'auto' || overflowX === 'scroll') &&
        curr.scrollWidth > curr.clientWidth + 4
      ) {
        return curr;
      }
    }
    curr = curr.parentElement;
  }
  return null;
}

/**
 * Reusable Auto-Scroll Hook for Timetable Drag and Drop.
 *
 * Smoothly and automatically scrolls the window or containing scrollable element
 * when a user drags a subject card or timetable item near the edges of the visible screen.
 *
 * Features:
 * - Controlled activation zones near top and bottom edges (and left/right for wide timetable tables).
 * - Smooth progressive acceleration curve as cursor approaches the edge (no sudden jumps).
 * - High-precision 60fps requestAnimationFrame loop so scrolling continues even if mouse pauses.
 * - Respects the 56px fixed top header boundary.
 * - Safely stops when cursor leaves edge zones or when drag ends (drop, dragend, mouseup, Escape).
 * - Does not cancel native HTML5 drag-and-drop or interfere with drop target validation.
 */
export function useDragAutoScroll({
  topThreshold = 130,
  bottomThreshold = 130,
  horizontalThreshold = 70,
  headerOffset = 56,
  minSpeed = 3,
  maxSpeed = 16,
  enabled = true,
}: DragAutoScrollOptions = {}) {
  const isDraggingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);
  const lastClientXRef = useRef<number | null>(null);
  const lastClientYRef = useRef<number | null>(null);
  const lastTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const stopScrollLoop = () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };

    const scrollStep = () => {
      if (!isDraggingRef.current) {
        stopScrollLoop();
        return;
      }

      const clientY = lastClientYRef.current;
      const clientX = lastClientXRef.current;
      const target = lastTargetRef.current;

      if (clientY !== null && clientX !== null) {
        // --- 1. VERTICAL SCROLLING ---
        // First check if cursor is directly over an internal scrollable container
        const verticalContainer = findScrollableAncestor(target, 'vertical');

        let handledVertical = false;

        if (verticalContainer) {
          const rect = verticalContainer.getBoundingClientRect();
          const canScrollUp = verticalContainer.scrollTop > 0;
          const canScrollDown =
            verticalContainer.scrollTop + verticalContainer.clientHeight <
            verticalContainer.scrollHeight - 2;

          let vSpeed = 0;
          if (clientY >= rect.bottom - bottomThreshold && canScrollDown) {
            const dist = Math.max(0, rect.bottom - clientY);
            const ratio = Math.max(0, Math.min(1, (bottomThreshold - dist) / bottomThreshold));
            vSpeed = minSpeed + (maxSpeed - minSpeed) * Math.pow(ratio, 1.5);
          } else if (clientY <= rect.top + topThreshold && canScrollUp) {
            const dist = Math.max(0, clientY - rect.top);
            const ratio = Math.max(0, Math.min(1, (topThreshold - dist) / topThreshold));
            vSpeed = -(minSpeed + (maxSpeed - minSpeed) * Math.pow(ratio, 1.5));
          }

          if (vSpeed !== 0) {
            verticalContainer.scrollTop += vSpeed;
            handledVertical = true;
          }
        }

        // If not handled by an internal container, scroll the main window / document
        if (!handledVertical) {
          const windowHeight = window.innerHeight;
          const currentScrollY = window.scrollY || document.documentElement.scrollTop;
          const maxScrollY =
            (document.documentElement.scrollHeight || document.body.scrollHeight) - windowHeight;

          const canScrollUp = currentScrollY > 0;
          const canScrollDown = currentScrollY < maxScrollY - 2;

          const topBoundary = headerOffset; // Account for the 56px fixed header
          let vSpeed = 0;

          // Bottom edge trigger
          if (clientY >= windowHeight - bottomThreshold && canScrollDown) {
            const dist = Math.max(0, windowHeight - clientY);
            const ratio = Math.max(0, Math.min(1, (bottomThreshold - dist) / bottomThreshold));
            vSpeed = minSpeed + (maxSpeed - minSpeed) * Math.pow(ratio, 1.5);
          }
          // Top edge trigger
          else if (clientY <= topBoundary + topThreshold && canScrollUp) {
            const dist = Math.max(0, clientY - topBoundary);
            const ratio = Math.max(0, Math.min(1, (topThreshold - dist) / topThreshold));
            vSpeed = -(minSpeed + (maxSpeed - minSpeed) * Math.pow(ratio, 1.5));
          }

          if (vSpeed !== 0) {
            window.scrollBy({ top: vSpeed, behavior: 'auto' });
          }
        }

        // --- 2. HORIZONTAL SCROLLING ---
        // Checks if cursor is near edges of horizontally overflowing table wrappers
        const horizContainer = findScrollableAncestor(target, 'horizontal');
        if (horizContainer) {
          const rect = horizContainer.getBoundingClientRect();
          const canScrollLeft = horizContainer.scrollLeft > 0;
          const canScrollRight =
            horizContainer.scrollLeft + horizContainer.clientWidth <
            horizContainer.scrollWidth - 2;

          let hSpeed = 0;
          if (clientX >= rect.right - horizontalThreshold && canScrollRight) {
            const dist = Math.max(0, rect.right - clientX);
            const ratio = Math.max(0, Math.min(1, (horizontalThreshold - dist) / horizontalThreshold));
            hSpeed = minSpeed + (maxSpeed - minSpeed) * Math.pow(ratio, 1.5);
          } else if (clientX <= rect.left + horizontalThreshold && canScrollLeft) {
            const dist = Math.max(0, clientX - rect.left);
            const ratio = Math.max(0, Math.min(1, (horizontalThreshold - dist) / horizontalThreshold));
            hSpeed = -(minSpeed + (maxSpeed - minSpeed) * Math.pow(ratio, 1.5));
          }

          if (hSpeed !== 0) {
            horizContainer.scrollLeft += hSpeed;
          }
        }
      }

      rafIdRef.current = requestAnimationFrame(scrollStep);
    };

    const startScrollLoop = () => {
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(scrollStep);
      }
    };

    const handleDragStart = () => {
      isDraggingRef.current = true;
      startScrollLoop();
    };

    const handleDragOver = (e: DragEvent) => {
      isDraggingRef.current = true;
      lastClientXRef.current = e.clientX;
      lastClientYRef.current = e.clientY;
      lastTargetRef.current = e.target as HTMLElement;
      startScrollLoop();
    };

    const handleDragEnd = () => {
      isDraggingRef.current = false;
      lastClientXRef.current = null;
      lastClientYRef.current = null;
      lastTargetRef.current = null;
      stopScrollLoop();
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        handleDragEnd();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDraggingRef.current) {
        handleDragEnd();
      }
    };

    // Global capture listeners ensure every drag movement is tracked
    window.addEventListener('dragstart', handleDragStart, { capture: true });
    window.addEventListener('dragover', handleDragOver, { capture: true });
    window.addEventListener('dragend', handleDragEnd, { capture: true });
    window.addEventListener('drop', handleDragEnd, { capture: true });
    window.addEventListener('mouseup', handleMouseUp, { capture: true });
    window.addEventListener('keydown', handleKeyDown, { capture: true });

    return () => {
      stopScrollLoop();
      window.removeEventListener('dragstart', handleDragStart, { capture: true });
      window.removeEventListener('dragover', handleDragOver, { capture: true });
      window.removeEventListener('dragend', handleDragEnd, { capture: true });
      window.removeEventListener('drop', handleDragEnd, { capture: true });
      window.removeEventListener('mouseup', handleMouseUp, { capture: true });
      window.removeEventListener('keydown', handleKeyDown, { capture: true });
    };
  }, [
    topThreshold,
    bottomThreshold,
    horizontalThreshold,
    headerOffset,
    minSpeed,
    maxSpeed,
    enabled,
  ]);
}

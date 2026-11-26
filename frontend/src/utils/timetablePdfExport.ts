import html2pdfModule, { Html2PdfOptions } from 'html2pdf.js';

// Resolve CJS / ESM default export safely for Vite
const html2pdf = (html2pdfModule as any).default || html2pdfModule;

/**
 * Standard department code normalizer
 */
export function getDepartmentCode(rawDept?: string): string {
  if (!rawDept) return 'AIDS';
  const d = rawDept.trim();
  const lower = d.toLowerCase();

  if (lower.includes('data science') || lower.includes('(ds)') || lower === 'ds') {
    if (lower.includes('artificial intelligence') || lower.includes('ai & ds') || lower.includes('aids')) {
      return 'AIDS';
    }
    return 'DS';
  }
  if (lower.includes('artificial intelligence') || lower.includes('ai & ds') || lower === 'aids') {
    return 'AIDS';
  }
  if (lower.includes('aiml') || lower.includes('machine learning')) {
    return 'AIML';
  }
  if (lower.includes('computer science') || lower === 'cse') {
    return 'CSE';
  }
  if (lower.includes('electronics') || lower === 'ece' || lower === 'ec') {
    return 'ECE';
  }
  if (lower.includes('mechanical') || lower === 'mech') {
    return 'MECH';
  }
  if (lower.includes('civil') || lower === 'civil') {
    return 'CIVIL';
  }
  if (lower.includes('physics')) {
    return 'Physics';
  }
  if (lower.includes('chemistry')) {
    return 'Chemistry';
  }
  return d.toUpperCase();
}

/**
 * Get ordinal suffix: 1 -> "1st", 3 -> "3rd", 4 -> "4th"
 */
function getOrdinal(num: number): string {
  if (num === 1) return '1st';
  if (num === 2) return '2nd';
  if (num === 3) return '3rd';
  return `${num}th`;
}

/**
 * Generate standard dynamic filename according to AQS requirements:
 * Format examples:
 * - `Class Timetable DS-3rd sem.pdf`
 * - `Class Timetable AIDS-5th sem.pdf`
 * - `Class Timetable CSE-7th sem.pdf`
 * - `Class Timetable First Year-A.pdf`
 * - `Class Timetable Physics-A.pdf`
 */
export function getTimetablePdfFilename({
  department,
  studentYear,
  semester,
  section,
  cycle,
  customPrefix,
}: {
  department?: string;
  studentYear?: string;
  semester?: string | number;
  section?: string;
  cycle?: string;
  customPrefix?: string;
}): string {
  if (customPrefix) {
    return customPrefix.endsWith('.pdf') ? customPrefix : `${customPrefix}.pdf`;
  }

  const isFirstYear =
    studentYear?.toLowerCase().includes('first') ||
    studentYear === '1' ||
    studentYear === '1st Year' ||
    Boolean(cycle);

  const cleanSec = (section || 'A').replace(/^Section\s+/i, '').trim();

  // 1. First Year & Cycle timetables
  if (isFirstYear) {
    if (cycle) {
      const cycleName = cycle.replace(/\s*cycle\s*/i, '').trim();
      return `Class Timetable ${cycleName}-${cleanSec}.pdf`;
    }
    return `Class Timetable First Year-${cleanSec}.pdf`;
  }

  // 2. Department timetables: Determine semester string
  let semStr = '3rd sem';
  const semRaw = (semester !== undefined && semester !== null) ? String(semester).trim() : '';
  const semLower = semRaw.toLowerCase();
  const yrLower = (studentYear || '').toLowerCase();
  const isEven = semLower.includes('even');

  // Check if explicit semester number is present (e.g. '3', '3rd', 'Semester 5', '7th sem')
  // Avoid treating '2nd Year' as semester 2 if semester is separately specified
  const digitMatch = semRaw.match(/\b([1-8])(?:st|nd|rd|th)?\b/i) || semRaw.match(/(\d+)/);
  if (digitMatch && !semLower.includes('year') && !semLower.includes('odd') && !semLower.includes('even')) {
    const num = parseInt(digitMatch[1], 10);
    if (num >= 1 && num <= 8) {
      semStr = `${getOrdinal(num)} sem`;
    }
  } else {
    // Derive from studentYear and semester type (Odd vs Even)
    if (yrLower.includes('2nd') || yrLower.includes('second') || yrLower === '2') {
      semStr = isEven ? '4th sem' : '3rd sem';
    } else if (yrLower.includes('3rd') || yrLower.includes('third') || yrLower === '3') {
      semStr = isEven ? '6th sem' : '5th sem';
    } else if (yrLower.includes('4th') || yrLower.includes('fourth') || yrLower.includes('final') || yrLower === '4') {
      semStr = isEven ? '8th sem' : '7th sem';
    } else {
      semStr = isEven ? '4th sem' : '3rd sem';
    }
  }

  const deptCode = getDepartmentCode(department || 'AIDS');
  
  // For Section B or non-A sections, include section tag; for Section A, match exact required format "Class Timetable DS-3rd sem.pdf"
  if (cleanSec && cleanSec !== 'A' && cleanSec !== '1') {
    return `Class Timetable ${deptCode}-${semStr}-${cleanSec}.pdf`;
  }
  return `Class Timetable ${deptCode}-${semStr}.pdf`;
}

/**
 * Direct PDF Download Utility for AQS Timetables
 *
 * Captures the dedicated timetable DOM element at high resolution (2x),
 * preserving all VTU grid colors, headers, college logos, and Table 1 registries.
 * Does NOT trigger window.print(). Directly downloads the .pdf file.
 */
export async function exportElementToPdf(
  targetElement: HTMLElement,
  filename: string,
  options?: {
    orientation?: 'portrait' | 'landscape';
  }
): Promise<void> {
  if (!targetElement) {
    throw new Error('Target element for PDF export not found.');
  }

  // 1. Wait for document fonts and images to load completely
  if (document.fonts) {
    await document.fonts.ready;
  }
  const images = Array.from(targetElement.querySelectorAll('img'));
  await Promise.all(
    images.map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );

  // 2. Clone the target container to an offscreen sandbox element
  // This guarantees full desktop layout without any horizontal scroll clipping or media-query interference
  const clone = targetElement.cloneNode(true) as HTMLElement;

  clone.style.position = 'fixed';
  clone.style.left = '-99999px';
  clone.style.top = '0';
  clone.style.width = '1120px';
  clone.style.minWidth = '1120px';
  clone.style.maxWidth = '1120px';
  clone.style.padding = '24px';
  clone.style.backgroundColor = '#ffffff';
  clone.style.color = '#000000';
  clone.style.boxSizing = 'border-box';
  clone.style.zIndex = '-9999';

  // Ensure all inner scrollbars are set to visible
  clone.querySelectorAll('.overflow-x-auto, [class*="overflow"]').forEach((el) => {
    (el as HTMLElement).style.overflow = 'visible';
    (el as HTMLElement).style.maxWidth = 'none';
  });

  // Ensure print-only elements are visible and print-hidden elements are excluded
  clone.querySelectorAll('.print\\:hidden, [class*="print:hidden"]').forEach((el) => {
    (el as HTMLElement).style.display = 'none';
  });
  clone.querySelectorAll('.hidden.print\\:block, [class*="hidden print:block"]').forEach((el) => {
    (el as HTMLElement).style.display = 'block';
  });

  document.body.appendChild(clone);

  try {
    const finalFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;

    const opt: Html2PdfOptions = {
      margin: [6, 6, 6, 6],
      filename: finalFilename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        letterRendering: true,
        backgroundColor: '#ffffff',
        scrollY: 0,
        scrollX: 0,
        windowWidth: 1200,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: options?.orientation || 'landscape',
        compress: true,
      },
      pagebreak: {
        mode: ['avoid-all', 'css', 'legacy'],
      },
    };

    // Small rendering delay to allow canvas painting
    await new Promise((r) => setTimeout(r, 150));

    await html2pdf().set(opt).from(clone).save();
  } finally {
    if (clone.parentNode) {
      clone.parentNode.removeChild(clone);
    }
  }
}

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { exportElementToPdf } from '../../utils/timetablePdfExport';

export interface DownloadPdfButtonProps {
  targetRef: React.RefObject<HTMLElement>;
  filename: string | (() => string);
  label?: string;
  className?: string;
  orientation?: 'portrait' | 'landscape';
  disabled?: boolean;
  onBeforeDownload?: () => Promise<void> | void;
  onAfterDownload?: () => Promise<void> | void;
}

/**
 * Reusable Download PDF Button for AQS Timetables
 *
 * Replaces old window.print() buttons with a direct client-side PDF file download.
 * Does NOT open the browser print dialog.
 */
export const DownloadPdfButton: React.FC<DownloadPdfButtonProps> = ({
  targetRef,
  filename,
  label = 'Download PDF',
  className = 'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-canvas-paper hover:bg-canvas text-primary border border-primary hover:border-primary-hover transition-colors shadow-crisp-sm',
  orientation = 'landscape',
  disabled = false,
  onBeforeDownload,
  onAfterDownload,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleDownload = async () => {
    if (isGenerating || disabled) return;

    if (!targetRef.current) {
      alert('Unable to generate PDF: timetable container element not found.');
      return;
    }

    setIsGenerating(true);
    try {
      if (onBeforeDownload) {
        await onBeforeDownload();
      }

      const resolvedFilename = typeof filename === 'function' ? filename() : filename;
      await exportElementToPdf(targetRef.current, resolvedFilename, { orientation });

      if (onAfterDownload) {
        await onAfterDownload();
      }
    } catch (err) {
      console.error('Failed to generate timetable PDF:', err);
      alert('An error occurred while generating the PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={disabled || isGenerating}
      title="Download official timetable PDF"
      className={`${className} ${
        disabled || isGenerating ? 'opacity-60 cursor-not-allowed' : ''
      }`}
    >
      {isGenerating ? (
        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
      ) : (
        <Download className="w-3.5 h-3.5 text-primary" />
      )}
      <span>{isGenerating ? 'Generating PDF...' : label}</span>
    </button>
  );
};

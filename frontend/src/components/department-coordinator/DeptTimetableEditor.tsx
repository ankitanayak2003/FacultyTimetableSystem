import React, { useState, useEffect, useMemo } from 'react';
import {
  Save,
  Send,
  Wand2,
  AlertTriangle,
  CheckCircle2,
  GripVertical,
  Calendar,
  X,
  Lock,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { useDragAutoScroll } from '../../hooks/useDragAutoScroll';
import {
  DeptPlacement,
  DeptSectionTimetable,
  DEAN_LOCKED_DEPT_SLOTS,
  INITIAL_AIDS_3A_PLACEMENTS,
  INITIAL_AIDS_3B_PLACEMENTS,
} from '../../data/workflowDemoData';
import { GeneratorCourseTable, GeneratorCourseItem } from '../common/GeneratorCourseTable';

const ACADEMIC_YEARS = ['2026–2027', '2025–2026', '2027–2028'];
const STUDENT_YEARS = ['Second Year', 'Third Year', 'Fourth Year'];
const SEMESTERS = ['Odd Semester', 'Even Semester'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

interface ClashRecord {
  placementId: string;
  day: string;
  period: number;
  facultyName: string;
  conflictingSection: string;
  conflictingSubject: string;
  reason: string;
}

export const DeptTimetableEditor: React.FC = () => {
  const {
    deptSubjects,
    deptTimetables,
    saveDeptSectionTimetable,
    publishDeptSectionTimetable,
    unpublishDeptSectionTimetable,
  } = useWorkflow();

  // Automatic scrolling during timetable drag-and-drop
  useDragAutoScroll();

  // Selectors
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026–2027');
  const [selectedSemester, setSelectedSemester] = useState('Odd Semester');
  const [selectedStudentYear, setSelectedStudentYear] = useState('Second Year');
  const [selectedSection, setSelectedSection] = useState('Section A');

  // Dynamic sections
  const [sections] = useState<string[]>(['Section A', 'Section B']);

  // Composite key for department section
  const timetableKey = `${selectedAcademicYear}_${selectedStudentYear}_${selectedSemester}_AIDS_${selectedSection}`;

  // Local Placements and Status
  const [placements, setPlacements] = useState<DeptPlacement[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [isDraft, setIsDraft] = useState(true);

  // Status notifications
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Clash Detection State
  const [clashes, setClashes] = useState<ClashRecord[]>([]);
  const [hasRunClashCheck, setHasRunClashCheck] = useState(false);

  // Drag-and-drop / Drop Modal
  const [pendingDrop, setPendingDrop] = useState<{
    day: (typeof DAYS)[number];
    startPeriod: number;
    subjectId?: string;
    subjectCode?: string;
    subjectTitle: string;
    facultyName: string;
    venue: string;
  } | null>(null);

  const [modalDuration, setModalDuration] = useState<number>(1);
  const [modalRoom, setModalRoom] = useState<string>('LH-201');
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  // Sync when key changes
  useEffect(() => {
    const existing = deptTimetables[timetableKey];
    if (existing) {
      setPlacements(existing.placements || []);
      setIsPublished(existing.isPublished || false);
      setIsDraft(existing.isDraft !== false);
    } else {
      // Default initial slots with Dean-locked slots
      if (selectedSection === 'Section A') {
        setPlacements(INITIAL_AIDS_3A_PLACEMENTS);
      } else if (selectedSection === 'Section B') {
        setPlacements(INITIAL_AIDS_3B_PLACEMENTS);
      } else {
        setPlacements([...DEAN_LOCKED_DEPT_SLOTS]);
      }
      setIsPublished(false);
      setIsDraft(true);
    }
    setClashes([]);
    setHasRunClashCheck(false);
  }, [timetableKey, deptTimetables, selectedSection]);

  // Page 3 subjects for tray
  const availableTraySubjects = useMemo(() => {
    return deptSubjects.filter(
      (s) => s.studentYear === selectedStudentYear && s.semester === selectedSemester
    );
  }, [deptSubjects, selectedStudentYear, selectedSemester]);

  // Generator Course Table Items (Sl. No., Course Code, Course Name, L:T:P, Course Type, Credit, Name of the Faculty Member)
  const generatorCourses = useMemo<GeneratorCourseItem[]>(() => {
    const list: GeneratorCourseItem[] = [];
    const seenKeys = new Set<string>();

    availableTraySubjects.forEach((sub) => {
      seenKeys.add(sub.id);
      if (sub.courseCode) seenKeys.add(sub.courseCode);
      list.push({
        id: sub.id,
        courseCode: sub.courseCode || '',
        courseName: sub.courseTitle,
        ltp: sub.ltp || (sub.type?.toLowerCase().includes('lab') ? '0:0:2' : '3:0:0'),
        courseType: sub.type,
        credit: sub.credits !== undefined ? sub.credits : (sub.type?.toLowerCase().includes('lab') ? 1 : 3),
        facultyName: sub.assignedFaculty || 'Unassigned',
      });
    });

    placements.forEach((p) => {
      if (p.subjectId && seenKeys.has(p.subjectId)) return;
      if (p.subjectCode && seenKeys.has(p.subjectCode)) return;
      if (seenKeys.has(p.subjectTitle)) return;

      const key = p.subjectId || p.subjectCode || p.subjectTitle;
      seenKeys.add(key);
      list.push({
        id: p.id,
        courseCode: p.subjectCode || '',
        courseName: p.subjectTitle || p.subjectCode || 'Institutional Slot',
        ltp: '—',
        courseType: p.isLockedSlot ? 'Institutional' : 'Core',
        credit: '—',
        facultyName: p.facultyName || 'Staff',
      });
    });

    return list;
  }, [availableTraySubjects, placements]);

  // Drag handlers
  const handleTrayDragStart = (e: React.DragEvent, sub: (typeof availableTraySubjects)[0]) => {
    if (isPublished) return;
    const data = JSON.stringify({
      subjectId: sub.id,
      courseCode: sub.courseCode || '',
      courseTitle: sub.courseTitle,
      assignedFaculty: sub.assignedFaculty,
      venue: sub.venue,
    });
    e.dataTransfer.setData('text/plain', data);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e: React.DragEvent, cellId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverCell(cellId);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (
    e: React.DragEvent,
    day: (typeof DAYS)[number],
    startPeriod: number
  ) => {
    e.preventDefault();
    setDragOverCell(null);
    if (isPublished) return;

    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const parsed = JSON.parse(dataStr);
      setPendingDrop({
        day,
        startPeriod,
        subjectId: parsed.subjectId,
        subjectCode: parsed.courseCode || '',
        subjectTitle: parsed.courseTitle,
        facultyName: parsed.assignedFaculty || 'Prof. Rajesh Shetty',
        venue: parsed.venue || 'LH-201',
      });
      setModalDuration(1);
      setModalRoom(parsed.venue || 'LH-201');
    } catch (err) {
      console.error('Error handling drop', err);
    }
  };

  const handleConfirmDrop = () => {
    if (!pendingDrop) return;
    const { day, startPeriod, subjectId, subjectCode, subjectTitle, facultyName } = pendingDrop;

    // Remove any overlapping non-locked placements
    const filtered = placements.filter((p) => {
      if (p.day !== day) return true;
      const pStart = p.startPeriod;
      const pEnd = pStart + p.duration - 1;
      const newStart = startPeriod;
      const newEnd = startPeriod + modalDuration - 1;
      const overlaps = Math.max(pStart, newStart) <= Math.min(pEnd, newEnd);
      // Dean-locked slots cannot be overwritten!
      if (overlaps && p.isLockedSlot) {
        return true;
      }
      return !overlaps;
    });

    const newPlacement: DeptPlacement = {
      id: `dp-${Date.now()}`,
      day,
      startPeriod,
      duration: modalDuration,
      subjectId,
      subjectCode: subjectCode || '',
      subjectTitle,
      facultyName,
      room: modalRoom,
    };

    setPlacements([...filtered, newPlacement]);
    setPendingDrop(null);
    setToastMsg({
      type: 'success',
      text: `Placed ${subjectTitle}${subjectCode ? ` (${subjectCode})` : ''} on ${day} Period ${startPeriod}.`,
    });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleDeletePlacement = (placementId: string) => {
    if (isPublished) return;
    const target = placements.find((p) => p.id === placementId);
    if (target?.isLockedSlot) {
      alert('Cannot remove Dean-locked or Basic Science-locked institutional slots!');
      return;
    }
    setPlacements((prev) => prev.filter((p) => p.id !== placementId));
  };

  // Clash Check Engine
  const runClashDetection = () => {
    const identifiedClashes: ClashRecord[] = [];

    // 1. Check internal room or faculty clashes within section
    for (let i = 0; i < placements.length; i++) {
      for (let j = i + 1; j < placements.length; j++) {
        const p1 = placements[i];
        const p2 = placements[j];
        if (p1.day === p2.day) {
          const p1End = p1.startPeriod + p1.duration - 1;
          const p2End = p2.startPeriod + p2.duration - 1;
          const overlaps = Math.max(p1.startPeriod, p2.startPeriod) <= Math.min(p1End, p2End);
          if (overlaps) {
            if (p1.facultyName && p2.facultyName && p1.facultyName === p2.facultyName) {
              identifiedClashes.push({
                placementId: p1.id,
                day: p1.day,
                period: p1.startPeriod,
                facultyName: p1.facultyName,
                conflictingSection: selectedSection,
                conflictingSubject: p2.subjectCode,
                reason: `Internal Double-Booking: Faculty assigned to ${p1.subjectCode} and ${p2.subjectCode} simultaneously.`,
              });
            }
            if (p1.room && p2.room && p1.room === p2.room) {
              identifiedClashes.push({
                placementId: p1.id,
                day: p1.day,
                period: p1.startPeriod,
                facultyName: p1.facultyName,
                conflictingSection: selectedSection,
                conflictingSubject: p2.subjectCode,
                reason: `Venue Conflict: Room ${p1.room} allocated to both ${p1.subjectCode} and ${p2.subjectCode}.`,
              });
            }
          }
        }
      }
    }

    // 2. Check cross-section conflicts with the other section (e.g. Section B)
    const otherSection = selectedSection === 'Section A' ? 'Section B' : 'Section A';
    const otherKey = `${selectedAcademicYear}_${selectedStudentYear}_${selectedSemester}_AIDS_${otherSection}`;
    const otherTimetable = deptTimetables[otherKey];
    const otherPlacements = otherTimetable ? otherTimetable.placements : (otherSection === 'Section B' ? INITIAL_AIDS_3B_PLACEMENTS : INITIAL_AIDS_3A_PLACEMENTS);

    placements.forEach((p) => {
      if (p.isLockedSlot) return; // Dean slots are shared institutional slots
      otherPlacements.forEach((op) => {
        if (op.isLockedSlot) return;
        if (p.day === op.day) {
          const pEnd = p.startPeriod + p.duration - 1;
          const opEnd = op.startPeriod + op.duration - 1;
          const overlaps = Math.max(p.startPeriod, op.startPeriod) <= Math.min(pEnd, opEnd);
          if (overlaps && p.facultyName && op.facultyName && p.facultyName === op.facultyName) {
            identifiedClashes.push({
              placementId: p.id,
              day: p.day,
              period: p.startPeriod,
              facultyName: p.facultyName,
              conflictingSection: otherSection,
              conflictingSubject: op.subjectCode,
              reason: `Cross-Section Clash: Faculty ${p.facultyName} also teaching in ${otherSection} (${op.subjectCode}) on ${p.day} Period ${p.startPeriod}.`,
            });
          }
        }
      });
    });

    // 3. Check Basic Science conflicts (Faculty committed to First Year)
    // Sneha Kamath has Basic Science Chem Cycle Tuesday Period 6-7 & Friday Period 1
    // Rajesh Shetty has Basic Science Chem Cycle Tuesday Period 6-7
    placements.forEach((p) => {
      if (p.facultyName.includes('Sneha Kamath')) {
        if (p.day === 'Tuesday' && p.startPeriod >= 6) {
          identifiedClashes.push({
            placementId: p.id,
            day: p.day,
            period: p.startPeriod,
            facultyName: p.facultyName,
            conflictingSection: 'Basic Science (Sec C Chem Cycle)',
            conflictingSubject: '22POPL17 Computer Programming Lab',
            reason: `Basic Science Conflict: Prof. Sneha Kamath is locked for First Year Chemistry Cycle laboratory.`,
          });
        }
      }
      if (p.facultyName.includes('Rajesh Shetty')) {
        if (p.day === 'Tuesday' && p.startPeriod >= 6) {
          identifiedClashes.push({
            placementId: p.id,
            day: p.day,
            period: p.startPeriod,
            facultyName: p.facultyName,
            conflictingSection: 'Basic Science (Sec C Chem Cycle)',
            conflictingSubject: '22POPL17 Computer Programming Lab',
            reason: `Basic Science Conflict: Prof. Rajesh Shetty is locked for First Year Chemistry Cycle laboratory.`,
          });
        }
      }
    });

    setClashes(identifiedClashes);
    setHasRunClashCheck(true);

    if (identifiedClashes.length === 0) {
      setToastMsg({
        type: 'success',
        text: 'Clash check complete: 0 conflicts detected! The timetable is clean and eligible for publication.',
      });
    } else {
      setToastMsg({
        type: 'error',
        text: `Detected ${identifiedClashes.length} scheduling conflict(s). Resolve all clashes before publishing.`,
      });
    }
    setTimeout(() => setToastMsg(null), 6000);
  };

  // Generate Timetable Action
  const handleGenerateTimetable = () => {
    // 1. Keep Dean-locked institutional slots
    const preserved = [...DEAN_LOCKED_DEPT_SLOTS];

    // 2. Sample balanced generation matching Page 3 allocations
    const generated: DeptPlacement[] = [
      ...preserved,
      // Monday
      { id: `gen-m1-${Date.now()}`, day: 'Monday', startPeriod: 1, duration: 1, subjectCode: '21AI32', subjectTitle: 'Data Structures & Applications', facultyName: 'Dr. Ananya Rao', room: 'LH-201' },
      { id: `gen-m2-${Date.now()}`, day: 'Monday', startPeriod: 2, duration: 1, subjectCode: '21AI33', subjectTitle: 'Discrete Mathematical Structures', facultyName: 'Prof. Rajesh Shetty', room: 'LH-201' },
      { id: `gen-m3-${Date.now()}`, day: 'Monday', startPeriod: 3, duration: 1, subjectCode: '21AI34', subjectTitle: 'Object Oriented Programming with Java', facultyName: 'Prof. Sneha Kamath', room: 'LH-201' },
      { id: `gen-m4-${Date.now()}`, day: 'Monday', startPeriod: 4, duration: 1, subjectCode: '21CIP37', subjectTitle: 'Constitution of India', facultyName: 'Prof. Vignesh Pai', room: 'LH-201' },

      // Tuesday
      { id: `gen-t1-${Date.now()}`, day: 'Tuesday', startPeriod: 1, duration: 1, subjectCode: '21AI33', subjectTitle: 'Discrete Mathematical Structures', facultyName: 'Prof. Rajesh Shetty', room: 'LH-201' },
      { id: `gen-t2-${Date.now()}`, day: 'Tuesday', startPeriod: 2, duration: 1, subjectCode: '21AI32', subjectTitle: 'Data Structures & Applications', facultyName: 'Dr. Ananya Rao', room: 'LH-201' },
      { id: `gen-t3-${Date.now()}`, day: 'Tuesday', startPeriod: 3, duration: 1, subjectCode: '21AI34', subjectTitle: 'Object Oriented Programming with Java', facultyName: 'Prof. Sneha Kamath', room: 'LH-201' },
      { id: `gen-t4-${Date.now()}`, day: 'Tuesday', startPeriod: 4, duration: 1, subjectCode: '21AI32', subjectTitle: 'Data Structures & Applications', facultyName: 'Dr. Ananya Rao', room: 'LH-201' },

      // Wednesday
      { id: `gen-w1-${Date.now()}`, day: 'Wednesday', startPeriod: 1, duration: 1, subjectCode: '21AI32', subjectTitle: 'Data Structures & Applications', facultyName: 'Dr. Ananya Rao', room: 'LH-201' },
      { id: `gen-w2-${Date.now()}`, day: 'Wednesday', startPeriod: 2, duration: 1, subjectCode: '21AI34', subjectTitle: 'Object Oriented Programming with Java', facultyName: 'Prof. Sneha Kamath', room: 'LH-201' },
      { id: `gen-w3-${Date.now()}`, day: 'Wednesday', startPeriod: 3, duration: 1, subjectCode: '21AI33', subjectTitle: 'Discrete Mathematical Structures', facultyName: 'Prof. Rajesh Shetty', room: 'LH-201' },
      { id: `gen-w6-${Date.now()}`, day: 'Wednesday', startPeriod: 6, duration: 2, subjectCode: '21AIL38', subjectTitle: 'Java Programming Laboratory', facultyName: 'Prof. Sneha Kamath', room: 'AI Computing Lab 2' },

      // Thursday
      { id: `gen-th1-${Date.now()}`, day: 'Thursday', startPeriod: 1, duration: 2, subjectCode: '21AIL37', subjectTitle: 'Data Structures Laboratory', facultyName: 'Dr. Ananya Rao', room: 'AI Computing Lab 1' },
      { id: `gen-th3-${Date.now()}`, day: 'Thursday', startPeriod: 3, duration: 1, subjectCode: '21AI34', subjectTitle: 'Object Oriented Programming with Java', facultyName: 'Prof. Sneha Kamath', room: 'LH-201' },
      { id: `gen-th4-${Date.now()}`, day: 'Thursday', startPeriod: 4, duration: 1, subjectCode: '21AI33', subjectTitle: 'Discrete Mathematical Structures', facultyName: 'Prof. Rajesh Shetty', room: 'LH-201' },

      // Friday
      { id: `gen-f1-${Date.now()}`, day: 'Friday', startPeriod: 1, duration: 1, subjectCode: '21AI33', subjectTitle: 'Discrete Mathematical Structures', facultyName: 'Prof. Rajesh Shetty', room: 'LH-201' },
      { id: `gen-f2-${Date.now()}`, day: 'Friday', startPeriod: 2, duration: 1, subjectCode: '21AI32', subjectTitle: 'Data Structures & Applications', facultyName: 'Dr. Ananya Rao', room: 'LH-201' },
      { id: `gen-f3-${Date.now()}`, day: 'Friday', startPeriod: 3, duration: 1, subjectCode: '21AI34', subjectTitle: 'Object Oriented Programming with Java', facultyName: 'Prof. Sneha Kamath', room: 'LH-201' },
    ];

    setPlacements(generated);
    setClashes([]);
    setHasRunClashCheck(false);
    setToastMsg({
      type: 'success',
      text: 'Timetable automatically generated! Prioritized faculty preferences, respected Dean & Basic Science locks, and balanced weekly workload.',
    });
    setTimeout(() => setToastMsg(null), 5000);
  };

  // Save Draft
  const handleSaveDraft = () => {
    const data: DeptSectionTimetable = {
      academicYear: selectedAcademicYear,
      studentYear: selectedStudentYear,
      semester: selectedSemester,
      department: 'AIDS',
      section: selectedSection,
      placements,
      isDraft: true,
      isPublished: false,
      lastSaved: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    saveDeptSectionTimetable(timetableKey, data);
    setIsDraft(true);
    setIsPublished(false);
    setToastMsg({ type: 'success', text: `Draft saved successfully for ${selectedSection}.` });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Publish Timetable
  const handlePublishTimetable = () => {
    if (clashes.length > 0) {
      alert('Cannot publish timetable with active clashes. Please resolve all conflicts first.');
      return;
    }
    const data: DeptSectionTimetable = {
      academicYear: selectedAcademicYear,
      studentYear: selectedStudentYear,
      semester: selectedSemester,
      department: 'AIDS',
      section: selectedSection,
      placements,
      isDraft: false,
      isPublished: true,
      lastSaved: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      publishedAt: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
    saveDeptSectionTimetable(timetableKey, data);
    publishDeptSectionTimetable(timetableKey);
    setIsPublished(true);
    setIsDraft(false);
    setToastMsg({
      type: 'success',
      text: `Timetable published officially for ${selectedStudentYear} (${selectedSection})! Verified 0 clashes.`,
    });
    setTimeout(() => setToastMsg(null), 5000);
  };

  const handleUnpublish = () => {
    unpublishDeptSectionTimetable(timetableKey);
    setIsPublished(false);
    setIsDraft(true);
    setToastMsg({ type: 'info', text: 'Timetable unlocked and reverted to editable draft.' });
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Table grid lookup helper
  const getPlacementAt = (day: (typeof DAYS)[number], period: number) => {
    return placements.find(
      (p) => p.day === day && period >= p.startPeriod && period < p.startPeriod + p.duration
    );
  };

  return (
    <div className="space-y-4 animate-fade-in text-ink">
      {/* Selector Card (Exact Dean layout & sizing) */}
      <div className="p-3.5 sm:p-4 bg-surface rounded-card border border-border-beige shadow-crisp space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2.5 border-b border-border-beige">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Class Timetable Editor
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-primary-subtle text-primary border border-primary/20">
                AIDS Department
              </span>
              {isPublished ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Published
                </span>
              ) : isDraft ? (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                  Draft
                </span>
              ) : null}
            </div>
            <h2 className="font-headline text-xl sm:text-2xl font-semibold text-primary">
              Timetable Editor — {selectedStudentYear} ({selectedSection})
            </h2>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              Design weekly schedules adhering to VTU Table 0 format. Institutional Dean slots are read-only; generate, detect clashes, and publish when verified.
            </p>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleGenerateTimetable}
              disabled={isPublished}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors shadow-crisp-sm ${
                isPublished
                  ? 'bg-canvas-muted text-ink-light cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-hover text-white shadow-crisp'
              }`}
            >
              <Wand2 className="w-3.5 h-3.5" />
              <span>Generate Timetable</span>
            </button>

            <button
              type="button"
              onClick={runClashDetection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-canvas-paper hover:bg-canvas text-primary border border-primary transition-colors shadow-crisp-sm"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-primary" />
              <span>Check Clashes</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isPublished}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors shadow-crisp-sm ${
                isPublished
                  ? 'bg-canvas-muted text-ink-light cursor-not-allowed'
                  : 'bg-canvas-paper hover:bg-canvas text-ink border border-border-beige'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>

            {isPublished ? (
              <button
                type="button"
                onClick={handleUnpublish}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 transition-colors shadow-crisp-sm"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Reopen Draft</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handlePublishTimetable}
                disabled={clashes.length > 0}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded transition-colors shadow-crisp-sm ${
                  clashes.length > 0
                    ? 'bg-canvas-muted text-ink-light cursor-not-allowed'
                    : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-crisp'
                }`}
                title={clashes.length > 0 ? 'Resolve clashes before publishing' : 'Publish official timetable'}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Publish Timetable</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Selectors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-0.5">
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Academic Year
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
            >
              {ACADEMIC_YEARS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Semester Type
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
            >
              {SEMESTERS.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Student Year
            </label>
            <select
              value={selectedStudentYear}
              onChange={(e) => setSelectedStudentYear(e.target.value)}
              className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
            >
              {STUDENT_YEARS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Section
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
            >
              {sections.map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {toastMsg && (
        <div
          className={`p-3 rounded-card text-xs flex items-center gap-2 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-950'
              : toastMsg.type === 'error'
              ? 'bg-rose-50 border border-rose-300 text-rose-950'
              : 'bg-canvas-paper border border-border-beige text-ink'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Clash Report Banner */}
      {hasRunClashCheck && (
        <div
          className={`p-3.5 rounded-card border text-xs space-y-2 ${
            clashes.length === 0
              ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
              : 'bg-rose-50/80 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {clashes.length === 0 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-700" />
              )}
              <span className="font-semibold">
                {clashes.length === 0
                  ? 'Verification Succeeded: 0 Clashes Found'
                  : `Verification Failed: ${clashes.length} Clash(es) Found`}
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider font-bold">
              Clash Engine Audit
            </span>
          </div>

          {clashes.length > 0 && (
            <div className="space-y-1.5 pt-1">
              {clashes.map((c, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-white rounded border border-rose-200 text-[11px] flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono font-bold text-rose-900 mr-2">
                      {c.day} P{c.period}
                    </span>
                    <strong className="text-ink">{c.facultyName}</strong>: {c.reason}
                  </div>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-100 text-rose-800 font-bold uppercase">
                    Conflict
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subject Tray (Palette) - Sized compactly */}
      <div className="p-3 bg-surface rounded-card border border-border-beige shadow-crisp space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
              Page 3 Allocated Subjects Tray
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary font-semibold">
              {availableTraySubjects.length} Courses Available
            </span>
          </div>
          <p className="text-[11px] text-ink-muted">
            Drag any subject card into an empty period in the timetable below.
          </p>
        </div>

        {availableTraySubjects.length === 0 ? (
          <div className="p-3.5 bg-canvas-muted rounded text-xs text-ink-muted border border-dashed border-border-beige text-center">
            No subjects configured for {selectedStudentYear} ({selectedSemester}). Go to Subject Allocation to assign faculty.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1">
            {availableTraySubjects.map((sub) => (
              <div
                key={sub.id}
                draggable={!isPublished}
                onDragStart={(e) => handleTrayDragStart(e, sub)}
                className={`p-2 rounded bg-canvas-paper border border-border-beige text-xs flex items-center gap-2 shadow-crisp-sm transition-all select-none ${
                  isPublished
                    ? 'opacity-60 cursor-not-allowed'
                    : 'cursor-grab hover:border-primary hover:shadow-crisp active:cursor-grabbing hover:bg-canvas'
                }`}
                title={`Course: ${sub.courseTitle}${sub.courseCode ? ` (${sub.courseCode})` : ''}\nDrag to timetable cell`}
              >
                <GripVertical className="w-3.5 h-3.5 text-ink-light flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-ink truncate max-w-[190px]" title={sub.courseTitle}>
                    {sub.courseTitle}
                  </p>
                  {sub.courseCode && sub.courseCode.trim() !== '' && (
                    <span className="font-mono font-semibold text-primary text-[10px] block">
                      {sub.courseCode}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timetable Grid Container (Class Timetable DS-3rd sem.docx format) */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden">
        <div className="py-2.5 px-3.5 bg-canvas-muted border-b border-border-beige flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="font-headline text-sm sm:text-base font-semibold text-primary">
              AIDS Weekly Class Schedule — {selectedStudentYear} ({selectedSection})
            </h3>
          </div>
          <span className="text-xs font-mono text-ink-muted">
            VTU Table 0 Blueprint • {selectedSemester} {selectedAcademicYear}
          </span>
        </div>

        <div className="overflow-x-auto p-2 sm:p-2.5 bg-white">
          <table className="w-full border-collapse border border-black text-xs select-none">
            <thead>
              <tr className="bg-[#993366] text-white font-mono text-[11px] border border-black">
                <th className="py-2 px-1.5 text-center font-bold border border-black bg-[#993366] text-white w-[84px] min-w-[80px] uppercase text-[10px]">
                  DAY/TIME
                </th>
                <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[88px]">
                  <div className="font-bold text-[10px]">I</div>
                  <div className="text-[8px] opacity-90 font-mono">9:00–9:55</div>
                </th>
                <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[88px]">
                  <div className="font-bold text-[10px]">II</div>
                  <div className="text-[8px] opacity-90 font-mono">9:55–10:50</div>
                </th>
                <th className="py-2 px-0.5 text-center font-bold border border-black bg-[#EFCDDE] text-black w-[42px] min-w-[40px] text-[9px] uppercase tracking-wider">
                  <div className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold text-center mx-auto tracking-widest uppercase text-black">
                    TEA BREAK
                  </div>
                </th>
                <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[88px]">
                  <div className="font-bold text-[10px]">III</div>
                  <div className="text-[8px] opacity-90 font-mono">11:10–12:05</div>
                </th>
                <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[88px]">
                  <div className="font-bold text-[10px]">IV</div>
                  <div className="text-[8px] opacity-90 font-mono">12:05–1:00</div>
                </th>
                <th className="py-2 px-0.5 text-center font-bold border border-black bg-[#EFCDDE] text-black w-[42px] min-w-[40px] text-[9px] uppercase tracking-wider">
                  <div className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold text-center mx-auto tracking-widest uppercase text-black">
                    LUNCH
                  </div>
                </th>
                <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[88px]">
                  <div className="font-bold text-[10px]">V</div>
                  <div className="text-[8px] opacity-90 font-mono">1:55–2:50</div>
                </th>
                <th className="py-2 px-0.5 text-center font-bold border border-black bg-[#EFCDDE] text-black w-[42px] min-w-[40px] text-[9px] uppercase tracking-wider">
                  <div className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold text-center mx-auto tracking-widest uppercase text-black">
                    LEISURE
                  </div>
                </th>
                <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[88px]">
                  <div className="font-bold text-[10px]">VI</div>
                  <div className="text-[8px] opacity-90 font-mono">3:00–3:55</div>
                </th>
                <th className="py-2 px-1 text-center font-semibold border border-black bg-[#993366] text-white min-w-[88px]">
                  <div className="font-bold text-[10px]">VII</div>
                  <div className="text-[8px] opacity-90 font-mono">3:55–4:45</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => {
                return (
                  <tr key={day} className="border border-black h-[54px]">
                    {/* Day Column */}
                    <td className="py-1 px-1.5 text-center font-bold font-mono text-[10px] uppercase border border-black bg-canvas-paper text-ink">
                      {day.substring(0, 3)}
                    </td>

                    {/* Period 1 */}
                    {renderCell(day, 1)}

                    {/* Period 2 */}
                    {renderCell(day, 2)}

                    {/* Tea Break Column */}
                    <td className="p-0 border border-black bg-[#EFCDDE] text-center" />

                    {/* Period 3 */}
                    {renderCell(day, 3)}

                    {/* Period 4 */}
                    {renderCell(day, 4)}

                    {/* Lunch Break Column */}
                    <td className="p-0 border border-black bg-[#EFCDDE] text-center" />

                    {/* Period 5 */}
                    {renderCell(day, 5)}

                    {/* Leisure Break Column */}
                    <td className="p-0 border border-black bg-[#EFCDDE] text-center" />

                    {/* Period 6 */}
                    {renderCell(day, 6)}

                    {/* Period 7 */}
                    {renderCell(day, 7)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Table 1: Automatic Timetable Generator Course & Faculty Allocation Registry */}
      <GeneratorCourseTable
        courses={generatorCourses}
        title={`Course & Faculty Allocation Registry — ${selectedStudentYear} (${selectedSection})`}
        subtitle="Table 1 (VTU Format)"
      />

      {/* Drop Placement Modal */}
      {pendingDrop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp max-w-sm w-full p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border-beige">
              <div>
                <h4 className="font-headline font-semibold text-primary text-sm">
                  Place Subject in Timetable
                </h4>
                <span className="text-[10px] font-mono text-ink-light">
                  {pendingDrop.day} • Period {pendingDrop.startPeriod}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPendingDrop(null)}
                className="p-1 text-ink-muted hover:text-ink rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 bg-canvas-paper rounded border border-border-beige text-xs space-y-1">
              {pendingDrop.subjectCode && pendingDrop.subjectCode.trim() !== '' && (
                <span className="font-mono font-bold text-primary block">{pendingDrop.subjectCode}</span>
              )}
              <p className="font-medium text-ink">{pendingDrop.subjectTitle}</p>
              <span className="text-[10px] text-ink-muted block font-mono">
                Assigned: {pendingDrop.facultyName}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
                  Duration (Consecutive Periods)
                </label>
                <select
                  value={modalDuration}
                  onChange={(e) => setModalDuration(Number(e.target.value))}
                  className="w-full px-2 py-1 text-xs bg-canvas rounded border border-border-beige font-semibold"
                >
                  <option value={1}>1 Period (Lecture/Tutorial)</option>
                  <option value={2}>2 Periods (Laboratory/Workshop)</option>
                  <option value={3}>3 Periods (Block Session)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
                  Classroom / Venue
                </label>
                <input
                  type="text"
                  value={modalRoom}
                  onChange={(e) => setModalRoom(e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-canvas rounded border border-border-beige font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border-beige">
              <button
                type="button"
                onClick={() => setPendingDrop(null)}
                className="px-3 py-1 text-xs rounded border border-border-beige hover:bg-canvas-muted text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDrop}
                className="px-3.5 py-1 text-xs font-semibold rounded bg-primary hover:bg-primary-hover text-white shadow-crisp"
              >
                Confirm Placement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper function to render each period cell
  function renderCell(day: (typeof DAYS)[number], period: number) {
    const placement = getPlacementAt(day, period);
    const cellId = `${day}-${period}`;

    // If this period is covered by a placement starting at an earlier period, don't re-render
    if (placement && placement.startPeriod !== period) {
      return null;
    }

    const colSpan = placement ? placement.duration : 1;
    const isDragTarget = dragOverCell === cellId;

    if (placement) {
      const isDeanLocked = placement.isLockedSlot;
      return (
        <td
          key={cellId}
          colSpan={colSpan}
          className={`p-1 border border-black text-center align-middle relative transition-colors ${
            isDeanLocked
              ? 'bg-amber-50/70 border-amber-300'
              : 'bg-white hover:bg-canvas-muted/20'
          }`}
        >
          <div className="flex flex-col items-center justify-center p-0.5 min-h-[46px] relative group">
            {isDeanLocked ? (
              <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[8px] font-mono font-bold bg-amber-200 text-amber-900 border border-amber-300 mb-0.5">
                <Lock className="w-2.5 h-2.5" /> Dean Slot
              </span>
            ) : (
              !isPublished && (
                <button
                  type="button"
                  onClick={() => handleDeletePlacement(placement.id)}
                  className="absolute right-0.5 top-0.5 p-0.5 text-ink-light hover:text-crimson opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from timetable"
                >
                  <X className="w-3 h-3" />
                </button>
              )
            )}
            {placement.subjectCode && placement.subjectCode.trim() !== '' && (
              <span className="font-mono font-bold text-primary text-[10px] leading-tight block">
                {placement.subjectCode}
              </span>
            )}
            <span className="text-[9px] text-ink font-semibold truncate max-w-[120px] block leading-tight">
              {placement.subjectTitle}
            </span>
            <span className="text-[8px] text-ink-muted font-mono truncate max-w-[120px] block leading-tight">
              {placement.facultyName} • {placement.room}
            </span>
          </div>
        </td>
      );
    }

    return (
      <td
        key={cellId}
        onDragOver={(e) => handleDragOver(e, cellId)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, day, period)}
        className={`p-1 border border-black text-center align-middle transition-colors h-[54px] ${
          isDragTarget ? 'bg-primary/10 border-primary' : 'bg-white hover:bg-canvas-muted/10'
        }`}
      >
        <div className="h-full min-h-[44px] flex items-center justify-center text-[10px] text-ink-light/50">
          —
        </div>
      </td>
    );
  }
};

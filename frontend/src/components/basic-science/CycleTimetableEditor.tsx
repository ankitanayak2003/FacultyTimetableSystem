import React, { useState, useEffect, useMemo } from 'react';
import {
  Save,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Trash2,
  GripVertical,
  Calendar,
  X,
  Sparkles,
  Printer,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { useDragAutoScroll } from '../../hooks/useDragAutoScroll';
import { GeneratorCourseTable, GeneratorCourseItem } from '../common/GeneratorCourseTable';
import {
  BasicScienceSubject,
  BasicSciencePlacement,
  CycleSectionTimetable,
  DEAN_LOCKED_FIRST_YEAR_SLOTS,
  REGISTERED_FACULTY_NAMES,
} from '../../data/workflowDemoData';

const ACADEMIC_YEARS = ['2026–2027', '2025–2026', '2027–2028'];
const STUDENT_YEARS = ['First Year'];
const SEMESTERS = ['Odd Semester', 'Even Semester'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

interface ClashRecord {
  placementId: string;
  day: string;
  startPeriod: number;
  duration: number;
  facultyName: string;
  conflictingCycle: string;
  conflictingSection: string;
  conflictingSubject: string;
  reason: string;
}

interface CycleTimetableEditorProps {
  cycle: 'Chemistry' | 'Physics';
}

export const CycleTimetableEditor: React.FC<CycleTimetableEditorProps> = ({ cycle }) => {
  const otherCycle: 'Chemistry' | 'Physics' = cycle === 'Chemistry' ? 'Physics' : 'Chemistry';

  const {
    physicsSubjects,
    chemistrySubjects,
    physicsSoftConstraints,
    chemistrySoftConstraints,
    physicsSections,
    chemistrySections,
    addCycleSection,
    removeCycleSection,
    cycleTimetables,
    saveCycleTimetable,
    lockCycleTimetable,
    unlockCycleTimetable,
  } = useWorkflow();

  // Automatic scrolling during timetable drag-and-drop
  useDragAutoScroll();

  // Active cycle data sources
  const subjects = cycle === 'Chemistry' ? chemistrySubjects : physicsSubjects;
  const softConstraints = cycle === 'Chemistry' ? chemistrySoftConstraints : physicsSoftConstraints;
  const sections = cycle === 'Chemistry' ? chemistrySections : physicsSections;

  // Selectors
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026–2027');
  const [selectedStudentYear] = useState('First Year');
  const [selectedSemester, setSelectedSemester] = useState('Odd Semester');
  const [selectedSection, setSelectedSection] = useState(sections[0] || 'Section A');

  // Keep section valid when sections list changes
  useEffect(() => {
    if (!sections.includes(selectedSection) && sections.length > 0) {
      setSelectedSection(sections[0]);
    }
  }, [sections, selectedSection]);

  // Section Modal State
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  // Active composite key
  const timetableKey = `${cycle}_${selectedAcademicYear}_${selectedSemester}_${selectedSection}`;

  // Local Placements and Lock State
  const [placements, setPlacements] = useState<BasicSciencePlacement[]>([]);
  const [isLocked, setIsLocked] = useState(false);

  // Status notifications
  const [toastMsg, setToastMsg] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Clash Detection State
  const [clashes, setClashes] = useState<ClashRecord[]>([]);
  const [hasRunClashCheck, setHasRunClashCheck] = useState(false);

  // Drag-and-Drop Placement Modal
  const [pendingDrop, setPendingDrop] = useState<{
    day: (typeof DAYS)[number];
    startPeriod: number;
    subject: BasicScienceSubject;
  } | null>(null);

  const [modalFaculty, setModalFaculty] = useState<string>('');
  const [modalDuration, setModalDuration] = useState<number>(1);
  const [modalRoom, setModalRoom] = useState<string>('AB-101');

  // Drag-over styling tracking
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  // Synchronize when selector changes or when cycleTimetables updates
  useEffect(() => {
    const existing = cycleTimetables[timetableKey];
    if (existing) {
      setPlacements(existing.placements || []);
      setIsLocked(existing.isLocked || false);
    } else {
      // Initialize with Dean-locked institutional slots
      setPlacements(DEAN_LOCKED_FIRST_YEAR_SLOTS);
      setIsLocked(false);
    }
    setClashes([]);
    setHasRunClashCheck(false);
  }, [timetableKey, cycleTimetables]);

  // Available subjects for tray palette
  const availableSubjects = useMemo(() => subjects, [subjects]);

  // Auto-generate course summary for Automatic Timetable Generator
  const generatorCourses = useMemo<GeneratorCourseItem[]>(() => {
    // 1. All valid defined subjects for this cycle (with or without course code)
    const list: GeneratorCourseItem[] = subjects.map((sub) => {
      const matchingPlacements = placements.filter(
        (p) => (p.subjectId && p.subjectId === sub.id) || p.subjectName === sub.name || (sub.code && p.subjectCode === sub.code)
      );
      const placedFaculty = matchingPlacements.map((p) => p.facultyName).filter(Boolean);
      const finalFaculty = placedFaculty.length > 0
        ? Array.from(new Set(placedFaculty)).join(', ')
        : (sub.facultyNames && sub.facultyNames.length > 0 ? sub.facultyNames.join(', ') : 'Unassigned');

      const ltp = sub.ltp || (sub.type === 'Practical' ? '0:0:2' : sub.type === 'Integrated' ? '3:0:2' : '3:0:0');
      const credit = sub.credits !== undefined && sub.credits !== null && sub.credits !== ''
        ? sub.credits
        : (sub.type === 'Practical' ? 1.5 : sub.type === 'Integrated' ? 4 : 3);

      return {
        id: sub.id,
        courseCode: sub.code ? sub.code.trim() : '',
        courseName: sub.name,
        ltp,
        courseType: sub.type,
        credit,
        facultyName: finalFaculty,
      };
    });

    // 2. Also append any placements in the grid not in subjects (e.g. Dean-locked slots)
    placements.forEach((p) => {
      const alreadyInList = list.some(
        (item) => (p.subjectId && item.id === p.subjectId) || item.courseName === p.subjectName || (p.subjectCode && item.courseCode === p.subjectCode)
      );
      if (!alreadyInList && p.subjectName) {
        list.push({
          id: p.subjectId || p.id,
          courseCode: p.subjectCode ? p.subjectCode.trim() : '',
          courseName: p.subjectName,
          ltp: '3:0:0',
          courseType: p.isDeanLocked ? 'Institutional Slot' : 'Theory',
          credit: 3,
          facultyName: p.facultyName || 'Unassigned',
        });
      }
    });

    return list;
  }, [subjects, placements]);

  // Handle dynamic section addition
  const handleAddSection = () => {
    const trimmed = newSectionName.trim();
    if (!trimmed) return;
    addCycleSection(cycle, trimmed);
    setSelectedSection(trimmed);
    setToastMsg({ type: 'success', text: `Section "${trimmed}" added for ${cycle} Cycle.` });
    setNewSectionName('');
    setShowAddSectionModal(false);
  };

  // Handle section removal
  const handleRemoveSection = (secName: string) => {
    if (sections.length <= 1) {
      alert(`Cannot remove the only remaining section for ${cycle} Cycle.`);
      return;
    }
    if (confirm(`Remove section "${secName}" from ${cycle} Cycle? Any saved draft for it will be detached.`)) {
      removeCycleSection(cycle, secName);
      setToastMsg({ type: 'info', text: `Section "${secName}" removed.` });
    }
  };

  // Drag from Subject Tray
  const handleTrayDragStart = (e: React.DragEvent, subject: BasicScienceSubject) => {
    if (isLocked) return;
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'TRAY_SUBJECT', subject }));
  };

  // Drag placed cell to move
  const handlePlacementDragStart = (e: React.DragEvent, placement: BasicSciencePlacement) => {
    if (isLocked || placement.isDeanLocked) return;
    e.dataTransfer.setData(
      'application/json',
      JSON.stringify({ type: 'MOVE_PLACEMENT', placementId: placement.id })
    );
  };

  // Dropping into a period cell
  const handleCellDrop = (e: React.DragEvent, day: (typeof DAYS)[number], startPeriod: number) => {
    e.preventDefault();
    setDragOverCell(null);
    if (isLocked) return;

    // Check if target cell or adjacent period is occupied by a Dean-locked institutional slot
    const targetOccupied = placements.find(
      (p) => p.day === day && p.startPeriod <= startPeriod && startPeriod < p.startPeriod + p.duration
    );
    if (targetOccupied?.isDeanLocked) {
      setToastMsg({
        type: 'error',
        text: `Cannot overwrite Dean-locked institutional slot: "${targetOccupied.subjectName}".`,
      });
      return;
    }

    try {
      const raw = e.dataTransfer.getData('application/json');
      if (!raw) return;
      const data = JSON.parse(raw);

      if (data.type === 'MOVE_PLACEMENT') {
        const moveId = data.placementId;
        const target = placements.find((p) => p.id === moveId);
        if (!target || target.isDeanLocked) return;

        // Check collision at new slot
        const collision = placements.find(
          (p) =>
            p.id !== moveId &&
            p.day === day &&
            Math.max(p.startPeriod, startPeriod) <
              Math.min(p.startPeriod + p.duration, startPeriod + target.duration)
        );

        if (collision) {
          if (collision.isDeanLocked) {
            setToastMsg({
              type: 'error',
              text: `Collision with Dean-locked period "${collision.subjectName}". Move cancelled.`,
            });
            return;
          }
          // Remove colliding placement
          setPlacements((prev) =>
            prev.filter((p) => p.id !== collision.id).map((p) =>
              p.id === moveId ? { ...p, day, startPeriod } : p
            )
          );
          setToastMsg({
            type: 'info',
            text: `Moved "${target.subjectCode}" to ${day} Period ${startPeriod}. Replaced overlapping cell.`,
          });
        } else {
          setPlacements((prev) =>
            prev.map((p) => (p.id === moveId ? { ...p, day, startPeriod } : p))
          );
        }
      } else if (data.type === 'TRAY_SUBJECT') {
        const sub: BasicScienceSubject = data.subject;
        setPendingDrop({ day, startPeriod, subject: sub });
        setModalFaculty(sub.facultyNames[0] || REGISTERED_FACULTY_NAMES[0]);
        setModalDuration(sub.type === 'Practical' ? 2 : 1);
        setModalRoom(sub.type === 'Practical' ? `${cycle} Lab` : selectedSection === 'Section C' ? 'AB-103' : 'AB-101');
      }
    } catch {
      // Ignored
    }
  };

  // Confirm placement from modal
  const handleConfirmPlacement = () => {
    if (!pendingDrop) return;
    const { day, startPeriod, subject } = pendingDrop;
    const duration = modalDuration;

    // Check collision with Dean-locked slots
    const deanCollision = placements.find(
      (p) =>
        p.isDeanLocked &&
        p.day === day &&
        Math.max(p.startPeriod, startPeriod) < Math.min(p.startPeriod + p.duration, startPeriod + duration)
    );
    if (deanCollision) {
      setToastMsg({
        type: 'error',
        text: `Cannot place here: Overlaps with Dean-locked slot "${deanCollision.subjectName}".`,
      });
      setPendingDrop(null);
      return;
    }

    const newPlacement: BasicSciencePlacement = {
      id: `p-${Date.now()}`,
      day,
      startPeriod,
      duration,
      subjectId: subject.id,
      subjectCode: subject.code || '',
      subjectName: subject.name,
      facultyName: modalFaculty || subject.facultyNames[0] || 'Unassigned',
      room: modalRoom.trim() || undefined,
      isMerged: duration > 1,
    };

    // Filter out any non-locked overlapping placements
    setPlacements((prev) => {
      const filtered = prev.filter(
        (p) =>
          !(
            p.day === day &&
            Math.max(p.startPeriod, startPeriod) <
              Math.min(p.startPeriod + p.duration, startPeriod + duration)
          )
      );
      return [...filtered, newPlacement];
    });

    setPendingDrop(null);
    setToastMsg({
      type: 'success',
      text: `Placed ${subject.name}${subject.code ? ` (${subject.code})` : ''} (${duration} period${duration > 1 ? 's' : ''}) on ${day} Period ${startPeriod}.`,
    });
  };

  // Remove placement
  const handleRemovePlacement = (id: string) => {
    if (isLocked) return;
    const item = placements.find((p) => p.id === id);
    if (item?.isDeanLocked) {
      setToastMsg({
        type: 'error',
        text: 'Dean-locked institutional periods are immutable and cannot be deleted.',
      });
      return;
    }
    setPlacements((prev) => prev.filter((p) => p.id !== id));
  };

  // Check clashes (Internal and Cross-Cycle!)
  const handleCheckClashes = () => {
    const detected: ClashRecord[] = [];

    // Helper: do two period ranges overlap?
    const isOverlapping = (s1: number, d1: number, s2: number, d2: number) => {
      return Math.max(s1, s2) < Math.min(s1 + d1, s2 + d2);
    };

    // 1. Check internal section faculty double-booking
    for (let i = 0; i < placements.length; i++) {
      for (let j = i + 1; j < placements.length; j++) {
        const p1 = placements[i];
        const p2 = placements[j];
        if (p1.day === p2.day && isOverlapping(p1.startPeriod, p1.duration, p2.startPeriod, p2.duration)) {
          // Double booked faculty in this section?
          if (p1.facultyName && p2.facultyName && p1.facultyName === p2.facultyName) {
            detected.push({
              placementId: p1.id,
              day: p1.day,
              startPeriod: p1.startPeriod,
              duration: p1.duration,
              facultyName: p1.facultyName,
              conflictingCycle: cycle,
              conflictingSection: selectedSection,
              conflictingSubject: p2.subjectCode,
              reason: `Internal Double-Booking: ${p1.facultyName} is scheduled concurrently in ${selectedSection}.`,
            });
          }
        }
      }
    }

    // 2. Check cross-section and cross-cycle faculty clashes in cycleTimetables
    Object.entries(cycleTimetables).forEach(([key, otherTable]) => {
      const [otherCycleName, , , otherSecName] = key.split('_');

      // Skip the exact same timetable instance
      if (otherCycleName === cycle && otherSecName === selectedSection) return;

      otherTable.placements.forEach((otherP) => {
        placements.forEach((currentP) => {
          if (
            currentP.day === otherP.day &&
            isOverlapping(
              currentP.startPeriod,
              currentP.duration,
              otherP.startPeriod,
              otherP.duration
            )
          ) {
            // Check faculty overlap
            if (
              currentP.facultyName &&
              otherP.facultyName &&
              !currentP.isDeanLocked &&
              !otherP.isDeanLocked
            ) {
              const currentFacs = currentP.facultyName.split(/[,/&]/).map((f) => f.trim());
              const otherFacs = otherP.facultyName.split(/[,/&]/).map((f) => f.trim());
              const commonFac = currentFacs.find((cf) => otherFacs.includes(cf));

              if (commonFac) {
                const isCrossCycle = otherCycleName !== cycle;
                detected.push({
                  placementId: currentP.id,
                  day: currentP.day,
                  startPeriod: currentP.startPeriod,
                  duration: currentP.duration,
                  facultyName: commonFac,
                  conflictingCycle: otherCycleName,
                  conflictingSection: otherSecName,
                  conflictingSubject: otherP.subjectCode,
                  reason: isCrossCycle
                    ? `Cross-Cycle Conflict: ${commonFac} is already allocated in ${otherCycleName} Cycle (${otherSecName}) for ${otherP.subjectCode}.`
                    : `Section Conflict: ${commonFac} is already allocated in ${cycle} Cycle (${otherSecName}) for ${otherP.subjectCode}.`,
                });
              }
            }

            // Check room collision (excluding auditoriums or general grounds)
            if (
              currentP.room &&
              otherP.room &&
              currentP.room.toLowerCase() === otherP.room.toLowerCase() &&
              !currentP.room.toLowerCase().includes('auditorium') &&
              !currentP.room.toLowerCase().includes('grounds')
            ) {
              detected.push({
                placementId: currentP.id,
                day: currentP.day,
                startPeriod: currentP.startPeriod,
                duration: currentP.duration,
                facultyName: currentP.facultyName,
                conflictingCycle: otherCycleName,
                conflictingSection: otherSecName,
                conflictingSubject: otherP.subjectCode,
                reason: `Room Conflict: Venue "${currentP.room}" is simultaneously occupied by ${otherCycleName} (${otherSecName}) for ${otherP.subjectCode}.`,
              });
            }
          }
        });
      });
    });

    setClashes(detected);
    setHasRunClashCheck(true);

    if (detected.length === 0) {
      setToastMsg({
        type: 'success',
        text: 'Zero clashes detected! All faculty, room assignments, and cross-cycle dependencies are clean.',
      });
    } else {
      setToastMsg({
        type: 'error',
        text: `Found ${detected.length} active conflict(s). Review Clash Analysis card below.`,
      });
    }
  };

  const isClashingPlacement = (id: string) => {
    return clashes.some((c) => c.placementId === id);
  };

  // Timetable Generation Action (Gemini-Assisted)
  const handleGenerateTimetable = () => {
    if (subjects.length === 0) {
      alert(`No subjects defined for ${cycle} Cycle on Page 1. Please allocate subjects and faculty first.`);
      return;
    }

    // Step 1: Keep Dean-locked institutional slots intact
    const generated: BasicSciencePlacement[] = [...DEAN_LOCKED_FIRST_YEAR_SLOTS];

    // Step 2: Parse optional Gemini soft constraints
    const constraintsLower = (softConstraints || '').toLowerCase();
    const preferMorningPracticals =
      constraintsLower.includes('morning') || constraintsLower.includes('early');
    const avoidAfterLunchMath =
      constraintsLower.includes('lunch') || constraintsLower.includes('afternoon');

    // Step 3: Categorize subjects
    const practicalSubs = subjects.filter((s) => s.type === 'Practical');
    const theorySubs = subjects.filter((s) => s.type !== 'Practical');

    // Slot map: day -> period -> occupied
    const isOccupied = (d: string, p: number) => {
      return generated.some((g) => g.day === d && g.startPeriod <= p && p < g.startPeriod + g.duration);
    };

    // Allocate practicals (2 consecutive periods)
    practicalSubs.forEach((ps, idx) => {
      const targetDays: (typeof DAYS)[number][] = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
      ];
      const targetDay = targetDays[idx % targetDays.length];

      // If user preferred morning practicals via soft constraint, target period 3 (11:10-1:00) or 1; otherwise period 6 (3:00-4:45)
      const preferredStart = preferMorningPracticals ? 3 : 6;
      const startP = !isOccupied(targetDay, preferredStart) && !isOccupied(targetDay, preferredStart + 1)
        ? preferredStart
        : !isOccupied(targetDay, 6)
        ? 6
        : 3;

      if (!isOccupied(targetDay, startP) && !isOccupied(targetDay, startP + 1)) {
        generated.push({
          id: `gen-p-${idx}-${Date.now()}`,
          day: targetDay,
          startPeriod: startP,
          duration: 2,
          subjectId: ps.id,
          subjectCode: ps.code || '',
          subjectName: ps.name,
          facultyName: ps.facultyNames.join(', ') || 'Assigned Faculty',
          room: `${cycle} Lab`,
          isMerged: true,
        });
      }
    });

    // Allocate remaining theory subjects across available slots
    let theoryIdx = 0;
    DAYS.forEach((d) => {
      // Teaching periods 1 to 7
      for (let p = 1; p <= 7; p++) {
        if (!isOccupied(d, p)) {
          if (theorySubs.length > 0) {
            let chosenSub = theorySubs[theoryIdx % theorySubs.length];

            // Soft constraint: avoid scheduling complex maths immediately after lunch (Period 5)
            if (avoidAfterLunchMath && p === 5 && chosenSub.name.toLowerCase().includes('math')) {
              theoryIdx++;
              chosenSub = theorySubs[theoryIdx % theorySubs.length];
            }

            generated.push({
              id: `gen-t-${d}-${p}-${Date.now()}`,
              day: d,
              startPeriod: p,
              duration: 1,
              subjectId: chosenSub.id,
              subjectCode: chosenSub.code || '',
              subjectName: chosenSub.name,
              facultyName: chosenSub.facultyNames[0] || 'Faculty Member',
              room: selectedSection === 'Section C' ? 'AB-103' : 'AB-101',
              isMerged: false,
            });
            theoryIdx++;
          }
        }
      }
    });

    setPlacements(generated);
    setClashes([]);
    setHasRunClashCheck(false);

    // Save as draft immediately
    const updatedData: CycleSectionTimetable = {
      cycle,
      academicYear: selectedAcademicYear,
      studentYear: selectedStudentYear,
      semester: selectedSemester,
      section: selectedSection,
      placements: generated,
      isLocked: false,
    };
    saveCycleTimetable(timetableKey, updatedData);

    const softNote = softConstraints.trim()
      ? ' Applied Gemini soft constraints: ' +
        (preferMorningPracticals ? 'morning practicals prioritized, ' : '') +
        (avoidAfterLunchMath ? 'post-lunch difficulty balanced.' : 'preferences structured.')
      : ' Generated standard balanced schedule.';

    setToastMsg({
      type: 'success',
      text: `Timetable generated for ${cycle} Cycle (${selectedSection}).${softNote}`,
    });
  };

  // Save Draft
  const handleSaveDraft = () => {
    const data: CycleSectionTimetable = {
      cycle,
      academicYear: selectedAcademicYear,
      studentYear: selectedStudentYear,
      semester: selectedSemester,
      section: selectedSection,
      placements,
      isLocked,
    };
    saveCycleTimetable(timetableKey, data);
    setToastMsg({
      type: 'success',
      text: `Draft saved successfully for ${cycle} Cycle (${selectedSection}).`,
    });
  };

  // Lock Timetable
  const handleLockTimetable = () => {
    if (clashes.length > 0) {
      alert(`Cannot lock timetable while ${clashes.length} active conflict(s) exist. Please resolve all clashes first.`);
      return;
    }
    // Check clashes if not yet run
    if (!hasRunClashCheck) {
      handleCheckClashes();
      return;
    }

    handleSaveDraft();
    lockCycleTimetable(timetableKey);
    setIsLocked(true);
    setToastMsg({
      type: 'success',
      text: `Timetable for ${cycle} Cycle (${selectedSection}) is finalized and locked. Certified for publication.`,
    });
  };

  // Unlock Timetable
  const handleUnlockTimetable = () => {
    unlockCycleTimetable(timetableKey);
    setIsLocked(false);
    setToastMsg({
      type: 'info',
      text: `Timetable unlocked for administrative edits.`,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 animate-fade-in text-ink">
      {/* Toast Notification Banner */}
      {toastMsg && (
        <div
          className={`p-3 rounded-card text-xs flex items-center justify-between border shadow-crisp transition-all animate-fade-in ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-300'
              : toastMsg.type === 'error'
              ? 'bg-rose-50 text-rose-950 border-rose-300'
              : 'bg-canvas-muted text-ink border-border-beige'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
            {toastMsg.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />}
            {toastMsg.type === 'info' && <Calendar className="w-4 h-4 text-primary flex-shrink-0" />}
            <span className="font-medium">{toastMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-ink-muted hover:text-ink ml-3"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Controls & Selectors Card */}
      <div className="p-3.5 sm:p-4 bg-surface rounded-card border border-border-beige shadow-crisp space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-border-beige">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                First-Year Foundation Planning
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider ${
                  isLocked
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {isLocked ? 'Locked & Finalized' : 'Draft (Editable)'}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider bg-primary-subtle text-primary">
                {cycle} Cycle
              </span>
            </div>
            <h2 className="font-headline text-xl sm:text-2xl font-semibold text-primary">
              {cycle} Cycle Timetable Editor
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Standard VTU 7-period grid with predefined Tea Break, Lunch Break, and Leisure slots. Dean-locked periods appear automatically.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateTimetable}
              disabled={isLocked}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border transition-colors shadow-crisp-sm ${
                isLocked
                  ? 'bg-canvas-muted text-ink-light border-border-beige cursor-not-allowed'
                  : 'bg-primary-subtle hover:bg-primary-subtle/80 text-primary border-primary'
              }`}
              title="Automatically generate schedule respecting Dean slots and Gemini soft constraints"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Generate Timetable</span>
            </button>

            <button
              type="button"
              onClick={handleCheckClashes}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-canvas-muted hover:bg-canvas-paper text-ink border border-border-beige transition-colors shadow-crisp-sm"
              title="Audit internal, section, and cross-cycle clashes"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              <span>Check Clashes</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isLocked}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border transition-colors shadow-crisp-sm ${
                isLocked
                  ? 'bg-canvas-muted text-ink-light border-border-beige cursor-not-allowed'
                  : 'bg-canvas-paper hover:bg-canvas text-primary border-primary hover:border-primary-hover'
              }`}
            >
              <Save className="w-3.5 h-3.5 text-primary" />
              <span>Save Draft</span>
            </button>

            {isLocked ? (
              <button
                type="button"
                onClick={handleUnlockTimetable}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-crisp-sm"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Unlock for Editing</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLockTimetable}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded bg-primary hover:bg-primary-hover text-white transition-colors shadow-crisp-sm"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock &amp; Finalize</span>
              </button>
            )}

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-canvas-muted hover:bg-canvas-paper text-ink border border-border-beige transition-colors shadow-crisp-sm"
              title="Print official academic timetable"
            >
              <Printer className="w-3.5 h-3.5 text-ink-muted" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* 5 Selectors Row (Dynamic Section Addition/Removal) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-0.5">
          {/* Academic Year */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Academic Year
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
            >
              {ACADEMIC_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Student Year */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Student Year
            </label>
            <select
              value={selectedStudentYear}
              disabled
              className="w-full px-2.5 py-1 text-xs bg-canvas-muted rounded border border-border-beige text-ink-muted font-semibold cursor-not-allowed"
            >
              {STUDENT_YEARS.map((sy) => (
                <option key={sy} value={sy}>
                  {sy} (Basic Science)
                </option>
              ))}
            </select>
          </div>

          {/* Semester */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
            >
              {SEMESTERS.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </select>
          </div>

          {/* Instructional Cycle */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Instructional Cycle
            </label>
            <input
              type="text"
              readOnly
              value={`${cycle} Cycle`}
              className="w-full px-2.5 py-1 text-xs bg-canvas-muted rounded border border-border-beige text-primary font-bold cursor-default"
            />
          </div>

          {/* Dynamic Section Selector */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted font-semibold">
                Section
              </label>
              <button
                type="button"
                onClick={() => setShowAddSectionModal(true)}
                className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" /> Add Section
              </button>
            </div>
            <div className="flex items-center gap-1.5">
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
              {sections.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSection(selectedSection)}
                  title={`Remove ${selectedSection}`}
                  className="p-1 text-ink-muted hover:text-rose-600 rounded hover:bg-canvas-muted transition-colors flex-shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Soft Constraints Indicator Banner */}
      {softConstraints.trim() && (
        <div className="p-3 bg-canvas-paper rounded-card border border-border-beige flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
            <span className="text-ink">
              <strong className="text-primary">Gemini Soft Constraints Active:</strong>{' '}
              <span className="italic text-ink-muted">"{softConstraints.slice(0, 120)}{softConstraints.length > 120 ? '...' : ''}"</span>
            </span>
          </div>
          <span className="text-[10px] font-mono text-ink-light flex-shrink-0">
            Considered during generation
          </span>
        </div>
      )}

      {/* Locked Notice Banner */}
      {isLocked && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-card flex items-center justify-between text-xs text-emerald-950">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span className="font-semibold">
              This timetable is LOCKED by Basic Science Coordinator. Grid slots are read-only.
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-800">
            Click "Unlock for Editing" to make adjustments.
          </span>
        </div>
      )}

      {/* Subject Tray (Palette) from Page 1 */}
      <div className="p-3 sm:p-3.5 bg-surface rounded-card border border-border-beige shadow-crisp space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
              Page 1 Allocated {cycle} Subjects
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary font-semibold">
              {availableSubjects.length} Available in Tray
            </span>
          </div>
          <p className="text-[11px] text-ink-muted">
            Drag any subject card into an empty period in the timetable grid below.
          </p>
        </div>

        {availableSubjects.length === 0 ? (
          <div className="p-3.5 bg-canvas-muted rounded text-xs text-ink-muted border border-dashed border-border-beige text-center">
            No subjects added to {cycle} Cycle master list yet. Go to{' '}
            <span className="font-semibold text-primary">Subject &amp; Faculty Allocation</span> to define subjects.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1">
            {availableSubjects.map((sub) => (
              <div
                key={sub.id}
                draggable={!isLocked}
                onDragStart={(e) => handleTrayDragStart(e, sub)}
                className={`p-2 rounded bg-canvas-paper border border-border-beige text-xs flex items-center gap-2 shadow-crisp-sm transition-all select-none ${
                  isLocked
                    ? 'opacity-60 cursor-not-allowed'
                    : 'cursor-grab hover:border-primary hover:shadow-crisp active:cursor-grabbing hover:bg-canvas'
                }`}
                title={`Subject: ${sub.name}${sub.code ? ` (${sub.code})` : ''}\nDrag to timetable cell`}
              >
                <GripVertical className="w-3.5 h-3.5 text-ink-light flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-ink truncate max-w-[200px]" title={sub.name}>
                    {sub.name}
                  </p>
                  {sub.code && sub.code.trim() !== '' && (
                    <span className="font-mono font-semibold text-primary text-[10px] block">
                      {sub.code}
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
              First-Year Schedule Grid — {cycle} Cycle ({selectedSection})
            </h3>
          </div>
          <span className="text-xs font-mono text-ink-muted">
            {selectedStudentYear} • {selectedSemester} • {selectedAcademicYear}
          </span>
        </div>

        <div className="overflow-x-auto p-2 sm:p-2.5 bg-white">
          <table className="w-full border-collapse border border-black text-xs select-none">
            <thead>
              <tr className="bg-[#993366] text-white font-mono text-[11px] border border-black">
                <th className="py-2 px-1.5 text-center font-bold border border-black bg-[#993366] text-white w-[84px] min-w-[80px] uppercase text-[10px]">
                  DAY/TIME
                </th>
                <th className="py-1.5 px-1 text-center border border-black bg-[#993366] text-white min-w-[88px]">
                  <div className="font-bold text-xs">Period 1</div>
                  <div className="text-[10px] text-white/90 font-normal">9:00 - 9:55</div>
                </th>
                <th className="py-1.5 px-1 text-center border border-black bg-[#993366] text-white min-w-[88px]">
                  <div className="font-bold text-xs">Period 2</div>
                  <div className="text-[10px] text-white/90 font-normal">9:55 - 10:50</div>
                </th>
                <th className="py-1.5 px-0.5 text-center border border-black bg-[#EFCDDE] text-[#4A1525] w-[42px] min-w-[40px] max-w-[46px] uppercase font-bold text-[9px] tracking-wider">
                  <div className="[writing-mode:vertical-rl] rotate-180 mx-auto whitespace-nowrap leading-none py-1">
                    TEA BREAK
                  </div>
                  <div className="text-[8px] font-semibold text-[#4A1525]/85 [writing-mode:vertical-rl] rotate-180 mx-auto whitespace-nowrap leading-none mt-1">
                    10:50-11:10
                  </div>
                </th>
                <th className="py-1.5 px-1 text-center border border-black bg-[#993366] text-white min-w-[88px]">
                  <div className="font-bold text-xs">Period 3</div>
                  <div className="text-[10px] text-white/90 font-normal">11:10 - 12:05</div>
                </th>
                <th className="py-1.5 px-1 text-center border border-black bg-[#993366] text-white min-w-[88px]">
                  <div className="font-bold text-xs">Period 4</div>
                  <div className="text-[10px] text-white/90 font-normal">12:05 - 1:00</div>
                </th>
                <th className="py-1.5 px-0.5 text-center border border-black bg-[#F0D0E0] text-[#4A1525] w-[42px] min-w-[40px] max-w-[46px] uppercase font-bold text-[9px] tracking-wider">
                  <div className="[writing-mode:vertical-rl] rotate-180 mx-auto whitespace-nowrap leading-none py-1">
                    LUNCH BREAK
                  </div>
                  <div className="text-[8px] font-semibold text-[#4A1525]/85 [writing-mode:vertical-rl] rotate-180 mx-auto whitespace-nowrap leading-none mt-1">
                    1:00 - 1:55
                  </div>
                </th>
                <th className="py-1.5 px-1 text-center border border-black bg-[#993366] text-white min-w-[88px]">
                  <div className="font-bold text-xs">Period 5</div>
                  <div className="text-[10px] text-white/90 font-normal">1:55 - 2:50</div>
                </th>
                <th className="py-1.5 px-0.5 text-center border border-black bg-[#F0D0E0] text-[#4A1525] w-[42px] min-w-[40px] max-w-[46px] uppercase font-bold text-[9px] tracking-wider">
                  <div className="[writing-mode:vertical-rl] rotate-180 mx-auto whitespace-nowrap leading-none py-1">
                    LEISURE
                  </div>
                  <div className="text-[8px] font-semibold text-[#4A1525]/85 [writing-mode:vertical-rl] rotate-180 mx-auto whitespace-nowrap leading-none mt-1">
                    2:50 - 3:00
                  </div>
                </th>
                <th className="py-1.5 px-1 text-center border border-black bg-[#993366] text-white min-w-[88px]">
                  <div className="font-bold text-xs">Period 6</div>
                  <div className="text-[10px] text-white/90 font-normal">3:00 - 3:55</div>
                </th>
                <th className="py-1.5 px-1 text-center border border-black bg-[#993366] text-white min-w-[88px]">
                  <div className="font-bold text-xs">Period 7</div>
                  <div className="text-[10px] text-white/90 font-normal">3:55 - 4:45</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => {
                const dayPlacements = placements.filter((p) => p.day === day);

                const getPlacementAt = (period: number) => {
                  return dayPlacements.find((p) => p.startPeriod === period);
                };

                const isCoveredByPrevious = (period: number) => {
                  return dayPlacements.some(
                    (p) => p.startPeriod < period && period < p.startPeriod + p.duration
                  );
                };

                const renderPeriodCell = (period: number) => {
                  if (isCoveredByPrevious(period)) {
                    return null;
                  }

                  const placement = getPlacementAt(period);
                  const cellKey = `${day}-${period}`;
                  const isHovered = dragOverCell === cellKey;

                  if (placement) {
                    const clashing = isClashingPlacement(placement.id);
                    const colSpan = placement.duration || 1;
                    const isDeanSlot = placement.isDeanLocked;

                    return (
                      <td
                        key={period}
                        colSpan={colSpan}
                        className={`p-1 border border-black align-top bg-white transition-colors ${
                          clashing ? 'bg-rose-50' : 'bg-white'
                        }`}
                      >
                        <div
                          draggable={!isLocked && !isDeanSlot}
                          onDragStart={(e) => handlePlacementDragStart(e, placement)}
                          className={`group relative p-1.5 rounded border transition-all h-full min-h-[54px] flex flex-col justify-between ${
                            isDeanSlot
                              ? 'border-amber-400 bg-amber-50/60 text-amber-950 shadow-xs cursor-not-allowed'
                              : clashing
                              ? 'border-rose-600 bg-rose-50 text-rose-950 shadow-crisp'
                              : 'border-neutral-300 bg-white hover:border-[#993366] text-black shadow-xs'
                          } ${isLocked || isDeanSlot ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
                          title={
                            isDeanSlot
                              ? `Dean-Locked Institutional Slot (Read-Only):\n${placement.subjectName}\nFaculty: ${placement.facultyName}\nVenue: ${placement.room || 'Campus'}`
                              : `Draggable Subject Slot:\n${placement.subjectName}\nFaculty: ${placement.facultyName}\nVenue: ${placement.room || 'AB-101'}`
                          }
                        >
                          {/* Top Row: Subject Code + Delete Button / Lock Icon */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono font-bold text-[#4A1525] text-xs flex items-center gap-1">
                              {placement.subjectCode || placement.subjectName}
                              {isDeanSlot && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-200 text-amber-900 font-mono font-bold uppercase tracking-wider flex items-center gap-0.5">
                                  <Lock className="w-2.5 h-2.5" /> Dean
                                </span>
                              )}
                            </span>
                            {!isLocked && !isDeanSlot && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemovePlacement(placement.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-neutral-400 hover:text-rose-600 rounded transition-opacity"
                                title="Remove placement"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Middle: Subject Name */}
                          <div
                            className="text-[10px] font-medium text-black leading-tight line-clamp-2 my-0.5"
                            title={placement.subjectName}
                          >
                            {placement.subjectName}
                          </div>

                          {/* Bottom: Faculty & Venue */}
                          <div className="flex items-center justify-between text-[9px] text-neutral-700 font-mono pt-0.5 border-t border-neutral-200 mt-0.5">
                            <span
                              className="truncate font-semibold text-black max-w-[70px]"
                              title={placement.facultyName}
                            >
                              {placement.facultyName}
                            </span>
                            {placement.room && (
                              <span className="text-[8px] px-1 py-0.2 rounded bg-neutral-100 text-neutral-600 ml-0.5 truncate max-w-[65px]">
                                {placement.room}
                              </span>
                            )}
                          </div>

                          {/* Clash badge */}
                          {clashing && (
                            <div className="absolute top-1 right-1 px-1.5 py-0.2 rounded bg-rose-600 text-white font-mono text-[8px] font-bold flex items-center gap-0.5 shadow-sm">
                              <span>⚠️ Clash</span>
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  }

                  // Empty Droppable Cell
                  return (
                    <td
                      key={period}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (!isLocked) setDragOverCell(cellKey);
                      }}
                      onDragLeave={() => setDragOverCell(null)}
                      onDrop={(e) => handleCellDrop(e, day, period)}
                      className={`p-1 border border-black align-middle text-center bg-white transition-all h-[58px] ${
                        isHovered && !isLocked ? 'bg-pink-50' : 'bg-white'
                      }`}
                    >
                      <div
                        className={`w-full h-full min-h-[50px] rounded border border-dashed flex flex-col items-center justify-center text-[10px] p-0.5 ${
                          isHovered && !isLocked
                            ? 'border-[#993366] bg-[#EFCDDE]/30 text-[#4A1525]'
                            : 'border-neutral-300 text-neutral-400'
                        }`}
                      >
                        {isHovered && !isLocked ? (
                          <span className="font-semibold text-[#4A1525] text-[9px]">Drop to Assign</span>
                        ) : (
                          <span className="opacity-40 font-mono text-xs">—</span>
                        )}
                      </div>
                    </td>
                  );
                };

                return (
                  <tr key={day} className="border border-black">
                    {/* Day Column */}
                    <td className="py-2 px-1 font-mono font-bold text-white bg-[#993366] border border-black uppercase text-[10px] whitespace-nowrap text-center w-[84px] min-w-[80px]">
                      {day}
                    </td>

                    {/* Periods 1 & 2 */}
                    {renderPeriodCell(1)}
                    {renderPeriodCell(2)}

                    {/* Break 1: TEA BREAK (Light Pink #EFCDDE) */}
                    <td className="w-[42px] min-w-[40px] max-w-[46px] bg-[#EFCDDE] border border-black text-center align-middle p-0.5 text-[#4A1525] font-mono select-none">
                      <span className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold tracking-widest uppercase inline-block whitespace-nowrap py-1">
                        Tea Break
                      </span>
                    </td>

                    {/* Periods 3 & 4 */}
                    {renderPeriodCell(3)}
                    {renderPeriodCell(4)}

                    {/* Break 2: LUNCH BREAK (Light Pink #F0D0E0) */}
                    <td className="w-[42px] min-w-[40px] max-w-[46px] bg-[#F0D0E0] border border-black text-center align-middle p-0.5 text-[#4A1525] font-mono select-none">
                      <span className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold tracking-widest uppercase inline-block whitespace-nowrap py-1">
                        Lunch Break
                      </span>
                    </td>

                    {/* Period 5 */}
                    {renderPeriodCell(5)}

                    {/* Break 3: LEISURE BREAK (Light Pink #F0D0E0) */}
                    <td className="w-[42px] min-w-[40px] max-w-[46px] bg-[#F0D0E0] border border-black text-center align-middle p-0.5 text-[#4A1525] font-mono select-none">
                      <span className="[writing-mode:vertical-rl] rotate-180 text-[8px] font-bold tracking-widest uppercase inline-block whitespace-nowrap py-1">
                        Leisure
                      </span>
                    </td>

                    {/* Periods 6 & 7 */}
                    {renderPeriodCell(6)}
                    {renderPeriodCell(7)}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Clash Analysis & Resolution Card */}
      {hasRunClashCheck && (
        <div className="p-3.5 bg-surface rounded-card border border-border-beige shadow-crisp space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${clashes.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
              <h3 className="font-headline text-sm font-semibold text-primary">
                Clash Analysis &amp; Cross-Cycle Validation Engine
              </h3>
            </div>
            <span
              className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${
                clashes.length > 0
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}
            >
              {clashes.length === 0 ? '0 Clashes Detected' : `${clashes.length} Active Conflict(s)`}
            </span>
          </div>

          {clashes.length === 0 ? (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <span>
                Zero clashes found! All faculty members and room assignments in {cycle} Cycle ({selectedSection}) are free from conflicts across all {cycle} sections and {otherCycle} Cycle timetables.
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-ink-muted">
                The following schedule conflicts were identified across {cycle} sections or cross-cycle allocations with {otherCycle} Cycle:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {clashes.map((c, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-rose-50 border border-rose-300 rounded text-xs text-rose-950 space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-[11px]">
                      <span>{c.facultyName}</span>
                      <span className="text-rose-800">
                        {c.day} (Period {c.startPeriod})
                      </span>
                    </div>
                    <p className="text-[11px] leading-tight text-rose-900">{c.reason}</p>
                    <div className="text-[10px] text-rose-800 font-mono pt-0.5">
                      Conflicting Target: {c.conflictingCycle} Cycle ({c.conflictingSection}) • Subject: {c.conflictingSubject}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Automatically Generated Placed Subjects Table (Table 1 VTU Format) */}
      <GeneratorCourseTable
        courses={generatorCourses}
        title={`Placed Courses & Faculty Assignment Summary — ${cycle} Cycle (${selectedSection})`}
        subtitle="Table 1 (VTU Format)"
      />

      {/* Drop Placement Confirmation Modal */}
      {pendingDrop && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp max-w-md w-full p-5 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-border-beige">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                  Confirm Timetable Placement
                </span>
                <h3 className="font-headline text-lg font-semibold text-primary">
                  {pendingDrop.subject.name}{pendingDrop.subject.code ? ` (${pendingDrop.subject.code})` : ''}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPendingDrop(null)}
                className="text-ink-muted hover:text-ink p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-2.5 bg-canvas-muted rounded font-mono text-[11px] flex justify-between">
                <span>
                  Slot: <strong className="text-ink">{pendingDrop.day}</strong>
                </span>
                <span>
                  Start Period: <strong className="text-ink">Period {pendingDrop.startPeriod}</strong>
                </span>
              </div>

              {/* Faculty Selector */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                  Assigned Faculty
                </label>
                <select
                  value={modalFaculty}
                  onChange={(e) => setModalFaculty(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
                >
                  {pendingDrop.subject.facultyNames?.map((fn) => (
                    <option key={fn} value={fn}>
                      {fn} (Allocated on Page 1)
                    </option>
                  ))}
                  <optgroup label="Other Registered Faculty">
                    {REGISTERED_FACULTY_NAMES.filter(
                      (r) => !pendingDrop.subject.facultyNames?.includes(r)
                    ).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                  Slot Duration
                </label>
                <select
                  value={modalDuration}
                  onChange={(e) => setModalDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
                >
                  <option value={1}>1 Period (Standard Theory — 55 min)</option>
                  <option value={2}>2 Consecutive Periods (Lab / Workshop)</option>
                  <option value={3}>3 Consecutive Periods (Extended Lab / Activity)</option>
                </select>
              </div>

              {/* Classroom / Lab Room */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                  Classroom / Laboratory Venue
                </label>
                <input
                  type="text"
                  value={modalRoom}
                  onChange={(e) => setModalRoom(e.target.value)}
                  placeholder="e.g. AB-101, Physics Lab 1, Chemistry Lab"
                  className="w-full px-3 py-2 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-beige">
              <button
                type="button"
                onClick={() => setPendingDrop(null)}
                className="px-3.5 py-1.5 text-xs rounded border border-border-beige text-ink-muted hover:bg-canvas-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPlacement}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-primary hover:bg-primary-hover text-white transition-colors shadow-crisp-sm"
              >
                Confirm Placement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Section Modal */}
      {showAddSectionModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp max-w-sm w-full p-5 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-border-beige">
              <h3 className="font-headline text-base font-semibold text-primary">
                Add Section for {cycle} Cycle
              </h3>
              <button
                type="button"
                onClick={() => setShowAddSectionModal(false)}
                className="text-ink-muted hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                Section Name
              </label>
              <input
                type="text"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                placeholder="e.g. Section E, Section F"
                className="w-full px-3 py-2 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-beige">
              <button
                type="button"
                onClick={() => setShowAddSectionModal(false)}
                className="px-3 py-1.5 text-xs rounded border border-border-beige text-ink-muted hover:bg-canvas-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddSection}
                className="px-4 py-1.5 text-xs font-semibold rounded bg-primary hover:bg-primary-hover text-white shadow-crisp-sm"
              >
                Add Section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

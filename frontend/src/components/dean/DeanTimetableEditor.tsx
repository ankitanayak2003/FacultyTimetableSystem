import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Info,
  Loader2,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import { useDragAutoScroll } from '../../hooks/useDragAutoScroll';
import { GeneratorCourseTable, GeneratorCourseItem } from '../common/GeneratorCourseTable';
import { shouldApplyRemotePlacements } from '../../utils/syncIntegrity';
import {
  DeanSubject,
  DeanPlacement,
  DeanSectionTimetable,
  DEAN_DEPARTMENTS,
} from '../../data/workflowDemoData';

const ACADEMIC_YEARS = ['2026–2027', '2025–2026', '2027–2028'];
const STUDENT_YEARS = ['First Year', 'Second Year', 'Third Year', 'Fourth Year'];
const SEMESTERS = ['Odd Semester', 'Even Semester'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

interface ClashRecord {
  placementId: string;
  day: string;
  startPeriod: number;
  duration: number;
  facultyName: string;
  conflictingSection: string;
  conflictingSubject: string;
  reason: string;
}

export const DeanTimetableEditor: React.FC = () => {
  const {
    deanSubjects,
    deanTimetables,
    saveDeanSectionTimetable,
    lockDeanSectionTimetable,
    unlockDeanSectionTimetable,
    departmentFaculty,
    syncStatus,
    isBackendConnected,
    backendSyncError,
    refreshBackendData,
  } = useWorkflow();

  const registeredFaculty = useMemo(() => {
    const names = departmentFaculty.map((f) => f.name).filter(Boolean);
    return names.length > 0 ? names : ['Faculty Member'];
  }, [departmentFaculty]);

  // Automatic scrolling during timetable drag-and-drop
  useDragAutoScroll();

  // 1. Timetable Selectors
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026–2027');
  const [selectedStudentYear, setSelectedStudentYear] = useState('Second Year');
  const [selectedSemester, setSelectedSemester] = useState('Odd Semester');
  const [selectedDepartment, setSelectedDepartment] = useState('AIDS');
  const [selectedSection, setSelectedSection] = useState('Section A');

  const isFirstYear = selectedStudentYear === 'First Year';

  // Dynamic sections per department
  const [sectionsByDept, setSectionsByDept] = useState<Record<string, string[]>>({
    AIDS: ['Section A', 'Section B'],
    AIML: ['Section A'],
    CSE: ['Section A', 'Section B', 'Section C'],
    ECE: ['Section A', 'Section B'],
    MECH: ['Section A'],
    CIVIL: ['Section A'],
    DS: ['Section A', 'Section B'],
    ML: ['Section A'],
    EC: ['Section A', 'Section B'],
    'First Year': ['Section A', 'Section B', 'Section C', 'Section D'],
  });

  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  // Active composite key: First Year is section-based without department
  const timetableKey = isFirstYear
    ? `${selectedAcademicYear}_First Year_${selectedSemester}_${selectedSection}`
    : `${selectedAcademicYear}_${selectedStudentYear}_${selectedSemester}_${selectedDepartment}_${selectedSection}`;

  // Local Timetable Placements and Lock State
  const [placements, setPlacements] = useState<DeanPlacement[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const activeScopeRef = useRef<string>(timetableKey);
  const previousScopeRef = useRef<string | null>(null);
  const isDirtyRef = useRef<boolean>(false);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Status notifications
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Clash Detection State
  const [clashes, setClashes] = useState<ClashRecord[]>([]);
  const [hasRunClashCheck, setHasRunClashCheck] = useState(false);

  // Drag and Drop Placement Modal
  const [pendingDrop, setPendingDrop] = useState<{
    day: (typeof DAYS)[number];
    startPeriod: number;
    subject: DeanSubject;
  } | null>(null);

  const [modalFaculty, setModalFaculty] = useState<string>('');
  const [modalDuration, setModalDuration] = useState<number>(1);
  const [modalRoom, setModalRoom] = useState<string>('');

  // Drag-over styling tracking
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  // Synchronize when selector changes or when deanTimetables updates (preserving unsaved local edits)
  useEffect(() => {
    activeScopeRef.current = timetableKey;
    const scopeChanged = previousScopeRef.current !== timetableKey;
    previousScopeRef.current = timetableKey;

    if (scopeChanged) {
      isDirtyRef.current = false;
    }

    if (!scopeChanged && !shouldApplyRemotePlacements({
      currentScopeKey: activeScopeRef.current,
      targetScopeKey: timetableKey,
      isDirty: isDirtyRef.current,
    })) {
      return;
    }

    const existing = deanTimetables[timetableKey];
    if (existing) {
      setPlacements(existing.placements || []);
      setIsLocked(existing.isLocked || false);
    } else {
      setPlacements([]);
      setIsLocked(false);
    }
    setClashes([]);
    setHasRunClashCheck(false);
  }, [timetableKey, deanTimetables]);

  // Available subjects from master catalog
  const availableSubjects = useMemo(() => {
    return deanSubjects;
  }, [deanSubjects]);

  // Handle adding a new section
  const handleAddSection = () => {
    if (!newSectionName.trim()) return;
    const trimmed = newSectionName.trim();
    const currentList = sectionsByDept[selectedDepartment] || ['Section A'];
    if (!currentList.includes(trimmed)) {
      setSectionsByDept((prev) => ({
        ...prev,
        [selectedDepartment]: [...currentList, trimmed],
      }));
      setSelectedSection(trimmed);
      setToastMsg({ type: 'success', text: `Section "${trimmed}" added for ${selectedDepartment}.` });
    }
    setNewSectionName('');
    setShowAddSectionModal(false);
  };

  // Drag from Subject Tray
  const handleTrayDragStart = (e: React.DragEvent, subject: DeanSubject) => {
    if (isLocked) return;
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'TRAY_SUBJECT', subject }));
  };

  // Drag placed cell to move
  const handlePlacementDragStart = (e: React.DragEvent, placement: DeanPlacement) => {
    if (isLocked) return;
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

    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;

    try {
      const data = JSON.parse(rawData);

      if (data.type === 'TRAY_SUBJECT') {
        const sub: DeanSubject = data.subject;
        // Determine smart duration
        const isLabOrIntegrated =
          sub.type.toLowerCase().includes('lab') ||
          sub.type.toLowerCase().includes('integrated') ||
          (sub.code ? sub.code.toLowerCase().includes('l') : false);
        const defaultDur = isLabOrIntegrated ? 2 : 1;

        // Determine default faculty
        const defaultFac = sub.facultyNames?.[0] || registeredFaculty[0];

        setModalFaculty(defaultFac);
        setModalDuration(defaultDur);
        setModalRoom(isLabOrIntegrated ? 'Laboratory' : '');
        setPendingDrop({
          day,
          startPeriod,
          subject: sub,
        });
      } else if (data.type === 'MOVE_PLACEMENT') {
        const placementId = data.placementId;
        isDirtyRef.current = true;
        setPlacements((prev) => {
          const target = prev.find((p) => p.id === placementId);
          if (!target) return prev;
          // Move placement to new day & period, retaining faculty, subject, duration
          return prev.map((p) =>
            p.id === placementId
              ? {
                  ...p,
                  day,
                  startPeriod,
                }
              : p
          );
        });
        setToastMsg({
          type: 'info',
          text: `Moved slot to ${day} Period ${startPeriod}. Faculty assigned remained intact.`,
        });
        // Clear old clash check when moved
        setHasRunClashCheck(false);
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  // Confirm placement from modal
  const handleConfirmPlacement = () => {
    if (!pendingDrop) return;
    const { day, startPeriod, subject } = pendingDrop;

    const newPlacement: DeanPlacement = {
      id: `p-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      day,
      startPeriod,
      duration: modalDuration,
      subjectCode: subject.code || '',
      subjectName: subject.name,
      facultyName: modalFaculty,
      room: modalRoom.trim() || undefined,
      isMerged: modalDuration > 1,
      subjectId: subject.id,
    };

    // Remove any overlapping placements on the same day and period
    const periodsOccupied = Array.from({ length: modalDuration }, (_, i) => startPeriod + i);
    const updated = placements.filter((p) => {
      if (p.day !== day) return true;
      const existingRange = Array.from({ length: p.duration }, (_, i) => p.startPeriod + i);
      const hasOverlap = periodsOccupied.some((period) => existingRange.includes(period));
      return !hasOverlap;
    });

    isDirtyRef.current = true;
    setPlacements([...updated, newPlacement]);
    setPendingDrop(null);
    setToastMsg({
      type: 'success',
      text: `Assigned ${subject.code} (${modalFaculty}) to ${day} Period ${startPeriod}.`,
    });
    setHasRunClashCheck(false);
  };

  // Delete / Remove placement
  const handleRemovePlacement = (placementId: string) => {
    if (isLocked) return;
    isDirtyRef.current = true;
    setPlacements((prev) => prev.filter((p) => p.id !== placementId));
    setToastMsg({ type: 'info', text: 'Placement removed from schedule.' });
    setHasRunClashCheck(false);
  };

  // Clash Detection Algorithm
  const handleCheckClashes = () => {
    const detected: ClashRecord[] = [];

    // 1. Internal check: check overlaps in same section
    placements.forEach((p, idx) => {
      for (let j = idx + 1; j < placements.length; j++) {
        const other = placements[j];
        if (p.day === other.day) {
          const range1 = Array.from({ length: p.duration }, (_, i) => p.startPeriod + i);
          const range2 = Array.from({ length: other.duration }, (_, i) => other.startPeriod + i);
          const overlap = range1.filter((r) => range2.includes(r));
          if (overlap.length > 0) {
            detected.push({
              placementId: p.id,
              day: p.day,
              startPeriod: p.startPeriod,
              duration: p.duration,
              facultyName: p.facultyName,
              conflictingSection: selectedSection,
              conflictingSubject: other.subjectCode,
              reason: `Overlap in same timetable on ${p.day} Period(s) ${overlap.join(', ')} with ${other.subjectCode}`,
            });
          }
        }
      }
    });

    // 2. Cross-timetable check across other sections in the same Academic Year & Semester
    Object.entries(deanTimetables).forEach(([otherKey, otherTimetable]) => {
      if (otherKey === timetableKey) return; // skip self
      if (
        otherTimetable.academicYear !== selectedAcademicYear ||
        otherTimetable.semester !== selectedSemester
      ) {
        return;
      }

      const otherSectionLabel = `${otherTimetable.department} ${otherTimetable.section}`;

      placements.forEach((currentP) => {
        const currentFacultyList = currentP.facultyName
          .split(/[,/&]/)
          .map((f) => f.trim().toLowerCase())
          .filter(Boolean);

        const currentPeriods = Array.from(
          { length: currentP.duration },
          (_, i) => currentP.startPeriod + i
        );

        otherTimetable.placements?.forEach((otherP) => {
          if (otherP.day === currentP.day) {
            const otherPeriods = Array.from(
              { length: otherP.duration },
              (_, i) => otherP.startPeriod + i
            );
            const commonPeriods = currentPeriods.filter((p) => otherPeriods.includes(p));

            if (commonPeriods.length > 0) {
              const otherFacultyList = otherP.facultyName
                .split(/[,/&]/)
                .map((f) => f.trim().toLowerCase())
                .filter(Boolean);

              const conflictingFaculty = currentFacultyList.find((f) =>
                otherFacultyList.includes(f)
              );

              if (conflictingFaculty) {
                detected.push({
                  placementId: currentP.id,
                  day: currentP.day,
                  startPeriod: currentP.startPeriod,
                  duration: currentP.duration,
                  facultyName: currentP.facultyName,
                  conflictingSection: otherSectionLabel,
                  conflictingSubject: otherP.subjectCode,
                  reason: `Double booking: Faculty member is also assigned in ${otherSectionLabel} for ${otherP.subjectCode} during Period(s) ${commonPeriods.join(', ')}.`,
                });
              }
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
        text: 'Zero Clashes Detected: All faculty assignments are completely conflict-free across institutional timetables.',
      });
    } else {
      setToastMsg({
        type: 'error',
        text: `${detected.length} conflict(s) identified. Review highlighted cells and clash analysis below.`,
      });
    }
  };

  // Action: Save Draft
  const canPersistToBackend = isBackendConnected === true && syncStatus !== 'loading' && syncStatus !== 'error';

  const handleSaveDraft = async () => {
    if (!canPersistToBackend) {
      setToastMsg({
        type: 'error',
        text: 'Cannot save draft: backend synchronization is pending or failed. Please retry sync first.',
      });
      return;
    }
    const initiatedKey = timetableKey;
    const initiatedIsFY = isFirstYear;
    const initiatedDept = selectedDepartment;
    const initiatedSection = selectedSection;

    setIsSaving(true);
    const timetableData: DeanSectionTimetable = {
      academicYear: selectedAcademicYear,
      studentYear: selectedStudentYear,
      semester: selectedSemester,
      department: isFirstYear ? null : selectedDepartment,
      section: selectedSection,
      placements,
      isLocked,
    };
    try {
      await saveDeanSectionTimetable(initiatedKey, timetableData);
      if (!isMountedRef.current || activeScopeRef.current !== initiatedKey) {
        return;
      }
      isDirtyRef.current = false;
      setToastMsg({
        type: 'success',
        text: initiatedIsFY
          ? `Draft saved successfully for First Year (Mixed Batch) - ${initiatedSection}.`
          : `Draft saved successfully for ${initiatedDept} - ${initiatedSection}.`,
      });
    } catch (err: any) {
      console.error('Failed to save Dean draft:', err);
      if (isMountedRef.current && activeScopeRef.current === initiatedKey) {
        setToastMsg({
          type: 'error',
          text: `Failed to save draft to Firestore: ${err?.message || 'Network/Server Error'}. Your local changes have been preserved.`,
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  // Action: Lock Timetable
  const handleLockTimetable = async () => {
    if (!canPersistToBackend) {
      setToastMsg({
        type: 'error',
        text: 'Cannot lock timetable: backend synchronization is pending or failed. Please retry sync first.',
      });
      return;
    }
    const initiatedKey = timetableKey;
    const initiatedIsFY = isFirstYear;
    const initiatedDept = selectedDepartment;
    const initiatedSection = selectedSection;

    setIsSaving(true);
    const timetableData: DeanSectionTimetable = {
      academicYear: selectedAcademicYear,
      studentYear: selectedStudentYear,
      semester: selectedSemester,
      department: isFirstYear ? null : selectedDepartment,
      section: selectedSection,
      placements,
      isLocked: true,
    };
    try {
      await saveDeanSectionTimetable(initiatedKey, timetableData);
      if (!isMountedRef.current || activeScopeRef.current !== initiatedKey) {
        return;
      }
      isDirtyRef.current = false;
      lockDeanSectionTimetable(initiatedKey);
      setIsLocked(true);
      setToastMsg({
        type: 'info',
        text: initiatedIsFY
          ? `Timetable locked and finalized for First Year (Mixed Batch) - ${initiatedSection}. Editing frozen.`
          : `Timetable locked and finalized for ${initiatedDept} - ${initiatedSection}. Editing frozen.`,
      });
    } catch (err: any) {
      console.error('Failed to lock Dean timetable:', err);
      if (isMountedRef.current && activeScopeRef.current === initiatedKey) {
        setToastMsg({
          type: 'error',
          text: `Failed to lock timetable in Firestore: ${err?.message || 'Network/Server Error'}.`,
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  };

  // Action: Unlock Timetable
  const handleUnlockTimetable = () => {
    isDirtyRef.current = true;
    unlockDeanSectionTimetable(timetableKey);
    setIsLocked(false);
    setToastMsg({
      type: 'info',
      text: isFirstYear
        ? `Timetable unlocked for First Year (Mixed Batch) - ${selectedSection}. You may now modify slots.`
        : `Timetable unlocked. You may now modify slots for ${selectedDepartment} - ${selectedSection}.`,
    });
  };

  // Course Table Data for Automatic Timetable Generator
  // Strictly includes a subject ONLY if:
  // 1. The subject has actually been added/placed in the currently selected class timetable (placements).
  // 2. The subject has a valid, non-empty course code (empty course codes are strictly excluded).
  // 3. The subject belongs to the selected class's academic year, semester, department (where applicable), and section.
  // 4. The subject is a valid active subject in the project data model.
  const generatorCourses = useMemo<GeneratorCourseItem[]>(() => {
    if (!placements || placements.length === 0) {
      return [];
    }

    const list: GeneratorCourseItem[] = [];
    const seenCodes = new Set<string>();

    placements.forEach((p) => {
      // Find matching subject definition in deanSubjects
      const matchedSub = deanSubjects.find(
        (s) =>
          (p.subjectId && s.id === p.subjectId) ||
          (s.code && p.subjectCode && s.code.trim().toUpperCase() === p.subjectCode.trim().toUpperCase()) ||
          s.name === p.subjectName
      );

      // Rule 2: Must have a valid, non-empty course code
      // If code was cleared in editor or is missing, strictly exclude
      const courseCode = (matchedSub?.code || p.subjectCode || '').trim();
      if (!courseCode) {
        return;
      }

      // Rule 3: Must belong to selected class's year, semester, academic year, and department (where applicable)
      if (matchedSub) {
        if (matchedSub.academicYear && matchedSub.academicYear !== selectedAcademicYear) {
          return;
        }
        if (matchedSub.studentYear && matchedSub.studentYear !== selectedStudentYear) {
          return;
        }
        if (matchedSub.semester && matchedSub.semester !== selectedSemester) {
          return;
        }
        if (!isFirstYear && (matchedSub as any).department && (matchedSub as any).department !== selectedDepartment) {
          return;
        }
      }

      // Deduplicate by uppercase courseCode so each course appears once in generator table
      const codeKey = courseCode.toUpperCase();
      if (seenCodes.has(codeKey)) {
        return;
      }
      seenCodes.add(codeKey);

      // Collect all faculty assigned to this subject across placements in this class
      const matchingPlacements = placements.filter(
        (pl) =>
          (pl.subjectCode && pl.subjectCode.trim().toUpperCase() === codeKey) ||
          (pl.subjectId && pl.subjectId === p.subjectId) ||
          pl.subjectName === p.subjectName
      );
      const placedFaculty = Array.from(new Set(matchingPlacements.map((pl) => pl.facultyName).filter(Boolean)));
      const finalFaculty = placedFaculty.length > 0 ? placedFaculty.join(', ') : (p.facultyName || 'Unassigned');

      const ltp =
        matchedSub?.ltp ||
        (matchedSub?.type?.includes('Lab') ? '0:0:2' : matchedSub?.type?.includes('Integrated') ? '3:0:2' : '3:0:0');
      const credit =
        matchedSub?.credits !== undefined && matchedSub?.credits !== null && matchedSub?.credits !== ''
          ? matchedSub.credits
          : (matchedSub?.type?.includes('Lab') ? 1.5 : matchedSub?.type?.includes('Integrated') ? 4 : 3);
      const courseType = matchedSub?.type || (p.isMerged ? 'Practical / Lab' : 'Theory');

      list.push({
        id: matchedSub?.id || p.subjectId || p.id,
        courseCode,
        courseName: matchedSub?.name || p.subjectName,
        ltp,
        courseType,
        credit,
        facultyName: finalFaculty,
      });
    });

    return list;
  }, [placements, deanSubjects, selectedAcademicYear, selectedStudentYear, selectedSemester, selectedDepartment, isFirstYear]);

  // Check if a placement is involved in a clash
  const isClashingPlacement = (placementId: string) => {
    return clashes.some((c) => c.placementId === placementId);
  };

  return (
    <div className="space-y-6 animate-fade-in text-ink">
      {/* Backend Synchronization Status Banner */}
      {syncStatus === 'loading' && (
        <div className="px-4 py-2.5 rounded-card border border-border-beige bg-canvas-paper text-xs text-ink-muted flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary flex-shrink-0" />
          <span>Synchronizing timetable data with Firestore... Draft saving is paused until sync completes.</span>
        </div>
      )}
      {syncStatus === 'error' && (
        <div className="px-4 py-2.5 rounded-card border border-rose-300 bg-rose-50 text-xs text-rose-900 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0" />
            <span>
              <strong>Backend sync failed:</strong> {backendSyncError || 'Unable to reach FastAPI server.'} Draft saving is disabled to protect existing Firestore records.
            </span>
          </div>
          <button
            type="button"
            onClick={() => void refreshBackendData()}
            className="px-2.5 py-1 rounded bg-white border border-rose-300 text-rose-900 font-semibold hover:bg-rose-100 flex-shrink-0"
          >
            Retry Sync
          </button>
        </div>
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`px-4 py-3 rounded-card border text-xs flex items-center justify-between transition-all ${
            toastMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : toastMsg.type === 'error'
              ? 'bg-rose-50 text-rose-900 border-rose-300'
              : 'bg-primary-subtle text-primary border-border-beige'
          }`}
        >
          <div className="flex items-center gap-2">
            {toastMsg.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-700 flex-shrink-0" />}
            {toastMsg.type === 'error' && <AlertTriangle className="w-4 h-4 text-rose-700 flex-shrink-0" />}
            {toastMsg.type === 'info' && <Info className="w-4 h-4 text-primary flex-shrink-0" />}
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
                Institutional Timetable Planning
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
            </div>
            <h2 className="font-headline text-xl sm:text-2xl font-semibold text-primary">
              Timetable Editor
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Standard VTU 7-period grid with predefined Tea Break, Lunch Break, and Leisure slots. Drag and place subjects from tray.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCheckClashes}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-canvas-muted hover:bg-canvas-paper text-ink border border-border-beige transition-colors shadow-crisp-sm"
              title="Validate faculty schedule conflicts across institutional timetables"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              <span>Check Clashes</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isLocked || isSaving || !canPersistToBackend}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded border transition-colors shadow-crisp-sm ${
                isLocked || isSaving || !canPersistToBackend
                  ? 'bg-canvas-muted text-ink-light border-border-beige cursor-not-allowed'
                  : 'bg-canvas-paper hover:bg-canvas text-primary border-primary hover:border-primary-hover'
              }`}
            >
              {isSaving ? (
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 text-primary" />
              )}
              <span>{isSaving ? 'Saving Draft...' : 'Save Draft'}</span>
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
                disabled={isSaving || !canPersistToBackend}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded transition-colors shadow-crisp-sm ${
                  isSaving || !canPersistToBackend
                    ? 'bg-canvas-muted text-ink-light border border-border-beige cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-hover text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Timetable</span>
              </button>
            )}
          </div>
        </div>

        {/* 5 Selectors Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-0.5">
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
              onChange={(e) => {
                const newYear = e.target.value;
                setSelectedStudentYear(newYear);
                if (newYear === 'First Year') {
                  setSelectedSection('Section A');
                } else {
                  const deptSecs = sectionsByDept[selectedDepartment] || ['Section A'];
                  setSelectedSection(deptSecs[0]);
                }
              }}
              className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
            >
              {STUDENT_YEARS.map((sy) => (
                <option key={sy} value={sy}>
                  {sy}
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

          {/* Department */}
          <div>
            <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted mb-0.5 font-semibold">
              Department
            </label>
            {isFirstYear ? (
              <select
                disabled
                value="NOT_APPLICABLE"
                className="w-full px-2.5 py-1 text-xs bg-canvas-muted rounded border border-border-beige text-ink-muted italic select-none cursor-not-allowed"
                title="First-year students are a mixed batch and are not grouped under individual departments."
              >
                <option value="NOT_APPLICABLE">
                  Not applicable — First Year is a mixed batch
                </option>
              </select>
            ) : (
              <select
                value={selectedDepartment}
                onChange={(e) => {
                  setSelectedDepartment(e.target.value);
                  const nextSections = sectionsByDept[e.target.value] || ['Section A'];
                  setSelectedSection(nextSections[0]);
                }}
                className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
              >
                {DEAN_DEPARTMENTS.map((dept) => (
                  <option key={dept.code} value={dept.code}>
                    {dept.code} — {dept.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Section (Dynamic + Add option) */}
          <div>
            <div className="flex items-center justify-between mb-0.5">
              <label className="block text-[10px] font-mono uppercase tracking-wider text-ink-muted font-semibold">
                Section
              </label>
              {!isFirstYear && (
                <button
                  type="button"
                  onClick={() => setShowAddSectionModal(true)}
                  className="text-[10px] text-primary hover:underline font-semibold flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Add Section
                </button>
              )}
            </div>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-2.5 py-1 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
            >
              {(isFirstYear
                ? (sectionsByDept['First Year'] || ['Section A', 'Section B', 'Section C', 'Section D'])
                : (sectionsByDept[selectedDepartment] || ['Section A'])
              ).map((sec) => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Locked Notice Banner */}
      {isLocked && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-card flex items-center justify-between text-xs text-emerald-950">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span className="font-semibold">
              This timetable is LOCKED by Dean (Academic Affairs). Grid slots are read-only.
            </span>
          </div>
          <span className="text-[11px] font-mono text-emerald-800">
            Click "Unlock for Editing" to make changes.
          </span>
        </div>
      )}

      {/* Subject Tray (Palette) */}
      <div className="p-2.5 sm:p-3 bg-surface rounded-card border border-border-beige shadow-crisp">
        {availableSubjects.length === 0 ? (
          <div className="p-3.5 bg-canvas-muted rounded text-xs text-ink-muted border border-dashed border-border-beige text-center">
            No subjects added yet to the master list. Go to{' '}
            <span className="font-semibold text-primary">Subject & Faculty Allocation</span> to define subjects and assign faculty.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-1">
            {availableSubjects.map((sub) => {
              const hasCode = Boolean(sub.code && sub.code.trim());
              return (
                <div
                  key={sub.id}
                  draggable={!isLocked}
                  onDragStart={(e) => handleTrayDragStart(e, sub)}
                  className={`p-2 rounded bg-canvas-paper border border-border-beige text-xs flex items-center gap-2 shadow-crisp-sm transition-all select-none ${
                    isLocked
                      ? 'opacity-60 cursor-not-allowed'
                      : 'cursor-grab hover:border-primary hover:shadow-crisp active:cursor-grabbing hover:bg-canvas'
                  }`}
                  title={hasCode ? `${sub.code} — ${sub.name}` : sub.name}
                >
                  <GripVertical className="w-3.5 h-3.5 text-ink-light flex-shrink-0" />
                  <div className="min-w-0">
                    {hasCode && (
                      <span className="font-mono font-bold text-primary text-[11px] block leading-tight">
                        {sub.code!.trim()}
                      </span>
                    )}
                    <span className="text-[11px] font-medium text-ink truncate block max-w-[200px]" title={sub.name}>
                      {sub.name}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Timetable Grid Container (Class Timetable DS-3rd sem.docx format) */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden">
        <div className="py-2.5 px-3.5 bg-canvas-muted border-b border-border-beige flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="font-headline text-sm sm:text-base font-semibold text-primary">
              Institutional Schedule Grid — {selectedDepartment} ({selectedSection})
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
                // Find placements for this day
                const dayPlacements = placements.filter((p) => p.day === day);

                // Helper to check what occupies a period
                const getPlacementAt = (period: number) => {
                  return dayPlacements.find((p) => p.startPeriod === period);
                };

                const isCoveredByPrevious = (period: number) => {
                  return dayPlacements.some(
                    (p) => p.startPeriod < period && period < p.startPeriod + p.duration
                  );
                };

                // Render cell function for teaching periods
                const renderPeriodCell = (period: number) => {
                  if (isCoveredByPrevious(period)) {
                    return null; // Merged with preceding cell
                  }

                  const placement = getPlacementAt(period);
                  const cellKey = `${day}-${period}`;
                  const isHovered = dragOverCell === cellKey;

                  if (placement) {
                    const clashing = isClashingPlacement(placement.id);
                    const colSpan = placement.duration || 1;

                    return (
                      <td
                        key={period}
                        colSpan={colSpan}
                        className={`p-1 border border-black align-top bg-white transition-colors ${
                          clashing ? 'bg-rose-50' : 'bg-white'
                        }`}
                      >
                        <div
                          draggable={!isLocked}
                          onDragStart={(e) => handlePlacementDragStart(e, placement)}
                          className={`group relative p-1.5 rounded border transition-all h-full min-h-[54px] flex flex-col justify-between ${
                            clashing
                              ? 'border-rose-600 bg-rose-50 text-rose-950 shadow-crisp'
                              : 'border-neutral-300 bg-white hover:border-[#993366] text-black shadow-xs'
                          } ${isLocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
                          title={`Draggable: Drag to another slot to move slot and faculty.\nSubject: ${placement.subjectName}\nFaculty: ${placement.facultyName}${placement.room && placement.room !== 'LH-201' ? `\nRoom: ${placement.room}` : ''}`}
                        >
                          {/* Top row: Subject Code (if available) + Delete Button */}
                          <div className="flex items-center justify-between gap-1">
                            {placement.subjectCode ? (
                              <span className="font-mono font-bold text-[#4A1525] text-xs">
                                {placement.subjectCode}
                              </span>
                            ) : (
                              <span />
                            )}
                            {!isLocked && (
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
                          <div className="text-[10px] font-medium text-black leading-tight line-clamp-2 my-0.5" title={placement.subjectName}>
                            {placement.subjectName}
                          </div>

                          {/* Bottom: Faculty & Room */}
                          <div className="flex items-center justify-between text-[9px] text-neutral-700 font-mono pt-0.5 border-t border-neutral-200 mt-0.5">
                            <span className="truncate font-semibold text-black max-w-[70px]" title={placement.facultyName}>
                              {placement.facultyName}
                            </span>
                            {placement.room && placement.room.trim() && placement.room !== 'LH-201' && (
                              <span className="text-[8px] px-1 py-0.2 rounded bg-neutral-100 text-neutral-600 ml-0.5">
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
                      <div className={`w-full h-full min-h-[50px] rounded border border-dashed flex flex-col items-center justify-center text-[10px] p-0.5 ${
                        isHovered && !isLocked
                          ? 'border-[#993366] bg-[#EFCDDE]/30 text-[#4A1525]'
                          : 'border-neutral-300 text-neutral-400'
                      }`}>
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
                Clash Analysis & Resolution Engine
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
                Zero clashes found! All faculty members and room assignments in this schedule are completely free from overlapping commitments across sections.
              </span>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-ink-muted">
                The following faculty assignments conflict with existing timetable allocations in other sections or within this class:
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
                      Target Section: {c.conflictingSection} • Code: {c.conflictingSubject}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Course Table for Automatic Timetable Generator */}
      <GeneratorCourseTable
        courses={generatorCourses}
        title={
          isFirstYear
            ? `Course & Faculty Allocation Registry — First Year (${selectedSection})`
            : `Course & Faculty Allocation Registry — ${selectedDepartment} ${selectedStudentYear} (${selectedSection})`
        }
        subtitle="Table 1 (VTU Format)"
        emptyMessage="No eligible subjects added to this class timetable yet."
      />

      {/* Drop Modal: Select Assigned Faculty & Slot Duration */}
      {pendingDrop && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface rounded-card border border-border-beige shadow-crisp max-w-md w-full p-5 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-border-beige">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                  Confirm Timetable Placement
                </span>
                <h3 className="font-headline text-lg font-semibold text-primary">
                  {pendingDrop.subject.code ? `${pendingDrop.subject.code} — ` : ''}{pendingDrop.subject.name}
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

              {/* Faculty Selector (From Allocated Faculty) */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                  Assigned Faculty
                </label>
                <select
                  value={modalFaculty}
                  onChange={(e) => setModalFaculty(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
                >
                  {/* Priority 1: Allocated faculty for this subject */}
                  {pendingDrop.subject.facultyNames?.map((fn) => (
                    <option key={fn} value={fn}>
                      {fn} (Allocated)
                    </option>
                  ))}
                  {/* Secondary list of other registered faculty */}
                  <optgroup label="Other Registered Faculty">
                    {registeredFaculty.filter(
                      (r) => !pendingDrop.subject.facultyNames?.includes(r)
                    ).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </optgroup>
                </select>
                <p className="text-[10px] text-ink-muted mt-1">
                  Faculty pre-allocated for this course are prioritized.
                </p>
              </div>

              {/* Duration (Periods) */}
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
                  <option value={2}>2 Consecutive Periods (Lab / Integrated / Training)</option>
                  <option value={3}>3 Consecutive Periods (Workshop / Project Work)</option>
                </select>
                {modalDuration > 1 && (
                  <p className="text-[10px] text-ink-muted mt-1">
                    Cell will merge across {modalDuration} consecutive periods.
                  </p>
                )}
              </div>

              {/* Room / Venue */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                  Classroom / Lab Venue
                </label>
                <input
                  type="text"
                  value={modalRoom}
                  onChange={(e) => setModalRoom(e.target.value)}
                  placeholder="Optional: leave blank if unassigned"
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
                Add Section for {selectedDepartment}
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
                placeholder="e.g. Section B, Section C"
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

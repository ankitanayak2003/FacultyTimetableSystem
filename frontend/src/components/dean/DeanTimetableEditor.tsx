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
  Info,
} from 'lucide-react';
import { useWorkflow } from '../../context/WorkflowContext';
import {
  DeanSubject,
  DeanPlacement,
  DeanSectionTimetable,
  DEAN_DEPARTMENTS,
  REGISTERED_FACULTY_NAMES,
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
  } = useWorkflow();

  // 1. Timetable Selectors
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('2026–2027');
  const [selectedStudentYear, setSelectedStudentYear] = useState('Second Year');
  const [selectedSemester, setSelectedSemester] = useState('Odd Semester');
  const [selectedDepartment, setSelectedDepartment] = useState('DS');
  const [selectedSection, setSelectedSection] = useState('Section A');

  // Dynamic sections per department
  const [sectionsByDept, setSectionsByDept] = useState<Record<string, string[]>>({
    DS: ['Section A', 'Section B'],
    ML: ['Section A'],
    CSE: ['Section A', 'Section B', 'Section C'],
    EC: ['Section A', 'Section B'],
    MECH: ['Section A'],
    CIVIL: ['Section A'],
    'First Year': ['Section A', 'Section B', 'Section C', 'Section D'],
  });

  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  // Active composite key
  const timetableKey = `${selectedAcademicYear}_${selectedStudentYear}_${selectedSemester}_${selectedDepartment}_${selectedSection}`;

  // Local Timetable Placements and Lock State
  const [placements, setPlacements] = useState<DeanPlacement[]>([]);
  const [isLocked, setIsLocked] = useState(false);

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
  const [modalRoom, setModalRoom] = useState<string>('LH-201');

  // Drag-over styling tracking
  const [dragOverCell, setDragOverCell] = useState<string | null>(null);

  // Synchronize when selector changes or when deanTimetables updates
  useEffect(() => {
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

  // Available subjects for the current Academic Year, Student Year, Semester
  const availableSubjects = useMemo(() => {
    return deanSubjects.filter(
      (s) =>
        s.academicYear === selectedAcademicYear &&
        s.studentYear === selectedStudentYear &&
        s.semester === selectedSemester
    );
  }, [deanSubjects, selectedAcademicYear, selectedStudentYear, selectedSemester]);

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
          sub.code.toLowerCase().includes('l');
        const defaultDur = isLabOrIntegrated ? 2 : 1;

        // Determine default faculty
        const defaultFac = sub.facultyNames?.[0] || REGISTERED_FACULTY_NAMES[0];

        setModalFaculty(defaultFac);
        setModalDuration(defaultDur);
        setModalRoom(isLabOrIntegrated ? 'Laboratory' : 'LH-201');
        setPendingDrop({
          day,
          startPeriod,
          subject: sub,
        });
      } else if (data.type === 'MOVE_PLACEMENT') {
        const placementId = data.placementId;
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
      subjectCode: subject.code,
      subjectName: subject.name,
      facultyName: modalFaculty,
      room: modalRoom.trim() || 'LH-201',
      isMerged: modalDuration > 1,
    };

    // Remove any overlapping placements on the same day and period
    const periodsOccupied = Array.from({ length: modalDuration }, (_, i) => startPeriod + i);
    const updated = placements.filter((p) => {
      if (p.day !== day) return true;
      const existingRange = Array.from({ length: p.duration }, (_, i) => p.startPeriod + i);
      const hasOverlap = periodsOccupied.some((period) => existingRange.includes(period));
      return !hasOverlap;
    });

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
  const handleSaveDraft = () => {
    const timetableData: DeanSectionTimetable = {
      academicYear: selectedAcademicYear,
      studentYear: selectedStudentYear,
      semester: selectedSemester,
      department: selectedDepartment,
      section: selectedSection,
      placements,
      isLocked,
    };
    saveDeanSectionTimetable(timetableKey, timetableData);
    setToastMsg({
      type: 'success',
      text: `Draft saved successfully for ${selectedDepartment} - ${selectedSection}.`,
    });
  };

  // Action: Lock Timetable
  const handleLockTimetable = () => {
    const timetableData: DeanSectionTimetable = {
      academicYear: selectedAcademicYear,
      studentYear: selectedStudentYear,
      semester: selectedSemester,
      department: selectedDepartment,
      section: selectedSection,
      placements,
      isLocked: true,
    };
    saveDeanSectionTimetable(timetableKey, timetableData);
    lockDeanSectionTimetable(timetableKey);
    setIsLocked(true);
    setToastMsg({
      type: 'info',
      text: `Timetable locked and finalized for ${selectedDepartment} - ${selectedSection}. Editing frozen.`,
    });
  };

  // Action: Unlock Timetable
  const handleUnlockTimetable = () => {
    unlockDeanSectionTimetable(timetableKey);
    setIsLocked(false);
    setToastMsg({
      type: 'info',
      text: `Timetable unlocked. You may now modify slots for ${selectedDepartment} - ${selectedSection}.`,
    });
  };

  // Auto-Generated Placed Subjects Table Data
  const autoGeneratedSubjects = useMemo(() => {
    const map = new Map<string, { code: string; name: string; facultySet: Set<string>; hours: number; type: string }>();

    placements.forEach((p) => {
      const code = p.subjectCode.trim();
      const existing = map.get(code);

      // Find original subject type from Page 1 subjects if available
      const orig = deanSubjects.find((s) => s.code.toLowerCase() === code.toLowerCase());
      const type = orig?.type || 'Institutional Course';

      if (!existing) {
        const faculties = new Set<string>();
        if (p.facultyName) {
          p.facultyName.split(/[,/&]/).forEach((f) => faculties.add(f.trim()));
        }
        map.set(code, {
          code,
          name: p.subjectName || code,
          facultySet: faculties,
          hours: p.duration,
          type,
        });
      } else {
        if (p.facultyName) {
          p.facultyName.split(/[,/&]/).forEach((f) => existing.facultySet.add(f.trim()));
        }
        existing.hours += p.duration;
      }
    });

    return Array.from(map.values()).map((item) => ({
      code: item.code,
      name: item.name,
      facultyList: Array.from(item.facultySet).filter(Boolean).join(', '),
      hours: item.hours,
      type: item.type,
    }));
  }, [placements, deanSubjects]);

  // Check if a placement is involved in a clash
  const isClashingPlacement = (placementId: string) => {
    return clashes.some((c) => c.placementId === placementId);
  };

  return (
    <div className="space-y-6 animate-fade-in text-ink">
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
      <div className="p-5 bg-surface rounded-card border border-border-beige shadow-crisp space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border-beige">
          <div>
            <div className="flex items-center gap-2 mb-1">
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
            <h2 className="font-headline text-2xl font-semibold text-primary">
              Timetable Editor
            </h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Standard VTU 7-period grid with predefined Tea Break, Lunch Break, and Leisure slots. Drag and place subjects from tray.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleCheckClashes}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded bg-canvas-muted hover:bg-canvas-paper text-ink border border-border-beige transition-colors shadow-crisp-sm"
              title="Validate faculty schedule conflicts across institutional timetables"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              <span>Check Clashes</span>
            </button>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isLocked}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded border transition-colors shadow-crisp-sm ${
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
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-crisp-sm"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Unlock for Editing</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLockTimetable}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded bg-primary hover:bg-primary-hover text-white transition-colors shadow-crisp-sm"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Timetable</span>
              </button>
            )}
          </div>
        </div>

        {/* 5 Selectors Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          {/* Academic Year */}
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
              Academic Year
            </label>
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
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
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
              Student Year
            </label>
            <select
              value={selectedStudentYear}
              onChange={(e) => setSelectedStudentYear(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
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
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
              Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink focus:outline-none focus:border-primary"
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
            <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                const nextSections = sectionsByDept[e.target.value] || ['Section A'];
                setSelectedSection(nextSections[0]);
              }}
              className="w-full px-3 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
            >
              {DEAN_DEPARTMENTS.map((dept) => (
                <option key={dept.code} value={dept.code}>
                  {dept.code} — {dept.name}
                </option>
              ))}
            </select>
          </div>

          {/* Section (Dynamic + Add option) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted font-semibold">
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
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
            >
              {(sectionsByDept[selectedDepartment] || ['Section A']).map((sec) => (
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
      <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
              Page 1 Allocated Subjects
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-subtle text-primary font-semibold">
              {availableSubjects.length} Available in Tray
            </span>
          </div>
          <p className="text-[11px] text-ink-muted">
            Drag any subject card into an empty period in the timetable below.
          </p>
        </div>

        {availableSubjects.length === 0 ? (
          <div className="p-4 bg-canvas-muted rounded text-xs text-ink-muted border border-dashed border-border-beige text-center">
            No subjects allocated yet for {selectedStudentYear} ({selectedSemester}). Go to{' '}
            <span className="font-semibold text-primary">Subject & Faculty Allocation</span> to define subjects and assign faculty.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5 max-h-36 overflow-y-auto p-1">
            {availableSubjects.map((sub) => (
              <div
                key={sub.id}
                draggable={!isLocked}
                onDragStart={(e) => handleTrayDragStart(e, sub)}
                className={`p-2.5 rounded bg-canvas-paper border border-border-beige text-xs flex items-center gap-2.5 shadow-crisp-sm transition-all select-none ${
                  isLocked
                    ? 'opacity-60 cursor-not-allowed'
                    : 'cursor-grab hover:border-primary hover:shadow-crisp active:cursor-grabbing hover:bg-canvas'
                }`}
                title={`Subject: ${sub.name}\nFaculty: ${sub.facultyNames.join(', ')}\nDrag to timetable cell`}
              >
                <GripVertical className="w-3.5 h-3.5 text-ink-light flex-shrink-0" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-primary text-[11px]">{sub.code}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-canvas-muted text-ink-muted">
                      {sub.type.split(' - ')[0] || sub.type}
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-ink truncate max-w-[200px]" title={sub.name}>
                    {sub.name}
                  </p>
                  <p className="text-[10px] text-ink-muted font-mono truncate max-w-[200px]">
                    Fac: {sub.facultyNames.join(', ') || 'Unassigned'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timetable Grid Container (Class Timetable DS-3rd sem.docx format) */}
      <div className="bg-surface rounded-card border border-border-beige shadow-crisp overflow-hidden">
        <div className="p-4 bg-canvas-muted border-b border-border-beige flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <h3 className="font-headline text-base font-semibold text-primary">
              Institutional Schedule Grid — {selectedDepartment} ({selectedSection})
            </h3>
          </div>
          <span className="text-xs font-mono text-ink-muted">
            {selectedStudentYear} • {selectedSemester} • {selectedAcademicYear}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs select-none">
            <thead>
              <tr className="bg-canvas-paper text-ink font-mono text-[11px] border-b border-border-beige">
                <th className="py-2.5 px-3 text-left font-semibold border-r border-border-beige w-28 uppercase">
                  DAY/TIME
                </th>
                <th className="py-2 px-2 text-center border-r border-border-beige min-w-[100px]">
                  <div className="font-bold">Period 1</div>
                  <div className="text-[10px] text-ink-muted font-normal">9:00 - 9:55</div>
                </th>
                <th className="py-2 px-2 text-center border-r border-border-beige min-w-[100px]">
                  <div className="font-bold">Period 2</div>
                  <div className="text-[10px] text-ink-muted font-normal">9:55 - 10:50</div>
                </th>
                <th className="py-2 px-2 text-center border-r border-border-beige bg-[#f4efe8] text-ink-muted min-w-[70px] uppercase font-bold text-[10px] tracking-wider">
                  <div>TEA BREAK</div>
                  <div className="text-[9px] font-normal">10:50 - 11:10</div>
                </th>
                <th className="py-2 px-2 text-center border-r border-border-beige min-w-[100px]">
                  <div className="font-bold">Period 3</div>
                  <div className="text-[10px] text-ink-muted font-normal">11:10 - 12:05</div>
                </th>
                <th className="py-2 px-2 text-center border-r border-border-beige min-w-[100px]">
                  <div className="font-bold">Period 4</div>
                  <div className="text-[10px] text-ink-muted font-normal">12:05 - 1:00</div>
                </th>
                <th className="py-2 px-2 text-center border-r border-border-beige bg-[#f4efe8] text-ink-muted min-w-[80px] uppercase font-bold text-[10px] tracking-wider">
                  <div>LUNCH BREAK</div>
                  <div className="text-[9px] font-normal">1:00 - 1:55</div>
                </th>
                <th className="py-2 px-2 text-center border-r border-border-beige min-w-[100px]">
                  <div className="font-bold">Period 5</div>
                  <div className="text-[10px] text-ink-muted font-normal">1:55 - 2:50</div>
                </th>
                <th className="py-2 px-2 text-center border-r border-border-beige bg-[#f4efe8] text-ink-muted min-w-[65px] uppercase font-bold text-[10px] tracking-wider">
                  <div>LEISURE</div>
                  <div className="text-[9px] font-normal">2:50 - 3:00</div>
                </th>
                <th className="py-2 px-2 text-center border-r border-border-beige min-w-[100px]">
                  <div className="font-bold">Period 6</div>
                  <div className="text-[10px] text-ink-muted font-normal">3:00 - 3:55</div>
                </th>
                <th className="py-2 px-2 text-center min-w-[100px]">
                  <div className="font-bold">Period 7</div>
                  <div className="text-[10px] text-ink-muted font-normal">3:55 - 4:45</div>
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
                        className={`p-1.5 border-r border-b border-border-beige align-top transition-colors ${
                          clashing
                            ? 'bg-rose-50 border-rose-300'
                            : 'bg-surface hover:bg-canvas-paper'
                        }`}
                      >
                        <div
                          draggable={!isLocked}
                          onDragStart={(e) => handlePlacementDragStart(e, placement)}
                          className={`group relative p-2 rounded border transition-all h-full min-h-[64px] flex flex-col justify-between ${
                            clashing
                              ? 'border-rose-400 bg-rose-50 text-rose-950 shadow-crisp'
                              : 'border-border-beige bg-canvas-paper hover:border-primary text-ink'
                          } ${isLocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
                          title={`Draggable: Drag to another slot to move slot and faculty.\nSubject: ${placement.subjectName}\nFaculty: ${placement.facultyName}\nRoom: ${placement.room || 'LH-201'}`}
                        >
                          {/* Top row: Subject Code + Delete Button */}
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-mono font-bold text-primary text-xs">
                              {placement.subjectCode}
                            </span>
                            {!isLocked && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemovePlacement(placement.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-ink-light hover:text-rose-600 rounded transition-opacity"
                                title="Remove placement"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {/* Middle: Subject Name */}
                          <div className="text-[11px] font-medium text-ink leading-tight truncate my-0.5">
                            {placement.subjectName}
                          </div>

                          {/* Bottom: Faculty & Room */}
                          <div className="flex items-center justify-between text-[10px] text-ink-muted font-mono pt-1 border-t border-border-subtle mt-1">
                            <span className="truncate font-semibold text-primary" title={placement.facultyName}>
                              {placement.facultyName}
                            </span>
                            {placement.room && (
                              <span className="text-[9px] px-1 py-0.2 rounded bg-canvas text-ink-light ml-1">
                                {placement.room}
                              </span>
                            )}
                          </div>

                          {/* Clash badge */}
                          {clashing && (
                            <div className="absolute top-1 right-1 px-1.5 py-0.2 rounded bg-rose-600 text-white font-mono text-[9px] font-bold flex items-center gap-0.5 shadow-sm">
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
                      className={`p-1.5 border-r border-b border-border-beige align-middle text-center transition-all h-20 ${
                        isHovered && !isLocked
                          ? 'bg-primary-subtle border-primary border-2 border-dashed'
                          : 'bg-surface hover:bg-canvas'
                      }`}
                    >
                      <div className="w-full h-full min-h-[58px] rounded border border-dashed border-border-subtle flex flex-col items-center justify-center text-ink-light text-[10px] p-1">
                        {isHovered && !isLocked ? (
                          <span className="font-semibold text-primary">Drop to Assign</span>
                        ) : (
                          <span className="opacity-40 font-mono">—</span>
                        )}
                      </div>
                    </td>
                  );
                };

                return (
                  <tr key={day} className="border-b border-border-beige hover:bg-canvas-paper/40 transition-colors">
                    {/* Day Column */}
                    <td className="py-3 px-3 font-mono font-bold text-primary bg-canvas-paper border-r border-border-beige uppercase text-[11px] whitespace-nowrap">
                      {day}
                    </td>

                    {/* Periods 1 & 2 */}
                    {renderPeriodCell(1)}
                    {renderPeriodCell(2)}

                    {/* Break 1: TEA BREAK (Non-editable) */}
                    <td className="bg-[#f4efe8] border-r border-border-beige text-center align-middle p-1 text-ink-muted font-mono text-[10px] font-semibold tracking-wider uppercase select-none">
                      <span className="writing-mode-vertical sm:writing-mode-horizontal text-[9px] block">
                        Tea Break
                      </span>
                    </td>

                    {/* Periods 3 & 4 */}
                    {renderPeriodCell(3)}
                    {renderPeriodCell(4)}

                    {/* Break 2: LUNCH BREAK (Non-editable) */}
                    <td className="bg-[#f4efe8] border-r border-border-beige text-center align-middle p-1 text-ink-muted font-mono text-[10px] font-semibold tracking-wider uppercase select-none">
                      <span className="writing-mode-vertical sm:writing-mode-horizontal text-[9px] block">
                        Lunch Break
                      </span>
                    </td>

                    {/* Period 5 */}
                    {renderPeriodCell(5)}

                    {/* Break 3: LEISURE BREAK (Non-editable) */}
                    <td className="bg-[#f4efe8] border-r border-border-beige text-center align-middle p-1 text-ink-muted font-mono text-[10px] font-semibold tracking-wider uppercase select-none">
                      <span className="writing-mode-vertical sm:writing-mode-horizontal text-[9px] block">
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
        <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp space-y-3">
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
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900 flex items-center gap-2">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {clashes.map((c, i) => (
                  <div
                    key={i}
                    className="p-3 bg-rose-50 border border-rose-300 rounded text-xs text-rose-950 space-y-1"
                  >
                    <div className="flex items-center justify-between font-mono font-bold text-[11px]">
                      <span>{c.facultyName}</span>
                      <span className="text-rose-800">
                        {c.day} (Period {c.startPeriod})
                      </span>
                    </div>
                    <p className="text-[11px] leading-tight text-rose-900">{c.reason}</p>
                    <div className="text-[10px] text-rose-800 font-mono pt-1">
                      Target Section: {c.conflictingSection} • Code: {c.conflictingSubject}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Automatically Generated Placed Subjects Table */}
      <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-border-beige">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-ink-light">
                Auto-Generated Allocation Registry
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-canvas-muted text-ink-muted font-semibold">
                Table 1 (VTU Format)
              </span>
            </div>
            <h3 className="font-headline text-base font-semibold text-primary">
              Placed Courses & Faculty Assignment Summary
            </h3>
          </div>
          <span className="text-xs font-mono text-ink-muted">
            {autoGeneratedSubjects.length} courses placed ({placements.length} timetable entries)
          </span>
        </div>

        {autoGeneratedSubjects.length === 0 ? (
          <div className="p-4 bg-canvas-muted rounded text-xs text-ink-muted text-center border border-dashed border-border-beige">
            No subjects placed in the timetable yet. Drag subjects from the tray above into the grid to populate this table.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-canvas-paper text-ink font-mono text-[11px] border-b border-border-beige text-left">
                  <th className="py-2.5 px-3 font-semibold border-r border-border-beige w-12 text-center">
                    Sl. No.
                  </th>
                  <th className="py-2.5 px-3 font-semibold border-r border-border-beige w-28">
                    Subject Code
                  </th>
                  <th className="py-2.5 px-3 font-semibold border-r border-border-beige">
                    Subject Name
                  </th>
                  <th className="py-2.5 px-3 font-semibold border-r border-border-beige w-40">
                    Course Type
                  </th>
                  <th className="py-2.5 px-3 font-semibold border-r border-border-beige">
                    Faculty Assigned
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-center w-24">
                    Weekly Periods
                  </th>
                </tr>
              </thead>
              <tbody>
                {autoGeneratedSubjects.map((s, idx) => (
                  <tr
                    key={s.code}
                    className="border-b border-border-beige hover:bg-canvas-paper/50 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-mono text-center text-ink-muted border-r border-border-beige">
                      {idx + 1}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-primary border-r border-border-beige">
                      {s.code}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-ink border-r border-border-beige">
                      {s.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-ink-muted border-r border-border-beige">
                      {s.type}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-ink border-r border-border-beige">
                      {s.facultyList || 'Unassigned'}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-center text-primary">
                      {s.hours}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                  {pendingDrop.subject.code} — {pendingDrop.subject.name}
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

              {/* Faculty Selector (From Page 1 Allocated Faculty) */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-ink-muted mb-1 font-semibold">
                  Assigned Faculty
                </label>
                <select
                  value={modalFaculty}
                  onChange={(e) => setModalFaculty(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-canvas rounded border border-border-beige text-ink font-semibold focus:outline-none focus:border-primary"
                >
                  {/* Priority 1: Allocated faculty for this subject on Page 1 */}
                  {pendingDrop.subject.facultyNames?.map((fn) => (
                    <option key={fn} value={fn}>
                      {fn} (Allocated on Page 1)
                    </option>
                  ))}
                  {/* Secondary list of other registered faculty */}
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
                <p className="text-[10px] text-ink-muted mt-1">
                  Faculty pre-allocated on Page 1 for this course are prioritized.
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
                  placeholder="e.g. LH-201, Systems Lab, AI Lab 1"
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

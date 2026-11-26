import React, { useState, useMemo, useRef } from 'react';
import {
  Filter,
  Clock,
  User,
  MapPin,
  Calendar,
} from 'lucide-react';
import {
  TimetableSlot,
  DayOfWeek,
  DAYS_OF_WEEK,
} from '../../data/studentDemoData';
import { useWorkflow } from '../../context/WorkflowContext';
import { DownloadPdfButton } from '../common/DownloadPdfButton';
import { getTimetablePdfFilename } from '../../utils/timetablePdfExport';
import { TimetableGrid } from './TimetableGrid';
import { TimetableStatus } from './TimetableStatus';

interface StudentTimetableProps {
  isPublished: boolean;
  onTogglePublished?: () => void;
}

export const StudentTimetable: React.FC<StudentTimetableProps> = ({
  isPublished,
  onTogglePublished,
}) => {
  const { timetableEntries } = useWorkflow();
  const [selectedDay, setSelectedDay] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [viewMode, setViewMode] = useState<'grid' | 'agenda'>('grid');
  const timetableRef = useRef<HTMLDivElement>(null);

  const liveSlots: TimetableSlot[] = useMemo(() => {
    return timetableEntries.map((s, idx) => ({
      id: `slot-${idx}`,
      day: s.day as DayOfWeek,
      period: s.period,
      time:
        s.period === 1
          ? '09:00 - 10:00'
          : s.period === 2
          ? '10:00 - 11:00'
          : s.period === 3
          ? '11:15 - 12:15'
          : s.period === 4
          ? '12:15 - 01:15'
          : s.period === 5
          ? '02:00 - 03:00'
          : s.period === 6
          ? '03:00 - 04:00'
          : '04:00 - 05:00',
      courseCode: s.courseCode,
      courseTitle: s.courseTitle,
      faculty: s.facultyName,
      type:
        s.courseTitle?.toLowerCase().includes('lab') ||
        s.courseCode?.toLowerCase().includes('l')
          ? 'Laboratory'
          : 'Theory',
      room: s.room,
    }));
  }, [timetableEntries]);

  // Agenda view items for the selected day or today
  const agendaSlots = liveSlots.filter((s) => {
    const dayMatches = selectedDay === 'All' ? s.day === 'Monday' : s.day === selectedDay;
    const typeMatches =
      typeFilter === 'All' ||
      (typeFilter === 'Theory' && s.type === 'Theory') ||
      (typeFilter === 'Laboratory' && s.type === 'Laboratory');
    return dayMatches && typeMatches;
  }).sort((a, b) => a.period - b.period);

  return (
    <div className="w-full space-y-5 animate-fade-in">
      {/* Top Section: Timetable Status Banner */}
      <TimetableStatus
        isPublished={isPublished}
        onToggleStatus={onTogglePublished}
      />

      {/* Control Bar: Day filters, View toggle, Print */}
      <div className="p-4 bg-surface rounded-card border border-border-beige shadow-crisp flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Day Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedDay('All')}
            className={`px-3 py-1.5 rounded-card text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDay === 'All'
                ? 'bg-primary text-white shadow-crisp-sm'
                : 'bg-canvas-muted text-ink-muted hover:text-ink hover:bg-canvas-dim border border-border-subtle'
            }`}
          >
            Full Week (Mon–Sat)
          </button>
          {DAYS_OF_WEEK.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSelectedDay(d)}
              className={`px-3 py-1.5 rounded-card text-xs font-semibold whitespace-nowrap transition-all ${
                selectedDay === d
                  ? 'bg-primary text-white shadow-crisp-sm'
                  : 'bg-canvas-muted text-ink-muted hover:text-ink hover:bg-canvas-dim border border-border-subtle'
              }`}
            >
              {d.slice(0, 3)}
            </button>
          ))}
        </div>

        {/* Right: Type Filter, View Switcher & Print */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-canvas-muted p-1 rounded-card border border-border-subtle text-xs">
            <Filter className="w-3.5 h-3.5 text-ink-light ml-1.5" />
            {(['All', 'Theory', 'Laboratory'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  typeFilter === t
                    ? 'bg-surface text-primary shadow-crisp-sm font-semibold'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {t === 'All' ? 'All Types' : t}
              </button>
            ))}
          </div>

          {/* View Mode (Grid vs Agenda) */}
          <div className="flex items-center bg-canvas-muted p-1 rounded-card border border-border-subtle text-xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-surface text-primary shadow-crisp-sm font-semibold'
                  : 'text-ink-muted hover:text-ink'
              }`}
              title="Matrix timetable grid"
            >
              Grid View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('agenda')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                viewMode === 'agenda'
                  ? 'bg-surface text-primary shadow-crisp-sm font-semibold'
                  : 'text-ink-muted hover:text-ink'
              }`}
              title="Sequential card agenda"
            >
              Agenda Cards
            </button>
          </div>

          {/* Download PDF Button */}
          <DownloadPdfButton
            targetRef={timetableRef}
            filename={getTimetablePdfFilename({
              department: 'AIDS',
              studentYear: 'Second Year',
              semester: '3rd sem',
              section: 'A',
            })}
            label="Download PDF"
          />
        </div>
      </div>

      {/* View Content */}
      <div ref={timetableRef} className="space-y-4 bg-white p-3 rounded-card">
        {viewMode === 'grid' ? (
          <TimetableGrid
            slots={liveSlots}
            selectedDayFilter={selectedDay}
            typeFilter={typeFilter}
            isPublished={isPublished}
          />
        ) : (
          /* Agenda Card View */
          <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <h4 className="font-headline font-semibold text-base text-ink">
                Agenda Schedule for {selectedDay === 'All' ? 'Monday' : selectedDay}
              </h4>
            </div>
            <span className="text-xs font-mono text-ink-light">
              {agendaSlots.length} Scheduled Sessions
            </span>
          </div>

          {agendaSlots.length === 0 ? (
            <div className="p-8 text-center bg-surface rounded-card border border-border-beige text-ink-muted">
              No sessions scheduled for this day matching your filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {agendaSlots.map((slot) => {
                const isLab = slot.type === 'Laboratory';
                const isMentorship = slot.type === 'Mentorship';
                return (
                  <div
                    key={slot.id}
                    className={`p-4 bg-surface rounded-card border transition-all shadow-crisp ${
                      isLab
                        ? 'border-l-4 border-l-accent-teal border-y border-r border-border-beige'
                        : isMentorship
                        ? 'border-l-4 border-l-accent-violet border-y border-r border-border-beige'
                        : 'border-border-beige hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                            isLab
                              ? 'bg-accent-teal/15 text-accent-teal'
                              : isMentorship
                              ? 'bg-accent-violet/15 text-accent-violet'
                              : 'bg-primary-subtle text-primary'
                          }`}
                        >
                          {slot.courseCode}
                        </span>
                        <span className="text-[10px] font-mono text-ink-light">
                          Period {slot.period}
                        </span>
                      </div>
                      <span className="text-xs font-mono text-ink-muted inline-flex items-center gap-1">
                        <Clock className="w-3 h-3 text-ink-light" />
                        {slot.time}
                      </span>
                    </div>

                    <h5 className="font-headline font-semibold text-sm text-ink mb-3 leading-snug">
                      {slot.courseTitle}
                    </h5>

                    <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-xs text-ink-muted">
                      <div className="flex items-center gap-1.5 truncate max-w-[160px]">
                        <User className="w-3.5 h-3.5 text-ink-light flex-shrink-0" />
                        <span className="truncate">{slot.faculty}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono font-medium px-2 py-0.5 rounded bg-canvas-muted text-ink border border-border-subtle">
                        <MapPin className="w-3 h-3 text-primary" />
                        <span>{slot.room}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
};

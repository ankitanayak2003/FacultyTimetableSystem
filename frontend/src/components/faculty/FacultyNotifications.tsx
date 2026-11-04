import React from 'react';
import {
  Bell,
  CheckCheck,
  Check,
  Calendar,
  Clock,
  FileText,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { FacultyNotificationItem } from '../../data/facultyDemoData';

interface FacultyNotificationsProps {
  notifications: FacultyNotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export const FacultyNotifications: React.FC<FacultyNotificationsProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getCategoryIcon = (category: FacultyNotificationItem['category']) => {
    switch (category) {
      case 'Timetable':
        return <Calendar className="w-4 h-4 text-primary" />;
      case 'Preferences':
        return <Sparkles className="w-4 h-4 text-accent-violet" />;
      case 'Workload':
        return <Clock className="w-4 h-4 text-accent-teal" />;
      case 'Meeting':
        return <UserCheck className="w-4 h-4 text-primary" />;
      case 'Leave':
        return <FileText className="w-4 h-4 text-accent-teal" />;
      default:
        return <Bell className="w-4 h-4 text-ink-light" />;
    }
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Top Banner */}
      <div className="p-6 bg-surface rounded-card border border-border-beige shadow-crisp">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-mono tracking-wider text-ink-light">
                Department of AI &amp; DS
              </span>
              <span className="text-xs font-mono text-primary font-semibold">
                • Notice Board
              </span>
            </div>
            <h2 className="font-headline text-2xl font-semibold text-primary">
              Departmental Notifications &amp; Alerts
            </h2>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed max-w-xl">
              Official academic memos, timetable notices, and HOD circulars filtered exclusively for the Department of Artificial Intelligence &amp; Data Science.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-semibold bg-primary-subtle text-primary border border-primary/20">
              {unreadCount} Unread Notice{unreadCount === 1 ? '' : 's'}
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface text-ink hover:bg-canvas-muted text-xs font-semibold rounded-card border border-border-beige transition-colors shadow-crisp-sm"
              >
                <CheckCheck className="w-4 h-4 text-primary" />
                <span>Mark All Read</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`p-4 rounded-card border transition-all shadow-crisp-sm flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
              !notif.isRead
                ? 'bg-surface border-l-4 border-l-primary border-y border-r border-border-beige shadow-crisp'
                : 'bg-surface/80 border-border-subtle opacity-85 hover:opacity-100'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2 rounded-card flex-shrink-0 mt-0.5 ${
                  !notif.isRead
                    ? 'bg-primary-subtle text-primary'
                    : 'bg-canvas-muted text-ink-light'
                }`}
              >
                {getCategoryIcon(notif.category)}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-canvas-muted text-ink-muted border border-border-subtle font-medium">
                    {notif.category}
                  </span>
                  {!notif.isRead && (
                    <span className="w-2 h-2 rounded-full bg-primary" />
                  )}
                  <span className="text-[11px] font-mono text-ink-light">
                    {notif.timestamp}
                  </span>
                </div>

                <h4 className="font-headline font-semibold text-sm text-ink leading-snug">
                  {notif.title}
                </h4>

                <p className="text-xs text-ink-muted mt-1 leading-relaxed max-w-3xl">
                  {notif.message}
                </p>
              </div>
            </div>

            {/* Read / Unread Status Button */}
            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
              {!notif.isRead ? (
                <button
                  type="button"
                  onClick={() => onMarkAsRead(notif.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-canvas-muted hover:bg-canvas-dim text-ink text-[11px] font-semibold border border-border-beige transition-colors"
                >
                  <Check className="w-3.5 h-3.5 text-primary" />
                  <span>Mark Read</span>
                </button>
              ) : (
                <span className="text-[10px] font-mono text-ink-light flex items-center gap-1">
                  <CheckCheck className="w-3 h-3 text-accent-teal" />
                  <span>Read</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

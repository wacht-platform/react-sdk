import { useState } from "react";
import { Archive, Star, ArrowCounterClockwise, Circle } from "@phosphor-icons/react";
import type { Notification } from "@/types";

export type NotificationAction =
  | { type: 'read'; id: string }
  | { type: 'unread'; id: string }
  | { type: 'archive'; id: string }
  | { type: 'star'; id: string }
  | { type: 'custom'; payload: any };

interface NotificationItemProps {
  notification: Notification;
  onAction: (action: NotificationAction) => void;
}

export function NotificationItem({
  notification,
  onAction,
}: NotificationItemProps) {
  const [expanded, setExpanded] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setExpanded(!expanded);
    if (!notification.is_read) {
      onAction({ type: 'read', id: notification.id });
    }
  };

  const handleActionClick = (cta: { label: string; payload: any }) => {
    onAction({ type: 'custom', payload: cta.payload });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";

    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;

    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className="w-flex w-gap-3 w-row--hover w-notif-row"
      onClick={handleClick}
      data-unread={!notification.is_read ? "" : undefined}
    >
      <div className="w-grow w-flex-col w-justify-center">
        <div className="w-flex w-items-center w-gap-2" style={{ marginBottom: 2 }}>
          {!notification.is_read && <span className="w-notif-dot" />}
          <h4 className="w-sec w-truncate" style={{ margin: 0 }}>
            {notification.title}
          </h4>
        </div>
        <p
          className={`w-secsub${expanded ? "" : " w-truncate"}`}
          style={{ margin: 0, wordWrap: expanded ? "break-word" : undefined }}
        >
          {notification.body}
        </p>

        {notification.ctas && notification.ctas.length > 0 && (
          <div className="w-flex w-wrap w-gap-2" style={{ marginTop: 10 }}>
            {notification.ctas.map((cta, index) => (
              <button
                key={index}
                className="w-btn w-btn--secondary w-btn--sm"
                onClick={() => handleActionClick(cta)}
              >
                {cta.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-flex-col w-items-end w-gap-2 w-none">
        <div className="w-flex w-items-center w-gap-1">
          {notification.is_read && (
            <button
              className="w-btn w-btn--icon"
              onClick={(e) => {
                e.stopPropagation();
                onAction({ type: 'unread', id: notification.id });
              }}
              title="Mark as unread"
            >
              <Circle size={14} />
            </button>
          )}
          <button
            className="w-btn w-btn--icon"
            onClick={(e) => {
              e.stopPropagation();
              onAction({ type: 'star', id: notification.id });
            }}
            title={notification.is_starred ? "Unstar" : "Star"}
            data-on={notification.is_starred ? "" : undefined}
          >
            <Star size={14} fill={notification.is_starred ? "currentColor" : "none"} />
          </button>
          <button
            className="w-btn w-btn--icon"
            onClick={(e) => {
              e.stopPropagation();
              onAction({ type: 'archive', id: notification.id });
            }}
            title={notification.is_archived ? "Unarchive" : "Archive"}
          >
            {notification.is_archived ? <ArrowCounterClockwise size={14} /> : <Archive size={14} />}
          </button>
        </div>
        <span className="w-secsub" style={{ whiteSpace: "nowrap" }}>
          {formatTime(notification.created_at)}
        </span>
      </div>
    </div>
  );
}

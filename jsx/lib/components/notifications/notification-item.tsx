import { useState } from "react";
import styled from "styled-components";
import { Archive, Star, RotateCcw, Circle } from "lucide-react";
import type { Notification } from "@/types";

const Item = styled.div<{ $unread: boolean; $expanded: boolean }>`
  padding: 12px 16px;
  background: ${props => props.$unread ? "var(--color-background-hover)" : "transparent"};
  transition: background-color 0.2s ease;
  cursor: pointer;
  display: flex;
  gap: 12px;
  border-bottom: 1px solid var(--color-border);

  &:hover {
    background: var(--color-background-hover);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const ContentContainer = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const Title = styled.h4`
  font-size: 14px;
  font-weight: 400;
  color: var(--color-foreground);
  margin: 0 0 2px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Body = styled.p<{ $expanded: boolean }>`
  font-size: 13px;
  color: var(--color-secondary-text);
  margin: 0;
  line-height: 1.4;
  
  ${props => !props.$expanded ? `
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  ` : `
    word-wrap: break-word;
  `}
`;

const MetaContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  min-width: 40px;
`;

const Time = styled.span`
  font-size: 11px;
  color: var(--color-muted);
  white-space: nowrap;
`;

const UnreadDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-primary);
`;


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
    <>
      <Item
        $unread={!notification.is_read}
        $expanded={expanded}
        onClick={handleClick}
      >


        <ContentContainer>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
            {!notification.is_read && <UnreadDot />}
            <Title>{notification.title}</Title>
          </div>
          <Body $expanded={expanded}>
            {notification.body}
          </Body>

          {notification.ctas && notification.ctas.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: '8px',
                marginTop: '10px',
                flexWrap: 'wrap',
              }}
            >
              {notification.ctas.map((cta, index) => (
                <button
                  key={index}
                  onClick={() => handleActionClick(cta)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '5px 12px',
                    fontSize: '12px',
                    fontWeight: 500,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-background)',
                    color: 'var(--color-foreground)',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--color-background-hover)';
                    e.currentTarget.style.borderColor = 'var(--color-primary)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'var(--color-background)';
                    e.currentTarget.style.borderColor = 'var(--color-border)';
                  }}
                >
                  {cta.label}
                </button>
              ))}
            </div>
          )}


        </ContentContainer>

        <MetaContainer>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {notification.is_read && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAction({ type: 'unread', id: notification.id });
                }}
                title="Mark as unread"
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-muted)',
                  padding: '4px 0',
                  display: 'flex',
                  transition: 'color 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-foreground)'}
                onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-muted)'}
              >
                <Circle size={14} />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction({ type: 'star', id: notification.id });
              }}
              title={notification.is_starred ? "Unstar" : "Star"}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: notification.is_starred ? 'var(--color-warning)' : 'var(--color-muted)',
                padding: '4px 0',
                display: 'flex',
                transition: 'color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.color = notification.is_starred ? 'var(--color-warning)' : 'var(--color-foreground)'}
              onMouseOut={(e) => e.currentTarget.style.color = notification.is_starred ? 'var(--color-warning)' : 'var(--color-muted)'}
            >
              <Star size={14} fill={notification.is_starred ? "currentColor" : "none"} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction({ type: 'archive', id: notification.id });
              }}
              title={notification.is_archived ? "Unarchive" : "Archive"}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--color-muted)',
                padding: '4px 0',
                display: 'flex',
                transition: 'color 0.2s',
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-foreground)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-muted)'}
            >
              {notification.is_archived ? <RotateCcw size={14} /> : <Archive size={14} />}
            </button>
          </div>
          <Time>{formatTime(notification.created_at)}</Time>
        </MetaContainer>
      </Item>
    </>
  );
}
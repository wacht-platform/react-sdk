import { useState } from "react";
import styled from "styled-components";
import { Archive, Star, ArrowCounterClockwise, Circle } from "@phosphor-icons/react";
import type { Notification } from "@/types";

const Item = styled.div<{ $unread: boolean; $expanded: boolean }>`
  padding: var(--space-6u) var(--space-8u);
  background: ${props => props.$unread ? "var(--color-accent)" : "transparent"};
  transition: background-color 0.2s ease;
  cursor: pointer;
  display: flex;
  gap: var(--space-6u);
  border-bottom: var(--border-width-thin) solid var(--color-border);

  &:hover {
    background: var(--color-accent);
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
  font-size: var(--font-size-lg);
  font-weight: 400;
  color: var(--color-popover-foreground);
  margin: 0 0 var(--space-1u) 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Body = styled.p<{ $expanded: boolean }>`
  font-size: var(--font-size-md);
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
  gap: var(--space-3u);
  min-width: var(--size-20u);
`;

const Time = styled.span`
  font-size: var(--font-size-xs);
  color: var(--color-muted);
  white-space: nowrap;
`;

const UnreadDot = styled.div`
  width: var(--space-4u);
  height: var(--space-4u);
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4u)', marginBottom: 'var(--space-1u)' }}>
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
                gap: 'var(--space-4u)',
                marginTop: 'var(--space-5u)',
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
                    padding: 'calc(var(--space-2u) + var(--border-width-thin)) var(--space-6u)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 500,
                    borderRadius: 'var(--radius-xs)',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: 'var(--border-width-thin) solid var(--color-border)',
                    background: 'var(--color-secondary)',
                    color: 'var(--color-secondary-foreground)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--color-accent)';
                    e.currentTarget.style.borderColor = 'var(--color-border-hover)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'var(--color-secondary)';
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
          <div style={{ display: 'flex', gap: 'var(--space-4u)', alignItems: 'center' }}>
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
                  padding: 'var(--space-2u) 0',
                  display: 'flex',
                  transition: 'color 0.2s ease',
                }}
                onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-popover-foreground)'}
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
                padding: 'var(--space-2u) 0',
                display: 'flex',
                transition: 'color 0.2s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.color = notification.is_starred ? 'var(--color-warning)' : 'var(--color-popover-foreground)'}
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
                padding: 'var(--space-2u) 0',
                display: 'flex',
                transition: 'color 0.2s ease',
              }}
              onMouseOver={(e) => e.currentTarget.style.color = 'var(--color-popover-foreground)'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--color-muted)'}
            >
              {notification.is_archived ? <ArrowCounterClockwise size={14} /> : <Archive size={14} />}
            </button>
          </div>
          <Time>{formatTime(notification.created_at)}</Time>
        </MetaContainer>
      </Item>
    </>
  );
}

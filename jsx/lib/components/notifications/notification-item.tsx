import styled from "styled-components";
import { X, ExternalLink } from "lucide-react";
import type { Notification } from "@/types/notification";

const Item = styled.div<{ $unread: boolean }>`
  padding: var(--space-md) var(--space-lg);
  background: ${props => props.$unread ? "var(--color-background-hover)" : "transparent"};
  transition: all 0.2s ease;
  position: relative;
  cursor: pointer;
  border-left: ${props => props.$unread ? "3px solid var(--color-primary)" : "3px solid transparent"};

  &:hover {
    background: var(--color-background-hover);
  }

  &:not(:last-child) {
    border-bottom: 1px solid var(--color-border);
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
`;

const TitleContainer = styled.div`
  display: flex;
  align-items: center;
  flex: 1;
  gap: var(--space-xs);
`;

const Title = styled.h4`
  font-size: var(--font-xs);
  font-weight: 400;
  color: var(--color-foreground);
  margin: 0;
  flex: 1;
  line-height: 1.4;
`;

const Severity = styled.span<{ $severity: string }>`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: var(--radius-full);
  background: ${props => {
    switch (props.$severity) {
      case "success": return "var(--color-success)";
      case "warning": return "var(--color-warning)";
      case "error": return "var(--color-error)";
      default: return "var(--color-primary)";
    }
  }};
  flex-shrink: 0;
`;

const Body = styled.p`
  font-size: var(--font-2xs);
  color: var(--color-secondary-text);
  margin: 0 0 var(--space-sm) 0;
  line-height: 1.5;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
`;

const Time = styled.span`
  font-size: var(--font-2xs);
  color: var(--color-muted);
`;

const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
`;

const ActionButton = styled.button`
  background: transparent;
  border: none;
  padding: var(--space-2xs);
  cursor: pointer;
  color: var(--color-secondary-text);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--color-background-hover);
    color: var(--color-foreground);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  svg {
    width: 14px;
    height: 14px;
  }
`;

const ActionLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  font-size: var(--font-2xs);
  font-weight: 400;
  color: var(--color-primary);
  text-decoration: none;
  padding: var(--space-2xs) var(--space-xs);
  border-radius: var(--radius-md);
  transition: all 0.2s ease;
  
  &:hover {
    background: var(--color-background-hover);
    color: var(--color-primary-hover);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete
}: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString();
    } else if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return "Just now";
    }
  };

  return (
    <Item $unread={!notification.is_read} onClick={handleClick}>
      <Header>
        <TitleContainer>
          <Severity $severity={notification.severity} />
          <Title>{notification.title}</Title>
        </TitleContainer>
        <ActionButton
          onClick={(e) => {
            e.stopPropagation();
            onDelete(notification.id);
          }}
          aria-label="Delete notification"
        >
          <X />
        </ActionButton>
      </Header>

      <Body>{notification.body}</Body>

      <Footer>
        <Time>{formatTime(notification.created_at)}</Time>
        {notification.action_url && (
          <Actions>
            <ActionLink
              href={notification.action_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              {notification.action_label || "View"}
              <ExternalLink />
            </ActionLink>
          </Actions>
        )}
      </Footer>
    </Item>
  );
}
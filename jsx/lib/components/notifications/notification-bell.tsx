import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { BellRing } from "lucide-react";
import { DefaultStylesProvider } from "../utility/root";
import { useNotifications } from "@/hooks/use-notifications";
import { NotificationPopover } from "./notification-popover";

const Container = styled.div`
  position: relative;
`;

const CircularContainer = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: var(--color-background-hover);
    border-color: var(--color-primary);
  }
`;

const NotificationButton = styled.button`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  border-radius: 50%;
  transition: all 0.2s ease;
  width: 100%;
  height: 100%;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary);
  }

  svg {
    width: 16px;
    height: 16px;
    color: var(--color-secondary-text);
    transition: color 0.2s ease;
  }

  &:hover svg {
    color: var(--color-primary);
  }
`;

const Badge = styled.span`
  position: absolute;
  top: -2px;
  right: -2px;
  background: var(--color-error);
  color: white;
  border-radius: 50%;
  padding: 0 4px;
  font-size: var(--font-2xs);
  font-weight: 500;
  min-width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid var(--color-background);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

interface NotificationBellProps {
  className?: string;
  showBadge?: boolean;
}

export function NotificationBell({ className, showBadge = true }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { unreadCount, notifications, loading, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  return (
    <DefaultStylesProvider>
      <Container ref={containerRef} className={className}>
        <CircularContainer>
          <NotificationButton onClick={() => setIsOpen(!isOpen)}>
            <BellRing size={16} />
            {showBadge && unreadCount > 0 && (
              <Badge>{unreadCount > 9 ? "9+" : unreadCount}</Badge>
            )}
          </NotificationButton>
        </CircularContainer>
        
        {isOpen && (
          <NotificationPopover
            notifications={notifications}
            loading={loading}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onDelete={deleteNotification}
          />
        )}
      </Container>
    </DefaultStylesProvider>
  );
}
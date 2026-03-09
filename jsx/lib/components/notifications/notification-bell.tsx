import { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import styled, { keyframes, css } from "styled-components";
import { Bell } from "lucide-react";
import { DefaultStylesProvider } from "../utility/root";
import { useScopeUnread } from "@/hooks/use-notifications";
import { NotificationPopover } from "./notification-popover";
import { usePopoverPosition } from "@/hooks/use-popover-position";
import type { NotificationListParams } from "@/types";

const Container = styled.div`
    position: relative;
    display: inline-flex;
`;

const ringAnimation = keyframes`
  0% { transform: rotate(0); }
  10% { transform: rotate(15deg); }
  20% { transform: rotate(-15deg); }
  30% { transform: rotate(10deg); }
  40% { transform: rotate(-10deg); }
  50% { transform: rotate(5deg); }
  60% { transform: rotate(-5deg); }
  100% { transform: rotate(0); }
`;

const NotificationButton = styled.button<{ $hasUnread: boolean }>`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    cursor: pointer;
    padding: var(--space-4u);
    border-radius: var(--radius-md);
    transition: all 0.2s ease;
    color: var(--color-foreground);

    &:hover {
        background: var(--color-background-hover);
        color: var(--color-primary);
    }

    &:hover svg {
        animation: ${(props) =>
            props.$hasUnread
                ? css`
                      ${ringAnimation} 2s ease
                  `
                : "none"};
    }

    &:focus {
        outline: none;
        box-shadow: 0 0 0 var(--border-width-regular) var(--color-primary);
    }

    svg {
        width: var(--size-10u);
        height: var(--size-10u);
    }
`;

const Badge = styled.span<{ $dotOnly?: boolean }>`
    position: absolute;
    top: ${(props) => (props.$dotOnly ? "var(--space-3u)" : "var(--space-2u)")};
    right: ${(props) => (props.$dotOnly ? "var(--space-3u)" : "var(--space-2u)")};
    background: var(--color-error);
    color: var(--color-foreground-inverse);
    border-radius: var(--space-5u);
    min-width: ${(props) => (props.$dotOnly ? "var(--space-4u)" : "var(--size-8u)")};
    height: ${(props) => (props.$dotOnly ? "var(--space-4u)" : "var(--size-8u)")};
    padding: ${(props) => (props.$dotOnly ? "0" : "0 var(--space-2u)")};
    font-size: calc(var(--font-size-2xs) - var(--border-width-thin));
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    border: var(--border-width-regular) solid var(--color-background);
    box-shadow: var(--shadow-sm);
    line-height: 1;
    transition: all 0.2s ease;
`;

interface NotificationBellProps {
    className?: string;
    showBadge?: boolean;
    scope?: NotificationListParams["scope"];
    onAction?: (payload: any) => void;
}

export function NotificationBell({
    className,
    showBadge = true,
    scope = "all",
    onAction,
}: NotificationBellProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const { count: unreadCount, refetch: refetchUnread } = useScopeUnread({
        scope,
    });

    const handleAction = async (action: any) => {
        // Only handle unread count refetching, actual actions are now in NotificationPanel
        await refetchUnread();
        onAction?.(action.payload);
    };

    const popoverPosition = usePopoverPosition({
        triggerRef: buttonRef,
        isOpen,
        minWidth: Math.min(
            450,
            typeof window !== "undefined" ? window.innerWidth - 32 : 300,
        ),
        defaultMaxHeight: 550,
    });

    useEffect(() => {
        if (!isOpen) return;

        const timer = setTimeout(() => {
            const handleClickOutside = (event: MouseEvent) => {
                const target = event.target as Node;

                if (containerRef.current?.contains(target)) {
                    return;
                }

                if (popoverRef.current?.contains(target)) {
                    return;
                }

                setIsOpen(false);
            };

            document.addEventListener("mousedown", handleClickOutside);

            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            };
        }, 50);

        return () => {
            clearTimeout(timer);
        };
    }, [isOpen]);

    return (
        <DefaultStylesProvider>
            <Container ref={containerRef} className={className}>
                <NotificationButton
                    ref={buttonRef}
                    onClick={() => setIsOpen(!isOpen)}
                    $hasUnread={unreadCount > 0}
                    aria-label={
                        unreadCount > 0
                            ? `${unreadCount} unread notifications`
                            : "Notifications"
                    }
                >
                    <Bell strokeWidth={1} />
                    {showBadge && unreadCount > 0 && (
                        <Badge $dotOnly={unreadCount <= 9}>
                            {unreadCount > 9 ? "9+" : ""}
                        </Badge>
                    )}
                </NotificationButton>

                {typeof window !== "undefined" &&
                    isOpen &&
                    ReactDOM.createPortal(
                        <DefaultStylesProvider>
                            <NotificationPopover
                                ref={popoverRef}
                                position={popoverPosition}
                                scope={scope}
                                onAction={handleAction}
                                onClose={() => setIsOpen(false)}
                            />
                        </DefaultStylesProvider>,
                        document.body,
                    )}
            </Container>
        </DefaultStylesProvider>
    );
}

import { forwardRef } from "react";
import styled from "styled-components";
import { NotificationPanel, type NotificationPanelProps } from "./notification-panel";

const Popover = styled.div<{
  $position?: { top?: number; bottom?: number; left?: number; right?: number; maxHeight?: number };
}>`
  position: fixed;
  ${(props) =>
    props.$position?.top !== undefined ? `top: ${props.$position.top}px;` : ""}
  ${(props) =>
    props.$position?.bottom !== undefined
      ? `bottom: ${props.$position.bottom}px;`
      : ""}
  ${(props) =>
    props.$position?.left !== undefined
      ? `left: ${props.$position.left}px;`
      : ""}
  ${(props) =>
    props.$position?.right !== undefined
      ? `right: ${props.$position.right}px;`
      : ""}
  width: 450px;
  max-width: calc(100vw - 24px);
  max-height: ${(props) => props.$position?.maxHeight ? `${props.$position.maxHeight}px` : '700px'};
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.1), 0 0 1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  animation: fadeIn 0.15s ease-out;
  max-height: 90vh;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(2px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media(max-width: 480px) {
    border-radius: 8px;
  }
`;

export interface NotificationPopoverProps extends Omit<NotificationPanelProps, 'fullWidth' | 'maxHeight'> {
  position?: { top?: number; bottom?: number; left?: number; right?: number; maxHeight?: number };
  onClose?: () => void;
}

export const NotificationPopover = forwardRef<
  HTMLDivElement,
  NotificationPopoverProps
>(
  (
    {
      position,
      scope,
      onAction,
      className,
      // onClose is kept for backward compatibility if needed, though unused in the internal trigger
    },
    ref,
  ) => {
    return (
      <Popover ref={ref} $position={position} className={className}>
        <NotificationPanel
          scope={scope}
          onAction={onAction}
          fullWidth
          maxHeight={position?.maxHeight ? `${position.maxHeight}px` : '100%'}
        />
      </Popover>
    );
  },
);

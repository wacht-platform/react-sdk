import { useRef, useEffect } from "react";
import styled from "styled-components";
import { Button } from "./button";

const PopoverContainer = styled.div`
  text-align: left;
  position: fixed;
  background: var(--color-popover);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  border: var(--border-width-thin) solid var(--color-border);
  padding: var(--space-8u);
  width: calc(calc(var(--size-50u) * 3) + var(--space-10u));
  z-index: 1000;
`;

const Title = styled.div`
  font-size: var(--font-size-lg);
  font-weight: 500;
  color: var(--color-popover-foreground);
  margin-bottom: var(--space-2u);
  line-height: 1.4;
`;

const Description = styled.div`
  font-size: var(--font-size-sm);
  color: var(--color-secondary-text);
  margin-bottom: var(--space-8u);
  line-height: 1.4;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: var(--space-4u);
  justify-content: flex-end;
`;

interface ConfirmationPopoverProps {
  title: string;
  description?: string;
  onConfirm: () => void;
  onCancel: () => void;
  style?: React.CSSProperties;
}

export const ConfirmationPopover = ({
  title,
  description,
  onConfirm,
  onCancel,
  style,
}: ConfirmationPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onCancel();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onCancel]);

  return (
    <PopoverContainer
      ref={popoverRef}
      style={{
        right: "calc(var(--size-32u) + var(--space-3u))",
        ...style,
      }}
    >
      <Title>{title}</Title>
      {description && <Description>{description}</Description>}
      <ButtonGroup>
        <Button
          onClick={onCancel}
          style={{
            fontSize: "var(--font-size-lg)",
            padding: "var(--space-3u) var(--space-8u)",
            background: "transparent",
            border: "var(--border-width-thin) solid var(--color-border)",
            color: "var(--color-popover-foreground)",
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          style={{
            fontSize: "var(--font-size-lg)",
            padding: "var(--space-3u) var(--space-8u)",
            background: "var(--color-error)",
            border: "var(--border-width-thin) solid var(--color-error)",
            color: "var(--color-foreground-inverse)",
          }}
        >
          Confirm
        </Button>
      </ButtonGroup>
    </PopoverContainer>
  );
};

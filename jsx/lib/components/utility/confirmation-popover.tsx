import { useRef, useEffect } from "react";
import styled from "styled-components";
import { Button } from "./button";

const PopoverContainer = styled.div`
  text-align: left;
  position: fixed;
  background: var(--color-background);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--color-shadow);
  border: 1px solid var(--color-border);
  padding: 16px;
  width: 320px;
  z-index: 1000;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: var(--color-foreground);
  margin-bottom: 4px;
  line-height: 1.4;
`;

const Description = styled.div`
  font-size: 12px;
  color: var(--color-secondary-text);
  margin-bottom: 16px;
  line-height: 1.4;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
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
        right: "70px",
        ...style,
      }}
    >
      <Title>{title}</Title>
      {description && <Description>{description}</Description>}
      <ButtonGroup>
        <Button
          onClick={onCancel}
          style={{
            fontSize: "14px",
            padding: "6px 16px",
            background: "transparent",
            border: "1px solid var(--color-border)",
            color: "var(--color-foreground)",
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          style={{
            fontSize: "14px",
            padding: "6px 16px",
            background: "var(--color-error)",
            border: "1px solid var(--color-error)",
            color: "white",
          }}
        >
          Confirm
        </Button>
      </ButtonGroup>
    </PopoverContainer>
  );
};

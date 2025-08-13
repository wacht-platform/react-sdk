import { useRef, useEffect, useState } from "react";
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
  font-weight: 400;
  color: var(--color-foreground);
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
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationPopover = ({
  title,
  onConfirm,
  onCancel,
}: ConfirmationPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    // Calculate position based on parent element
    if (popoverRef.current) {
      const rect = popoverRef.current.parentElement?.getBoundingClientRect();
      if (rect) {
        setPosition({
          top: rect.bottom + 8,
          left: rect.right - 320, // 320px is the width of popover
        });
      }
    }
  }, []);

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
        top: `${position.top}px`, 
        left: `${position.left}px` 
      }}
    >
      <Title>{title}</Title>
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
            background: "#dc2626",
            border: "1px solid #dc2626",
            color: "white",
          }}
        >
          Confirm
        </Button>
      </ButtonGroup>
    </PopoverContainer>
  );
};

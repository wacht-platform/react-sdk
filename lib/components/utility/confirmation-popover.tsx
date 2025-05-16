import { useRef } from "react";
import styled from "styled-components";
import { Button } from "./button";

const PopoverContainer = styled.div`
  text-align: left;
  position: absolute;
  right: 0;
  background: white;
  border-radius: 8px;
  box-shadow:
    0 4px 6px -1px rgb(0 0 0 / 0.1),
    0 2px 4px -2px rgb(0 0 0 / 0.1);
  border: 1px solid #e2e8f0;
  padding: 16px;
  width: 280px;
  z-index: 10;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 400;
  color: #1e293b;
  margin-bottom: 8px;
  text-wrap: wrap;
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

  return (
    <PopoverContainer ref={popoverRef}>
      <Title>{title}</Title>
      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
        <Button
          style={{ fontSize: 12, width: "fit-content" }}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          style={{ fontSize: 12, width: "fit-content" }}
          onClick={onConfirm}
        >
          Confirm
        </Button>
      </div>
    </PopoverContainer>
  );
};

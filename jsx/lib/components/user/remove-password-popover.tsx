import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/utility/input";
import { Button } from "@/components/utility/button";
import { FormGroup, Label } from "../utility/form";
import { useScreenContext } from "./context";
import { usePopoverPosition } from "@/hooks/use-popover-position";

const PopoverContainer = styled.div`
  position: fixed;
  background: var(--color-popover);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  border: var(--border-width-thin) solid var(--color-border);
  padding: var(--space-8u);
  width: calc(calc(var(--size-50u) * 4));
  max-width: calc(100vw - var(--space-24u));
  z-index: 1001;

  @media (max-width: 600px) {
    width: calc(100vw - var(--space-24u));
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: var(--space-4u);
  justify-content: flex-end;
  margin-top: var(--space-8u);
`;

const Title = styled.div`
  font-size: var(--font-size-xl);
  font-weight: 400;
  color: var(--color-popover-foreground);
  margin-bottom: var(--space-4u);
  display: flex;
  align-items: center;
  gap: var(--space-4u);
`;

const WarningBox = styled.div`
  background: var(--color-warning-background);
  border: var(--border-width-thin) solid var(--color-warning-border);
  border-radius: var(--radius-2xs);
  padding: var(--space-6u);
  margin-bottom: var(--space-8u);
`;

const WarningText = styled.p`
  font-size: var(--font-size-md);
  color: var(--color-warning-text, var(--color-foreground));
  margin: 0;
  line-height: 1.5;
`;

interface RemovePasswordPopoverProps {
  triggerRef?: React.RefObject<HTMLElement | null>;
  onClose: () => void;
  onRemovePassword: (currentPassword: string) => Promise<void>;
}

export const RemovePasswordPopover = ({
  onClose,
  onRemovePassword,
  triggerRef,
}: RemovePasswordPopoverProps) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useScreenContext();
  const position = usePopoverPosition({
    triggerRef: triggerRef ?? { current: null },
    isOpen: mounted,
    minWidth: 400,
    defaultMaxHeight: 360,
  });

  useEffect(() => {
    setMounted(true);

    // Add click outside listener
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    // Add escape key listener
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  const handleSubmit = async () => {
    if (!currentPassword || loading) return;

    setLoading(true);
    try {
      await onRemovePassword(currentPassword);
      onClose();
    } catch (error: any) {
      const errorMessage = error.message || "Failed to remove password. Please try again.";
      toast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <PopoverContainer
      ref={popoverRef}
      style={{
        top: position?.top !== undefined ? `${position.top}px` : undefined,
        bottom: position?.bottom !== undefined ? `${position.bottom}px` : undefined,
        left: position?.left !== undefined ? `${position.left}px` : undefined,
        right: position?.right !== undefined ? `${position.right}px` : undefined,
        maxHeight: position?.maxHeight ? `${position.maxHeight}px` : undefined,
        visibility: position ? "visible" : "hidden",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Title>
        <AlertTriangle size={18} color="var(--color-warning)" />
        Remove Password
      </Title>

      <WarningBox>
        <WarningText>
          You're about to remove password authentication from your account.
          Make sure you have another way to sign in (email, phone, social login, or passkey)
          before continuing.
        </WarningText>
      </WarningBox>

      <FormGroup>
        <Label htmlFor="current-password">Confirm your current password</Label>
        <Input
          id="current-password"
          type="password"
          placeholder="Enter current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoFocus
        />
      </FormGroup>

      <ButtonGroup>
        <Button
          $outline
          onClick={onClose}
          style={{ width: 'auto', padding: '0 var(--space-6u)' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!currentPassword || loading}
          style={{
            width: 'auto',
            padding: '0 var(--space-6u)',
            background: 'var(--color-error)',
            borderColor: 'var(--color-error)'
          }}
        >
          {loading ? "Removing..." : "Remove Password"}
        </Button>
      </ButtonGroup>
    </PopoverContainer>
  );
};

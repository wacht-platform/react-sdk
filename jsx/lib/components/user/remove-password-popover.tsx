import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { AlertTriangle } from "lucide-react";
import { Input } from "@/components/utility/input";
import { Button } from "@/components/utility/button";
import { FormGroup, Label } from "../utility/form";
import { useScreenContext } from "./context";

const PopoverContainer = styled.div`
  position: fixed;
  background: var(--color-background);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px var(--color-shadow);
  border: 1px solid var(--color-border);
  padding: 16px;
  width: 400px;
  max-width: calc(100vw - 48px);
  z-index: 1001;

  @media (max-width: 600px) {
    width: calc(100vw - 48px);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
`;

const Title = styled.div`
  font-size: 16px;
  font-weight: 500;
  color: var(--color-foreground);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const WarningBox = styled.div`
  background: var(--color-warning-bg, rgba(251, 191, 36, 0.1));
  border: 1px solid var(--color-warning-border, rgba(251, 191, 36, 0.3));
  border-radius: var(--radius-sm);
  padding: 12px;
  margin-bottom: 16px;
`;

const WarningText = styled.p`
  font-size: 13px;
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
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [currentPassword, setCurrentPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useScreenContext();

  useEffect(() => {
    setMounted(true);

    // Calculate position after a short delay
    const timer = setTimeout(() => {
      if (!popoverRef.current || !triggerRef?.current) return;

      const triggerButton = triggerRef.current;

      if (triggerButton) {
        const rect = triggerButton.getBoundingClientRect();
        const popoverWidth = 400;
        const popoverHeight = 300; // Approximate height
        const spacing = 8;

        let top = 0;
        let left = 0;

        // Check available space
        const spaceBottom = window.innerHeight - rect.bottom;
        const spaceTop = rect.top;

        // Prefer to open below if there's space
        if (spaceBottom >= popoverHeight + spacing) {
          top = rect.bottom + spacing;
          // Align to right edge of button (bottom-right)
          left = rect.right - popoverWidth;

          // If it goes off left edge, align to left edge of button instead (bottom-left)
          if (left < spacing) {
            left = rect.left;

            // If that also goes off right edge, center it on screen
            if (left + popoverWidth > window.innerWidth - spacing) {
              left = (window.innerWidth - popoverWidth) / 2;
            }
          }
        }
        // Otherwise open above
        else if (spaceTop >= popoverHeight + spacing) {
          top = rect.top - popoverHeight - spacing;
          // Align to right edge of button (top-right)
          left = rect.right - popoverWidth;

          // If it goes off left edge, align to left edge of button instead (top-left)
          if (left < spacing) {
            left = rect.left;

            // If that also goes off right edge, center it on screen
            if (left + popoverWidth > window.innerWidth - spacing) {
              left = (window.innerWidth - popoverWidth) / 2;
            }
          }
        }
        // If no space above or below, position it at the best available spot
        else {
          // Position at bottom with scrolling if needed
          top = rect.bottom + spacing;
          left = rect.right - popoverWidth;

          if (left < spacing) {
            left = rect.left;
          }
        }

        setPosition({ top, left });
      }
    }, 10);

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
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose, triggerRef]);

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
        top: `${position.top}px`,
        left: `${position.left}px`,
        visibility: position.top > 0 ? "visible" : "hidden",
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Title>
        <AlertTriangle size={18} color="var(--color-warning, #fbbf24)" />
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
          style={{ width: 'auto', padding: '0 var(--space-md)' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!currentPassword || loading}
          style={{ 
            width: 'auto', 
            padding: '0 var(--space-md)',
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
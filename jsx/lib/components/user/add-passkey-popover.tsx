import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Input } from "@/components/utility/input";
import { Button } from "@/components/utility/button";
import { usePopoverPosition } from "@/hooks/use-popover-position";

const PopoverContainer = styled.div`
  position: fixed;
  background: var(--color-popover);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  border: var(--border-width-thin) solid var(--color-border);
  padding: var(--space-8u);
  width: calc(calc(var(--size-50u) * 3) + var(--space-10u));
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
  font-size: var(--font-size-lg);
  font-weight: 400;
  color: var(--color-popover-foreground);
  margin-bottom: var(--space-4u);
`;

const StyledFormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--space-2u);
  margin-bottom: var(--space-6u);
`;

const ErrorMessage = styled.div`
  color: var(--color-error);
  font-size: var(--font-size-sm);
  margin-top: var(--space-2u);
`;

interface AddPasskeyPopoverProps {
    triggerRef?: React.RefObject<HTMLElement | null>;
    onClose: () => void;
    onAddPasskey: (name: string) => Promise<void>;
}

export const AddPasskeyPopover = ({
    onClose,
    onAddPasskey,
    triggerRef,
}: AddPasskeyPopoverProps) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = useState(false);
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const position = usePopoverPosition({
        triggerRef: triggerRef ?? { current: null },
        isOpen: mounted,
        minWidth: 320,
        defaultMaxHeight: 260,
    });

    useEffect(() => {
        setMounted(true);

        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

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
        if (loading) return;

        setLoading(true);
        setError("");
        try {
            await onAddPasskey(name.trim());
            onClose();
        } catch (err: any) {
            setError(err.message || "Failed to register passkey");
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
                visibility: position ? "visible" : "hidden"
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <Title>Add Passkey</Title>

            <StyledFormGroup>
                <Input
                    type="text"
                    placeholder="e.g., MacBook Pro, iPhone"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                />
            </StyledFormGroup>

            {error && <ErrorMessage>{error}</ErrorMessage>}

            <ButtonGroup>
                <Button $outline onClick={onClose}>Cancel</Button>
                <Button
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Registering..." : "Continue"}
                </Button>
            </ButtonGroup>
        </PopoverContainer>
    );
};

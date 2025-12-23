import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Input } from "@/components/utility/input";
import { Label } from "../utility/form";

const PopoverContainer = styled.div`
  position: fixed;
  background: var(--color-background);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px var(--color-shadow);
  border: 1px solid var(--color-border);
  padding: 16px;
  width: 320px;
  max-width: calc(100vw - 48px);
  z-index: 1001;
  
  @media (max-width: 600px) {
    width: calc(100vw - 48px);
  }
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 8px 16px;
  background: ${(props) =>
        props.$primary ? "var(--color-primary)" : "var(--color-background)"};
  color: ${(props) =>
        props.$primary ? "white" : "var(--color-secondary-text)"};
  border: 1px solid
    ${(props) =>
        props.$primary ? "var(--color-primary)" : "var(--color-border)"};
  border-radius: var(--radius-md);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${(props) =>
        props.$primary
            ? "var(--color-primary-hover)"
            : "var(--color-input-background)"};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
`;

const Title = styled.div`
  font-size: 14px;
  font-weight: 400;
  color: var(--color-foreground);
  margin-bottom: 8px;
`;

const StyledFormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
`;

const ErrorMessage = styled.div`
  color: var(--color-error);
  font-size: 12px;
  margin-top: 4px;
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
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        setMounted(true);

        // Calculate position after a short delay
        const timer = setTimeout(() => {
            if (!popoverRef.current || !triggerRef?.current) return;

            const triggerButton = triggerRef.current;

            if (triggerButton) {
                const rect = triggerButton.getBoundingClientRect();
                const popoverWidth = 320;
                const popoverHeight = 180;
                const spacing = 8;

                let top = 0;
                let left = 0;

                const spaceBottom = window.innerHeight - rect.bottom;
                const spaceTop = rect.top;

                if (spaceBottom >= popoverHeight + spacing) {
                    top = rect.bottom + spacing;
                    left = rect.right - popoverWidth;

                    if (left < spacing) {
                        left = rect.left;
                        if (left + popoverWidth > window.innerWidth - spacing) {
                            left = (window.innerWidth - popoverWidth) / 2;
                        }
                    }
                } else if (spaceTop >= popoverHeight + spacing) {
                    top = rect.top - popoverHeight - spacing;
                    left = rect.right - popoverWidth;

                    if (left < spacing) {
                        left = rect.left;
                        if (left + popoverWidth > window.innerWidth - spacing) {
                            left = (window.innerWidth - popoverWidth) / 2;
                        }
                    }
                } else {
                    top = rect.bottom + spacing;
                    left = rect.right - popoverWidth;
                    if (left < spacing) {
                        left = rect.left;
                    }
                }

                setPosition({ top, left });
            }
        }, 10);

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
            clearTimeout(timer);
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [onClose, triggerRef]);

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
                top: `${position.top}px`,
                left: `${position.left}px`,
                visibility: position.top > 0 ? 'visible' : 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <Title>Add Passkey</Title>
            <div
                style={{
                    fontSize: "14px",
                    color: "var(--color-muted)",
                    marginBottom: "16px",
                }}
            >
                Give your passkey a name to identify it later.
            </div>

            <StyledFormGroup>
                <Label>Name (optional)</Label>
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
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    $primary
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Registering..." : "Continue"}
                </Button>
            </ButtonGroup>
        </PopoverContainer>
    );
};

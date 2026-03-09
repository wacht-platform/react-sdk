import { useState, useRef, useEffect, RefObject } from "react";
import styled from "styled-components";
import { X } from "lucide-react";
import { Input } from "@/components/utility/input";
import { FormGroup, Label } from "../../utility/form";
import { Button, Spinner } from "../../utility";
import { ComboBox, ComboBoxOption } from "../../utility/combo-box";
import { WorkspaceRole } from "@/types";
import { useScreenContext } from "../../organization/context";
import { usePopoverPosition } from "@/hooks/use-popover-position";

const PopoverContainer = styled.div`
  position: fixed;
  width: calc(calc(var(--size-50u) * 4) - var(--space-20u));
  max-width: calc(100vw - var(--space-24u));
  background: var(--color-background);
  border: var(--border-width-thin) solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: 1001;
  
  @media (max-width: 600px) {
    width: calc(100vw - var(--space-24u));
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4u) var(--space-6u);
  border-bottom: var(--border-width-thin) solid var(--color-border);
`;

const Title = styled.h3`
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: 400;
  color: var(--color-foreground);
`;

const Content = styled.div`
  padding: var(--space-6u);
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: var(--space-2u);
  justify-content: flex-end;
  padding: var(--space-4u) var(--space-6u);
  border-top: var(--border-width-thin) solid var(--color-border);
  background: var(--color-background-subtle);
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: var(--space-2u);
  cursor: pointer;
  color: var(--color-muted);
  transition: all 0.15s ease;
  border-radius: var(--radius-2xs);
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: var(--color-foreground);
    background: var(--color-input-background);
  }
`;

interface InviteMemberPopoverProps {
    onClose: () => void;
    onSuccess: () => void;
    roles: WorkspaceRole[];
    createInvitation: (payload: { email: string; role_id: string }) => Promise<any>;
    triggerRef: RefObject<HTMLElement | null>;
}

export const InviteMemberPopover = ({
    onClose,
    onSuccess,
    roles,
    createInvitation,
    triggerRef
}: InviteMemberPopoverProps) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [email, setEmail] = useState("");
    const [selectedRole, setSelectedRole] = useState<WorkspaceRole | null>(
        roles[0] || null
    );
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { toast } = useScreenContext();
  const position = usePopoverPosition({
    triggerRef,
    isOpen: mounted,
    minWidth: 360,
    defaultMaxHeight: 320,
  });

    const roleOptions: ComboBoxOption[] = roles.map((role) => ({
        value: role.id,
        label: role.name,
    }));

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleInvite = async () => {
        const trimmedEmail = email.trim().toLowerCase();

        if (!trimmedEmail || !selectedRole) return;

        // Validate email format
        if (!validateEmail(trimmedEmail)) {
            toast("Please enter a valid email address", "error");
            return;
        }

        // Sanitize and validate email length
        if (trimmedEmail.length > 320) { // RFC 5321 limit
            toast("Email address is too long", "error");
            return;
        }

        setLoading(true);
        try {
            await createInvitation({ email: trimmedEmail, role_id: selectedRole.id });
            onSuccess();
        } catch (error: any) {
            const errorMessage = error.message || "Failed to send invitation. Please try again.";
            toast(errorMessage, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);

        // Add click outside listener
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose?.();
            }
        };

        // Add escape key listener
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose?.();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [onClose]);

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
            role="dialog"
            aria-labelledby="invite-member-title"
            aria-modal="true"
        >
            <Header>
                <Title id="invite-member-title">Invite Member</Title>
                <CloseButton onClick={onClose} aria-label="Close invite member dialog">
                    <X size={16} />
                </CloseButton>
            </Header>

            <Content>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4u)" }}>
                    <FormGroup>
                        <Label>Email Address</Label>
                        <Input
                            type="email"
                            placeholder="colleague@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoFocus
                            aria-label="Email address for invitation"
                            aria-describedby="email-help"
                        />
                    </FormGroup>

                    <FormGroup>
                        <Label>Role</Label>
                        <ComboBox
                            options={roleOptions}
                            value={selectedRole?.id}
                            onChange={(id) =>
                                setSelectedRole(roles.find((role) => role.id === id)!)
                            }
                            placeholder="Select a role"
                            aria-label="Select role for invited member"
                        />
                    </FormGroup>
                </div>
            </Content>

            <ButtonGroup>
                <Button
                    $outline
                    onClick={onClose}
                    style={{
                        width: "auto",
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleInvite}
                    disabled={!email || !selectedRole || loading}
                    style={{
                        width: "auto",
                    }}
                >
                    {loading ? <Spinner size={16} /> : "Send Invitation"}
                </Button>
            </ButtonGroup>
        </PopoverContainer>
    );
};

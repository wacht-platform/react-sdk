import { useState, useRef, useEffect, RefObject } from "react";
import styled from "styled-components";
import { Input } from "@/components/utility/input";
import { Button, Spinner } from "../../utility";
import { ComboBox, ComboBoxOption } from "../../utility/combo-box";
import { WorkspaceRole } from "@/types";
import { useScreenContext } from "../../organization/context";
import { usePopoverPosition } from "@/hooks/use-popover-position";

const PopoverContainer = styled.div`
    position: fixed;
    background: var(--color-popover);
    border-radius: 10px;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--color-border);
    width: 360px;
    max-width: calc(100vw - 24px);
    z-index: 1001;
    overflow: hidden;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;

    @media (max-width: 600px) {
        width: calc(100vw - 24px);
    }
`;

const Title = styled.div`
    font-size: 13px;
    font-weight: 600;
    color: var(--color-popover-foreground);
`;

const Field = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const FieldLabel = styled.label`
    font-size: 11px;
    font-weight: 500;
    color: var(--color-secondary-text);
`;

const Actions = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
    & > button { width: 100%; }
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
    triggerRef,
}: InviteMemberPopoverProps) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [email, setEmail] = useState("");
    const [selectedRole, setSelectedRole] = useState<WorkspaceRole | null>(
        roles[0] || null,
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

    const validateEmail = (email: string): boolean =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleInvite = async () => {
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail || !selectedRole) return;
        if (!validateEmail(trimmedEmail)) {
            toast("Please enter a valid email address", "error");
            return;
        }
        if (trimmedEmail.length > 320) {
            toast("Email address is too long", "error");
            return;
        }
        setLoading(true);
        try {
            await createInvitation({
                email: trimmedEmail,
                role_id: selectedRole.id,
            });
            onSuccess();
        } catch (error: any) {
            toast(
                error.message || "Failed to send invitation. Please try again.",
                "error",
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose?.();
            }
        };
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose?.();
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [onClose]);

    if (!mounted) return null;

    return (
        <PopoverContainer
            ref={popoverRef}
            style={{
                top: position?.top !== undefined ? `${position.top}px` : undefined,
                bottom: position?.bottom !== undefined ? `${position.bottom}px` : undefined,
                left: position?.left !== undefined ? `${position.left}px` : undefined,
                right: position?.right !== undefined ? `${position.right}px` : undefined,
                visibility: position ? "visible" : "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="invite-member-title"
            aria-modal="true"
        >
            <Title id="invite-member-title">Invite member</Title>
            <Field>
                <FieldLabel>Email</FieldLabel>
                <Input
                    type="email"
                    placeholder="colleague@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && email && selectedRole) handleInvite();
                    }}
                    autoFocus
                    aria-label="Email address for invitation"
                />
            </Field>
            <Field>
                <FieldLabel>Role</FieldLabel>
                <ComboBox
                    options={roleOptions}
                    value={selectedRole?.id}
                    onChange={(id) =>
                        setSelectedRole(roles.find((role) => role.id === id)!)
                    }
                    placeholder="Select a role"
                    aria-label="Select role for invited member"
                />
            </Field>
            <Actions>
                <Button $size="sm" $outline onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    $size="sm"
                    onClick={handleInvite}
                    disabled={!email || !selectedRole || loading}
                >
                    {loading ? <Spinner size={12} /> : "Send invite"}
                </Button>
            </Actions>
        </PopoverContainer>
    );
};

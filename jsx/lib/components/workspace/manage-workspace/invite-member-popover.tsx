import { useState, useRef, useEffect, RefObject } from "react";
import { Input } from "@/components/utility/input";
import { Button, Spinner } from "../../utility";
import { ComboBox, ComboBoxOption } from "../../utility/combo-box";
import { WorkspaceRole } from "@/types";
import { useScreenContext } from "../../organization/context";
import { usePopoverPosition } from "@/hooks/use-popover-position";

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
        contentRef: popoverRef,
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
        <div
            ref={popoverRef}
            className="w-pop w-pop--wide w-pop-body"
            style={{
                position: "fixed",
                zIndex: 1001,
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
            <div className="w-pop-title" id="invite-member-title">
                Invite member
            </div>
            <div className="w-field">
                <label className="w-label">Email</label>
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
            </div>
            <div className="w-field">
                <label className="w-label">Role</label>
                <ComboBox
                    options={roleOptions}
                    value={selectedRole?.id}
                    onChange={(id) =>
                        setSelectedRole(roles.find((role) => role.id === id)!)
                    }
                    placeholder="Select a role"
                    aria-label="Select role for invited member"
                />
            </div>
            <div className="w-flex w-gap-2">
                <Button $size="sm" $outline $fullWidth onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    $size="sm"
                    $fullWidth
                    onClick={handleInvite}
                    disabled={!email || !selectedRole || loading}
                >
                    {loading ? <Spinner size={12} /> : "Send invite"}
                </Button>
            </div>
        </div>
    );
};

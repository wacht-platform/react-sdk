import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/utility/input";
import { useActiveOrganization } from "@/hooks/use-organization";
import { Spinner } from "../utility";
import { ComboBox, ComboBoxOption } from "../utility/combo-box";
import { OrganizationRole } from "@/types";
import { useScreenContext } from "./context";
import { usePopoverPosition } from "@/hooks/use-popover-position";

interface InviteMemberPopoverProps {
    onClose?: () => void;
    onSuccess?: () => void;
    roles: OrganizationRole[];
    triggerRef?: React.RefObject<HTMLElement | null>;
}

export const InviteMemberPopover = ({
    onClose,
    onSuccess,
    roles,
    triggerRef,
}: InviteMemberPopoverProps) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [email, setEmail] = useState("");
    const [selectedRole, setSelectedRole] = useState<OrganizationRole | null>(null);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { inviteMember } = useActiveOrganization();
    const { toast } = useScreenContext();
    const position = usePopoverPosition({
        contentRef: popoverRef,
        triggerRef: triggerRef ?? { current: null },
        isOpen: mounted,
        minWidth: 360,
        defaultMaxHeight: 360,
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
            await inviteMember({ email: trimmedEmail, organizationRole: selectedRole });
            onSuccess?.();
        } catch (error: any) {
            toast(error.message || "Failed to send invitation. Please try again.", "error");
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
            className="w-pop w-pop--wide"
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
            <div className="w-pop-body">
                <div className="w-pop-title" id="invite-member-title">Invite member</div>
                <label className="w-field">
                    <span className="w-label">Email</span>
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
                </label>
                <label className="w-field">
                    <span className="w-label">Role</span>
                    <ComboBox
                        options={roleOptions}
                        value={selectedRole?.id}
                        onChange={(id) =>
                            setSelectedRole(roles.find((role) => role.id === id)!)
                        }
                        placeholder="Select a role"
                        aria-label="Select role for invited member"
                    />
                </label>
            </div>
            <div className="w-pop-foot">
                <button type="button" className="w-btn w-btn--ghost w-btn--sm" onClick={onClose}>
                    Cancel
                </button>
                <button
                    type="button"
                    className="w-btn w-btn--primary w-btn--sm"
                    onClick={handleInvite}
                    disabled={!email || !selectedRole || loading}
                >
                    {loading ? <Spinner size={12} /> : "Send invite"}
                </button>
            </div>
        </div>
    );
};

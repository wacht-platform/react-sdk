import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/utility/input";
import { Spinner } from "../utility";
import { OrganizationDomain } from "@/types";
import { useActiveOrganization } from "@/hooks/use-organization";
import { useScreenContext } from "./context";
import { usePopoverPosition } from "@/hooks/use-popover-position";

interface AddDomainPopoverProps {
    onClose?: () => void;
    domain?: OrganizationDomain;
    triggerRef?: React.RefObject<HTMLElement | null>;
}

export const AddDomainPopover = ({
    onClose,
    domain,
    triggerRef,
}: AddDomainPopoverProps) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const [currentDomain, setCurrentDomain] = useState<OrganizationDomain>();
    const [newFqdn, setNewFqdn] = useState("");
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const { addDomain, verifyDomain } = useActiveOrganization();
    const { toast } = useScreenContext();
    const position = usePopoverPosition({
        contentRef: popoverRef,
        triggerRef: triggerRef ?? { current: null },
        isOpen: mounted,
        minWidth: 360,
        defaultMaxHeight: 420,
    });

    const validateDomain = (d: string): boolean =>
        /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/.test(d);

    const sanitizeDomain = (d: string): string =>
        d.trim().toLowerCase().replace(/^https?:\/\//, "");

    const handleDomainCreation = async () => {
        const sanitized = sanitizeDomain(newFqdn);
        if (!sanitized) {
            toast("Please enter a domain name", "error");
            return;
        }
        if (!validateDomain(sanitized)) {
            toast("Please enter a valid domain (e.g., example.com)", "error");
            return;
        }
        if (sanitized.length > 253) {
            toast("Domain name is too long", "error");
            return;
        }
        setLoading(true);
        try {
            const res = await addDomain!({ fqdn: sanitized });
            toast("Domain added", "info");
            setCurrentDomain(res!.data);
        } catch (error: any) {
            toast(error.message || "Failed to add domain. Please try again.", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDomainVerification = async () => {
        if (!currentDomain || loading) return;
        setLoading(true);
        try {
            await verifyDomain!(currentDomain);
            onClose?.();
            toast("Domain verified", "info");
        } catch (error: any) {
            toast(error.message || "Failed to verify domain. Check DNS records and try again.", "error");
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

    useEffect(() => {
        if (domain) setCurrentDomain(domain);
    }, [domain]);

    if (!mounted) return null;

    const style: React.CSSProperties = {
        position: "fixed",
        zIndex: 1001,
        top: position?.top !== undefined ? `${position.top}px` : undefined,
        bottom: position?.bottom !== undefined ? `${position.bottom}px` : undefined,
        left: position?.left !== undefined ? `${position.left}px` : undefined,
        right: position?.right !== undefined ? `${position.right}px` : undefined,
        visibility: position ? "visible" : "hidden",
    };

    if (!currentDomain) {
        return (
            <div
                ref={popoverRef}
                className="w-pop w-pop--wide"
                style={style}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="add-domain-title"
                aria-modal="true"
            >
                <div className="w-pop-body">
                    <div className="w-pop-title" id="add-domain-title">Add domain</div>
                    <p className="w-pop-sub">Verified members auto-join this org.</p>
                    <label className="w-field">
                        <span className="w-label">Domain</span>
                        <Input
                            type="text"
                            placeholder="example.com"
                            value={newFqdn}
                            onChange={(e) => setNewFqdn(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && newFqdn) handleDomainCreation();
                            }}
                            autoFocus
                            aria-label="Domain name"
                        />
                    </label>
                </div>
                <div className="w-pop-foot">
                    <button type="button" className="w-btn w-btn--ghost w-btn--sm" onClick={onClose}>Cancel</button>
                    <button type="button" className="w-btn w-btn--primary w-btn--sm" onClick={handleDomainCreation} disabled={!newFqdn || loading}>
                        {loading ? <Spinner size={12} /> : "Continue"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={popoverRef}
            className="w-pop w-pop--wide"
            style={style}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="verify-domain-title"
            aria-modal="true"
        >
            <div className="w-pop-body">
                <div className="w-pop-title" id="verify-domain-title">Verify domain</div>
                <p className="w-pop-sub">Add this DNS record, then verify.</p>
                <label className="w-field">
                    <span className="w-label">Type</span>
                    <Input value={currentDomain?.verification_dns_record_type} disabled />
                </label>
                <label className="w-field">
                    <span className="w-label">Name</span>
                    <Input value={currentDomain?.verification_dns_record_name} disabled />
                </label>
                <label className="w-field">
                    <span className="w-label">Value</span>
                    <Input value={currentDomain?.verification_dns_record_data} disabled />
                </label>
            </div>
            <div className="w-pop-foot">
                <button type="button" className="w-btn w-btn--ghost w-btn--sm" onClick={onClose}>Cancel</button>
                <button type="button" className="w-btn w-btn--primary w-btn--sm" onClick={handleDomainVerification} disabled={loading}>
                    {loading ? <Spinner size={12} /> : "Verify"}
                </button>
            </div>
        </div>
    );
};

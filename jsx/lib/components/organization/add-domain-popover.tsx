import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { Input } from "@/components/utility/input";
import { Button, Spinner } from "../utility";
import { OrganizationDomain } from "@/types";
import { useActiveOrganization } from "@/hooks/use-organization";
import { useScreenContext } from "./context";
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

const Hint = styled.div`
    font-size: 12px;
    color: var(--color-secondary-text);
    line-height: 1.4;
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
        top: position?.top !== undefined ? `${position.top}px` : undefined,
        bottom: position?.bottom !== undefined ? `${position.bottom}px` : undefined,
        left: position?.left !== undefined ? `${position.left}px` : undefined,
        right: position?.right !== undefined ? `${position.right}px` : undefined,
        visibility: position ? "visible" : "hidden",
    };

    if (!currentDomain) {
        return (
            <PopoverContainer
                ref={popoverRef}
                style={style}
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-labelledby="add-domain-title"
                aria-modal="true"
            >
                <Title id="add-domain-title">Add domain</Title>
                <Hint>Add a corporate domain so verified users auto-join this organization.</Hint>
                <Field>
                    <FieldLabel>Domain</FieldLabel>
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
                </Field>
                <Actions>
                    <Button $size="sm" $outline onClick={onClose}>Cancel</Button>
                    <Button $size="sm" onClick={handleDomainCreation} disabled={!newFqdn || loading}>
                        {loading ? <Spinner size={12} /> : "Continue"}
                    </Button>
                </Actions>
            </PopoverContainer>
        );
    }

    return (
        <PopoverContainer
            ref={popoverRef}
            style={style}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-labelledby="verify-domain-title"
            aria-modal="true"
        >
            <Title id="verify-domain-title">Verify domain</Title>
            <Hint>Add the following DNS record to your provider, then verify.</Hint>
            <Field>
                <FieldLabel>Type</FieldLabel>
                <Input value={currentDomain?.verification_dns_record_type} disabled />
            </Field>
            <Field>
                <FieldLabel>Name</FieldLabel>
                <Input value={currentDomain?.verification_dns_record_name} disabled />
            </Field>
            <Field>
                <FieldLabel>Value</FieldLabel>
                <Input value={currentDomain?.verification_dns_record_data} disabled />
            </Field>
            <Actions>
                <Button $size="sm" $outline onClick={onClose}>Cancel</Button>
                <Button $size="sm" onClick={handleDomainVerification} disabled={loading}>
                    {loading ? <Spinner size={12} /> : "Verify"}
                </Button>
            </Actions>
        </PopoverContainer>
    );
};

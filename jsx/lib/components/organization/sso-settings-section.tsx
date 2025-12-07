"use client";

import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import useSWR from "swr";
import { Shield, Trash, Copy, Check, Plus, X } from "lucide-react";
import { useActiveOrganization } from "@/hooks/use-organization";
import { useDeployment } from "@/hooks";
import { Spinner } from "../utility/spinner";
import { EmptyState } from "../utility/empty-state";
import { ConfirmationPopover } from "../utility/confirmation-popover";
import { useScreenContext } from "./context";
import { Button } from "../utility";
import { Input } from "../utility/input";
import { FormGroup, Label } from "../utility/form";
import type { EnterpriseConnection, CreateEnterpriseConnectionPayload } from "@/types";

const HeaderCTAContainer = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
`;

const Card = styled.div`
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
`;

const CardTitle = styled.h3`
  font-size: 16px;
  font-weight: 500;
  color: var(--color-foreground);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Badge = styled.span`
  background: var(--color-primary-background);
  color: var(--color-primary);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 400;
  text-transform: uppercase;
`;

const CardDetail = styled.div`
  font-size: 13px;
  color: var(--color-muted);
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconButton = styled.button`
  background: none;
  border: 1px solid var(--color-border);
  padding: 6px;
  cursor: pointer;
  color: var(--color-muted);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--color-input-background);
    color: var(--color-foreground);
  }
`;

const InfoBox = styled.div`
  padding: 12px 16px;
  background: var(--color-background-alt);
  border-radius: 8px;
  margin-bottom: 24px;
  border: 1px solid var(--color-border);
  font-size: 13px;
  color: var(--color-secondary-text);
`;

const Textarea = styled.textarea`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  background: var(--color-input-background);
  color: var(--color-foreground);
  min-height: 100px;
  resize: vertical;
  font-family: monospace;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

const PopoverContainer = styled.div`
  position: fixed;
  width: 480px;
  max-width: calc(100vw - 48px);
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 12px var(--color-shadow);
  z-index: 1001;
  
  @media (max-width: 600px) {
    width: calc(100vw - 48px);
  }
`;

const PopoverHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) var(--space-md);
  border-bottom: 1px solid var(--color-border);
`;

const PopoverTitle = styled.h3`
  margin: 0;
  font-size: var(--font-xs);
  font-weight: 400;
  color: var(--color-foreground);
`;

const PopoverContent = styled.div`
  padding: var(--space-lg);
  max-height: 450px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
`;

const PopoverButtonGroup = styled.div`
  display: flex;
  gap: var(--space-xs);
  justify-content: flex-end;
  padding: var(--space-sm) var(--space-md);
  border-top: 1px solid var(--color-border);
  background: var(--color-background-alt);
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: var(--space-xs);
  cursor: pointer;
  color: var(--color-muted);
  transition: all 0.15s ease;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: var(--color-foreground);
    background: var(--color-input-background);
  }
`;

export const SSOSettingsSection = () => {
    const {
        activeOrganization,
        loading,
        getEnterpriseConnections,
        createEnterpriseConnection,
        deleteEnterpriseConnection,
    } = useActiveOrganization();
    const { deployment } = useDeployment();
    const { toast } = useScreenContext();
    const [isCreating, setIsCreating] = useState(false);
    const [connectionToDelete, setConnectionToDelete] = useState<string | null>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const configureButtonRef = useRef<HTMLButtonElement>(null);

    const {
        data: connections = [],
        isLoading,
        mutate,
    } = useSWR(
        activeOrganization?.id ? `wacht-org-sso:${activeOrganization.id}` : null,
        async () => await getEnterpriseConnections?.() || [],
        {
            refreshInterval: 30000,
            revalidateOnFocus: false,
        }
    );

    const handleDelete = async (connectionId: string) => {
        try {
            await deleteEnterpriseConnection?.(connectionId);
            mutate();
            toast("SSO connection deleted", "info");
        } catch (error: any) {
            toast(error.message || "Failed to delete connection", "error");
        }
        setConnectionToDelete(null);
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const spMetadataUrl = deployment?.backend_host
        ? `https://${deployment.backend_host}/auth/sso/metadata`
        : "";
    const spAcsUrl = deployment?.backend_host
        ? `https://${deployment.backend_host}/auth/sso/callback`
        : "";

    if (loading || isLoading) {
        return (
            <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                <Spinner />
            </div>
        );
    }

    return (
        <>
            <HeaderCTAContainer>
                <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: "16px", color: "var(--color-foreground)" }}>
                        Enterprise SSO
                    </h3>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "var(--color-muted)" }}>
                        Configure SAML SSO for your organization
                    </p>
                </div>
                {connections.length === 0 && (
                    <div style={{ position: "relative" }}>
                        <Button ref={configureButtonRef} onClick={() => setIsCreating(true)}>
                            <Plus size={16} /> Configure SSO
                        </Button>
                        {isCreating && (
                            <CreateSSOPopover
                                onClose={() => setIsCreating(false)}
                                triggerRef={configureButtonRef}
                                onCreate={async (payload) => {
                                    try {
                                        await createEnterpriseConnection?.(payload);
                                        mutate();
                                        setIsCreating(false);
                                        toast("SSO connection created", "info");
                                    } catch (error: any) {
                                        toast(error.message || "Failed to create connection", "error");
                                    }
                                }}
                            />
                        )}
                    </div>
                )}
            </HeaderCTAContainer>

            <InfoBox>
                <div style={{ marginBottom: "12px", fontWeight: 500 }}>
                    Service Provider Details
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ minWidth: "80px" }}>ACS URL:</span>
                        <code style={{ flex: 1, fontSize: "12px" }}>{spAcsUrl}</code>
                        <IconButton onClick={() => copyToClipboard(spAcsUrl, "acs")}>
                            {copiedField === "acs" ? <Check size={14} /> : <Copy size={14} />}
                        </IconButton>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ minWidth: "80px" }}>Metadata:</span>
                        <code style={{ flex: 1, fontSize: "12px" }}>{spMetadataUrl}</code>
                        <IconButton onClick={() => copyToClipboard(spMetadataUrl, "metadata")}>
                            {copiedField === "metadata" ? <Check size={14} /> : <Copy size={14} />}
                        </IconButton>
                    </div>
                </div>
            </InfoBox>

            {connections.length === 0 ? (
                <EmptyState
                    title="No SSO connection configured"
                    description="Set up SAML SSO to allow members to sign in with your identity provider"
                />
            ) : (
                connections.map((connection: EnterpriseConnection) => (
                    <Card key={connection.id}>
                        <CardHeader>
                            <CardTitle>
                                <Shield size={18} />
                                SAML SSO
                                <Badge>{connection.protocol.toUpperCase()}</Badge>
                            </CardTitle>
                            <div style={{ position: "relative" }}>
                                <IconButton
                                    onClick={() => setConnectionToDelete(connection.id)}
                                    style={{ color: "var(--color-error)" }}
                                >
                                    <Trash size={16} />
                                </IconButton>
                                {connectionToDelete === connection.id && (
                                    <ConfirmationPopover
                                        title="Delete this SSO connection?"
                                        onConfirm={() => handleDelete(connection.id)}
                                        onCancel={() => setConnectionToDelete(null)}
                                    />
                                )}
                            </div>
                        </CardHeader>
                        <CardDetail>
                            <strong>Entity ID:</strong> {connection.idp_entity_id}
                        </CardDetail>
                        <CardDetail>
                            <strong>SSO URL:</strong> {connection.idp_sso_url}
                        </CardDetail>
                        <CardDetail>
                            <strong>Created:</strong>{" "}
                            {new Date(connection.created_at).toLocaleDateString()}
                        </CardDetail>
                    </Card>
                ))
            )}
        </>
    );
};

interface CreateSSOPopoverProps {
    onClose: () => void;
    onCreate: (payload: CreateEnterpriseConnectionPayload) => Promise<void>;
    triggerRef?: React.RefObject<HTMLElement | null>;
}

const Select = styled.select`
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  background: var(--color-input-background);
  color: var(--color-foreground);
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: var(--color-primary);
  }
`;

const CreateSSOPopover = ({ onClose, onCreate, triggerRef }: CreateSSOPopoverProps) => {
    const { getDomains } = useActiveOrganization();
    const popoverRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [formData, setFormData] = useState({
        domain_id: "",
        idp_entity_id: "",
        idp_sso_url: "",
        idp_certificate: "",
    });

    const {
        data: domains = [],
        isLoading: domainsLoading,
    } = useSWR(
        "wacht-org-verified-domains-for-sso",
        async () => {
            const allDomains = await getDomains?.() || [];
            return allDomains.filter(d => d.verified);
        },
        { revalidateOnFocus: false }
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.domain_id) {
            return;
        }
        setLoading(true);
        try {
            await onCreate({
                protocol: "saml",
                domain_id: formData.domain_id,
                idp_entity_id: formData.idp_entity_id,
                idp_sso_url: formData.idp_sso_url,
                idp_certificate: formData.idp_certificate,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setMounted(true);

        const timer = setTimeout(() => {
            if (!popoverRef.current || !triggerRef?.current) return;

            const triggerButton = triggerRef.current;

            if (triggerButton) {
                const rect = triggerButton.getBoundingClientRect();
                const popoverWidth = 480;
                const popoverHeight = 450;
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
                onClose?.();
            }
        };

        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                onClose?.();
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
            role="dialog"
            aria-labelledby="create-sso-title"
            aria-modal="true"
        >
            <PopoverHeader>
                <PopoverTitle id="create-sso-title">Configure SAML SSO</PopoverTitle>
                <CloseButton onClick={onClose} aria-label="Close">
                    <X size={16} />
                </CloseButton>
            </PopoverHeader>

            <form onSubmit={handleSubmit}>
                <PopoverContent>
                    <FormGroup>
                        <Label>Domain *</Label>
                        {domainsLoading ? (
                            <div style={{ padding: "10px", color: "var(--color-muted)" }}>
                                Loading domains...
                            </div>
                        ) : domains.length === 0 ? (
                            <div style={{
                                padding: "12px",
                                background: "var(--color-warning-background)",
                                border: "1px solid var(--color-warning-border)",
                                borderRadius: "6px",
                                fontSize: "13px",
                                color: "var(--color-warning)"
                            }}>
                                No verified domains found. Please add and verify a domain first.
                            </div>
                        ) : (
                            <Select
                                value={formData.domain_id}
                                onChange={(e) =>
                                    setFormData({ ...formData, domain_id: e.target.value })
                                }
                                required
                            >
                                <option value="">Select a verified domain</option>
                                {domains.map(domain => (
                                    <option key={domain.id} value={domain.id}>
                                        {domain.fqdn}
                                    </option>
                                ))}
                            </Select>
                        )}
                    </FormGroup>
                    <FormGroup>
                        <Label>IdP Entity ID</Label>
                        <Input
                            type="text"
                            value={formData.idp_entity_id}
                            onChange={(e) =>
                                setFormData({ ...formData, idp_entity_id: e.target.value })
                            }
                            placeholder="https://idp.example.com/entity"
                            required
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label>IdP SSO URL</Label>
                        <Input
                            type="url"
                            value={formData.idp_sso_url}
                            onChange={(e) =>
                                setFormData({ ...formData, idp_sso_url: e.target.value })
                            }
                            placeholder="https://idp.example.com/sso"
                            required
                        />
                    </FormGroup>
                    <FormGroup style={{ marginBottom: 0 }}>
                        <Label>IdP Certificate (PEM format)</Label>
                        <Textarea
                            value={formData.idp_certificate}
                            onChange={(e) =>
                                setFormData({ ...formData, idp_certificate: e.target.value })
                            }
                            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                            required
                        />
                    </FormGroup>
                </PopoverContent>

                <PopoverButtonGroup>
                    <Button $outline onClick={onClose} type="button" style={{ width: "auto" }}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading} style={{ width: "auto" }}>
                        {loading ? (
                            <>
                                <Spinner size={14} /> Creating...
                            </>
                        ) : (
                            "Create Connection"
                        )}
                    </Button>
                </PopoverButtonGroup>
            </form>
        </PopoverContainer>
    );
};

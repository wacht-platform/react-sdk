import { useState, useEffect } from "react";
import styled from "styled-components";
import { useActiveWorkspace, useWorkspaceList } from "@/hooks/use-workspace";
import { useDeployment } from "@/hooks/use-deployment";
import { useScreenContext } from "../../organization/context";
import {
    Button,
    Input,
    Spinner,
    Switch,
    FormGroup,
    Label,
} from "@/components/utility";
import { ItemRow, ItemContent, ItemActions, SectionLabel } from "./shared";

const Section = styled.div`
    display: flex;
    flex-direction: column;
    gap: var(--space-6u);
`;

const DangerCard = styled.div`
    padding: var(--space-8u);
    border: 1px solid
        color-mix(in srgb, var(--color-error) 45%, var(--color-border));
    background: color-mix(in srgb, var(--color-error) 4%, transparent);
    border-radius: 10px;
`;

const DangerRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4u);
    @media (max-width: 600px) {
        flex-direction: column;
        align-items: stretch;
    }
`;

const DangerTitle = styled.div`
    font-size: 13px;
    font-weight: 500;
    color: var(--color-card-foreground);
`;

const DangerSub = styled.div`
    font-size: 12px;
    color: var(--color-secondary-text);
    margin-top: 2px;
    line-height: 1.4;
`;

export const GeneralSettingsSection = () => {
    const { activeWorkspace, loading, updateWorkspace } = useActiveWorkspace();
    const { deleteWorkspace } = useWorkspaceList();
    const { deployment } = useDeployment();
    const { toast } = useScreenContext();

    const [name, setName] = useState(activeWorkspace?.name || "");
    const [description, setDescription] = useState(activeWorkspace?.description || "");
    const [security, setSecurity] = useState({
        mfa_required: false,
        ip_restrictions: false,
        allowed_ips: "",
    });
    const [isSaving, setIsSaving] = useState(false);
    const [confirmName, setConfirmName] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        if (activeWorkspace) {
            setName(activeWorkspace.name || "");
            setDescription(activeWorkspace.description || "");
            setSecurity({
                mfa_required: (activeWorkspace as any).enforce_2fa || false,
                ip_restrictions:
                    (activeWorkspace as any).enable_ip_restriction || false,
                allowed_ips:
                    (activeWorkspace as any).whitelisted_ips?.join("\n") || "",
            });
        }
    }, [activeWorkspace]);

    const autoSave = async () => {
        if (!activeWorkspace || isSaving) return;
        try {
            setIsSaving(true);
            await updateWorkspace({
                name,
                description,
                enforce_2fa: security.mfa_required,
                enable_ip_restriction: security.ip_restrictions,
                whitelisted_ips: security.allowed_ips
                    .split("\n")
                    .filter((ip) => ip.trim()),
            });
            toast("Changes saved", "info");
        } catch (error: any) {
            toast(error.message || "Failed to save changes", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteWorkspace = async () => {
        if (!activeWorkspace || confirmName !== activeWorkspace.name) return;
        try {
            setIsDeleting(true);
            await deleteWorkspace(activeWorkspace);
            toast("Workspace deleted", "info");
        } catch {
            toast("Failed to delete workspace", "error");
        } finally {
            setIsDeleting(false);
            setConfirmName("");
        }
    };

    if (loading && !activeWorkspace) return <Spinner />;
    if (!activeWorkspace) return null;

    const mfaEnabled = deployment?.b2b_settings?.enforce_mfa_per_workspace_enabled;
    const ipEnabled = deployment?.b2b_settings?.ip_allowlist_per_workspace_enabled;

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-8u)",
                paddingBottom: "var(--size-20u)",
            }}
        >
            {/* Details */}
            <Section>
                <FormGroup>
                    <Label htmlFor="name">Workspace name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={autoSave}
                        placeholder="Workspace name"
                        required
                    />
                </FormGroup>
                <FormGroup>
                    <Label htmlFor="description">Description</Label>
                    <Input
                        id="description"
                        as="textarea"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        onBlur={autoSave}
                        placeholder="Optional description"
                        style={{
                            minHeight: "var(--size-40u)",
                            resize: "vertical",
                        }}
                    />
                </FormGroup>
            </Section>

            {/* Security */}
            {(mfaEnabled || ipEnabled) && (
                <Section>
                    <SectionLabel>Security</SectionLabel>
                    {mfaEnabled && (
                        <ItemRow style={{ padding: 0 }}>
                            <ItemContent>
                                <Label
                                    style={{
                                        fontSize: 13,
                                        fontWeight: 500,
                                        marginBottom: 4,
                                        display: "block",
                                    }}
                                >
                                    Multi-factor authentication
                                </Label>
                                <p
                                    style={{
                                        fontSize: 12,
                                        color: "var(--color-secondary-text)",
                                        margin: 0,
                                    }}
                                >
                                    Require all workspace members to set up MFA.
                                </p>
                            </ItemContent>
                            <ItemActions>
                                <Switch
                                    checked={security.mfa_required}
                                    onChange={() => {
                                        setSecurity((p) => ({
                                            ...p,
                                            mfa_required: !p.mfa_required,
                                        }));
                                        setTimeout(autoSave, 0);
                                    }}
                                />
                            </ItemActions>
                        </ItemRow>
                    )}
                    {ipEnabled && (
                        <>
                            <ItemRow style={{ padding: 0 }}>
                                <ItemContent>
                                    <Label
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 500,
                                            marginBottom: 4,
                                            display: "block",
                                        }}
                                    >
                                        IP restrictions
                                    </Label>
                                    <p
                                        style={{
                                            fontSize: 12,
                                            color: "var(--color-secondary-text)",
                                            margin: 0,
                                        }}
                                    >
                                        Only allow access from specific IP addresses.
                                    </p>
                                </ItemContent>
                                <ItemActions>
                                    <Switch
                                        checked={security.ip_restrictions}
                                        onChange={() => {
                                            setSecurity((p) => ({
                                                ...p,
                                                ip_restrictions: !p.ip_restrictions,
                                            }));
                                            setTimeout(autoSave, 0);
                                        }}
                                    />
                                </ItemActions>
                            </ItemRow>
                            {security.ip_restrictions && (
                                <FormGroup>
                                    <Label htmlFor="allowed_ips">
                                        Allowed IP addresses
                                    </Label>
                                    <Input
                                        id="allowed_ips"
                                        as="textarea"
                                        value={security.allowed_ips}
                                        onChange={(e) =>
                                            setSecurity((p) => ({
                                                ...p,
                                                allowed_ips: e.target.value,
                                            }))
                                        }
                                        onBlur={autoSave}
                                        placeholder="192.168.1.1&#10;10.0.0.0/24"
                                        style={{
                                            minHeight: "var(--size-40u)",
                                            fontFamily: "monospace",
                                        }}
                                    />
                                </FormGroup>
                            )}
                        </>
                    )}
                </Section>
            )}

            {/* Danger zone */}
            <Section>
                <SectionLabel>Danger zone</SectionLabel>
                <DangerCard>
                    <DangerRow>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <DangerTitle>Delete workspace</DangerTitle>
                            <DangerSub>
                                Once you delete this workspace, there is no going back.
                            </DangerSub>
                        </div>
                        <Button
                            $size="sm"
                            $outline
                            $destructive
                            onClick={() => {
                                setShowDeleteConfirm(!showDeleteConfirm);
                                setConfirmName("");
                            }}
                        >
                            {showDeleteConfirm ? "Cancel" : "Delete workspace"}
                        </Button>
                    </DangerRow>

                    {showDeleteConfirm && (
                        <div
                            style={{
                                marginTop: 14,
                                display: "flex",
                                flexDirection: "column",
                                gap: 10,
                            }}
                        >
                            <FormGroup>
                                <Label htmlFor="confirm_workspace_name">
                                    Type <strong>{activeWorkspace.name}</strong> to confirm
                                </Label>
                                <Input
                                    id="confirm_workspace_name"
                                    type="text"
                                    value={confirmName}
                                    onChange={(e) => setConfirmName(e.target.value)}
                                    placeholder={activeWorkspace.name}
                                />
                            </FormGroup>
                            <Button
                                $size="sm"
                                $destructive
                                onClick={handleDeleteWorkspace}
                                disabled={
                                    confirmName !== activeWorkspace.name || isDeleting
                                }
                            >
                                {isDeleting ? <Spinner size={12} /> : "Delete forever"}
                            </Button>
                        </div>
                    )}
                </DangerCard>
            </Section>
        </div>
    );
};

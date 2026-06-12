import { useState, useEffect } from "react";
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
        <div className="w-flex-col w-gap-4">
            {/* Details */}
            <div className="w-flex-col w-gap-3">
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
                        className="w-input--area"
                    />
                </FormGroup>
            </div>

            {/* Security */}
            {(mfaEnabled || ipEnabled) && (
                <div className="w-flex-col w-gap-3">
                    <SectionLabel>Security</SectionLabel>
                    {mfaEnabled && (
                        <ItemRow>
                            <ItemContent>
                                <div className="w-sec">
                                    Multi-factor authentication
                                </div>
                                <p className="w-secsub">
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
                            <ItemRow>
                                <ItemContent>
                                    <div className="w-sec">IP restrictions</div>
                                    <p className="w-secsub">
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
                                        className="w-input--area w-mono-sm"
                                    />
                                </FormGroup>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Danger zone */}
            <div className="w-flex-col w-gap-3">
                <SectionLabel>Danger zone</SectionLabel>
                <div className="w-danger">
                    <div className="w-grow">
                        <div className="w-sec">Delete workspace</div>
                        <div className="w-secsub">
                            Once you delete this workspace, there is no going back.
                        </div>
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
                </div>

                {showDeleteConfirm && (
                    <div className="w-flex-col w-gap-3">
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
            </div>
        </div>
    );
};

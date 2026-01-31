import { useState, useMemo, useEffect, useRef, useCallback, ChangeEvent } from "react";
import { Building, Trash2 } from "lucide-react";
import { Organization } from "@/types";
import { useSession } from "@/hooks/use-session";
import { useWorkspaceList } from "@/hooks/use-workspace";
import { useDeployment } from "@/hooks/use-deployment";
import { useOrganizationList } from "@/hooks/use-organization";
import { useScreenContext } from "../context";
import {
    Button,
    Input,
    Spinner,
    Switch,
    ComboBox,
    FormGroup,
    Label,
} from "@/components/utility";
import {
    SectionLayout,
    ImageContainer,
    ItemRow,
    ItemContent,
    ItemActions,
    ButtonActions,
} from "./shared";

export const GeneralSettingsSection = ({
    organization: selectedOrganization,
}: {
    organization: Organization;
}) => {
    const { switchOrganization, refetch } = useSession();
    const { workspaces: workspaceList } = useWorkspaceList();
    const { deployment } = useDeployment();
    const { deleteOrganization: deleteOrgFromList, updateOrganization } =
        useOrganizationList();
    const { toast } = useScreenContext();
    const [name, setName] = useState(selectedOrganization?.name || "");
    const [description, setDescription] = useState(
        selectedOrganization?.description || "",
    );

    const [previewUrl, setPreviewUrl] = useState<string | null>(
        selectedOrganization?.image_url || null,
    );

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [security, setSecurity] = useState({
        mfa_required: false,
        ip_restrictions: false,
        allowed_ips: "",
        default_workspace_id: "",
    });
    const [confirmName, setConfirmName] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);

    // Latest state ref to avoid closure issues in autoSave and concurrent updates
    const latestState = useRef({ name, description, security, imageFile, isSaving });
    useEffect(() => {
        latestState.current = { name, description, security, imageFile, isSaving };
    }, [name, description, security, imageFile, isSaving]);

    const autoSave = useCallback(async () => {
        if (!selectedOrganization || latestState.current.isSaving) return;
        const state = latestState.current;

        try {
            setIsSaving(true);
            await updateOrganization(selectedOrganization, {
                name: state.name,
                description: state.description,
                image: state.imageFile as any,
                whitelisted_ips: state.security.allowed_ips.split("\n").filter(ip => ip.trim()),
                enable_ip_restriction: state.security.ip_restrictions,
                enforce_mfa: state.security.mfa_required,
                auto_assigned_workspace_id: state.security.default_workspace_id || "0",
            });
            toast("Changes saved", "info");
        } catch (error: any) {
            const errorMessage =
                error.message || "Failed to save changes. Please try again.";
            toast(errorMessage, "error");
        } finally {
            setIsSaving(false);
        }
    }, [selectedOrganization, updateOrganization, toast]);

    useEffect(() => {
        if (selectedOrganization) {
            setName(selectedOrganization.name || "");
            setDescription(selectedOrganization.description || "");
            setPreviewUrl(selectedOrganization.image_url || null);
            setSecurity({
                allowed_ips: selectedOrganization.whitelisted_ips?.join("\n") || "",
                ip_restrictions: selectedOrganization.enable_ip_restriction || false,
                mfa_required: selectedOrganization.enforce_mfa || false,
                default_workspace_id:
                    selectedOrganization.auto_assigned_workspace_id || "",
            });
        }
    }, [selectedOrganization]);

    const workspaces = useMemo(() => {
        const currentOrgWorkspaces = workspaceList.filter(
            (workspace) => workspace.organization.id === selectedOrganization?.id,
        );
        return currentOrgWorkspaces;
    }, [workspaceList, selectedOrganization?.id]);

    const handleDeleteOrganization = async () => {
        if (!selectedOrganization || confirmName !== selectedOrganization.name)
            return;

        try {
            setIsDeleting(true);
            await switchOrganization("");
            await deleteOrgFromList(selectedOrganization);
            await refetch();
            toast("Organization deleted successfully", "info");
        } catch (error) {
            toast("Failed to delete organization", "error");
        } finally {
            setIsDeleting(false);
            setConfirmName("");
        }
    };

    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.[0]) {
            const file = event.target.files[0];

            if (file.size > 2 * 1024 * 1024) {
                toast("File size cannot exceed 2MB", "error");
                return;
            }

            if (!file.type.startsWith("image/")) {
                toast("Please select a valid image file", "error");
                return;
            }

            if (previewUrl && previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(previewUrl);
            }

            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));

            // Immediate save for image
            try {
                setIsSaving(true);
                const state = latestState.current;
                await updateOrganization(selectedOrganization, {
                    name: state.name,
                    description: state.description,
                    image: file as any,
                    whitelisted_ips: state.security.allowed_ips.split("\n").filter(ip => ip.trim()),
                    enable_ip_restriction: state.security.ip_restrictions,
                    enforce_mfa: state.security.mfa_required,
                    auto_assigned_workspace_id: state.security.default_workspace_id || "0",
                });
                toast("Logo updated", "info");
            } catch (error: any) {
                toast(error.message || "Failed to update logo", "error");
            } finally {
                setIsSaving(false);
            }
        }
    };

    if (!selectedOrganization) return <Spinner />;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2xl)", paddingBottom: "40px" }}>
            <SectionLayout>
                <ImageContainer>
                    <div
                        style={{
                            width: "90px",
                            height: "90px",
                            borderRadius: "50%",
                            border: "2px dashed var(--color-border)",
                            background: previewUrl ? "transparent" : "var(--color-input-background)",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden",
                            transition: "all 0.2s ease",
                            boxShadow: "0 2px 8px var(--color-shadow)",
                        }}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {previewUrl ? (
                            <img
                                src={previewUrl}
                                alt="Logo"
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        ) : (
                            <Building size={32} color="var(--color-muted)" />
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: "none" }}
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                    </div>
                </ImageContainer>

                <div style={{ flex: 1 }}>
                    <div style={{ marginBottom: "var(--space-lg)" }}>
                        <h3 style={{ fontSize: "var(--font-sm)", color: "var(--color-foreground)", margin: "0 0 4px 0", fontWeight: "400" }}>
                            Organization Logo
                        </h3>
                        <p style={{ fontSize: "var(--font-xs)", color: "var(--color-secondary-text)", margin: 0 }}>
                            Upload an image to represent your organization
                        </p>
                    </div>

                    <ButtonActions style={{ marginBottom: "var(--space-sm)" }}>
                        <Button $size="sm" onClick={() => fileInputRef.current?.click()}>
                            {previewUrl ? "Change" : "Upload"}
                        </Button>
                        {previewUrl && (
                            <Button
                                $outline
                                $size="sm"
                                onClick={async () => {
                                    setPreviewUrl(null);
                                    setImageFile(null);
                                    try {
                                        setIsSaving(true);
                                        const state = latestState.current;
                                        await updateOrganization(selectedOrganization, {
                                            name: state.name,
                                            description: state.description,
                                            image: "null" as any, // Explicitly Remove
                                            whitelisted_ips: state.security.allowed_ips.split("\n").filter(ip => ip.trim()),
                                            enable_ip_restriction: state.security.ip_restrictions,
                                            enforce_mfa: state.security.mfa_required,
                                            auto_assigned_workspace_id: state.security.default_workspace_id || "0",
                                        });
                                        toast("Logo removed", "info");
                                    } catch (error: any) {
                                        toast(error.message || "Failed to remove logo", "error");
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }}
                            >
                                <Trash2 size={14} style={{ marginRight: "4px" }} /> Remove
                            </Button>
                        )}
                    </ButtonActions>
                </div>
            </SectionLayout>

            <div style={{ height: "1px", background: "var(--color-divider)" }} />

            <div>
                <div style={{ marginBottom: "var(--space-md)", textAlign: "inherit" }}>
                    <h3 style={{ fontSize: "var(--font-sm)", color: "var(--color-foreground)", margin: "0 0 4px 0" }}>
                        Organization Details
                    </h3>
                    <p style={{ fontSize: "var(--font-xs)", color: "var(--color-secondary-text)", margin: 0 }}>
                        Basic information about your organization
                    </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    <FormGroup>
                        <Label htmlFor="name">Organization Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={autoSave}
                            placeholder="Enter organization name"
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
                            placeholder="Enter organization description"
                            style={{ minHeight: "80px", resize: "vertical" }}
                        />
                    </FormGroup>

                    {deployment?.b2b_settings?.enforce_mfa_per_org_enabled && (
                        <ItemRow style={{ padding: "0" }}>
                            <ItemContent>
                                <Label style={{ fontSize: "13px", fontWeight: "400", marginBottom: "4px", display: "block" }}>
                                    Multi-Factor Authentication
                                </Label>
                                <p style={{ fontSize: "12px", color: "var(--color-muted)", margin: 0 }}>
                                    Require all members to set up MFA for added security
                                </p>
                            </ItemContent>
                            <ItemActions>
                                <Switch
                                    checked={security.mfa_required}
                                    onChange={() => {
                                        const next = !security.mfa_required;
                                        setSecurity(prev => ({ ...prev, mfa_required: next }));
                                        setTimeout(() => autoSave(), 0);
                                    }}
                                />
                            </ItemActions>
                        </ItemRow>
                    )}

                    {deployment?.b2b_settings?.ip_allowlist_per_org_enabled && (
                        <>
                            <ItemRow style={{ padding: "0" }}>
                                <ItemContent>
                                    <Label style={{ fontSize: "13px", fontWeight: "400", marginBottom: "4px", display: "block" }}>
                                        IP Restrictions
                                    </Label>
                                    <p style={{ fontSize: "12px", color: "var(--color-muted)", margin: 0 }}>
                                        Only allow access from specific IP addresses
                                    </p>
                                </ItemContent>
                                <ItemActions>
                                    <Switch
                                        checked={security.ip_restrictions}
                                        onChange={() => {
                                            const next = !security.ip_restrictions;
                                            setSecurity(prev => ({ ...prev, ip_restrictions: next }));
                                            setTimeout(() => autoSave(), 0);
                                        }}
                                    />
                                </ItemActions>
                            </ItemRow>

                            {security.ip_restrictions && (
                                <FormGroup>
                                    <Label htmlFor="allowed_ips">Allowed IP Addresses</Label>
                                    <Input
                                        id="allowed_ips"
                                        as="textarea"
                                        value={security.allowed_ips}
                                        onChange={(e) => setSecurity(prev => ({ ...prev, allowed_ips: e.target.value }))}
                                        onBlur={autoSave}
                                        placeholder="192.168.1.1&#10;10.0.0.0/24"
                                        style={{ minHeight: "80px", fontFamily: "monospace" }}
                                    />
                                </FormGroup>
                            )}
                        </>
                    )}

                    {deployment?.b2b_settings?.workspaces_enabled && workspaces.length > 0 && (
                        <FormGroup>
                            <Label htmlFor="default_workspace">Default Workspace</Label>
                            <ComboBox
                                options={workspaces.map(w => ({ value: w.id, label: w.name }))}
                                value={security.default_workspace_id}
                                onChange={(val) => {
                                    setSecurity(prev => ({ ...prev, default_workspace_id: val }));
                                    setTimeout(() => autoSave(), 0);
                                }}
                                placeholder="Select default workspace"
                            />
                        </FormGroup>
                    )}
                </div>
            </div>

            {
                deployment?.b2b_settings?.allow_org_deletion && (
                    <>
                        <div style={{ height: "1px", background: "var(--color-divider)" }} />

                        <div>
                            <div style={{ marginBottom: "16px" }}>
                                <h3 style={{ fontSize: "16px", color: "var(--color-foreground)", margin: "0 0 4px 0" }}>
                                    Danger Zone
                                </h3>
                                <p style={{ fontSize: "14px", color: "var(--color-muted)", margin: 0 }}>
                                    Irreversible and destructive actions
                                </p>
                            </div>

                            <div style={{
                                padding: "20px",
                                border: "1px solid var(--color-error)",
                                borderRadius: "8px",
                            }}>
                                <div style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: showDeleteConfirm ? "20px" : "0",
                                }}>
                                    <div>
                                        <div style={{
                                            fontSize: "14px",
                                            color: "var(--color-foreground)",
                                            marginBottom: "4px",
                                            fontWeight: "500",
                                        }}>
                                            Delete Organization
                                        </div>
                                        <div style={{
                                            fontSize: "13px",
                                            color: "var(--color-muted)",
                                        }}>
                                            Once you delete an organization, there is no going back. Please be certain.
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            if (!showDeleteConfirm) {
                                                setShowDeleteConfirm(true);
                                            } else {
                                                setShowDeleteConfirm(false);
                                                setConfirmName("");
                                            }
                                        }}
                                        style={{
                                            background: "var(--color-error)",
                                            color: "white",
                                            border: "none",
                                            padding: "6px 12px",
                                            fontSize: "13px",
                                            height: "32px",
                                            width: "auto",
                                        }}
                                    >
                                        {showDeleteConfirm ? "Cancel" : "Delete"}
                                    </Button>
                                </div>

                                {showDeleteConfirm && (
                                    <div style={{ width: "100%", marginTop: "16px" }}>
                                        <FormGroup>
                                            <Label htmlFor="confirm_org_name">
                                                Type <strong>{selectedOrganization.name}</strong> to confirm
                                            </Label>
                                            <Input
                                                id="confirm_org_name"
                                                type="text"
                                                value={confirmName}
                                                onChange={(e) => setConfirmName(e.target.value)}
                                                placeholder="Organization name"
                                                style={{ width: "100%" }}
                                            />
                                        </FormGroup>

                                        <Button
                                            onClick={handleDeleteOrganization}
                                            disabled={confirmName !== selectedOrganization.name || isDeleting}
                                            style={{
                                                background: confirmName === selectedOrganization.name
                                                    ? "var(--color-error)"
                                                    : "transparent",
                                                color: confirmName === selectedOrganization.name
                                                    ? "white"
                                                    : "var(--color-muted)",
                                                border: "1px solid var(--color-border)",
                                                padding: "8px 16px",
                                                fontSize: "14px",
                                                height: "36px",
                                                cursor: confirmName === selectedOrganization.name
                                                    ? "pointer"
                                                    : "not-allowed",
                                                width: "100%",
                                            }}
                                        >
                                            {isDeleting ? <Spinner size={12} /> : "Delete Forever"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )
            }
        </div >
    );
};

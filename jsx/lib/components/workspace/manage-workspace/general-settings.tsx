import { useState, useRef, useEffect, ChangeEvent } from "react";
import { Building, Trash2 } from "lucide-react";
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
import {
    SectionLayout,
    ImageContainer,
    ItemRow,
    ItemContent,
    ItemActions,
    ButtonActions,
} from "./shared";

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
    const [previewUrl, setPreviewUrl] = useState<string | null>(activeWorkspace?.image_url || null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [confirmName, setConfirmName] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (activeWorkspace) {
            setName(activeWorkspace.name || "");
            setDescription(activeWorkspace.description || "");
            setPreviewUrl(activeWorkspace.image_url || null);
            setSecurity({
                mfa_required: (activeWorkspace as any).enforce_2fa || false,
                ip_restrictions: (activeWorkspace as any).enable_ip_restriction || false,
                allowed_ips: (activeWorkspace as any).whitelisted_ips?.join("\n") || "",
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
                image: imageFile as any,
                enforce_2fa: security.mfa_required,
                enable_ip_restriction: security.ip_restrictions,
                whitelisted_ips: security.allowed_ips.split("\n").filter(ip => ip.trim()),
            });
            toast("Changes saved", "info");
        } catch (error: any) {
            toast(error.message || "Failed to save changes", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files?.[0]) {
            const file = event.target.files[0];
            if (file.size > 2 * 1024 * 1024) {
                toast("File size cannot exceed 2MB", "error");
                return;
            }
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));

            // Immediate save for image
            try {
                setIsSaving(true);
                await updateWorkspace({
                    name,
                    description,
                    image: file as any,
                    enforce_2fa: security.mfa_required,
                    enable_ip_restriction: security.ip_restrictions,
                    whitelisted_ips: security.allowed_ips.split("\n").filter(ip => ip.trim()),
                });
                toast("Logo updated", "info");
            } catch (error: any) {
                toast(error.message || "Failed to update logo", "error");
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleDeleteWorkspace = async () => {
        if (!activeWorkspace || confirmName !== activeWorkspace.name) return;
        try {
            setIsDeleting(true);
            await deleteWorkspace(activeWorkspace);
            toast("Workspace deleted", "info");
        } catch (error) {
            toast("Failed to delete workspace", "error");
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading && !activeWorkspace) return <Spinner />;
    if (!activeWorkspace) return <div style={{ padding: "24px", color: "var(--color-muted)" }}>Workspace not found</div>;

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
                            <img src={previewUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        ) : (
                            <Building size={32} color="var(--color-muted)" />
                        )}
                        <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" onChange={handleImageChange} />
                    </div>
                </ImageContainer>

                <div style={{ flex: 1, textAlign: "inherit" }}>
                    <div style={{ marginBottom: "var(--space-lg)" }}>
                        <h3 style={{ fontSize: "var(--font-sm)", color: "var(--color-foreground)", margin: "0 0 4px 0" }}>Workspace Logo</h3>
                        <p style={{ fontSize: "var(--font-xs)", color: "var(--color-secondary-text)", margin: 0 }}>Customise your workspace identity</p>
                    </div>
                    <ButtonActions style={{ marginBottom: "var(--space-sm)" }}>
                        <Button $size="sm" onClick={() => fileInputRef.current?.click()}>
                            {previewUrl ? "Change" : "Upload"}
                        </Button>
                        {previewUrl && (
                            <Button $outline $size="sm" onClick={async () => {
                                setPreviewUrl(null);
                                setImageFile(null);
                                try {
                                    setIsSaving(true);
                                    await updateWorkspace({
                                        name,
                                        description,
                                        image: "null" as any, // Explicitly Remove
                                        enforce_2fa: security.mfa_required,
                                        enable_ip_restriction: security.ip_restrictions,
                                        whitelisted_ips: security.allowed_ips.split("\n").filter(ip => ip.trim()),
                                    });
                                    toast("Logo removed", "info");
                                } catch (error: any) {
                                    toast(error.message || "Failed to remove logo", "error");
                                } finally {
                                    setIsSaving(false);
                                }
                            }}>
                                <Trash2 size={14} style={{ marginRight: "4px" }} /> Remove
                            </Button>
                        )}
                    </ButtonActions>
                </div>
            </SectionLayout>

            <div style={{ height: "1px", background: "var(--color-divider)" }} />

            <div>
                <div style={{ marginBottom: "var(--space-md)" }}>
                    <h3 style={{ fontSize: "var(--font-sm)", color: "var(--color-foreground)", margin: "0 0 4px 0" }}>Workspace Details</h3>
                    <p style={{ fontSize: "var(--font-xs)", color: "var(--color-secondary-text)", margin: 0 }}>Basic settings for this workspace</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-lg)" }}>
                    <FormGroup>
                        <Label htmlFor="name">Workspace Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} onBlur={autoSave} placeholder="Enter workspace name" required />
                    </FormGroup>

                    <FormGroup>
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" as="textarea" value={description} onChange={(e) => setDescription(e.target.value)} onBlur={autoSave} placeholder="Enter workspace description" style={{ minHeight: "80px", resize: "vertical" }} />
                    </FormGroup>

                    {deployment?.b2b_settings?.enforce_mfa_per_workspace_enabled && (
                        <ItemRow>
                            <ItemContent>
                                <Label style={{ fontSize: "13px", fontWeight: "400", marginBottom: "4px", display: "block" }}>Multi-Factor Authentication</Label>
                                <p style={{ fontSize: "12px", color: "var(--color-muted)", margin: 0 }}>Require MFA for all workspace members</p>
                            </ItemContent>
                            <ItemActions>
                                <Switch checked={security.mfa_required} onChange={() => { setSecurity(p => ({ ...p, mfa_required: !p.mfa_required })); setTimeout(() => autoSave(), 0); }} />
                            </ItemActions>
                        </ItemRow>
                    )}

                    {deployment?.b2b_settings?.ip_allowlist_per_workspace_enabled && (
                        <>
                            <ItemRow>
                                <ItemContent>
                                    <Label style={{ fontSize: "13px", fontWeight: "400", marginBottom: "4px", display: "block" }}>IP Restrictions</Label>
                                    <p style={{ fontSize: "12px", color: "var(--color-muted)", margin: 0 }}>Limit workspace access to trusted IP addresses</p>
                                </ItemContent>
                                <ItemActions>
                                    <Switch checked={security.ip_restrictions} onChange={() => { setSecurity(p => ({ ...p, ip_restrictions: !p.ip_restrictions })); setTimeout(() => autoSave(), 0); }} />
                                </ItemActions>
                            </ItemRow>

                            {security.ip_restrictions && (
                                <FormGroup>
                                    <Label htmlFor="allowed_ips">Allowed IP Addresses</Label>
                                    <Input id="allowed_ips" as="textarea" value={security.allowed_ips} onChange={(e) => setSecurity(p => ({ ...p, allowed_ips: e.target.value }))} onBlur={autoSave} placeholder="One IP per line..." style={{ minHeight: "80px", fontFamily: "monospace" }} />
                                </FormGroup>
                            )}
                        </>
                    )}
                </div>
            </div>

            <div style={{ height: "1px", background: "var(--color-divider)" }} />

            <div style={{
                padding: "24px",
                border: "1px solid var(--color-error)",
                borderRadius: "16px",
                background: "transparent",
                textAlign: "inherit",
            }}>
                <h3 style={{ color: "var(--color-error)", fontSize: "15px", fontWeight: "400", margin: "0 0 4px 0" }}>Danger Zone</h3>
                <p style={{ color: "var(--color-secondary-text)", fontSize: "13px", margin: "0 0 20px 0" }}>Destructive actions for this workspace</p>

                {!showDeleteConfirm ? (
                    <Button $destructive $size="sm" onClick={() => setShowDeleteConfirm(true)}>Delete Workspace</Button>
                ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <Label>Type <strong>{activeWorkspace.name}</strong> to confirm</Label>
                        <Input value={confirmName} onChange={(e) => setConfirmName(e.target.value)} placeholder="Workspace name" />
                        <div style={{ display: "flex", gap: "12px" }}>
                            <Button $destructive $size="sm" onClick={handleDeleteWorkspace} disabled={confirmName !== activeWorkspace.name || isDeleting} style={{ flex: 1 }}>
                                {isDeleting ? <Spinner size={12} /> : "Delete Workspace"}
                            </Button>
                            <Button $outline $size="sm" onClick={() => { setShowDeleteConfirm(false); setConfirmName(""); }} style={{ flex: 1 }}>Cancel</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

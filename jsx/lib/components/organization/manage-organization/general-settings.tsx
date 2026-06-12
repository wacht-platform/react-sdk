import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
import { ItemRow, ItemContent, ItemActions, SectionLabel } from "./shared";

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

    const latestState = useRef({ name, description, security, isSaving });
    useEffect(() => {
        latestState.current = { name, description, security, isSaving };
    }, [name, description, security, isSaving]);

    const saveAll = useCallback(async () => {
        if (!selectedOrganization) return;
        const state = latestState.current;
        try {
            setIsSaving(true);
            await updateOrganization(selectedOrganization, {
                name: state.name,
                description: state.description,
                whitelisted_ips: state.security.allowed_ips
                    .split("\n")
                    .filter((ip) => ip.trim()),
                enable_ip_restriction: state.security.ip_restrictions,
                enforce_mfa: state.security.mfa_required,
                auto_assigned_workspace_id:
                    state.security.default_workspace_id || "0",
            });
            toast("Changes saved", "info");
        } catch (error: any) {
            toast(error.message || "Failed to save changes", "error");
        } finally {
            setIsSaving(false);
        }
    }, [selectedOrganization, updateOrganization, toast]);

    const autoSave = useCallback(() => {
        if (latestState.current.isSaving) return;
        saveAll();
    }, [saveAll]);

    useEffect(() => {
        if (selectedOrganization) {
            setName(selectedOrganization.name || "");
            setDescription(selectedOrganization.description || "");
            setSecurity({
                allowed_ips:
                    selectedOrganization.whitelisted_ips?.join("\n") || "",
                ip_restrictions:
                    selectedOrganization.enable_ip_restriction || false,
                mfa_required: selectedOrganization.enforce_mfa || false,
                default_workspace_id:
                    selectedOrganization.auto_assigned_workspace_id || "",
            });
        }
    }, [selectedOrganization]);

    const workspaces = useMemo(() => {
        return workspaceList.filter(
            (w) => w.organization.id === selectedOrganization?.id,
        );
    }, [workspaceList, selectedOrganization?.id]);

    const handleDeleteOrganization = async () => {
        if (!selectedOrganization || confirmName !== selectedOrganization.name)
            return;
        try {
            setIsDeleting(true);
            await switchOrganization("");
            await deleteOrgFromList(selectedOrganization);
            await refetch();
            toast("Organization deleted", "info");
        } catch {
            toast("Failed to delete organization", "error");
        } finally {
            setIsDeleting(false);
            setConfirmName("");
        }
    };

    if (!selectedOrganization) return <Spinner />;

    return (
        <div className="w-flex-col w-gap-4">
            {/* Details */}
            <div className="w-flex-col w-gap-3">
                <FormGroup>
                    <Label htmlFor="name">Organization name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={autoSave}
                        placeholder="Organization name"
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
                {deployment?.b2b_settings?.workspaces_enabled &&
                    workspaces.length > 0 && (
                        <FormGroup>
                            <Label htmlFor="default_workspace">
                                Default workspace
                            </Label>
                            <ComboBox
                                options={workspaces.map((w) => ({
                                    value: w.id,
                                    label: w.name,
                                }))}
                                value={security.default_workspace_id}
                                onChange={(val) => {
                                    setSecurity((prev) => ({
                                        ...prev,
                                        default_workspace_id: val,
                                    }));
                                    setTimeout(autoSave, 0);
                                }}
                                placeholder="Select default workspace"
                            />
                        </FormGroup>
                    )}
            </div>

            {/* Security */}
            {(deployment?.b2b_settings?.enforce_mfa_per_org_enabled ||
                deployment?.b2b_settings?.ip_allowlist_per_org_enabled) && (
                <div className="w-flex-col w-gap-3">
                    <SectionLabel>Security</SectionLabel>
                    {deployment?.b2b_settings?.enforce_mfa_per_org_enabled && (
                        <ItemRow>
                            <ItemContent className="w-flex-col w-gap-1">
                                <div className="w-sec">
                                    Multi-factor authentication
                                </div>
                                <p className="w-secsub">
                                    Require all members to set up MFA for added
                                    security.
                                </p>
                            </ItemContent>
                            <ItemActions>
                                <Switch
                                    checked={security.mfa_required}
                                    onChange={() => {
                                        const next = !security.mfa_required;
                                        setSecurity((prev) => ({
                                            ...prev,
                                            mfa_required: next,
                                        }));
                                        setTimeout(autoSave, 0);
                                    }}
                                />
                            </ItemActions>
                        </ItemRow>
                    )}
                    {deployment?.b2b_settings?.ip_allowlist_per_org_enabled && (
                        <>
                            <ItemRow>
                                <ItemContent className="w-flex-col w-gap-1">
                                    <div className="w-sec">
                                        IP restrictions
                                    </div>
                                    <p className="w-secsub">
                                        Only allow access from specific IP
                                        addresses.
                                    </p>
                                </ItemContent>
                                <ItemActions>
                                    <Switch
                                        checked={security.ip_restrictions}
                                        onChange={() => {
                                            const next =
                                                !security.ip_restrictions;
                                            setSecurity((prev) => ({
                                                ...prev,
                                                ip_restrictions: next,
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
                                            setSecurity((prev) => ({
                                                ...prev,
                                                allowed_ips: e.target.value,
                                            }))
                                        }
                                        onBlur={autoSave}
                                        placeholder="192.168.1.1&#10;10.0.0.0/24"
                                        className="w-input--area w-input--mono"
                                    />
                                </FormGroup>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Danger zone */}
            {deployment?.b2b_settings?.allow_org_deletion && (
                <div className="w-flex-col w-gap-3">
                    <SectionLabel>Danger zone</SectionLabel>
                    <div className="w-danger w-flex-col w-items-start w-gap-3">
                        <div className="w-flex w-items-center w-justify-between w-gap-2 w-full">
                            <div className="w-grow w-flex-col w-gap-1">
                                <div className="w-sec">Delete organization</div>
                                <div className="w-secsub">
                                    Once you delete this organization, there is
                                    no going back.
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
                                {showDeleteConfirm
                                    ? "Cancel"
                                    : "Delete organization"}
                            </Button>
                        </div>

                        {showDeleteConfirm && (
                            <div className="w-flex-col w-gap-3 w-full">
                                <FormGroup>
                                    <Label htmlFor="confirm_org_name">
                                        Type{" "}
                                        <strong>
                                            {selectedOrganization.name}
                                        </strong>{" "}
                                        to confirm
                                    </Label>
                                    <Input
                                        id="confirm_org_name"
                                        type="text"
                                        value={confirmName}
                                        onChange={(e) =>
                                            setConfirmName(e.target.value)
                                        }
                                        placeholder={selectedOrganization.name}
                                    />
                                </FormGroup>
                                <Button
                                    $size="sm"
                                    $destructive
                                    onClick={handleDeleteOrganization}
                                    disabled={
                                        confirmName !==
                                            selectedOrganization.name ||
                                        isDeleting
                                    }
                                >
                                    {isDeleting ? (
                                        <Spinner size={12} />
                                    ) : (
                                        "Delete forever"
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

import { useEffect, useRef, useState } from "react";
import {
    Buildings,
    FolderSimple,
    Camera,
    Check,
    CaretRight,
    CaretDown,
    Plus,
    X,
    ArrowCounterClockwise,
} from "@phosphor-icons/react";
import {
    useOrganizationList,
    useOrganizationMemberships,
} from "@/hooks/use-organization";
import { useWorkspaceList } from "@/hooks/use-workspace";
import { useSession } from "@/hooks/use-session";
import { Input } from "../utility/input";
import { Spinner } from "../utility";

type Mode = "org" | "ws";

interface RoleLike {
    id: string;
    name: string;
}

interface PendingInvite {
    email: string;
    roleId: string;
    roleName: string;
}

export interface CreateFlowProps {
    mode: Mode;
    organizationId?: string;
    onSuccess?: (entity?: any) => void;
    onCancel?: () => void;
    onCreateOrganization?: () => void;
}

const getInitials = (text: string) =>
    text
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?";

const sanitize = (text: string) => text.trim().replace(/[<>"'&]/g, "");
const validName = (name: string) =>
    name.length >= 2 && name.length <= 100 && /^[a-zA-Z0-9\s_.-]+$/.test(name);
const validEmail = (email: string) => /.+@.+\..+/.test(email);

const pickDefault = (roles: RoleLike[], preferred: string): RoleLike | null => {
    if (!roles.length) return null;
    return roles.find((r) => r.name === preferred) || roles[0];
};

/* small anchored role dropdown built on the .w-combo primitive */
const RoleSelect = ({
    roles,
    value,
    onChange,
    fullWidth,
}: {
    roles: RoleLike[];
    value: RoleLike | null;
    onChange: (r: RoleLike) => void;
    fullWidth?: boolean;
}) => {
    const [open, setOpen] = useState(false);
    const wrap = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!open) return;
        const h = (e: MouseEvent) => {
            if (wrap.current && !wrap.current.contains(e.target as Node))
                setOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [open]);

    return (
        <div ref={wrap} className={`w-relative${fullWidth ? " w-full" : " w-none"}`}>
            <button
                type="button"
                className={`w-combo${fullWidth ? " w-full" : " w-rolepick-btn"}`}
                data-open={open ? "" : undefined}
                onClick={() => setOpen((o) => !o)}
                disabled={!roles.length}
            >
                <span className="w-combo-val">{value?.name || "Role"}</span>
                <CaretDown size={14} />
            </button>
            {open && (
                <div className="w-combo-menu w-combo-menu--pop">
                    {roles.map((r) => (
                        <button
                            key={r.id}
                            type="button"
                            className="w-combo-opt"
                            onClick={() => {
                                onChange(r);
                                setOpen(false);
                            }}
                        >
                            {r.name}
                            {r.id === value?.id && (
                                <span className="w-combo-check">
                                    <Check size={13} />
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const CreateFlow = ({
    mode,
    organizationId,
    onSuccess,
    onCancel,
    onCreateOrganization,
}: CreateFlowProps) => {
    const isOrg = mode === "org";
    const noun = isOrg ? "organization" : "workspace";
    const Noun = isOrg ? "Organization" : "Workspace";

    const { createOrganization, getOrganizationRoles, inviteOrganizationMember } =
        useOrganizationList();
    const { createWorkspace, getWorkspaceRoles, createWorkspaceInvitation } =
        useWorkspaceList();
    const { organizationMemberships } = useOrganizationMemberships();
    const { refetch } = useSession();

    const [step, setStep] = useState<0 | 1 | 2>(0);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState<File>();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedOrgId, setSelectedOrgId] = useState(organizationId);
    const [orgOpen, setOrgOpen] = useState(false);
    const orgWrap = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [entity, setEntity] = useState<any>(null);
    const [roles, setRoles] = useState<RoleLike[]>([]);
    const [invites, setInvites] = useState<PendingInvite[]>([]);
    const [draft, setDraft] = useState("");
    const [role, setRole] = useState<RoleLike | null>(null);

    const selectedOrg = organizationMemberships?.find(
        (m) => m.organization.id === selectedOrgId,
    )?.organization;

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    useEffect(() => {
        if (!orgOpen) return;
        const h = (e: MouseEvent) => {
            if (orgWrap.current && !orgWrap.current.contains(e.target as Node))
                setOrgOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, [orgOpen]);

    const onPickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            setError("Image must be under 2 MB.");
            return;
        }
        if (!file.type.startsWith("image/")) {
            setError("Please choose a valid image file.");
            return;
        }
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setError(null);
        setImage(file);
        setPreviewUrl(URL.createObjectURL(file));
    };

    const handleCreate = async () => {
        const cleanName = sanitize(name);
        const cleanDesc = sanitize(description);
        if (!validName(cleanName)) {
            setError(`Enter a valid ${noun} name (2–100 characters).`);
            return;
        }
        if (!isOrg && !selectedOrgId) {
            setError("Select an organization first.");
            return;
        }
        setBusy(true);
        setError(null);
        try {
            if (isOrg) {
                const res: any = await createOrganization({
                    name: cleanName,
                    description: cleanDesc,
                    image,
                });
                const org = res?.data?.organization ?? res?.organization ?? res;
                setEntity(org);
                const r = await getOrganizationRoles(org).catch(
                    () => [] as RoleLike[],
                );
                setRoles(r as RoleLike[]);
                setRole(pickDefault(r as RoleLike[], "Member"));
            } else {
                const res: any = await createWorkspace(
                    selectedOrgId!,
                    cleanName,
                    image,
                    cleanDesc,
                );
                const ws = res?.workspace ?? res;
                const wsWithOrg = {
                    ...ws,
                    organization: { id: selectedOrgId },
                };
                setEntity(wsWithOrg);
                const r = await getWorkspaceRoles(ws).catch(
                    () => [] as RoleLike[],
                );
                setRoles(r as RoleLike[]);
                setRole(pickDefault(r as RoleLike[], "Editor"));
            }
            await refetch();
            setStep(1);
        } catch (e: any) {
            setError(e?.message || `Failed to create ${noun}.`);
        } finally {
            setBusy(false);
        }
    };

    const addInvite = () => {
        const email = draft.trim();
        if (!validEmail(email) || invites.some((i) => i.email === email)) return;
        if (!role) return;
        setInvites((v) => [
            ...v,
            { email, roleId: role.id, roleName: role.name },
        ]);
        setDraft("");
    };

    const onDraftKey = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addInvite();
        }
    };

    const handleFinish = async () => {
        if (!invites.length) {
            setStep(2);
            return;
        }
        setBusy(true);
        setError(null);
        try {
            for (const inv of invites) {
                if (isOrg) {
                    await inviteOrganizationMember(entity, {
                        email: inv.email,
                        organizationRole: { id: inv.roleId } as any,
                    } as any);
                } else {
                    await createWorkspaceInvitation(
                        entity,
                        inv.email,
                        inv.roleId,
                    );
                }
            }
            setStep(2);
        } catch (e: any) {
            setError(e?.message || "Some invitations could not be sent.");
        } finally {
            setBusy(false);
        }
    };

    const reset = () => {
        setStep(0);
        setName("");
        setDescription("");
        setImage(undefined);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setEntity(null);
        setRoles([]);
        setInvites([]);
        setDraft("");
        setError(null);
    };

    return (
        <div className="w-card w-create-card">
            <div className="w-create-body">
                {/* header */}
                <div className="w-flex-col w-items-center w-gap-3 w-create-head">
                    {step === 0 ? (
                        <span className="w-ibadge-wrap">
                            <button
                                type="button"
                                className="w-ibadge w-avatar-edit"
                                data-busy={busy ? "" : undefined}
                                onClick={() => fileInputRef.current?.click()}
                                title={`Upload ${noun} logo`}
                                aria-label={`Upload ${noun} logo`}
                            >
                                {previewUrl ? (
                                    <img src={previewUrl} alt={`${Noun} logo`} />
                                ) : isOrg ? (
                                    <Buildings />
                                ) : (
                                    <FolderSimple />
                                )}
                                <span className="w-avatar-veil">
                                    <Camera />
                                </span>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="w-none"
                                hidden
                                accept="image/png, image/jpeg, image/gif, image/svg+xml"
                                onChange={onPickImage}
                                disabled={busy}
                            />
                            {previewUrl && (
                                <button
                                    type="button"
                                    className="w-ibadge-x"
                                    title="Remove logo"
                                    aria-label="Remove logo"
                                    onClick={() => {
                                        if (previewUrl)
                                            URL.revokeObjectURL(previewUrl);
                                        setPreviewUrl(null);
                                        setImage(undefined);
                                    }}
                                >
                                    <X />
                                </button>
                            )}
                        </span>
                    ) : (
                        <span
                            className={`w-ibadge${step === 2 ? " w-ibadge--done" : ""}`}
                        >
                            {step === 2 ? <Check /> : isOrg ? <Buildings /> : <FolderSimple />}
                        </span>
                    )}
                    <div className="w-flex-col w-gap-1 w-text-center">
                        <h1 className="w-title-lg">
                            {step === 0
                                ? `Create ${isOrg ? "an" : "a"} ${noun}`
                                : step === 1
                                  ? "Invite your team"
                                  : `${Noun} created`}
                        </h1>
                        <p className="w-sub">
                            {step === 0
                                ? `Set up a new ${noun}${isOrg ? " to collaborate with your team." : " inside your organization."}`
                                : step === 1
                                  ? "Add people now, or skip and do it later."
                                  : `${name} is ready to go.`}
                        </p>
                    </div>
                </div>

                {step < 2 && (
                    <div className="w-steps w-create-steps">
                        <i data-on="" />
                        <i data-on={step >= 1 ? "" : undefined} />
                    </div>
                )}

                {error && (
                    <div className="w-banner w-banner--error w-mb-4">
                        {error}
                    </div>
                )}

                {/* step 0 — details */}
                {step === 0 && (
                    <div className="w-flex-col w-gap-4">
                        {!isOrg && (
                            <label className="w-field">
                                <span className="w-label">Organization</span>
                                <div className="w-relative" ref={orgWrap}>
                                    <button
                                        type="button"
                                        className="w-combo w-full"
                                        data-open={orgOpen ? "" : undefined}
                                        onClick={() => setOrgOpen((o) => !o)}
                                        disabled={busy}
                                    >
                                        <span className="w-combo-val w-inline w-gap-2">
                                            <span className="w-avatar w-avatar--sm">
                                                {selectedOrg?.image_url ? (
                                                    <img
                                                        src={selectedOrg.image_url}
                                                        alt={selectedOrg.name}
                                                    />
                                                ) : (
                                                    getInitials(
                                                        selectedOrg?.name || "O",
                                                    ).charAt(0)
                                                )}
                                            </span>
                                            <span>
                                                {selectedOrg?.name ||
                                                    "Select organization"}
                                            </span>
                                        </span>
                                        <CaretDown size={14} />
                                    </button>
                                    {orgOpen && (
                                        <div className="w-combo-menu w-combo-menu--pop">
                                            {organizationMemberships?.map((m) => {
                                                const restricted =
                                                    !!m.eligibility_restriction
                                                        ?.type &&
                                                    m.eligibility_restriction
                                                        .type !== "none";
                                                return (
                                                    <button
                                                        type="button"
                                                        key={m.organization.id}
                                                        className="w-combo-opt"
                                                        disabled={restricted}
                                                        data-disabled={
                                                            restricted
                                                                ? ""
                                                                : undefined
                                                        }
                                                        onClick={() => {
                                                            if (restricted) return;
                                                            setSelectedOrgId(
                                                                m.organization.id,
                                                            );
                                                            setOrgOpen(false);
                                                        }}
                                                    >
                                                        <span className="w-avatar w-avatar--sm">
                                                            {m.organization
                                                                .image_url ? (
                                                                <img
                                                                    src={
                                                                        m
                                                                            .organization
                                                                            .image_url
                                                                    }
                                                                    alt={
                                                                        m
                                                                            .organization
                                                                            .name
                                                                    }
                                                                />
                                                            ) : (
                                                                getInitials(
                                                                    m.organization
                                                                        .name,
                                                                ).charAt(0)
                                                            )}
                                                        </span>
                                                        <span>
                                                            {m.organization.name}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                            {onCreateOrganization && (
                                                <button
                                                    type="button"
                                                    className="w-combo-opt w-text-primary"
                                                    onClick={() => {
                                                        setOrgOpen(false);
                                                        onCreateOrganization();
                                                    }}
                                                >
                                                    <Plus size={13} />
                                                    Create new organization
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </label>
                        )}

                        <label className="w-field">
                            <span className="w-label">{Noun} name</span>
                            <Input
                                autoFocus
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={isOrg ? "Acme Inc" : "Product"}
                                disabled={busy}
                            />
                        </label>

                        <label className="w-field">
                            <span className="w-label">
                                Description{" "}
                                <span className="w-secsub">· optional</span>
                            </span>
                            <Input
                                as="textarea"
                                className="w-input--area"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={
                                    isOrg
                                        ? "What does your team do?"
                                        : "What's this workspace for?"
                                }
                                disabled={busy}
                            />
                        </label>

                        <div className="w-flex-col w-gap-2">
                            <button
                                type="button"
                                className="w-btn w-btn--primary w-btn--block"
                                onClick={handleCreate}
                                disabled={busy || !name.trim()}
                            >
                                {busy ? (
                                    <Spinner size={15} />
                                ) : (
                                    <>
                                        Continue
                                        <CaretRight size={15} />
                                    </>
                                )}
                            </button>
                            {onCancel && (
                                <button
                                    type="button"
                                    className="w-btn w-btn--secondary w-btn--block"
                                    onClick={onCancel}
                                    disabled={busy}
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* step 1 — invite */}
                {step === 1 && (
                    <div className="w-flex-col w-gap-4">
                        <div className="w-field">
                            <span className="w-label">Invite by email</span>
                            <div className="w-flex w-gap-2">
                                <Input
                                    autoFocus
                                    className="w-grow"
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={onDraftKey}
                                    placeholder="teammate@acme.com"
                                />
                                <RoleSelect
                                    roles={roles}
                                    value={role}
                                    onChange={setRole}
                                />
                            </div>
                            <span className="w-secsub">
                                Press Enter to add each person.
                            </span>
                        </div>

                        {invites.length > 0 && (
                            <div className="w-list">
                                {invites.map((i) => (
                                    <div
                                        key={i.email}
                                        className="w-row"
                                        style={{
                                            gridTemplateColumns: "1fr auto",
                                            padding: "10px 0",
                                        }}
                                    >
                                        <div className="w-flex w-items-center w-gap-2">
                                            <span className="w-avatar w-avatar--sm">
                                                {getInitials(i.email)}
                                            </span>
                                            <span className="w-truncate w-text-secondary">
                                                {i.email}
                                            </span>
                                        </div>
                                        <div className="w-flex w-items-center w-gap-2">
                                            <span className="w-pill">
                                                {i.roleName}
                                            </span>
                                            <button
                                                type="button"
                                                className="w-btn w-btn--icon"
                                                title="Remove"
                                                onClick={() =>
                                                    setInvites((v) =>
                                                        v.filter(
                                                            (x) =>
                                                                x.email !==
                                                                i.email,
                                                        ),
                                                    )
                                                }
                                            >
                                                <X size={13} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="w-flex w-gap-2">
                            <button
                                type="button"
                                className="w-btn w-btn--secondary w-none"
                                onClick={() => setStep(2)}
                                disabled={busy}
                            >
                                Skip
                            </button>
                            <button
                                type="button"
                                className="w-btn w-btn--primary w-grow"
                                onClick={handleFinish}
                                disabled={busy}
                            >
                                {busy ? (
                                    <Spinner size={15} />
                                ) : invites.length ? (
                                    `Invite ${invites.length} & finish`
                                ) : (
                                    "Finish"
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* step 2 — done */}
                {step === 2 && (
                    <div className="w-flex-col w-items-center w-gap-4">
                        <div className="w-create-summary">
                            <span className="w-avatar w-avatar--md">
                                {previewUrl ? (
                                    <img src={previewUrl} alt={name} />
                                ) : (
                                    getInitials(name)
                                )}
                            </span>
                            <div className="w-flex-col w-gap-1">
                                <span className="w-sec">{name}</span>
                                <span className="w-secsub">
                                    {invites.length
                                        ? `${invites.length} invite${invites.length > 1 ? "s" : ""} sent`
                                        : "No invites yet"}
                                </span>
                            </div>
                        </div>
                        <button
                            type="button"
                            className="w-btn w-btn--primary w-btn--block"
                            onClick={() => onSuccess?.(entity)}
                        >
                            Go to {noun}
                            <CaretRight size={15} />
                        </button>
                        <button
                            type="button"
                            className="w-link w-link--muted w-linkbtn w-inline w-gap-1"
                            onClick={reset}
                        >
                            <ArrowCounterClockwise size={12} /> Create another
                        </button>
                    </div>
                )}
            </div>

            {step === 0 && (
                <div className="w-create-foot">
                    <span className="w-secsub">
                        {isOrg
                            ? "Organizations group your team, billing and settings."
                            : "Workspaces live inside an organization."}
                    </span>
                </div>
            )}
        </div>
    );
};

export default CreateFlow;

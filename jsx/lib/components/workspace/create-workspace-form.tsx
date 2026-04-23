import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { CaretLeft, CaretDown, Plus } from "@phosphor-icons/react";
import { useWorkspaceList } from "@/hooks/use-workspace";
import { useOrganizationMemberships } from "@/hooks/use-organization";
import { useSession } from "@/hooks/use-session";
import { useScreenContext } from "../organization/context";
import { DefaultStylesProvider } from "../utility";

const Container = styled.div`
    display: flex;
    height: 100%;
    min-height: calc(var(--size-50u) * 4);
    border-radius: var(--radius-lg);
    overflow: hidden;

    @media (max-width: 768px) {
        flex-direction: column;
        height: auto;
    }
`;

const LeftPanel = styled.div`
    width: 35%;
    background: var(--color-secondary);
    padding: var(--space-16u);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    border-right: var(--border-width-thin) solid var(--color-border);

    @media (max-width: 768px) {
        width: 100%;
        border-right: none;
        border-bottom: var(--border-width-thin) solid var(--color-border);
        padding: var(--space-12u);
    }
`;

const RightPanel = styled.div`
    flex: 1;
    padding: var(--space-16u);
    display: flex;
    flex-direction: column;
    background: var(--color-card);
    color: var(--color-card-foreground);

    @media (max-width: 768px) {
        padding: var(--space-12u);
    }
`;

const AvatarContainer = styled.div<{ hasImage: boolean }>`
    width: var(--size-40u);
    height: var(--size-40u);
    border-radius: var(--radius-xl);
    overflow: hidden;
    background: ${(props) =>
        props.hasImage ? "transparent" : "var(--color-input-background)"};
    border: var(--border-width-regular) solid var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: var(--space-8u);
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;

    &:hover {
        border-color: var(--color-border-hover);
        transform: scale(1.02);
    }
`;

const AvatarImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
`;

const AvatarPlaceholder = styled.div`
    font-size: calc(var(--font-size-3xl) + var(--font-size-3xl));
    font-weight: 600;
    color: var(--color-muted);
    background: var(--color-border);
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
`;

const Title = styled.h2`
    font-size: var(--font-size-xl);
    font-weight: 400;
    color: var(--color-card-foreground);
    margin-bottom: var(--space-4u);
`;

const Description = styled.p`
    font-size: var(--font-size-md);
    color: var(--color-secondary-text);
    line-height: 1.4;
    max-width: calc(var(--size-50u) * 2);
`;

const FormHeader = styled.div`
    margin-bottom: var(--space-12u);
`;

const FormTitle = styled.h3`
    font-size: var(--font-size-xl);
    font-weight: 400;
    color: var(--color-card-foreground);
    margin-bottom: var(--space-3u);
`;

const FormDescription = styled.p`
    font-size: var(--font-size-md);
    color: var(--color-secondary-text);
    line-height: 1.4;
`;

const FormContent = styled.div`
    flex: 1;
`;

const FormGroup = styled.div`
    margin-bottom: var(--space-10u);
`;

const Label = styled.label`
    display: block;
    margin-bottom: var(--space-3u);
    font-size: var(--font-size-md);
    font-weight: 400;
    color: var(--color-card-foreground);
`;

const Input = styled.input`
    width: 100%;
    padding: var(--space-4u) var(--space-6u);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-xs);
    font-size: var(--font-size-lg);
    outline: none;
    background: var(--color-input-background);
    color: var(--color-card-foreground);
    transition: all 0.2s ease;
    box-sizing: border-box;

    &:focus {
        border-color: var(--color-primary);
        box-shadow: var(--ring-primary);
    }

    &::placeholder {
        color: var(--color-muted);
    }
`;

const TextArea = styled.textarea`
    width: 100%;
    padding: var(--space-4u) var(--space-6u);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-xs);
    font-size: var(--font-size-lg);
    outline: none;
    resize: vertical;
    min-height: var(--size-40u);
    background: var(--color-input-background);
    color: var(--color-card-foreground);
    transition: all 0.2s ease;
    font-family: inherit;
    box-sizing: border-box;

    &:focus {
        border-color: var(--color-primary);
        box-shadow: var(--ring-primary);
    }

    &::placeholder {
        color: var(--color-muted);
    }
`;

const ButtonGroup = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: auto;
    padding-top: var(--space-12u);
`;

const BackButton = styled.button`
    display: flex;
    align-items: center;
    gap: var(--space-3u);
    padding: var(--space-4u) var(--space-6u);
    background: transparent;
    border: none;
    font-size: var(--font-size-md);
    font-weight: 400;
    color: var(--color-secondary-text);
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
        color: var(--color-card-foreground);
    }
`;

const SubmitButton = styled.button`
    padding: var(--space-4u) var(--space-10u);
    border-radius: var(--radius-xs);
    font-size: var(--font-size-lg);
    font-weight: 400;
    cursor: pointer;
    transition: all 0.2s ease;
    background: var(--color-primary);
    color: var(--color-primary-foreground);
    border: none;

    &:hover:not(:disabled) {
        background: var(--color-primary-hover);
        transform: translateY(calc(var(--border-width-thin) * -1));
        box-shadow: var(--shadow-md);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const HiddenInput = styled.input`
    display: none;
`;

const UploadOverlay = styled.div`
    position: absolute;
    inset: 0;
    background: var(--color-dialog-backdrop);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
    cursor: pointer;

    ${AvatarContainer}:hover & {
        opacity: 1;
    }
`;

const UploadText = styled.div`
    color: var(--color-foreground-inverse);
    font-size: var(--font-size-sm);
    font-weight: 400;
`;

const DropdownContainer = styled.div`
    position: relative;
`;

const DropdownButton = styled.button`
    width: 100%;
    padding: var(--space-4u) var(--space-6u);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-xs);
    font-size: var(--font-size-lg);
    outline: none;
    background: var(--color-input-background);
    color: var(--color-card-foreground);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    text-align: left;

    &:hover {
        border-color: var(--color-border-hover);
    }

    &:focus {
        border-color: var(--color-primary);
        box-shadow: var(--ring-primary);
    }

    &:disabled {
        background: var(--color-secondary);
        cursor: not-allowed;
    }
`;

const DropdownContent = styled.div`
    position: absolute;
    top: calc(100% + var(--space-2u));
    left: 0;
    right: 0;
    background: var(--color-popover);
    border: var(--border-width-thin) solid var(--color-border);
    border-radius: var(--radius-xs);
    box-shadow: var(--shadow-md);
    z-index: 10;
    max-height: calc(var(--size-50u) * 2);
    overflow-y: auto;
`;

const DropdownItem = styled.button`
    width: 100%;
    padding: var(--space-4u) var(--space-6u);
    border: none;
    background: transparent;
    font-size: var(--font-size-lg);
    color: var(--color-popover-foreground);
    cursor: pointer;
    text-align: left;
    display: flex;
    align-items: center;
    gap: var(--space-4u);
    transition: background 0.1s ease;

    &:hover {
        background: var(--color-accent);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }
`;

const OrgAvatar = styled.div`
    width: var(--size-10u);
    height: var(--size-10u);
    border-radius: 50%;
    overflow: hidden;
    background: var(--color-border);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-2xs);
    font-weight: 600;
    color: var(--color-secondary-text);
    flex-shrink: 0;
`;

const OrgAvatarImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
`;

const CreateOrgItem = styled(DropdownItem)`
    border-top: var(--border-width-thin) solid var(--color-border);
    color: var(--color-primary);
    font-weight: 400;
    padding: var(--space-5u) var(--space-6u);

    &:hover {
        background: var(--color-primary-background);
    }
`;

const PlusIcon = styled.div`
    width: var(--size-10u);
    height: var(--size-10u);
    border-radius: 50%;
    border: var(--border-width-thin) dashed var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-primary);
`;

interface CreateWorkspaceFormProps {
    organizationId?: string;
    onSuccess?: (workspace?: any) => void;
    onCancel?: () => void;
    onCreateOrganization?: () => void;
}

export const CreateWorkspaceForm: React.FC<CreateWorkspaceFormProps> = ({
    organizationId: initialOrgId,
    onSuccess,
    onCancel,
    onCreateOrganization,
}) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [image, setImage] = useState<File>();
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedOrgId, setSelectedOrgId] = useState(initialOrgId);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { toast } = useScreenContext();
    const { createWorkspace } = useWorkspaceList();
    const { refetch } = useSession();
    const { organizationMemberships } = useOrganizationMemberships();

    const selectedOrg = organizationMemberships?.find(
        (m) => m.organization.id === selectedOrgId,
    )?.organization;

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];

            if (file.size > 2 * 1024 * 1024) {
                toast("File size cannot exceed 2MB", "error");
                return;
            }

            if (!file.type.startsWith("image/")) {
                toast("Please select a valid image file", "error");
                return;
            }

            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }

            setImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const getInitials = (text: string) => {
        return (
            text
                .split(" ")
                .map((word) => word[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "W"
        );
    };

    const sanitizeText = (text: string): string => {
        return text.trim().replace(/[<>\"'&]/g, "");
    };

    const validateWorkspaceName = (name: string): boolean => {
        return (
            name.length >= 2 &&
            name.length <= 100 &&
            /^[a-zA-Z0-9\s_.-]+$/.test(name)
        );
    };

    const handleSubmit = async () => {
        const sanitizedName = sanitizeText(name);
        const sanitizedDescription = sanitizeText(description);

        if (!sanitizedName || !selectedOrgId) {
            toast("Please enter a workspace name", "error");
            return;
        }

        if (!validateWorkspaceName(sanitizedName)) {
            toast(
                "Workspace name must be 2-100 characters and contain only letters, numbers, spaces, dots, underscores, and hyphens",
                "error",
            );
            return;
        }

        if (sanitizedDescription.length > 500) {
            toast("Description must be less than 500 characters", "error");
            return;
        }

        setIsSubmitting(true);
        try {
            const createdWorkspace = await createWorkspace(
                selectedOrgId,
                sanitizedName,
                image,
                sanitizedDescription,
            );
            await refetch();
            onSuccess?.(createdWorkspace);
        } catch (error: any) {
            const errorMessage =
                error.message ||
                "Failed to create workspace. Please try again.";
            toast(errorMessage, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        return () => {
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <DefaultStylesProvider>
            <Container>
                <LeftPanel>
                    <AvatarContainer
                        hasImage={!!previewUrl}
                        onClick={handleFileSelect}
                    >
                        {previewUrl ? (
                            <AvatarImage
                                src={previewUrl}
                                alt="Workspace logo"
                            />
                        ) : (
                            <AvatarPlaceholder>
                                {getInitials(name || "W")}
                            </AvatarPlaceholder>
                        )}
                        <UploadOverlay>
                            <UploadText>Upload Logo</UploadText>
                        </UploadOverlay>
                    </AvatarContainer>
                    <HiddenInput
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        accept="image/png, image/jpeg, image/gif"
                        disabled={isSubmitting}
                    />
                    <Title>Create new workspace</Title>
                    <Description>
                        Workspaces are used to organize your projects and team
                        members into logical groups.
                    </Description>
                </LeftPanel>

                <RightPanel>
                    <FormHeader>
                        <FormTitle>Choose your workspace name</FormTitle>
                        <FormDescription>
                            Enter a name for your new workspace. This will be
                            visible to all members.
                        </FormDescription>
                    </FormHeader>

                    <FormContent>
                        <FormGroup>
                            <Label>Organization</Label>
                            <DropdownContainer ref={dropdownRef}>
                                <DropdownButton
                                    type="button"
                                    onClick={() =>
                                        setDropdownOpen(!dropdownOpen)
                                    }
                                    disabled={isSubmitting}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "var(--space-4u)",
                                        }}
                                    >
                                        <OrgAvatar>
                                            {selectedOrg?.image_url ? (
                                                <OrgAvatarImage
                                                    src={selectedOrg.image_url}
                                                    alt={selectedOrg.name}
                                                />
                                            ) : (
                                                getInitials(
                                                    selectedOrg?.name || "O",
                                                ).charAt(0)
                                            )}
                                        </OrgAvatar>
                                        <span>
                                            {selectedOrg?.name ||
                                                "Select organization"}
                                        </span>
                                    </div>
                                    <CaretDown
                                        size={16}
                                        style={{
                                            color: "var(--color-secondary-text)",
                                        }}
                                    />
                                </DropdownButton>
                                {dropdownOpen && (
                                    <DropdownContent>
                                        {organizationMemberships?.map(
                                            (membership) => {
                                                const hasRestriction =
                                                    membership
                                                        .eligibility_restriction
                                                        ?.type &&
                                                    membership
                                                        .eligibility_restriction
                                                        ?.type !== "none";

                                                return (
                                                    <DropdownItem
                                                        key={
                                                            membership
                                                                .organization.id
                                                        }
                                                        onClick={() => {
                                                            if (
                                                                !hasRestriction
                                                            ) {
                                                                setSelectedOrgId(
                                                                    membership
                                                                        .organization
                                                                        .id,
                                                                );
                                                                setDropdownOpen(
                                                                    false,
                                                                );
                                                            }
                                                        }}
                                                        disabled={
                                                            hasRestriction
                                                        }
                                                        style={{
                                                            opacity:
                                                                hasRestriction
                                                                    ? 0.6
                                                                    : 1,
                                                            cursor: hasRestriction
                                                                ? "not-allowed"
                                                                : "pointer",
                                                        }}
                                                        title={
                                                            hasRestriction
                                                                ? membership
                                                                      .eligibility_restriction
                                                                      ?.message
                                                                : undefined
                                                        }
                                                    >
                                                        <OrgAvatar>
                                                            {membership
                                                                .organization
                                                                .image_url ? (
                                                                <OrgAvatarImage
                                                                    src={
                                                                        membership
                                                                            .organization
                                                                            .image_url
                                                                    }
                                                                    alt={
                                                                        membership
                                                                            .organization
                                                                            .name
                                                                    }
                                                                />
                                                            ) : (
                                                                getInitials(
                                                                    membership
                                                                        .organization
                                                                        .name,
                                                                ).charAt(0)
                                                            )}
                                                        </OrgAvatar>
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                flexDirection:
                                                                    "column",
                                                                gap: "var(--space-1u)",
                                                            }}
                                                        >
                                                            <span>
                                                                {
                                                                    membership
                                                                        .organization
                                                                        .name
                                                                }
                                                            </span>
                                                            {hasRestriction && (
                                                                <span
                                                                    style={{
                                                                        fontSize:
                                                                            "var(--font-size-2xs)",
                                                                        color: "var(--color-error)",
                                                                    }}
                                                                >
                                                                    Restricted
                                                                </span>
                                                            )}
                                                        </div>
                                                    </DropdownItem>
                                                );
                                            },
                                        )}
                                        <CreateOrgItem
                                            onClick={() => {
                                                setDropdownOpen(false);
                                                onCreateOrganization?.();
                                            }}
                                        >
                                            <PlusIcon>
                                                <Plus size={12} />
                                            </PlusIcon>
                                            <span>Create new organization</span>
                                        </CreateOrgItem>
                                    </DropdownContent>
                                )}
                            </DropdownContainer>
                        </FormGroup>

                        <FormGroup>
                            <Label>Workspace name</Label>
                            <Input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Workspace Name"
                                disabled={isSubmitting}
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label>Description (optional)</Label>
                            <TextArea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="What is this workspace for?"
                                disabled={isSubmitting}
                            />
                        </FormGroup>
                    </FormContent>

                    <ButtonGroup>
                        {onCancel ? (
                            <BackButton
                                onClick={onCancel}
                                disabled={isSubmitting}
                            >
                                <CaretLeft size={16} />
                                Back
                            </BackButton>
                        ) : (
                            <div></div>
                        )}
                        <SubmitButton
                            onClick={handleSubmit}
                            disabled={isSubmitting || !name.trim()}
                        >
                            {isSubmitting ? "Creating..." : "Create"}
                        </SubmitButton>
                    </ButtonGroup>
                </RightPanel>
            </Container>
        </DefaultStylesProvider>
    );
};

export default CreateWorkspaceForm;

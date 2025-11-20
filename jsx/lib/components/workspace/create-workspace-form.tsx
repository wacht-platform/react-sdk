import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { ChevronLeft, ChevronDown, Plus } from "lucide-react";
import { useWorkspaceList } from "@/hooks/use-workspace";
import { useOrganizationMemberships } from "@/hooks/use-organization";
import { useScreenContext } from "../organization/context";
import { DefaultStylesProvider } from "../utility";

const Container = styled.div`
  display: flex;
  height: 100%;
  min-height: 400px;
`;

const LeftPanel = styled.div`
  width: 35%;
  background: var(--color-background-hover);
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-right: 1px solid var(--color-border);
`;

const RightPanel = styled.div`
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;
`;

const AvatarContainer = styled.div<{ hasImage: boolean }>`
  width: 80px;
  height: 80px;
  border-radius: 16px;
  overflow: hidden;
  background: ${(props) =>
    props.hasImage ? "transparent" : "var(--color-background)"};
  border: 2px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
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
  font-size: 32px;
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
  font-size: 16px;
  font-weight: 400;
  color: var(--color-foreground);
  margin-bottom: 8px;
`;

const Description = styled.p`
  font-size: 13px;
  color: var(--color-secondary-text);
  line-height: 1.4;
  max-width: 200px;
`;

const FormHeader = styled.div`
  margin-bottom: 24px;
`;

const FormTitle = styled.h3`
  font-size: 16px;
  font-weight: 400;
  color: var(--color-foreground);
  margin-bottom: 6px;
`;

const FormDescription = styled.p`
  font-size: 13px;
  color: var(--color-secondary-text);
  line-height: 1.4;
`;

const FormContent = styled.div`
  flex: 1;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  font-weight: 400;
  color: var(--color-foreground);
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  background: var(--color-background);
  color: var(--color-foreground);
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-background);
  }

  &::placeholder {
    color: var(--color-muted);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  resize: vertical;
  min-height: 80px;
  background: var(--color-background);
  color: var(--color-foreground);
  transition: all 0.2s ease;
  font-family: inherit;
  box-sizing: border-box;

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px var(--color-primary-background);
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
  padding-top: 24px;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: transparent;
  border: none;
  font-size: 13px;
  font-weight: 400;
  color: var(--color-secondary-text);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: var(--color-foreground);
  }
`;

const SubmitButton = styled.button`
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s ease;
  background: var(--color-primary);
  color: white;
  border: none;

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px var(--color-primary-shadow);
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
  color: white;
  font-size: 12px;
  font-weight: 400;
`;

const DropdownContainer = styled.div`
  position: relative;
`;

const DropdownButton = styled.button`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  background: var(--color-background);
  color: var(--color-foreground);
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
    box-shadow: 0 0 0 3px var(--color-primary-background);
  }

  &:disabled {
    background: var(--color-background-hover);
    cursor: not-allowed;
  }
`;

const DropdownContent = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  box-shadow:
    0 4px 6px -1px var(--color-shadow),
    0 2px 4px -1px var(--color-shadow);
  z-index: 10;
  max-height: 200px;
  overflow-y: auto;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  font-size: 14px;
  color: var(--color-foreground);
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.1s ease;

  &:hover {
    background: var(--color-background-hover);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const OrgAvatar = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
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
  border-top: 1px solid var(--color-border);
  color: var(--color-primary);
  font-weight: 400;
  padding: 10px 12px;

  &:hover {
    background: var(--color-primary-background);
  }
`;

const PlusIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px dashed var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
`;

interface CreateWorkspaceFormProps {
  organizationId: string;
  onSuccess?: () => void;
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
      name.length >= 2 && name.length <= 100 && /^[a-zA-Z0-9\s_.-]+$/.test(name)
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
      await createWorkspace(
        selectedOrgId,
        sanitizedName,
        image,
        sanitizedDescription,
      );
      onSuccess?.();
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to create workspace. Please try again.";
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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <DefaultStylesProvider>
      <Container>
        <LeftPanel>
          <AvatarContainer hasImage={!!previewUrl} onClick={handleFileSelect}>
            {previewUrl ? (
              <AvatarImage src={previewUrl} alt="Workspace logo" />
            ) : (
              <AvatarPlaceholder>{getInitials(name || "W")}</AvatarPlaceholder>
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
            Workspaces are used to organize your projects and team members into
            logical groups.
          </Description>
        </LeftPanel>

        <RightPanel>
          <FormHeader>
            <FormTitle>Choose your workspace name</FormTitle>
            <FormDescription>
              Enter a name for your new workspace. This will be visible to all
              members.
            </FormDescription>
          </FormHeader>

          <FormContent>
            <FormGroup>
              <Label>Organization</Label>
              <DropdownContainer ref={dropdownRef}>
                <DropdownButton
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  disabled={isSubmitting}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <OrgAvatar>
                      {selectedOrg?.image_url ? (
                        <OrgAvatarImage
                          src={selectedOrg.image_url}
                          alt={selectedOrg.name}
                        />
                      ) : (
                        getInitials(selectedOrg?.name || "O").charAt(0)
                      )}
                    </OrgAvatar>
                    <span>{selectedOrg?.name || "Select organization"}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    style={{ color: "var(--color-secondary-text)" }}
                  />
                </DropdownButton>
                {dropdownOpen && (
                  <DropdownContent>
                    {organizationMemberships?.map((membership) => (
                      <DropdownItem
                        key={membership.organization.id}
                        onClick={() => {
                          setSelectedOrgId(membership.organization.id);
                          setDropdownOpen(false);
                        }}
                      >
                        <OrgAvatar>
                          {membership.organization.image_url ? (
                            <OrgAvatarImage
                              src={membership.organization.image_url}
                              alt={membership.organization.name}
                            />
                          ) : (
                            getInitials(membership.organization.name).charAt(0)
                          )}
                        </OrgAvatar>
                        <span>{membership.organization.name}</span>
                      </DropdownItem>
                    ))}
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
              <BackButton onClick={onCancel} disabled={isSubmitting}>
                <ChevronLeft size={16} />
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

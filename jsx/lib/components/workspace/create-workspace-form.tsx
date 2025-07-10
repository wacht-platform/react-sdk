import React, { useState, useRef } from "react";
import styled from "styled-components";
import { ChevronLeft, ChevronDown, Plus } from "lucide-react";
import { useWorkspaceList } from "@/hooks/use-workspace";
import { useOrganizationMemberships } from "@/hooks/use-organization";

const Container = styled.div`
  display: flex;
  height: 100%;
  min-height: 400px;
`;

const LeftPanel = styled.div`
  width: 35%;
  background: #f8f9fa;
  padding: 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border-right: 1px solid #e5e7eb;
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
  background: ${(props) => (props.hasImage ? "transparent" : "#ffffff")};
  border: 2px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    border-color: #d1d5db;
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
  color: #9ca3af;
  background: #e5e7eb;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Title = styled.h2`
  font-size: 16px;
  font-weight: 400;
  color: #111827;
  margin-bottom: 8px;
`;

const Description = styled.p`
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
  max-width: 200px;
`;

const FormHeader = styled.div`
  margin-bottom: 24px;
`;

const FormTitle = styled.h3`
  font-size: 16px;
  font-weight: 400;
  color: #111827;
  margin-bottom: 6px;
`;

const FormDescription = styled.p`
  font-size: 13px;
  color: #6b7280;
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
  font-weight: 500;
  color: #374151;
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  background: #ffffff;
  color: #111827;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  resize: vertical;
  min-height: 80px;
  background: #ffffff;
  color: #111827;
  transition: all 0.2s ease;
  font-family: inherit;
  box-sizing: border-box;

  &:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  &::placeholder {
    color: #9ca3af;
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
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: #111827;
  }
`;

const SubmitButton = styled.button`
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #6366f1;
  color: white;
  border: none;

  &:hover:not(:disabled) {
    background: #4f46e5;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.25);
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
  background: rgba(0, 0, 0, 0.5);
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
  font-weight: 500;
`;

const DropdownContainer = styled.div`
  position: relative;
`;

const DropdownButton = styled.button`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
  background: #ffffff;
  color: #111827;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  text-align: left;

  &:hover {
    border-color: #d1d5db;
  }

  &:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }

  &:disabled {
    background: #f9fafb;
    cursor: not-allowed;
  }
`;

const DropdownContent = styled.div`
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
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
  color: #111827;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.1s ease;

  &:hover {
    background: #f5f5f5;
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
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: #6b7280;
  flex-shrink: 0;
`;

const OrgAvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const CreateOrgItem = styled(DropdownItem)`
  border-top: 1px solid #e5e7eb;
  color: #6366f1;
  font-weight: 500;
  padding: 10px 12px;

  &:hover {
    background: #f5f3ff;
  }
`;

const PlusIcon = styled.div`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px dashed #6366f1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6366f1;
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
  const { createWorkspace } = useWorkspaceList();
  const { organizationMemberships } = useOrganizationMemberships();

  const selectedOrg = organizationMemberships?.find(m => m.organization.id === selectedOrgId)?.organization;


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      if (file.size > 2 * 1024 * 1024) {
        alert("File size cannot exceed 2MB");
        return;
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

  const handleSubmit = async () => {
    if (!name.trim() || !selectedOrgId) return;

    setIsSubmitting(true);
    try {
      await createWorkspace(selectedOrgId, name, image, description);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create workspace:", error);
    } finally {
      setIsSubmitting(false);
    }
  };


  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
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
          Workspaces are used to organize your projects and team members into logical groups.
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <OrgAvatar>
                    {selectedOrg?.image_url ? (
                      <OrgAvatarImage src={selectedOrg.image_url} alt={selectedOrg.name} />
                    ) : (
                      getInitials(selectedOrg?.name || 'O').charAt(0)
                    )}
                  </OrgAvatar>
                  <span>{selectedOrg?.name || 'Select organization'}</span>
                </div>
                <ChevronDown size={16} style={{ color: '#6b7280' }} />
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
              placeholder="your-workspace-name"
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
          <BackButton onClick={onCancel} disabled={isSubmitting}>
            <ChevronLeft size={16} />
            Back
          </BackButton>
          <SubmitButton
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? "Creating..." : "Create"}
          </SubmitButton>
        </ButtonGroup>
      </RightPanel>
    </Container>
  );
};

export default CreateWorkspaceForm;

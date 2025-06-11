import { useState, useRef, useCallback } from "react";
import styled from "styled-components";
import { Upload, X } from "lucide-react";
import { useWorkspaceList } from "@/hooks/use-workspace";

const FormGroup = styled.div`
  margin-bottom: 16px;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-foreground);
`;

const Input = styled.input`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  outline: none;
  background: var(--color-input-background);
  color: var(--color-foreground);

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-background);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  outline: none;
  resize: vertical;
  min-height: 80px;
  background: var(--color-input-background);
  color: var(--color-foreground);

  &:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-background);
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
`;

const Button = styled.button<{ variant?: "primary" | "outline" }>`
  padding: 8px 16px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  background: ${(props) =>
    props.variant === "primary" ? "var(--color-primary)" : "var(--color-background)"};
  color: ${(props) => (props.variant === "primary" ? "white" : "var(--color-foreground)")};
  border: ${(props) =>
    props.variant === "primary" ? "none" : "1px solid var(--color-border)"};

  &:hover {
    background: ${(props) =>
      props.variant === "primary" ? "var(--color-primary-hover)" : "var(--color-input-background)"};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LogoUploadContainer = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 20px;
  width: 100%;
  margin-bottom: 8px;
`;

const AvatarContainer = styled.div<{ hasImage: boolean }>`
  width: 80px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  background: ${(props) => (props.hasImage ? "transparent" : "var(--color-input-background)")};
  border: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 4px var(--color-shadow);
  color: var(--color-secondary-text);
  font-size: 20px;
  font-weight: 500;
`;

const AvatarImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AvatarPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-secondary-text);
  font-size: 12px;
`;

const UploadControls = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 8px;
`;

const ActionButton = styled.button<{
  variant?: "primary" | "secondary" | "danger";
}>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 14px;
  font-weight: 500;
  width: fit-content;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${(props) => {
    if (props.variant === "primary") return "var(--color-input-background)";
    if (props.variant === "danger") return "var(--color-error-background)";
    return "transparent";
  }};
  color: ${(props) => {
    if (props.variant === "primary") return "var(--color-foreground)";
    if (props.variant === "danger") return "var(--color-error)";
    return "var(--color-secondary-text)";
  }};
  border: ${(props) => {
    if (props.variant === "primary") return "none";
    if (props.variant === "danger") return "1px solid var(--color-error)";
    return "1px solid var(--color-border)";
  }};

  &:hover {
    background: ${(props) => {
      if (props.variant === "primary") return "var(--color-border)";
      if (props.variant === "danger") return "var(--color-error)";
      return "var(--color-input-background)";
    }};
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const HelperText = styled.div`
  font-size: 12px;
  color: var(--color-secondary-text);
  margin-top: 4px;
`;

interface CreateWorkspaceFormProps {
  organizationId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateWorkspaceForm: React.FC<CreateWorkspaceFormProps> = ({
  organizationId,
  onSuccess,
  onCancel,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createWorkspace } = useWorkspaceList();

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      if (file.size > 2 * 1024 * 1024) {
        // 2MB limit
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

  const handleRemoveImage = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setImage(undefined);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleCancel = () => {
    onCancel?.();
  };

  const handleSubmit = async () => {
    if (!name.trim() || !organizationId) return;

    setIsSubmitting(true);
    try {
      await createWorkspace(organizationId, name, image, description);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create workspace:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <FormGroup>
        <Label>Logo</Label>
        <LogoUploadContainer>
          <AvatarContainer hasImage={!!previewUrl}>
            {previewUrl ? (
              <AvatarImage src={previewUrl} alt="Workspace logo preview" />
            ) : (
              <AvatarPlaceholder>
                <Upload size={24} />
              </AvatarPlaceholder>
            )}
          </AvatarContainer>
          <UploadControls>
            <ActionButton
              type="button"
              variant="primary"
              onClick={handleFileSelect}
              disabled={isSubmitting}
            >
              <Upload size={16} />
              Upload image
            </ActionButton>
            {previewUrl && (
              <ActionButton
                type="button"
                variant="danger"
                onClick={handleRemoveImage}
                disabled={isSubmitting}
              >
                <X size={16} />
                Remove
              </ActionButton>
            )}
            <HelperText>
              Max file size: 2MB. Recommended: Square, 200x200px.
            </HelperText>
          </UploadControls>
        </LogoUploadContainer>
        <HiddenInput
          type="file"
          ref={fileInputRef}
          onChange={handleImageChange}
          accept="image/png, image/jpeg, image/gif"
          disabled={isSubmitting}
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="workspace-name">Workspace name</Label>
        <Input
          id="workspace-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Engineering Team"
          disabled={isSubmitting}
        />
      </FormGroup>

      <FormGroup>
        <Label htmlFor="workspace-description">Description</Label>
        <TextArea
          id="workspace-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the purpose of this workspace"
          disabled={isSubmitting}
        />
      </FormGroup>

      <ButtonGroup>
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting || !name.trim()}
        >
          {isSubmitting ? "Creating..." : "Create Workspace"}
        </Button>
      </ButtonGroup>
    </>
  );
};

export default CreateWorkspaceForm;

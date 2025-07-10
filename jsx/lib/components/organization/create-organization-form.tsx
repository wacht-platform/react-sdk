import { useState, useRef } from "react";
import styled from "styled-components";
import { useOrganizationList } from "@/hooks/use-organization";
import { ChevronLeft } from "lucide-react";

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
  font-weight: 500;
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

const HelperText = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
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

interface CreateOrganizationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateOrganizationForm: React.FC<CreateOrganizationFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createOrganization } = useOrganizationList();

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    const generatedSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(generatedSlug);
  };

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
        .slice(0, 2) || "O"
    );
  };

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await createOrganization({
        name,
        description,
        image,
      });
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create organization:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container>
      <LeftPanel>
        <AvatarContainer hasImage={!!previewUrl} onClick={handleFileSelect}>
          {previewUrl ? (
            <AvatarImage src={previewUrl} alt="Organization logo" />
          ) : (
            <AvatarPlaceholder>{getInitials(name || "O")}</AvatarPlaceholder>
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
        <Title>Create new organization</Title>
        <Description>
          Organizations help you manage all your team members for an org in one umbrella.
        </Description>
      </LeftPanel>

      <RightPanel>
        <FormHeader>
          <FormTitle>Choose your organization name</FormTitle>
          <FormDescription>
            This is the name of your company or team. You can always change it
            later.
          </FormDescription>
        </FormHeader>

        <FormContent>
          <FormGroup>
            <Label>Organization name</Label>
            <Input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Acme Inc."
              disabled={isSubmitting}
            />
          </FormGroup>

          <FormGroup>
            <Label>Organization URL</Label>
            <Input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="acme-inc"
              disabled={isSubmitting}
            />
            <HelperText>
              This will be your organization's unique identifier in URLs.
            </HelperText>
          </FormGroup>

          <FormGroup>
            <Label>Description (optional)</Label>
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does your organization do?"
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

export default CreateOrganizationForm;

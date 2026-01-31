import { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import { useOrganizationList } from "@/hooks/use-organization";
import { ChevronLeft } from "lucide-react";
import { useScreenContext } from "./context";
import { DefaultStylesProvider } from "../utility";

const Container = styled.div`
  display: flex;
  height: 100%;
  min-height: 400px;

  @media (max-width: 768px) {
    flex-direction: column;
    height: auto;
  }
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

  @media (max-width: 768px) {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--color-border);
    padding: 24px;
  }
`;

const RightPanel = styled.div`
  flex: 1;
  padding: 32px;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    padding: 24px;
  }
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

interface CreateOrganizationFormProps {
  onSuccess?: (organization?: any) => void;
  onCancel?: () => void;
}

export const CreateOrganizationForm: React.FC<CreateOrganizationFormProps> = ({
  onSuccess,
  onCancel,
}) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { createOrganization } = useOrganizationList();
  const { toast } = useScreenContext();

  const handleNameChange = (value: string) => {
    setName(value);
  };

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
        .slice(0, 2) || "O"
    );
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const sanitizeText = (text: string): string => {
    return text.trim().replace(/[<>\"'&]/g, "");
  };

  const validateOrganizationName = (name: string): boolean => {
    return (
      name.length >= 2 && name.length <= 100 && /^[a-zA-Z0-9\s_.-]+$/.test(name)
    );
  };

  const handleSubmit = async () => {
    const sanitizedName = sanitizeText(name);
    const sanitizedDescription = sanitizeText(description);

    if (!sanitizedName) {
      toast("Please enter an organization name", "error");
      return;
    }

    if (!validateOrganizationName(sanitizedName)) {
      toast(
        "Organization name must be 2-100 characters and contain only letters, numbers, spaces, dots, underscores, and hyphens",
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
      const createdOrganization = await createOrganization({
        name: sanitizedName,
        description: sanitizedDescription,
        image,
      });
      onSuccess?.(createdOrganization);
    } catch (error: any) {
      const errorMessage =
        error.message || "Failed to create organization. Please try again.";
      toast(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DefaultStylesProvider>
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
            Organizations help you manage all your team members for an org in
            one umbrella.
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

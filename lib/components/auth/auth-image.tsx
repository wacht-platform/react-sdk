import styled from "styled-components";
import { useDeployment } from "../../hooks/use-deployment";

const ImageContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: var(--space-lg);
`;

const LogoImage = styled.img`
  max-width: 60px;
  max-height: 60px;
  width: auto;
  height: auto;
  object-fit: contain;
`;

export function AuthFormImage() {
  const { deployment } = useDeployment();

  const logoUrl = deployment?.ui_settings?.logo_image_url;

  if (!logoUrl) {
    return null;
  }

  return (
    <ImageContainer>
      <LogoImage
        src={logoUrl}
        alt="Logo"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </ImageContainer>
  );
}

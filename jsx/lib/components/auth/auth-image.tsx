import { useState } from "react";
import styled from "styled-components";
import { useDeployment } from "../../hooks/use-deployment";

const ImageContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const LogoWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: var(--color-muted-background, rgba(0, 0, 0, 0.05));
  border-radius: 50%;
  padding: var(--space-md, 12px);

  @media (prefers-color-scheme: dark) {
    background: var(--color-muted-background, rgba(255, 255, 255, 0.08));
  }
`;

const LogoImage = styled.img`
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
  object-fit: contain;
`;

export function AuthFormImage() {
  const { deployment } = useDeployment();
  const [imageError, setImageError] = useState(false);

  const logoUrl = deployment?.ui_settings?.logo_image_url;

  if (!logoUrl || imageError) {
    return null;
  }

  return (
    <ImageContainer>
      <LogoWrapper>
        <LogoImage
          src={logoUrl}
          alt="Logo"
          onError={() => setImageError(true)}
        />
      </LogoWrapper>
    </ImageContainer>
  );
}

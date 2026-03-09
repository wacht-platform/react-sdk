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
  width: var(--size-40u);
  height: var(--size-40u);
  background: var(--color-background-subtle);
  border-radius: 50%;
  padding: var(--space-6u);

  @media (prefers-color-scheme: dark) {
    background: var(--color-background-subtle);
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

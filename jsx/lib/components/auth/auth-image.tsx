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
    max-width: var(--size-32u);
    max-height: var(--size-32u);
    border-radius: 50%;
    margin-bottom: var(--space-6u);
`;

const LogoImage = styled.img`
    max-width: 100%;
    max-height: 100%;
    width: auto;
    height: auto;
    object-fit: contain;
`;

export function AuthFormImage({
    placement = "center",
}: {
    placement?: "center" | "left" | "right";
}) {
    const { deployment } = useDeployment();
    const [imageError, setImageError] = useState(false);

    const logoUrl = deployment?.ui_settings?.logo_image_url;

    if (!logoUrl || imageError) {
        return null;
    }

    const justifyContent =
        placement === "left"
            ? "flex-start"
            : placement === "right"
              ? "flex-end"
              : "center";

    return (
        <ImageContainer
            style={{
                justifyContent,
            }}
        >
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

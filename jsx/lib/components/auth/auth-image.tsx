import { useState } from "react";
import { useDeployment } from "../../hooks/use-deployment";

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
        <div style={{ display: "flex", justifyContent, width: "100%" }}>
            <img
                src={logoUrl}
                alt="Logo"
                onError={() => setImageError(true)}
                style={{
                    maxWidth: 40,
                    maxHeight: 40,
                    width: "auto",
                    height: "auto",
                    objectFit: "contain",
                }}
            />
        </div>
    );
}

import { DefaultStylesProvider } from "@/components/utility/root";
import { OtherAuthOptions } from "@/components/auth/other-auth-options";
import { AuthCard, AuthHead } from "./auth-card";
import { useDeployment } from "@/hooks/use-deployment";

interface OtherSignInOptionsProps {
    onBack: () => void;
}

export function OtherSignInOptions({ onBack }: OtherSignInOptionsProps) {
    const { deployment } = useDeployment();
    const appName = deployment?.ui_settings?.app_name;

    return (
        <DefaultStylesProvider>
            <AuthCard
                footer={
                    <span className="w-auth-foot">
                        <button
                            type="button"
                            className="w-link"
                            onClick={onBack}
                        >
                            Back to sign in
                        </button>
                    </span>
                }
            >
                <AuthHead
                    title="All sign-in methods"
                    sub={`Choose another way to sign in to ${appName || "your account"}`}
                />
                <OtherAuthOptions />
            </AuthCard>
        </DefaultStylesProvider>
    );
}

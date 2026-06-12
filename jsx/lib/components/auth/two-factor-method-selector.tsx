import { DefaultStylesProvider } from "../utility/root";
import { AuthCard, AuthHead } from "./auth-card";
import { MethodButton } from "../utility/method-button";

export interface TwoFactorMethod {
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    available: boolean;
    phoneNumber?: string;
}

interface TwoFactorMethodSelectorProps {
    methods: TwoFactorMethod[];
    onSelectMethod: (methodId: string) => void;
    onBack?: () => void;
}

export function TwoFactorMethodSelector({
    methods,
    onSelectMethod,
    onBack,
}: TwoFactorMethodSelectorProps) {
    return (
        <DefaultStylesProvider>
            <AuthCard
                footer={
                    onBack ? (
                        <span className="w-auth-foot">
                            <button
                                type="button"
                                className="w-link"
                                onClick={onBack}
                            >
                                Back to login
                            </button>
                        </span>
                    ) : undefined
                }
            >
                <AuthHead
                    title="Two-factor authentication"
                    sub="Choose how you'd like to verify your identity"
                />

                <div className="w-method-stack">
                    {methods.map((method) => (
                        <MethodButton
                            key={method.id}
                            icon={method.icon}
                            label={method.name}
                            description={
                                method.phoneNumber
                                    ? `${method.description} ${method.phoneNumber}`
                                    : method.description
                            }
                            onClick={() => onSelectMethod(method.id)}
                            disabled={!method.available}
                        />
                    ))}
                </div>
            </AuthCard>
        </DefaultStylesProvider>
    );
}

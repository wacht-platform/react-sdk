"use client";

import { createContext, useContext, useState } from "react";
import { useDeployment } from "../hooks";

interface SignInContextType {
	email: string;
	showOtherOptions: boolean;
	showForgotPassword: boolean;
	otpSent: boolean;
	setEmail: (email: string) => void;
	setShowOtherOptions: (show: boolean) => void;
	setShowForgotPassword: (show: boolean) => void;
	setOtpSent: (sent: boolean) => void;
	enabledSocialsProviders: DeploymentSocialConnection[];
	authSettings: AuthSettings | undefined;
	firstFactor: FirstFactor | undefined;
	setFirstFactor: (factor: FirstFactor) => void;
}

const SignInContext = createContext<SignInContextType | undefined>(undefined);

export function useSignInContext() {
	const context = useContext(SignInContext);
	if (!context) {
		throw new Error("useSignIn must be used within a SignInProvider");
	}
	return context;
}

interface SignInProviderProps {
	children: React.ReactNode;
}

export function SignInProvider({ children }: SignInProviderProps) {
	const { deployment } = useDeployment();
	const [firstFactor, setFirstFactor] = useState<FirstFactor>(
		deployment?.auth_settings.first_factor || "email_password",
	);
	const [email, setEmail] = useState("");
	const [showOtherOptions, setShowOtherOptions] = useState(false);
	const [showForgotPassword, setShowForgotPassword] = useState(false);
	const [otpSent, setOtpSent] = useState(false);

	const enabledSocialsProviders =
		deployment?.social_connections.filter((conn) => conn.enabled) || [];

	const authSettings = deployment?.auth_settings;

	return (
		<SignInContext.Provider
			value={{
				email,
				showOtherOptions,
				showForgotPassword,
				otpSent,
				setFirstFactor,
				setEmail,
				setShowOtherOptions,
				setShowForgotPassword,
				setOtpSent,
				enabledSocialsProviders,
				authSettings,
				firstFactor,
			}}
		>
			{children}
		</SignInContext.Provider>
	);
}

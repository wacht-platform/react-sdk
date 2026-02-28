"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useDeployment } from "../hooks";
import { FirstFactor } from "@/types";
import { DeploymentSocialConnection } from "@/types";
import { AuthSettings } from "@/types";

export type SignInStep =
  | "identifier"
  | "password"
  | "verification"
  | "2fa";

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
  signInStep: SignInStep;
  setSignInStep: (step: SignInStep) => void;
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
    deployment?.auth_settings.first_factor || "email_password"
  );
  const firstFactorHydratedRef = useRef(
    Boolean(deployment?.auth_settings.first_factor),
  );
  const [email, setEmail] = useState("");
  const [showOtherOptions, setShowOtherOptions] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [signInStep, setSignInStep] = useState<SignInStep>("identifier");

  const enabledSocialsProviders =
    deployment?.social_connections.filter((conn) => conn.enabled) || [];

  const authSettings = deployment?.auth_settings;

  useEffect(() => {
    const nextFirstFactor = deployment?.auth_settings?.first_factor;
    if (!firstFactorHydratedRef.current && nextFirstFactor) {
      setFirstFactor(nextFirstFactor);
      firstFactorHydratedRef.current = true;
    }
  }, [deployment?.auth_settings?.first_factor]);

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
        signInStep,
        setSignInStep,
      }}
    >
      {children}
    </SignInContext.Provider>
  );
}

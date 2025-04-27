import { useDeployment } from "@/hooks";
import { useEffect } from "react";

export const NavigateToSignIn = () => {
  const { deployment, loading } = useDeployment();

  useEffect(() => {
    if (!deployment) return;

    const signinLink =
      import.meta?.env?.VITE_SIGNIN_URL ||
      deployment.ui_settings.sign_in_page_url;

    let currentHost = window.location.href;

    let url = new URL(signinLink);
    url.searchParams.set("redirect_uri", `${currentHost}`);

    window.location.href = url.toString();
  }, [deployment, loading]);

  return null;
};

export const NavigateToSignUp = () => {
  const { deployment, loading } = useDeployment();

  useEffect(() => {
    if (!deployment) return;

    const signupLink =
      import.meta?.env?.VITE_SIGNUP_URL ||
      deployment.ui_settings.sign_up_page_url;

    let currentHost = window.location.href;

    let url = new URL(signupLink);
    url.searchParams.set("redirect_uri", `${currentHost}`);

    window.location.href = url.toString();
  }, [deployment, loading]);

  return null;
};

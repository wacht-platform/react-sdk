import { useDeployment } from "./use-deployment";
import type { NavigateOptions } from "@/types/platform-adapter";

export const useNavigation = () => {
  const { adapter, deployment } = useDeployment();

  const platformNavigate = adapter.useNavigate();

  const navigate = (to: string, options?: NavigateOptions) => {
    if (platformNavigate) {
      platformNavigate(to, options);
    } else {
      window.location.href = to;
    }
  };

  const getRedirectUri = (passedRedirectUri?: string): string => {
    if (passedRedirectUri) {
      return passedRedirectUri;
    }
    const currentParams = new URLSearchParams(window.location.search);
    const existingRedirectUri = currentParams.get("redirect_uri");
    if (existingRedirectUri) {
      return existingRedirectUri;
    }
    return window.location.href;
  };

  const navigateToSignIn = (redirectUri?: string) => {
    if (!deployment) return;

    const targetRedirectUri = getRedirectUri(redirectUri);
    const params = new URLSearchParams();
    params.set("redirect_uri", targetRedirectUri);

    if (deployment?.mode === "staging") {
      params.set("__dev_session__", localStorage.getItem("__dev_session__") ?? "");
    }

    navigate(
      `${deployment.ui_settings.sign_in_page_url}?${params.toString()}`,
      { replace: true },
    );
  };

  const navigateToAccountSelection = (redirectUri?: string) => {
    if (!deployment) return;

    const targetRedirectUri = getRedirectUri(redirectUri);
    const params = new URLSearchParams();
    params.set("redirect_uri", targetRedirectUri);

    if (deployment?.mode === "staging") {
      params.set("__dev_session__", localStorage.getItem("__dev_session__") ?? "");
    }

    navigate(
      `https://${deployment.frontend_host}?${params.toString()}`,
      { replace: true },
    );
  };

  const navigateToSignUp = (redirectUri?: string) => {
    if (!deployment) return;

    const targetRedirectUri = getRedirectUri(redirectUri);
    const params = new URLSearchParams();
    params.set("redirect_uri", targetRedirectUri);

    if (deployment?.mode === "staging") {
      params.set("__dev_session__", localStorage.getItem("__dev_session__") ?? "");
    }

    navigate(
      `${deployment.ui_settings.sign_up_page_url}?${params.toString()}`,
      { replace: true },
    );
  };

  return {
    navigate,
    navigateToSignIn,
    navigateToAccountSelection,
    navigateToSignUp,
  };
};

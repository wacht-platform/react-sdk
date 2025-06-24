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

  const navigateToSignIn = (redirectUri?: string) => {
    if (!deployment) return;

    const signinLink = deployment.ui_settings.sign_in_page_url;
    const currentHost = redirectUri || window.location.href;

    let url = new URL(signinLink);
    url.searchParams.set("redirect_uri", currentHost);

    if (deployment?.mode === "staging") {
      url.searchParams.set(
        "dev_session",
        localStorage.getItem("__dev_session__") ?? ""
      );
    }

    navigate(url.toString(), { replace: true });
  };

  const navigateToSignUp = (redirectUri?: string) => {
    if (!deployment) return;

    const signupLink = deployment.ui_settings.sign_up_page_url;
    const currentHost = redirectUri || window.location.href;

    let url = new URL(signupLink);
    url.searchParams.set("redirect_uri", currentHost);

    if (deployment?.mode === "staging") {
      url.searchParams.set(
        "dev_session",
        localStorage.getItem("__dev_session__") ?? ""
      );
    }

    navigate(url.toString(), { replace: true });
  };

  return {
    navigate,
    navigateToSignIn,
    navigateToSignUp,
  };
};

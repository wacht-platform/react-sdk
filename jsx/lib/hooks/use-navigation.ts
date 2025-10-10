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

    const currentHost = redirectUri || window.location.href;
    const params = new URLSearchParams();
    params.set("redirect_uri", currentHost);

    if (deployment?.mode === "staging") {
      params.set("dev_session", localStorage.getItem("__dev_session__") ?? "");
    }

    navigate(
      `${deployment.ui_settings.sign_in_page_url}?${params.toString()}`,
      { replace: true },
    );
  };

  const navigateToSignUp = (redirectUri?: string) => {
    if (!deployment) return;

    const currentHost = redirectUri || window.location.href;
    const params = new URLSearchParams();
    params.set("redirect_uri", currentHost);

    if (deployment?.mode === "staging") {
      params.set("dev_session", localStorage.getItem("__dev_session__") ?? "");
    }

    navigate(
      `${deployment.ui_settings.sign_up_page_url}?${params.toString()}`,
      { replace: true },
    );
  };

  return {
    navigate,
    navigateToSignIn,
    navigateToSignUp,
  };
};

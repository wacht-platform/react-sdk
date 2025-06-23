import { useDeployment } from "./use-deployment";
import type { NavigateOptions } from "@/types/platform-adapter";

export const useNavigation = () => {
  const { adapter, deployment } = useDeployment();

  const platformNavigate = adapter.useNavigate();

  const navigate = (to: string, options?: NavigateOptions) => {
    if (platformNavigate) {
      platformNavigate(to, options);
    } else {
      const searchParams = new URLSearchParams(window.location.search);
      let newUrl = new URL(to, window.location.origin);

      searchParams.forEach((value, key) => {
        if (!newUrl.searchParams.has(key)) {
          newUrl.searchParams.set(key, value);
        }
      });

      if (options?.replace) {
        window.location.replace(newUrl.toString());
      } else {
        window.location.assign(newUrl.toString());
      }
      window.dispatchEvent(new PopStateEvent("popstate", { state: options?.state || {} }));
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

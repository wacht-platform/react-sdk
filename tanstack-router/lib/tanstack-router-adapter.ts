"use client";

import { useNavigate } from "@tanstack/react-router";
import type { PlatformAdapter, NavigateOptions } from "@wacht/jsx";
import { isSafeUrl, isExternalUrl } from "@wacht/jsx";

const useNavigateAdapter = () => {
  try {
    const navigate = useNavigate();

    return (to: string, options?: NavigateOptions) => {
      if (!isSafeUrl(to)) {
        console.error(`Navigation blocked: Dangerous URL detected - ${to}`);
        return;
      }

      const isExternal = isExternalUrl(to);

      if (isExternal) {
        // External URLs always use window.location
        if (options?.replace) {
          window.location.replace(to);
        } else {
          window.location.href = to;
        }
        return;
      }

      try {
        navigate({
          to,
          replace: options?.replace || false,
        });
      } catch (error) {
        // Fallback to window.location if TanStack Router navigation fails
        if (options?.replace) {
          window.location.replace(to);
        } else {
          window.location.href = to;
        }
      }
    };
  } catch (error) {
    // If useNavigate hook is not available (outside router context), fallback to window.location
    return (to: string, options?: NavigateOptions) => {
      if (!isSafeUrl(to)) {
        console.error(`Navigation blocked: Dangerous URL detected - ${to}`);
        return;
      }

      if (options?.replace) {
        window.location.replace(to);
      } else {
        window.location.href = to;
      }
    };
  }
};

export const createTanStackRouterAdapter = (): PlatformAdapter => {
  return {
    useNavigate: useNavigateAdapter,
  };
};

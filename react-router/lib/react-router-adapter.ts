"use client";

import { useNavigate } from "react-router";
import type { PlatformAdapter, NavigateOptions } from "@snipextt/wacht";
import { isSafeUrl, isExternalUrl } from "@snipextt/wacht";

/**
 * React Router adapter that uses the useNavigate hook.
 * This works for React Router v7 applications.
 */
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

      // For internal navigation, use React Router
      try {
        navigate(to, {
          replace: options?.replace || false,
          state: options?.state,
        });
      } catch (error) {
        // Fallback to window.location if React Router fails
        console.warn(
          "React Router navigation failed, falling back to browser navigation:",
          error,
        );
        if (options?.replace) {
          window.location.replace(to);
        } else {
          window.location.href = to;
        }
      }
    };
  } catch (error) {
    // If useNavigate is not available, provide a fallback
    console.warn(
      "React Router useNavigate not available, falling back to browser navigation:",
      error,
    );
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

export const createReactRouterAdapter = (): PlatformAdapter => {
  return {
    useNavigate: useNavigateAdapter,
  };
};

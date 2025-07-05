"use client";

import { useNavigate } from "react-router";
import type { PlatformAdapter, NavigateOptions } from "@snipextt/wacht";
import { isExternalUrl, isSafeUrl } from "@snipextt/wacht";

const useReactRouterNavigate = () => {
  try {
    const navigate = useNavigate();

    return (to: string, options?: NavigateOptions) => {
      try {
        if (!isSafeUrl(to)) {
          console.error(`Navigation blocked: Dangerous URL detected - ${to}`);
          return;
        }

        const isExternal = isExternalUrl(to);

        if (isExternal) {
          if (options?.replace) {
            window.location.replace(to);
          } else {
            window.location.href = to;
          }
        } else {
          navigate(to, {
            replace: options?.replace || false,
            state: options?.state,
          });
        }
      } catch (error) {
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
    console.warn(
      "React Router useNavigate not available, falling back to browser navigation:",
      error,
    );
    return (to: string, options?: NavigateOptions) => {
      // Security check: block dangerous URLs
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
    useNavigate: useReactRouterNavigate,
  };
};

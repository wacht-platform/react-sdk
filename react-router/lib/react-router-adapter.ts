"use client";

import { useNavigate } from "react-router";
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
        if (options?.replace) {
          window.location.replace(to);
        } else {
          window.location.href = to;
        }
        return;
      }

      try {
        navigate(to, {
          replace: options?.replace || false,
          state: options?.state,
        });
      } catch (error) {
        if (options?.replace) {
          window.location.replace(to);
        } else {
          window.location.href = to;
        }
      }
    };
  } catch (error) {
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

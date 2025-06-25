"use client";

// import { useNavigate } from "react-router";
import type { PlatformAdapter, NavigateOptions } from "@snipextt/wacht";

export const createReactRouterAdapter = (): PlatformAdapter => {
  return {
    useNavigate: () => {
      try {
        return (to: string, _options?: NavigateOptions) => {
          window.location.href = to;
        };
      } catch (error) {
        return null;
      }
    },
  };
};

"use client";

import { useNavigate } from "react-router";
import type { PlatformAdapter, NavigateOptions } from "@snipextt/wacht";

export const createReactRouterAdapter = (): PlatformAdapter => {
  return {
    useNavigate: () => {
      try {
        const navigate = useNavigate();
        return (to: string, options?: NavigateOptions) => {
          navigate(to, {
            replace: options?.replace,
            state: options?.state,
          });
        };
      } catch (error) {
        return null;
      }
    },
  };
};

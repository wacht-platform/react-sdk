"use client";

import { useRouter } from "next/navigation";
import type { PlatformAdapter, NavigateOptions } from "@snipextt/wacht";
import { isExternalUrl, isSafeUrl } from "@snipextt/wacht";

const useNextjsNavigate = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const router = useRouter();
    
    return (to: string, options?: NavigateOptions) => {
      try {
        // Security check: block dangerous URLs
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
          if (options?.replace) {
            router.replace(to);
          } else {
            router.push(to);
          }
        }
      } catch (error) {
        console.warn("Next.js router navigation failed, falling back to browser navigation:", error);
        if (options?.replace) {
          window.location.replace(to);
        } else {
          window.location.href = to;
        }
      }
    };
  } catch (error) {
    console.warn("Next.js useRouter not available, falling back to browser navigation:", error);
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

export const createNextjsAdapter = (): PlatformAdapter => {
  return {
    useNavigate: useNextjsNavigate,
  };
};

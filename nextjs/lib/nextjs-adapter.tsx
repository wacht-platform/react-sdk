"use client";

import type { PlatformAdapter, NavigateOptions } from "@wacht/jsx";
import { isSafeUrl, isExternalUrl } from "@wacht/jsx";

/**
 * Next.js adapter that uses the universal window.next.router API.
 * This works for both App Router and Pages Router without requiring React hooks.
 */
const useNavigateAdapter = () => {
  if (typeof window === "undefined") {
    return null;
  }
  
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

    // For internal navigation, use Next.js router if available
    try {
      const router = (window as any).next?.router;
      if (router) {
        if (options?.replace) {
          router.replace(to);
        } else {
          router.push(to);
        }
        return;
      }
    } catch {}
    
    // Fallback to window.location
    if (options?.replace) {
      window.location.replace(to);
    } else {
      window.location.href = to;
    }
  };
};

export const createNextjsAdapter = (): PlatformAdapter => {
  return {
    useNavigate: useNavigateAdapter,
  };
};
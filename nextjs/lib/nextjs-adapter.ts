import type { PlatformAdapter, NavigateOptions } from "@snipextt/wacht";

export const createNextjsAdapter = (): PlatformAdapter => {
  return {
    useNavigate: () => {
      if (typeof window === "undefined") {
        return null;
      }

      // For standalone builds, just use browser navigation without Next.js hooks
      return (to: string, options?: NavigateOptions) => {
        console.log("Next.js adapter using browser navigation");

        // Use window.location for cross-origin or full page navigation
        if (options?.replace) {
          window.location.replace(to);
        } else {
          window.location.href = to;
        }
      };
    },
  };
};

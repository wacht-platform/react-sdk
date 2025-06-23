import type { PlatformAdapter, NavigateOptions } from "@snipextt/wacht";

const getNextjsRouter = () => {
  if (typeof window === 'undefined') return null;

  try {
    const { useRouter } = require("next/navigation");
    const router = useRouter();
    return { router, type: 'app' as const };
  } catch {
    try {
      const { useRouter } = require("next/router");
      const router = useRouter();
      return { router, type: 'pages' as const };
    } catch {
      return null;
    }
  }
};

const createNavigateFunction = (router: any) => {
  return (to: string, options?: NavigateOptions) => {
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
};

export const createNextjsAdapter = (): PlatformAdapter => {
  return {
    useNavigate: () => {
      const routerInfo = getNextjsRouter();

      if (routerInfo) {
        return createNavigateFunction(routerInfo.router);
      }

      return null;
    },
  };
};



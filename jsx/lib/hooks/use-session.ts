import { responseMapper } from "../utils/response-mapper";
import { useClient } from "./use-client";
import useSWR, { useSWRConfig } from "swr";
import { useCallback } from "react";
import { ApiResult } from "@/types";
import { Session, SessionToken } from "@/types";
import { Client } from "@/types";
import { useDeployment } from "./use-deployment";
import { useNavigation } from "./use-navigation";

type UseSessionReturnType =
  | {
    loading: true;
    session: never;
    switchSignIn: never;
    switchOrganization: never;
    switchWorkspace: never;
    signOut: never;
    getToken: never;
    error: Error | null;
    refetch: () => Promise<void>;
  }
  | {
    loading: false;
    error: Error | null;
    session: Session;
    switchSignIn: (signInId: string) => Promise<void>;
    signOut: (signInId?: string) => Promise<void>;
    getToken: (template?: string) => Promise<string>;
    switchOrganization: (organizationId?: string) => Promise<void>;
    switchWorkspace: (workspaceId: string) => Promise<void>;
    refetch: () => Promise<void>;
  };

async function fetchSession(client: Client): Promise<Session> {
  const response = await client("/session", {
    method: "GET",
  });
  const responseParsed = await responseMapper<Session>(response);
  return responseParsed.data;
}

async function switchSignIn(
  client: Client,
  signInId: string
): Promise<ApiResult<Session>> {
  const response = await client(
    `/session/switch-sign-in?sign_in_id=${signInId}`,
    {
      method: "POST",
    }
  );
  return responseMapper(response);
}

async function signOut(
  client: Client,
  signInId?: string
): Promise<ApiResult<Session>> {
  const url = signInId
    ? `/session/sign-out?sign_in_id=${signInId}`
    : "/session/sign-out";
  const response = await client(url, {
    method: "POST",
  });
  return responseMapper(response);
}

async function switchOrganization(
  client: Client,
  organizationId?: string
): Promise<ApiResult<Session>> {
  const response = await client(
    `/session/switch-organization${organizationId ? `?organization_id=${organizationId}` : ""
    }`,
    {
      method: "POST",
    }
  );
  return responseMapper(response);
}

async function switchWorkspace(
  client: Client,
  workspaceId: string
): Promise<ApiResult<Session>> {
  const response = await client(
    `/session/switch-workspace?workspace_id=${workspaceId}`,
    {
      method: "POST",
    }
  );
  return responseMapper(response);
}

const tokenSingletonMap = new Map<string, SessionToken>();
const fetchSingleton = new Map<string, Promise<ApiResult<SessionToken>>>();

export function clearTokenCache() {
  tokenSingletonMap.clear();
  fetchSingleton.clear();
}

async function getSessionToken(
  client: Client,
  template?: string
): Promise<ApiResult<SessionToken>> {
  const response = await client(
    `/session/token${template ? `?template=${template}` : ""}`
  );
  return responseMapper(response);
}

export function useSession(): UseSessionReturnType {
  const { client, loading } = useClient();
  const { deployment } = useDeployment();
  const { navigate } = useNavigation();
  const { cache } = useSWRConfig();
  const {
    data: session,
    error,
    mutate,
    isLoading,
  } = useSWR(!loading ? "/session" : null, () => fetchSession(client), {
    refreshInterval: 30000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateIfStale: false,
    dedupingInterval: 5000,
  });

  const refetch = useCallback(async () => {
    await mutate(undefined, { revalidate: true });
  }, [mutate]);

  const getToken = useCallback(
    async (template: string = "default") => {
      if (!session) throw new Error("no session");
      const existingToken = tokenSingletonMap.get(template);
      if (existingToken && existingToken.expires > Date.now()) {
        return existingToken?.token || "";
      }
      if (!fetchSingleton.get(template)) {
        fetchSingleton.set(template, getSessionToken(client, template));
      }
      const data = await fetchSingleton.get(template)!;
      fetchSingleton.delete(template);
      tokenSingletonMap.set(template, data.data);
      return data.data.token;
    },
    [client, session?.active_signin]
  );

  if (loading || !session || isLoading) {
    return {
      loading: true,
      error,
      session: null as never,
      switchSignIn: null as never,
      switchOrganization: null as never,
      switchWorkspace: null as never,
      signOut: null as never,
      getToken: null as never,
      refetch,
    };
  }

  return {
    loading: isLoading,
    error,
    session,
    switchSignIn: async (signInId: string) => {
      await switchSignIn(client, signInId);
      await mutate(undefined, { revalidate: true });
    },
    signOut: async (signInId?: string) => {
      await signOut(client, signInId);
      
      // Explicitly clear known SDK cache keys with specific namespacing
      // to avoid colliding with user's own cache keys.
      
      // Known SDK keys (static):
      const staticKeys = [
        "/session",
        "/user",
        "/me/signins",
        "/me/organization-memberships",
        "/me/workspace-memberships",
        "wacht-notifications:channel-counts"
      ];

      // Dynamic keys prefixes:
      const dynamicKeyPrefixes = [
        "wacht-notifications:",  // notifications
        "wacht-agent-sessions:", // use-conversation-sessions
        "wacht-agent-contexts:", // use-context-manager
        "wacht-org-domains:",    // organization domains
        "wacht-api-workspaces:", // workspace API calls
        "wacht-api-organizations:" // organization API calls
      ];

      if (cache instanceof Map) {
        // Safe iteration for Map
        // We use Array.from to avoid iteration issues if environment is old
        const keys = Array.from(cache.keys());
        for (const key of keys) {
          let shouldDelete = false;
          
          if (staticKeys.includes(key as string)) {
            shouldDelete = true;
          } else if (typeof key === 'string') {
             // check string prefixes
             if (dynamicKeyPrefixes.some(prefix => key.startsWith(prefix))) {
                shouldDelete = true;
             }
          } 
          // Note: We removed array keys because we converted them to namespaced strings
          // for better specificity and collision avoidance.

          if (shouldDelete) {
            cache.delete(key);
          }
        }
      }
      
      // Clear token cache
      clearTokenCache();
      
      await mutate(undefined, { revalidate: true });

      if (deployment?.ui_settings) {
        if (signInId && deployment.ui_settings.after_sign_out_one_page_url) {
          navigate(deployment.ui_settings.after_sign_out_one_page_url);
        } else if (!signInId && deployment.ui_settings.after_sign_out_all_page_url) {
          navigate(deployment.ui_settings.after_sign_out_all_page_url);
        }
      }
    },
    switchOrganization: async (organizationId?: string) => {
      await switchOrganization(client, organizationId);
      clearTokenCache();
      await mutate(undefined, { revalidate: true });
    },
    switchWorkspace: async (workspaceId: string) => {
      await switchWorkspace(client, workspaceId);
      clearTokenCache();
      await mutate(undefined, { revalidate: true });
    },
    getToken,
    refetch,
  };
}

import { responseMapper } from "../utils/response-mapper";
import { useClient } from "./use-client";
import useSWR from "swr";
import { useCallback } from "react";
import { ApiResult } from "@/types/client";
import { Session, SessionToken } from "@/types/session";
import { Client } from "@/types/client";
import { useOrganizationMemberships } from "./use-organization";
import { useWorkspaceMemberships } from "./use-workspace";
import { useDeployment } from "./use-deployment";

type UseSessionReturnType =
  | {
    loading: true;
    session: never;
    switchSignIn: never;
    switchOrganization: never;
    switchWorkspace: never;
    signOut: never;
    getToken: never;
    addNewAccount: never;
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
    addNewAccount: () => void;
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
  signInId: string,
): Promise<ApiResult<Session>> {
  const response = await client(
    `/session/switch-sign-in?sign_in_id=${signInId}`,
    {
      method: "POST",
    },
  );
  return responseMapper(response);
}

async function signOut(
  client: Client,
  signInId?: string,
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
  organizationId?: string,
): Promise<ApiResult<Session>> {
  const response = await client(
    `/session/switch-organization${organizationId ? `?organization_id=${organizationId}` : ""
    }`,
    {
      method: "PUT",
    },
  );
  return responseMapper(response);
}

async function switchWorkspace(
  client: Client,
  workspaceId: string,
): Promise<ApiResult<Session>> {
  const response = await client(
    `/session/switch-workspace?workspace_id=${workspaceId}`,
    {
      method: "PUT",
    },
  );
  return responseMapper(response);
}

const tokenSingletonMap = new Map<string, SessionToken>();
const fetchSingleton = new Map<string, Promise<ApiResult<SessionToken>>>();

async function getSessionToken(
  client: Client,
  template?: string,
): Promise<ApiResult<SessionToken>> {
  const response = await client(
    `/session/token${template ? `?template=${template}` : ""}`,
  );
  return responseMapper(response);
}

export function useSession(): UseSessionReturnType {
  const { client, loading } = useClient();
  const { deployment } = useDeployment();
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
  const { loading: organizationLoading } = useOrganizationMemberships();
  const { loading: workspaceLoading } = useWorkspaceMemberships();

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const getToken = useCallback(
    async (template: string = "default") => {
      if (!session) throw new Error("no session");
      const existingToken = tokenSingletonMap.get(template);
      if (existingToken && existingToken.expires > Date.now()) {
        return existingToken?.token || "";
      }
      if (!fetchSingleton.get(template)) {
        fetchSingleton.set(template, getSessionToken(client));
      }
      const data = await fetchSingleton.get(template)!;
      fetchSingleton.delete(template);
      if (data.errors?.length) {
        throw new error(data.errors[0]);
      }
      tokenSingletonMap.set(template, data.data);
      return data.data.token;
    },
    [client, session?.active_signin],
  );

  const addNewAccount = useCallback(() => {
    if (!deployment) return;

    // Use deployment configuration for sign-in URL with proper redirect
    const signinLink = deployment.ui_settings.sign_in_page_url;

    const currentHost = window.location.href;
    const url = new URL(signinLink);
    url.searchParams.set("redirect_uri", currentHost);

    // Handle staging mode dev session
    if (deployment.mode === "staging") {
      const devSession = localStorage.getItem("__dev_session__");
      if (devSession) {
        url.searchParams.set("dev_session", devSession);
      }
    }

    window.location.href = url.toString();
  }, [deployment]);

  if (loading || !session || isLoading || organizationLoading || workspaceLoading) {
    return {
      loading: true,
      error,
      session: null as never,
      switchSignIn: null as never,
      switchOrganization: null as never,
      switchWorkspace: null as never,
      signOut: null as never,
      getToken: null as never,
      addNewAccount: null as never,
      refetch,
    };
  }

  return {
    loading: isLoading || organizationLoading || workspaceLoading,
    error,
    session,
    switchSignIn: async (signInId: string) => {
      await switchSignIn(client, signInId);
      await mutate();
    },
    signOut: async (signInId?: string) => {
      await signOut(client, signInId);
      await mutate();
    },
    switchOrganization: async (organizationId?: string) => {
      await switchOrganization(client, organizationId);
      await mutate();
    },
    switchWorkspace: async (workspaceId: string) => {
      await switchWorkspace(client, workspaceId);
      await mutate();
    },
    getToken,
    addNewAccount,
    refetch,
  };
}

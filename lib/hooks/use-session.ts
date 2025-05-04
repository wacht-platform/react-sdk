import { responseMapper } from "../utils/response-mapper";
import { useClient } from "./use-client";
import useSWR from "swr";
import { useCallback } from "react";
import { ApiResult } from "@/types/client";
import { Session } from "@/types/session";
import { Client } from "@/types/client";

type UseSessionReturnType =
  | {
      loading: true;
      session: never;
      switchSignIn: never;
      switchOrganization: never;
      switchWorkspace: never;
      signOut: never;
      error: Error | null;
      refetch: () => Promise<void>;
    }
  | {
      loading: false;
      error: Error | null;
      session: Session;
      switchSignIn: (signInId: string) => Promise<void>;
      signOut: (signInId?: string) => Promise<void>;
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
    `/session/switch-organization${
      organizationId ? `?organization_id=${organizationId}` : ""
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

export function useSession(): UseSessionReturnType {
  const { client, loading } = useClient();
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
    await mutate();
  }, [mutate]);

  if (loading || !session || isLoading) {
    return {
      loading: true,
      error,
      session: null as never,
      switchSignIn: null as never,
      switchOrganization: null as never,
      switchWorkspace: null as never,
      signOut: null as never,
      refetch,
    };
  }

  return {
    loading: isLoading,
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
    refetch,
  };
}

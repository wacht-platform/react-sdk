import type { ApiResult, Client } from "../types/client";
import { mapResponse } from "../utils/response-mapper";
import { useClient } from "./use-client";
import useSWR from "swr";
import { useCallback } from "react";

type UseSessionReturnType =
  | {
    loading: true;
    session: never;
    switchSignIn: never;
    signOut: never;
    error: Error | null;
    refetch: () => Promise<void>;
  }
  | {
    loading: false;
    error: Error | null;
    session: Session;
    switchSignIn: (signInId: number) => Promise<void>;
    signOut: (signInId?: number) => Promise<void>;
    refetch: () => Promise<void>;
  };

async function fetchSession(client: Client): Promise<Session> {
  const response = await client("/session", {
    method: "GET",
  });
  const responseParsed = await mapResponse<Session>(response);
  return responseParsed.data;
}

async function switchSignIn(
  client: Client,
  signInId: number,
): Promise<ApiResult<Session>> {
  const response = await client(
    `/session/switch-sign-in?sign_in_id=${signInId}`,
    {
      method: "POST",
    },
  );
  return mapResponse(response);
}

async function signOut(
  client: Client,
  signInId?: number,
): Promise<ApiResult<Session>> {
  const url = signInId
    ? `/session/sign-out?sign_in_id=${signInId}`
    : "/session/sign-out";
  const response = await client(url, {
    method: "POST",
  });
  return mapResponse(response);
}

export function useSession(): UseSessionReturnType {
  const { client, loading } = useClient();
  const {
    data: session,
    error,
    mutate,
    isLoading,
  } = useSWR(!loading ? "/session" : null, () => fetchSession(client));

  const refetch = useCallback(async () => {
    await mutate();
  }, [mutate]);

  if (loading || !session || isLoading) {
    return {
      loading: true,
      error,
      session: null as never,
      switchSignIn: null as never,
      signOut: null as never,
      refetch,
    };
  }

  return {
    loading: isLoading,
    error,
    session,
    switchSignIn: async (signInId: number) => {
      await switchSignIn(client, signInId);
      await mutate();
    },
    signOut: async (signInId?: number) => {
      await signOut(client, signInId);
      await mutate();
    },
    refetch,
  };
}

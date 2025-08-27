import { responseMapper } from "../utils/response-mapper";
import { useClient } from "./use-client";
import useSWR from "swr";
import { ChannelCounts } from "@/types/notification";
import { Client } from "@/types";

async function fetchChannelCounts(client: Client): Promise<ChannelCounts> {
  const response = await client("/notifications/channel-counts", {
    method: "GET",
  });
  const responseParsed = await responseMapper<ChannelCounts>(response);
  return responseParsed.data;
}

type UseChannelCountsReturnType =
  | {
      loading: true;
      counts: never;
      error: Error | null;
      refetch: () => Promise<void>;
    }
  | {
      loading: false;
      counts: ChannelCounts;
      error: Error | null;
      refetch: () => Promise<void>;
    };

export function useChannelCounts(): UseChannelCountsReturnType {
  const { client, loading: clientLoading } = useClient();

  const {
    data,
    error,
    mutate: refetch,
  } = useSWR(
    !clientLoading ? ["notifications", "channel-counts"] : null,
    () => fetchChannelCounts(client),
    {
      refreshInterval: 30000, // Poll every 30 seconds
      revalidateOnFocus: true,
    }
  );

  const refetchWrapper = async () => {
    await refetch();
  };

  if (!data || clientLoading) {
    return {
      loading: true,
      counts: undefined as never,
      error,
      refetch: refetchWrapper,
    } as const;
  }

  return {
    loading: false,
    counts: data,
    error,
    refetch: refetchWrapper,
  } as const;
}
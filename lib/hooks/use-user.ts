import { useClient } from "@/hooks/use-client";
import useSWR from "swr";
import { mapResponse } from "@/utils/response-mapper";

interface UserSession {
  id: string;
  browser: string;
  ipAddress: string;
  timestamp: string;
  location: string;
}

const fetchUser = async (client: Client) => {
  const response = await mapResponse<CurrentUser>(await client("/me"));
  return response.data;
};

export function useUser() {
  const { client, loading } = useClient();
  const { data: user, isLoading, mutate } = useSWR(loading ? null : "/user", () => fetchUser(client));

  const updateProfile = async (data: any) => {
    const response = await mapResponse(await client("/me", {
      method: "PATCH",
      body: JSON.stringify(data),
    }));
    return response;
  };

  const getEmailAddresses = async () => {
    const response = await mapResponse(await client("/me/email-addresses", {
      method: "GET",
    }));
    return response;
  };

  const getEmailAddress = async (id: string) => {
    const response = await mapResponse(await client(`/me/email-addresses/${id}`, {
      method: "GET",
    }));
    return response;
  };

  const createEmailAddress = async (email: string) => {
    const response = await mapResponse<UserEmailAddress>(await client("/me/email-addresses", {
      method: "POST",
      body: JSON.stringify({ email }),
    }));
    return response;
  };

  const deleteEmailAddress = async (id: string) => {
    const response = await mapResponse(await client(`/me/email-addresses/${id}`, {
      method: "DELETE",
    }));
    return response;
  };

  const prepareEmailVerification = async (id: string) => {
    const response = await mapResponse(await client(`/me/email-addresses/${id}/prepare-verification`, {
      method: "POST",
    }));
    return response;
  };

  const attemptEmailVerification = async (id: string, otp: string) => {
    const response = await mapResponse(await client(`/me/email-addresses/${id}/attempt-verification?code=${otp}`, {
      method: "POST",
    }));
    return response;
  };

  const createPhoneNumber = async (phone_number: string) => {
    const response = await mapResponse<UserPhoneNumber>(await client("/me/phone-numbers", {
      method: "POST",
      body: JSON.stringify({ phone_number }),
    }));
    return response;
  };

  const deletePhoneNumber = async (id: string) => {
    const response = await mapResponse(await client(`/me/phone-numbers/${id}`, {
      method: "DELETE",
    }));
    return response;
  };

  const preparePhoneVerification = async (id: string) => {
    const response = await mapResponse(await client(`/me/phone-numbers/${id}/prepare-verification`, {
      method: "POST",
    }));
    return response;
  };

  const attemptPhoneVerification = async (id: string, otp: string) => {
    const response = await mapResponse(await client(`/me/phone-numbers/${id}/attempt-verification?code=${otp}`, {
      method: "POST",
    }));
    return response;
  };

  const makePhonePrimary = async (id: string) => {
    const response = await mapResponse(await client(`/me/phone-numbers/${id}/make-primary`, {
      method: "POST",
    }));
    return response;
  };

  const sessions: UserSession[] = [
    {
      id: "1",
      browser: "Chrome on MacOS",
      ipAddress: "192.168.1.1",
      timestamp: "Last active 2 hours ago",
      location: "San Francisco, US",
    },
    {
      id: "2",
      browser: "Safari on iOS",
      ipAddress: "192.168.1.2",
      timestamp: "Last active 5 minutes ago",
      location: "New York, US",
    },
  ];

  return {
    user: {
      ...user,
      sessions,
      refetch: mutate,
    },
    updateProfile,
    getEmailAddresses,
    getEmailAddress,
    createEmailAddress,
    deleteEmailAddress,
    prepareEmailVerification,
    attemptEmailVerification,
    createPhoneNumber,
    deletePhoneNumber,
    preparePhoneVerification,
    attemptPhoneVerification,
    makePhonePrimary,
    loading: isLoading || loading,
  };
}

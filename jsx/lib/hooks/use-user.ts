import { useClient } from "@/hooks/use-client";
import useSWR from "swr";
import { responseMapper } from "@/utils/response-mapper";
import {
  CurrentUser,
  UserAuthenticator,
  UserEmailAddress,
  UserPhoneNumber,
} from "@/types";
import { Client } from "@/types";
import { SignIn } from "@/types";
import { useSession } from "./use-session";
import { useOrganizationMemberships } from "./use-organization";
import { useWorkspaceMemberships } from "./use-workspace";
import { useMemo } from "react";

type SecondFactorPolicy = "none" | "optional" | "enforced";

interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  username?: string;
  primary_email_address_id?: string;
  primary_phone_number_id?: string;
  second_factor_policy?: SecondFactorPolicy;
  remove_profile_picture?: boolean;
}

const fetchUser = async (client: Client) => {
  const response = await responseMapper<CurrentUser>(await client("/me"));
  return response.data;
};

const fetchUserSignins = async (client: Client) => {
  const response = await responseMapper<SignIn[]>(await client("/me/signins"));
  return response.data;
};

export function useUser() {
  const { client, loading } = useClient();
  const {
    data: user,
    error,
    isLoading,
    mutate,
  } = useSWR(loading ? null : "/user", () => fetchUser(client));

  const updateProfile = async (data: ProfileUpdateData) => {
    const form = new FormData();
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && value !== null && value !== "") {
        form.append(key, String(value));
      }
    }

    const response = await responseMapper(
      await client("/me", {
        method: "POST",
        body: form,
      }),
    );
    mutate();
    return response;
  };

  const getEmailAddresses = async () => {
    const response = await responseMapper(
      await client("/me/email-addresses", {
        method: "GET",
      }),
    );
    return response;
  };

  const getEmailAddress = async (id: string) => {
    const response = await responseMapper(
      await client(`/me/email-addresses/${id}`, {
        method: "GET",
      }),
    );
    return response;
  };

  const createEmailAddress = async (email: string) => {
    const form = new FormData();
    form.append("email", email);

    const response = await responseMapper<UserEmailAddress>(
      await client("/me/email-addresses", {
        method: "POST",
        body: form,
      }),
    );
    return response;
  };

  const deleteEmailAddress = async (id: string) => {
    const response = await responseMapper(
      await client(`/me/email-addresses/${id}/delete`, {
        method: "POST",
      }),
    );
    return response;
  };

  const prepareEmailVerification = async (id: string) => {
    const response = await responseMapper(
      await client(`/me/email-addresses/${id}/prepare-verification`, {
        method: "POST",
      }),
    );
    return response;
  };

  const attemptEmailVerification = async (id: string, otp: string) => {
    const response = await responseMapper(
      await client(
        `/me/email-addresses/${id}/attempt-verification?code=${otp}`,
        {
          method: "POST",
        },
      ),
    );
    return response;
  };

  const createPhoneNumber = async (
    phone_number: string,
    country_code: string,
  ) => {
    const form = new FormData();
    form.append("phone_number", phone_number);
    form.append("country_code", country_code);

    const response = await responseMapper<UserPhoneNumber>(
      await client("/me/phone-numbers", {
        method: "POST",
        body: form,
      }),
    );
    return response;
  };

  const deletePhoneNumber = async (id: string) => {
    const response = await responseMapper(
      await client(`/me/phone-numbers/${id}/delete`, {
        method: "POST",
      }),
    );
    return response;
  };

  const preparePhoneVerification = async (id: string) => {
    const response = await responseMapper(
      await client(`/me/phone-numbers/${id}/prepare-verification`, {
        method: "POST",
      }),
    );
    return response;
  };

  const attemptPhoneVerification = async (id: string, otp: string) => {
    const form = new FormData();
    form.append("code", otp);

    const response = await responseMapper(
      await client(`/me/phone-numbers/${id}/attempt-verification`, {
        method: "POST",
        body: form,
      }),
    );
    return response;
  };

  const makePhonePrimary = async (id: string) => {
    const response = await responseMapper(
      await client(`/me/phone-numbers/${id}/make-primary`, {
        method: "POST",
      }),
    );
    mutate();
    return response;
  };

  const makeEmailPrimary = async (id: string) => {
    const response = await responseMapper(
      await client(`/me/email-addresses/${id}/make-primary`, {
        method: "POST",
      }),
    );
    return response;
  };

  const setupAuthenticator = async () => {
    const response = await responseMapper<UserAuthenticator>(
      await client("/me/authenticator", {
        method: "POST",
      }),
    );
    return response.data;
  };

  const verifyAuthenticator = async (id: string, codes: string[]) => {
    const form = new FormData();
    form.append("authenticator_id", id);
    codes.forEach((code) => {
      form.append("codes", code);
    });

    const response = await responseMapper(
      await client("/me/authenticator/attempt-verification", {
        method: "POST",
        body: form,
      }),
    );
    return response;
  };

  const deleteAuthenticator = async (id: string) => {
    const response = await responseMapper(
      await client(`/me/authenticator/${id}/delete`, {
        method: "POST",
      }),
    );
    return response;
  };

  const generateBackupCodes = async () => {
    const response = await responseMapper<string[]>(
      await client("/me/backup-codes", {
        method: "POST",
      }),
    );
    return response.data;
  };

  const updateProfilePicture = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await responseMapper(
      await client("/me/profile-picture", {
        method: "POST",
        body: formData,
      }),
    );
    return response;
  };

  const regenerateBackupCodes = async () => {
    const response = await responseMapper<string[]>(
      await client("/me/backup-codes/regenerate", {
        method: "POST",
      }),
    );
    return response.data;
  };

  const updatePassword = async (
    currentPassword: string,
    newPassword: string,
  ) => {
    const form = new FormData();
    form.append("current_password", currentPassword);
    form.append("new_password", newPassword);

    const response = await responseMapper(
      await client("/me/update-password", {
        method: "POST",
        body: form,
      }),
    );
    return response;
  };

  const removePassword = async (currentPassword: string) => {
    const form = new FormData();
    form.append("current_password", currentPassword);

    const response = await responseMapper(
      await client("/me/remove-password", {
        method: "POST",
        body: form,
      }),
    );
    mutate(); // Refresh user data after removing password
    return response;
  };

  const deleteAccount = async (password: string) => {
    const form = new FormData();
    form.append("password", password);

    const response = await responseMapper(
      await client("/me/account/delete", {
        method: "POST",
        body: form,
      }),
    );
    return response;
  };

  const disconnectSocialConnection = async (id: string) => {
    const response = await responseMapper(
      await client(`/me/social-connections/${id}/disconnect`, {
        method: "POST",
      }),
    );
    return response;
  };

  const connectSocialAccount = async ({
    provider,
    redirectUri,
  }: {
    provider: string;
    redirectUri?: string;
  }) => {
    const params = new URLSearchParams({ provider });
    if (redirectUri) {
      params.append("redirect_uri", redirectUri);
    }

    const response = await responseMapper<{ oauth_url: string }>(
      await client(`/me/init-sso-connection?${params.toString()}`, {
        method: "POST",
      }),
    );

    if ("data" in response && response.data?.oauth_url) {
      window.open(response.data.oauth_url, "_blank");
    }

    return response;
  };

  return {
    user: {
      ...user,
      refetch: mutate,
    },
    loading: loading || isLoading,
    error: error || null,
    updateProfile,
    getEmailAddresses,
    getEmailAddress,
    createEmailAddress,
    deleteEmailAddress,
    prepareEmailVerification,
    attemptEmailVerification,
    makeEmailPrimary,
    createPhoneNumber,
    deletePhoneNumber,
    preparePhoneVerification,
    attemptPhoneVerification,
    makePhonePrimary,
    setupAuthenticator,
    verifyAuthenticator,
    deleteAuthenticator,
    generateBackupCodes,
    regenerateBackupCodes,
    updateProfilePicture,
    disconnectSocialConnection,
    connectSocialAccount,
    updatePassword,
    removePassword,
    deleteAccount,
  };
}

export function useUserSignins() {
  const { client, loading } = useClient();
  const {
    data: signins,
    error,
    isLoading,
    mutate,
  } = useSWR(loading ? null : "/me/signins", () => fetchUserSignins(client));

  const removeSignin = async (id: string) => {
    const response = await responseMapper(
      await client(`/me/signins/${id}/signout`, {
        method: "POST",
      }),
    );
    return response;
  };

  return {
    signins,
    error: error || null,
    removeSignin,
    refetch: mutate,
    loading: isLoading || loading,
  };
}

export function useActiveTenancy() {
  const { session, loading: sessionLoading } = useSession();
  const { loading: organizationMembershipsLoading, organizationMemberships } =
    useOrganizationMemberships();
  const { loading: useWorkspaceMembershipsLoading, workspaceMemberships } =
    useWorkspaceMemberships();

  if (
    sessionLoading ||
    organizationMembershipsLoading ||
    useWorkspaceMembershipsLoading
  )
    return {
      loading: true,
      orgMembership: null,
      workspaceMembership: null,
    };

  const activeOrganizationMembership = useMemo(() => {
    if (!session || !session.signins || session.signins.length === 0)
      return null;
    return organizationMemberships?.find(
      (membership) =>
        membership.id ===
        session.active_signin?.active_organization_membership_id,
    );
  }, [session]);

  const activeWorkspaceMembership = useMemo(() => {
    if (!session || !session.signins || session.signins.length === 0)
      return null;
    return workspaceMemberships?.find(
      (membership) =>
        membership.id === session.active_signin?.active_workspace_membership_id,
    );
  }, [session]);

  return {
    loading: false,
    orgMembership: activeOrganizationMembership,
    workspaceMembership: activeWorkspaceMembership,
  };
}

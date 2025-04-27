import { useClient } from "@/hooks/use-client";
import useSWR from "swr";
import { mapResponse } from "@/utils/response-mapper";
import { CurrentUser, UserAuthenticator, UserEmailAddress, UserPhoneNumber } from "@/types/user";
import { Client } from "@/types/client";
import { SignIn } from "@/types/session";

type SecondFactorPolicy = "none" | "optional" | "enforced";

interface ProfileUpdateData {
	first_name?: string;
	last_name?: string;
	username?: string;
	primary_email_address_id?: string;
	primary_phone_number_id?: string;
	second_factor_policy?: SecondFactorPolicy;
}

const fetchUser = async (client: Client) => {
	const response = await mapResponse<CurrentUser>(await client("/me"));
	return response.data;
};

const fetchUserSignins = async (client: Client) => {
	const response = await mapResponse<SignIn[]>(await client("/me/signins"));
	return response.data;
};

export function useUser() {
	const { client, loading } = useClient();
	const {
		data: user,
		isLoading,
		mutate,
	} = useSWR(loading ? null : "/user", () => fetchUser(client));

	const updateProfile = async (data: ProfileUpdateData) => {
		const response = await mapResponse(
			await client("/me", {
				method: "PATCH",
				body: JSON.stringify(data),
			}),
		);
		mutate();
		return response;
	};

	const getEmailAddresses = async () => {
		const response = await mapResponse(
			await client("/me/email-addresses", {
				method: "GET",
			}),
		);
		return response;
	};

	const getEmailAddress = async (id: string) => {
		const response = await mapResponse(
			await client(`/me/email-addresses/${id}`, {
				method: "GET",
			}),
		);
		return response;
	};

	const createEmailAddress = async (email: string) => {
		const response = await mapResponse<UserEmailAddress>(
			await client("/me/email-addresses", {
				method: "POST",
				body: JSON.stringify({ email }),
			}),
		);
		return response;
	};

	const deleteEmailAddress = async (id: string) => {
		const response = await mapResponse(
			await client(`/me/email-addresses/${id}`, {
				method: "DELETE",
			}),
		);
		return response;
	};

	const prepareEmailVerification = async (id: string) => {
		const response = await mapResponse(
			await client(`/me/email-addresses/${id}/prepare-verification`, {
				method: "POST",
			}),
		);
		return response;
	};

	const attemptEmailVerification = async (id: string, otp: string) => {
		const response = await mapResponse(
			await client(
				`/me/email-addresses/${id}/attempt-verification?code=${otp}`,
				{
					method: "POST",
				},
			),
		);
		return response;
	};

	const createPhoneNumber = async (phone_number: string) => {
		const response = await mapResponse<UserPhoneNumber>(
			await client("/me/phone-numbers", {
				method: "POST",
				body: JSON.stringify({ phone_number }),
			}),
		);
		return response;
	};

	const deletePhoneNumber = async (id: string) => {
		const response = await mapResponse(
			await client(`/me/phone-numbers/${id}`, {
				method: "DELETE",
			}),
		);
		return response;
	};

	const preparePhoneVerification = async (id: string) => {
		const response = await mapResponse(
			await client(`/me/phone-numbers/${id}/prepare-verification`, {
				method: "POST",
			}),
		);
		return response;
	};

	const attemptPhoneVerification = async (id: string, otp: string) => {
		const response = await mapResponse(
			await client(`/me/phone-numbers/${id}/attempt-verification?code=${otp}`, {
				method: "POST",
			}),
		);
		return response;
	};

	const makePhonePrimary = async (id: string) => {
		const response = await mapResponse(
			await client(`/me/phone-numbers/${id}/make-primary`, {
				method: "POST",
			}),
		);
		return response;
	};

	const setupAuthenticator = async () => {
		const response = await mapResponse<UserAuthenticator>(
			await client("/me/authenticator", {
				method: "POST",
			}),
		);
		return response.data;
	};

	const verifyAuthenticator = async (id: string, codes: string[]) => {
		const response = await mapResponse(
			await client("/me/authenticator/attempt-verification", {
				method: "POST",
				body: JSON.stringify({ codes, authenticator_id: id }),
			}),
		);
		return response;
	};

	const deleteAuthenticator = async (id: string) => {
		const response = await mapResponse(
			await client(`/me/authenticator/${id}`, {
				method: "DELETE",
			}),
		);
		return response;
	};

	const generateBackupCodes = async () => {
		const response = await mapResponse<string[]>(
			await client("/me/backup-codes", {
				method: "POST",
			}),
		);
		return response.data;
	};

	const updateProfilePicture = async (file: File) => {
		const formData = new FormData();
		formData.append("file", file);

		const response = await mapResponse(
			await client("/me/profile-picture", {
				method: "POST",
				body: formData,
			}),
		);
		return response;
	};

	const regenerateBackupCodes = async () => {
		const response = await mapResponse<string[]>(
			await client("/me/backup-codes/regenerate", {
				method: "POST",
			}),
		);
		return response.data;
	};

	return {
		user: {
			...user,
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
		setupAuthenticator,
		verifyAuthenticator,
		deleteAuthenticator,
		generateBackupCodes,
		regenerateBackupCodes,
		updateProfilePicture,
		loading: isLoading || loading,
	};
}

export function useUserSignins() {
	const { client, loading } = useClient();
	const { data: signins, isLoading } = useSWR(
		loading ? null : "/me/signins",
		() => fetchUserSignins(client),
	);

	const removeSignin = async (id: string) => {
		const response = await mapResponse(
			await client(`/me/signins/${id}/signout`, {
				method: "PATCH",
			}),
		);
		return response;
	};

	return {
		signins,
		removeSignin,
		loading: isLoading || loading,
	};
}

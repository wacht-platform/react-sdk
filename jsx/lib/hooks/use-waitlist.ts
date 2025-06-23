import { useState } from "react";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import { type ApiResult, type ErrorInterface, ErrorCode } from "@/types/client";

export interface WaitlistParams {
	first_name: string;
	last_name: string;
	email: string;
}

export interface WaitlistEntry {
	id: string;
	deployment_id: number;
	email_address: string;
	first_name: string;
	last_name: string;
	created_at: string;
	updated_at: string;
}

export interface WaitlistResponse {
	message: string;
	entry: WaitlistEntry;
}

export function useWaitlist() {
	const { client, loading: clientLoading } = useClient();
	const [loading, setLoading] = useState(false);
	const [errors, setErrors] = useState<ApiResult<
		unknown,
		ErrorInterface
	> | null>(null);

	const joinWaitlist = async (
		params: WaitlistParams,
	): Promise<ApiResult<WaitlistResponse, ErrorInterface>> => {
		setLoading(true);
		setErrors(null);

		try {
			const form = new FormData();
			for (const [key, value] of Object.entries(params)) {
				if (value) {
					form.append(key, value);
				}
			}

			const response = await client("/waitlist/join", {
				method: "POST",
				body: form,
			});

			const result = await responseMapper<WaitlistResponse>(response);
			setErrors(result.errors ? result : null);
			return result;
		} catch (error) {
			const errorResult: ApiResult<WaitlistResponse, ErrorInterface> = {
				data: null as never,
				errors: [
					{
						message:
							error instanceof Error
								? error.message
								: "Failed to join waitlist",
						code: ErrorCode.Unknown,
					},
				],
			};
			setErrors(errorResult);
			return errorResult;
		} finally {
			setLoading(false);
		}
	};

	if (clientLoading) {
		return {
			loading: true,
			errors: null,
			joinWaitlist: null as never,
		};
	}

	return {
		loading,
		errors,
		joinWaitlist,
	};
}

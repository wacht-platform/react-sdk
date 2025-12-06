import { useState } from "react";
import { useClient } from "./use-client";
import { responseMapper } from "../utils/response-mapper";
import { type ApiResult, type ErrorInterface } from "@/types";

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

	const joinWaitlist = async (
		params: WaitlistParams,
	): Promise<ApiResult<WaitlistResponse, ErrorInterface>> => {
		setLoading(true);

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
			return result;
		} finally {
			setLoading(false);
		}
	};

	if (clientLoading) {
		return {
			loading: true,
			joinWaitlist: null as never,
		};
	}

	return {
		loading,
		joinWaitlist,
	};
}

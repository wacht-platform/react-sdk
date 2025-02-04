import type { ApiResult } from "../types/client";

export async function mapResponse<T>(
	response: Response,
): Promise<ApiResult<T>> {
	const json = await response.json();

	return {
		data: json.data,
		error: json.errors,
	} as ApiResult<T>;
}

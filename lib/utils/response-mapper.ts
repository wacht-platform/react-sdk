import { ApiResult } from "@/types/client";

export async function responseMapper<T>(
  response: Response,
): Promise<ApiResult<T>> {
  const json = await response.json();

  return {
    data: json.data,
    errors: json.errors,
  } as ApiResult<T>;
}

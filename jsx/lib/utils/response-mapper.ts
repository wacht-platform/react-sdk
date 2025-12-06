import { ApiResult } from "@/types";

export async function responseMapper<T>(
  response: Response,
): Promise<ApiResult<T>> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const json = await response.json();
      if (json.message) {
        errorMessage = json.message;
      } else if (json.errors && json.errors.length > 0) {
        errorMessage = json.errors[0].message || errorMessage;
      }
    } catch {}

    throw new Error(errorMessage);
  }

  const json = await response.json();

  return {
    data: json.data,
  } as ApiResult<T>;
}

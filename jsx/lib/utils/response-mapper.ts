import { ApiResult } from "@/types/client";

export async function responseMapper<T>(
  response: Response,
): Promise<ApiResult<T>> {
  if (!response.ok) {
    // Handle HTTP errors (400+)
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      // Try to get a more specific error message from the response body
      const json = await response.json();
      if (json.message) {
        errorMessage = json.message;
      } else if (json.errors && json.errors.length > 0) {
        errorMessage = json.errors[0].message || errorMessage;
      }
    } catch {
      // If JSON parsing fails, use the default HTTP error message
    }
    
    throw new Error(errorMessage);
  }

  const json = await response.json();

  return {
    data: json.data,
    errors: json.errors,
  } as ApiResult<T>;
}

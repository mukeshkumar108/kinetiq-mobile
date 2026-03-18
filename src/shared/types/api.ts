/**
 * Backend response envelope.
 * Every endpoint returns this exact shape — see handover doc section 1.
 */

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  error: null;
};

export type ApiErrorResponse = {
  success: false;
  data: null;
  error: {
    message: string;
    code: string;
  };
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Structured error thrown for any backend envelope error.
 * Both the response interceptor (4xx/5xx) and unwrapResponse (200 + success:false)
 * funnel into this single error type.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Extract data from a successful response envelope.
 * Throws ApiError if the backend returned success: false.
 */
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new ApiError(response.error.message, response.error.code);
  }
  return response.data;
}

/**
 * Type guard: checks if an unknown response body is the backend error envelope.
 * Used by the Axios response interceptor to normalize 4xx/5xx errors.
 */
export function isApiErrorEnvelope(
  body: unknown,
): body is ApiErrorResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    (body as Record<string, unknown>).success === false &&
    "error" in body &&
    typeof (body as Record<string, unknown>).error === "object"
  );
}

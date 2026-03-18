import axios, { AxiosError } from "axios";
import { env } from "@/shared/config/env";
import { getBearerToken } from "@/modules/auth/token";
import type { ApiResponse } from "@/shared/types/api";
import { ApiError, unwrapResponse, isApiErrorEnvelope } from "@/shared/types/api";

/**
 * Single centralized Axios instance.
 * Token injection and error normalization happen here and nowhere else.
 */
export const apiClient = axios.create({
  baseURL: env.API_URL,
  headers: { "Content-Type": "application/json" },
});

// --- Request interceptor: inject bearer token ---
apiClient.interceptors.request.use(async (config) => {
  const token = await getBearerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response interceptor: normalize backend envelope errors ---
// When the backend returns 4xx/5xx with { success: false, error: { message, code } },
// Axios throws before unwrapResponse runs. This interceptor catches that case and
// throws ApiError so consumers always get a consistent error type.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.data && isApiErrorEnvelope(error.response.data)) {
      const envelope = error.response.data;
      throw new ApiError(envelope.error.message, envelope.error.code);
    }
    // Network errors, timeouts, etc. — let them through as-is
    throw error;
  },
);

// --- Typed request helpers that unwrap the response envelope ---

export async function apiGet<T>(
  url: string,
  params?: Record<string, string | boolean | undefined>,
): Promise<T> {
  const res = await apiClient.get<ApiResponse<T>>(url, { params });
  return unwrapResponse(res.data);
}

export async function apiPost<T>(
  url: string,
  body?: unknown,
): Promise<T> {
  const res = await apiClient.post<ApiResponse<T>>(url, body);
  return unwrapResponse(res.data);
}

export async function apiPatch<T>(
  url: string,
  body?: unknown,
): Promise<T> {
  const res = await apiClient.patch<ApiResponse<T>>(url, body);
  return unwrapResponse(res.data);
}

export async function apiDelete<T>(url: string): Promise<T> {
  const res = await apiClient.delete<ApiResponse<T>>(url);
  return unwrapResponse(res.data);
}

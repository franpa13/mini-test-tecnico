import { ApiError } from "@/shared/types/api-error";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

interface ApiEnvelope<T> {
  success: boolean;
  statusCode: number;
  data?: T;
  message?: string;
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, init);
  const body = (await res.json()) as ApiEnvelope<T>;

  if (!res.ok || !body.success) {
    throw new ApiError(body.message ?? "Error consultando la API", body.statusCode ?? res.status);
  }

  return body.data as T;
}

import { getStoredToken } from './sessionStorage';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

function getErrorMessage(payload: unknown) {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = payload.message;
    return Array.isArray(message) ? message.join(', ') : String(message);
  }

  return typeof payload === 'string' && payload.trim() ? payload : 'Error inesperado al consumir la API';
}

export async function request<T>(path: string, options: RequestOptions = {}) {
  const token = options.token ?? getStoredToken();
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: options.body ? (isFormData ? (options.body as FormData) : JSON.stringify(options.body)) : undefined,
    });
  } catch {
    throw new ApiError('No fue posible conectar con el servidor', 0);
  }

  if (!response.ok) {
    const payload = await response.json().catch(async () => response.text().catch(() => null));
    throw new ApiError(getErrorMessage(payload), response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

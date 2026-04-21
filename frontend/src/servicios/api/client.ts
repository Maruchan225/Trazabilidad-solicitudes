import { obtenerTokenGuardado } from '@/servicios/autenticacion/autenticacion.storage';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

type MetodoHttp = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

type OpcionesRequest = {
  method?: MetodoHttp;
  body?: unknown;
  token?: string | null;
  headers?: HeadersInit;
};

export class ApiError extends Error {
  statusCode: number;

  constructor(message: string | string[], statusCode: number) {
    const texto = Array.isArray(message) ? message.join(', ') : message;
    super(texto);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export function extraerMensajeErrorApi(
  payload: unknown,
  mensajePorDefecto: string,
): string | string[] {
  if (
    payload &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof payload.message !== 'undefined'
  ) {
    return payload.message as string | string[];
  }

  if (typeof payload === 'string' && payload.trim()) {
    return payload;
  }

  return mensajePorDefecto;
}

async function solicitar<T>(endpoint: string, opciones: OpcionesRequest = {}) {
  const {
    method = 'GET',
    body,
    token = obtenerTokenGuardado(),
    headers,
  } = opciones;

  const esFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  let response: Response;

  try {
    response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers: {
        ...(esFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body
        ? esFormData
          ? body
          : JSON.stringify(body)
        : undefined,
    });
  } catch {
    throw new ApiError('No fue posible conectar con el servidor', 0);
  }

  if (!response.ok) {
    const error = await response
      .json()
      .catch(async () => {
        const texto = await response.text().catch(() => '');
        return texto || null;
      });

    throw new ApiError(
      extraerMensajeErrorApi(error, 'Error inesperado al consumir la API'),
      response.status,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiClient = {
  get: <T>(
    endpoint: string,
    opciones?: Omit<OpcionesRequest, 'method' | 'body'>,
  ) => solicitar<T>(endpoint, { ...opciones, method: 'GET' }),
  post: <T>(
    endpoint: string,
    body?: unknown,
    opciones?: Omit<OpcionesRequest, 'method' | 'body'>,
  ) => solicitar<T>(endpoint, { ...opciones, method: 'POST', body }),
  patch: <T>(
    endpoint: string,
    body?: unknown,
    opciones?: Omit<OpcionesRequest, 'method' | 'body'>,
  ) => solicitar<T>(endpoint, { ...opciones, method: 'PATCH', body }),
  put: <T>(
    endpoint: string,
    body?: unknown,
    opciones?: Omit<OpcionesRequest, 'method' | 'body'>,
  ) => solicitar<T>(endpoint, { ...opciones, method: 'PUT', body }),
  delete: <T>(
    endpoint: string,
    opciones?: Omit<OpcionesRequest, 'method' | 'body'>,
  ) => solicitar<T>(endpoint, { ...opciones, method: 'DELETE' }),
};

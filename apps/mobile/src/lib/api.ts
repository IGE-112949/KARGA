export type ErrorDetail = { field: string; message: string };

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: ErrorDetail[]) {
    super(message);
    this.name = 'ApiError';
  }
}

export type Api = {
  get<T>(path: string): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  patch<T>(path: string, body: unknown): Promise<T>;
  put<T>(path: string, body: unknown): Promise<T>;
  upload<T>(path: string, form: FormData, method?: 'PUT' | 'POST'): Promise<T>;
  del(path: string): Promise<void>;
};

// Cliente HTTP da API KARGA: junta o JWT e converte o formato de erro { error: { code, message, details } }.
export function createApi(getToken: () => Promise<string | null>, baseUrl: string, onUnauthorized: () => void): Api {
  async function request<T>(method: string, path: string, body?: unknown, form?: FormData): Promise<T> {
    const token = await getToken();
    // Sem token (ex.: a Auth não respondeu ao renovar a sessão) a API devolvia 401 e a sessão terminava; assim não.
    if (!token) throw new ApiError(0, 'NO_SESSION', 'Não foi possível validar a sessão. Tenta novamente.');
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    let res: Response;
    try {
      res = await fetch(baseUrl.replace(/\/$/, '') + path, {
        method,
        headers,
        body: form ?? (body !== undefined ? JSON.stringify(body) : undefined),
      });
    } catch (e) {
      // Em desenvolvimento, o motivo real aparece no terminal do Expo.
      if (typeof __DEV__ !== 'undefined' && __DEV__) console.warn(`[api] ${method} ${path} falhou:`, e);
      throw new ApiError(0, 'NETWORK_ERROR', 'Sem ligação à internet ou servidor indisponível.');
    }
    if (res.status === 204) return undefined as T;
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      if (res.status === 401) onUnauthorized();
      const e = (data as { error?: { code?: string; message?: string; details?: ErrorDetail[] } } | null)?.error;
      if (e?.code) throw new ApiError(res.status, e.code, e.message ?? 'Ocorreu um erro.', e.details);
      throw new ApiError(res.status, 'HTTP_ERROR', 'Ocorreu um erro. Tenta novamente.');
    }
    return data as T;
  }

  return {
    get: (path) => request('GET', path),
    post: (path, body) => request('POST', path, body),
    patch: (path, body) => request('PATCH', path, body),
    put: (path, body) => request('PUT', path, body),
    upload: (path, form, method = 'PUT') => request(method, path, undefined, form),
    del: (path) => request<void>('DELETE', path),
  };
}

import { createApi, ApiError } from '@/lib/api';

function stubFetch(impl: (url: string, init: RequestInit) => Promise<Response>) {
  const fn = jest.fn(impl);
  (globalThis as unknown as { fetch: typeof fn }).fetch = fn;
  return fn;
}
const json = (status: number, body?: unknown) =>
  new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const make = (onUnauthorized = jest.fn()) => ({ api: createApi(async () => 'tok', 'http://api.test', onUnauthorized), onUnauthorized });

describe('createApi', () => {
  it('sem token (Auth indisponível) não chama a API nem termina a sessão', async () => {
    const f = stubFetch(async () => json(401, { error: { code: 'UNAUTHORIZED', message: 'x' } }));
    const onUnauthorized = jest.fn();
    const api = createApi(async () => null, 'http://api.test', onUnauthorized);
    await expect(api.get('/me')).rejects.toMatchObject({ code: 'NO_SESSION' });
    expect(f).not.toHaveBeenCalled();
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('envia o token no header Authorization', async () => {
    const f = stubFetch(async () => json(200, { ok: true }));
    const { api } = make();
    await api.get('/me');
    expect(f.mock.calls[0][0]).toBe('http://api.test/me');
    expect((f.mock.calls[0][1].headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('erro da API vira ApiError com status e code', async () => {
    stubFetch(async () => json(404, { error: { code: 'PROFILE_NOT_FOUND', message: 'x' } }));
    const { api } = make();
    await expect(api.get('/me')).rejects.toMatchObject({ status: 404, code: 'PROFILE_NOT_FOUND', message: 'x' });
  });

  it('erro de validação usa como mensagem a do primeiro campo (ex.: hora que já passou)', async () => {
    stubFetch(async () => json(400, { error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos', details: [{ field: 'start', message: 'Essa hora já passou.' }] } }));
    const { api } = make();
    await expect(api.get('/x')).rejects.toMatchObject({ code: 'VALIDATION_ERROR', message: 'Essa hora já passou.' });
  });

  it('mantém os detalhes de validação', async () => {
    const details = [{ field: 'plate', message: 'Matrícula inválida' }];
    stubFetch(async () => json(400, { error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos', details } }));
    const { api } = make();
    const err = (await api.post('/me/vehicles', {}).catch((e) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.details).toEqual(details);
  });

  it('falha de rede vira NETWORK_ERROR', async () => {
    stubFetch(async () => { throw new TypeError('Network request failed'); });
    const { api } = make();
    await expect(api.get('/me')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });

  it('401 chama onUnauthorized', async () => {
    stubFetch(async () => json(401, { error: { code: 'UNAUTHORIZED', message: 'Sessão inválida ou expirada' } }));
    const { api, onUnauthorized } = make();
    await expect(api.get('/me')).rejects.toMatchObject({ status: 401 });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('204 devolve undefined', async () => {
    stubFetch(async () => new Response(null, { status: 204 }));
    const { api } = make();
    await expect(api.del('/me')).resolves.toBeUndefined();
  });

  it('erro sem corpo JSON vira HTTP_ERROR', async () => {
    stubFetch(async () => new Response('<html>', { status: 502 }));
    const { api } = make();
    await expect(api.get('/me')).rejects.toMatchObject({ status: 502, code: 'HTTP_ERROR' });
  });
});

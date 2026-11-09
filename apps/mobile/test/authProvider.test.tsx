import { render, screen, act } from '@testing-library/react-native';
import { Text } from 'react-native';

type Cb = (event: string, session: unknown) => void;
jest.mock('@/lib/supabase', () => {
  const auth = {
    getSession: jest.fn(),
    signOut: jest.fn(async (_o?: unknown) => ({ error: null })),
    onAuthStateChange: jest.fn((cb: unknown) => { auth.cb = cb; return { data: { subscription: { unsubscribe: jest.fn() } } }; }),
    cb: null as unknown,
  };
  return { supabase: { auth } };
});
const mockAuth = (jest.requireMock('@/lib/supabase') as { supabase: { auth: { getSession: jest.Mock; signOut: jest.Mock; cb: Cb | null } } }).supabase.auth;

import { AuthProvider, useAuth } from '@/auth/AuthProvider';

const sessionOf = (id: string) => ({ access_token: `tok-${id}`, user: { id } });
const profileOf = (id: string) => ({ id, fullName: `User ${id}`, phone: null, avatarUrl: null, isDriver: true, isHost: false, termsAcceptedAt: 'x', vehicles: [] });
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

let latest: ReturnType<typeof useAuth>;
function Probe() {
  latest = useAuth();
  return <Text testID="probe">{`${latest.status}|${latest.profile?.id ?? '-'}`}</Text>;
}
const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.cb = null;
});

describe('AuthProvider', () => {
  it('sem rede ao arrancar (refresh falhou) → error, não boas-vindas', async () => {
    const { AuthRetryableFetchError } = jest.requireActual('@supabase/supabase-js');
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: new AuthRetryableFetchError('Failed to fetch', 0) });
    await render(<AuthProvider><Probe /></AuthProvider>);
    await flush();
    expect(screen.getByTestId('probe').props.children).toBe('error|-');
  });

  it('terminar sessão limpa a sessão local mesmo sem rede', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    await render(<AuthProvider><Probe /></AuthProvider>);
    await flush();
    await act(() => latest.signOut());
    expect(mockAuth.signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('falha ao atualizar o perfil mantém o perfil já carregado', async () => {
    mockAuth.getSession.mockResolvedValue({ data: { session: sessionOf('a') }, error: null });
    const fetchMock = jest.fn().mockResolvedValueOnce(json(200, profileOf('a'))).mockRejectedValueOnce(new TypeError('Network request failed'));
    (globalThis as unknown as { fetch: unknown }).fetch = fetchMock;
    await render(<AuthProvider><Probe /></AuthProvider>);
    await flush();
    expect(screen.getByTestId('probe').props.children).toBe('ready|a');
    await act(async () => { await latest.refreshProfile(); });
    expect(screen.getByTestId('probe').props.children).toBe('ready|a');
  });

  it('resposta atrasada do utilizador anterior é ignorada', async () => {
    let resolveA!: (r: Response) => void;
    mockAuth.getSession.mockResolvedValue({ data: { session: sessionOf('a') }, error: null });
    const fetchMock = jest.fn()
      .mockImplementationOnce(() => new Promise<Response>((r) => { resolveA = r; }))
      .mockResolvedValueOnce(json(200, profileOf('b')));
    (globalThis as unknown as { fetch: unknown }).fetch = fetchMock;
    await render(<AuthProvider><Probe /></AuthProvider>);
    await flush();
    mockAuth.getSession.mockResolvedValue({ data: { session: sessionOf('b') }, error: null });
    await act(async () => { mockAuth.cb!('SIGNED_IN', sessionOf('b')); });
    await flush();
    expect(screen.getByTestId('probe').props.children).toBe('ready|b');
    await act(async () => { resolveA(json(200, profileOf('a'))); });
    await flush();
    expect(screen.getByTestId('probe').props.children).toBe('ready|b');
  });
});

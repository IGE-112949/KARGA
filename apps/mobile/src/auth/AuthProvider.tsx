import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { isAuthRetryableFetchError } from '@supabase/supabase-js';
import { ApiError, createApi, type Api } from '@/lib/api';
import { config } from '@/lib/config';
import type { Profile } from '@/lib/types';
import { resolveStatus, type AuthStatus, type MeResult } from './resolveStatus';

type AuthValue = {
  status: AuthStatus;
  session: Session | null;
  profile: Profile | null;
  error: ApiError | null;
  api: Api;
  refreshProfile: () => Promise<Profile | null>;
  signOut: () => Promise<void>;
  retry: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [me, setMe] = useState<MeResult>(null);
  const [offline, setOffline] = useState(false);
  const userId = session?.user.id ?? null;
  const currentUser = useRef<string | null>(null);
  currentUser.current = userId;
  const signingOut = useRef(false);

  const signOut = useCallback(async () => {
    if (signingOut.current) return;
    signingOut.current = true;
    try {
      // 'local' apaga a sessão guardada mesmo sem rede (a revogação no servidor é feita se possível).
      await supabase.auth.signOut({ scope: 'local' });
    } catch {
      // ignorar: a sessão local já foi limpa
    } finally {
      setOffline(false);
      setSession(null);
      setMe(null);
      signingOut.current = false;
    }
  }, []);

  const api = useMemo(
    () => createApi(async () => (await supabase.auth.getSession()).data.session?.access_token ?? null, config.apiUrl, () => void signOut()),
    [signOut],
  );

  const loadSession = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    setOffline(!data.session && !!error && isAuthRetryableFetchError(error));
    setSession(data.session);
    setSessionLoaded(true);
  }, []);

  useEffect(() => {
    void loadSession();
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      if (s) setOffline(false);
      setSession(s);
      setSessionLoaded(true);
    });
    return () => data.subscription.unsubscribe();
  }, [loadSession]);

  const refreshProfile = useCallback(async () => {
    const forUser = currentUser.current;
    try {
      const profile = await api.get<Profile>('/me');
      // Resposta de outro utilizador (sessão mudou entretanto) é descartada.
      if (currentUser.current !== forUser || profile.id !== forUser) return null;
      setMe({ ok: true, profile });
      return profile;
    } catch (e) {
      if (currentUser.current !== forUser) return null;
      const error = e instanceof ApiError ? e : new ApiError(0, 'UNKNOWN', 'Ocorreu um erro. Tenta novamente.');
      // Se o perfil já estava carregado, uma falha numa atualização não o apaga (o ecrã mostra o erro da ação).
      setMe((prev) => (prev?.ok && prev.profile.id === forUser && error.code !== 'PROFILE_NOT_FOUND' ? prev : { ok: false, error }));
      return null;
    }
  }, [api]);

  // Perfil carregado sempre que muda o utilizador da sessão (não a cada renovação do token).
  useEffect(() => {
    setMe(null);
    if (userId) void refreshProfile();
  }, [userId, refreshProfile]);

  const retry = useCallback(() => {
    setMe(null);
    if (offline || !currentUser.current) void loadSession();
    else void refreshProfile();
  }, [offline, loadSession, refreshProfile]);

  const value: AuthValue = {
    status: resolveStatus({ sessionLoaded, hasSession: !!session, me, offline }),
    session,
    profile: me?.ok ? me.profile : null,
    error: offline ? new ApiError(0, 'NETWORK_ERROR', 'Sem ligação à internet ou servidor indisponível.') : me && !me.ok ? me.error : null,
    api,
    refreshProfile,
    signOut,
    retry,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth fora do AuthProvider');
  return v;
}

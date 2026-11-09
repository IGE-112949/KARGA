import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
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
  const userId = session?.user.id ?? null;
  const signingOut = useRef(false);

  const signOut = useCallback(async () => {
    if (signingOut.current) return;
    signingOut.current = true;
    try {
      await supabase.auth.signOut();
    } catch {
      // Sem rede: a sessão local é limpa na mesma pelo supabase-js.
    } finally {
      setSession(null);
      setMe(null);
      signingOut.current = false;
    }
  }, []);

  const api = useMemo(
    () => createApi(async () => (await supabase.auth.getSession()).data.session?.access_token ?? null, config.apiUrl, () => void signOut()),
    [signOut],
  );

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionLoaded(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setSessionLoaded(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await api.get<Profile>('/me');
      setMe({ ok: true, profile });
      return profile;
    } catch (e) {
      const error = e instanceof ApiError ? e : new ApiError(0, 'UNKNOWN', 'Ocorreu um erro. Tenta novamente.');
      setMe({ ok: false, error });
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
    void refreshProfile();
  }, [refreshProfile]);

  const value: AuthValue = {
    status: resolveStatus({ sessionLoaded, hasSession: !!session, me }),
    session,
    profile: me?.ok ? me.profile : null,
    error: me && !me.ok ? me.error : null,
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

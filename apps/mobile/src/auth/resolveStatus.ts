import type { ApiError } from '@/lib/api';
import type { Profile } from '@/lib/types';

export type AuthStatus = 'loading' | 'signedOut' | 'onboarding' | 'ready' | 'error';

export type MeResult = { ok: true; profile: Profile } | { ok: false; error: ApiError } | null;

export function resolveStatus({ sessionLoaded, hasSession, me }: {
  sessionLoaded: boolean; hasSession: boolean; me: MeResult;
}): AuthStatus {
  if (!sessionLoaded) return 'loading';
  if (!hasSession) return 'signedOut';
  if (!me) return 'loading';
  if (me.ok) return 'ready';
  return me.error.code === 'PROFILE_NOT_FOUND' ? 'onboarding' : 'error';
}

// Para onde mandar o utilizador quando o estado muda e o ecrã atual já não serve (null = fica).
export function redirectFor(status: AuthStatus, segments: string[]): string | null {
  const inAuth = segments[0] === '(auth)';
  const inRegister = inAuth && segments[1] === 'register';
  if (status === 'signedOut') return inAuth ? null : '/welcome';
  if (status === 'onboarding') return inRegister ? null : '/register/role';
  if (status === 'ready') return inAuth && !inRegister ? '/profile' : null;
  return null;
}

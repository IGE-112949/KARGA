import { redirectFor, resolveStatus } from '@/auth/resolveStatus';
import { ApiError } from '@/lib/api';
import type { Profile } from '@/lib/types';

const profile: Profile = {
  id: 'u1', fullName: 'Ana', phone: null, avatarUrl: null, isDriver: true, isHost: false,
  termsAcceptedAt: '2026-11-09T10:00:00.000Z', vehicles: [],
};

describe('resolveStatus', () => {
  it('sessão por carregar → loading', () => {
    expect(resolveStatus({ sessionLoaded: false, hasSession: false, me: null })).toBe('loading');
  });
  it('sem sessão → signedOut', () => {
    expect(resolveStatus({ sessionLoaded: true, hasSession: false, me: null })).toBe('signedOut');
  });
  it('sessão e perfil ainda por carregar → loading', () => {
    expect(resolveStatus({ sessionLoaded: true, hasSession: true, me: null })).toBe('loading');
  });
  it('404 PROFILE_NOT_FOUND → onboarding', () => {
    const error = new ApiError(404, 'PROFILE_NOT_FOUND', 'Perfil não encontrado');
    expect(resolveStatus({ sessionLoaded: true, hasSession: true, me: { ok: false, error } })).toBe('onboarding');
  });
  it('perfil → ready', () => {
    expect(resolveStatus({ sessionLoaded: true, hasSession: true, me: { ok: true, profile } })).toBe('ready');
  });
  it('erro de rede → error', () => {
    const error = new ApiError(0, 'NETWORK_ERROR', 'Sem ligação');
    expect(resolveStatus({ sessionLoaded: true, hasSession: true, me: { ok: false, error } })).toBe('error');
  });
});

describe('redirectFor', () => {
  it('sem sessão fora da autenticação → boas-vindas', () => {
    expect(redirectFor('signedOut', ['(app)', 'profile'])).toBe('/welcome');
    expect(redirectFor('signedOut', ['(auth)', 'login'])).toBeNull();
  });
  it('sem perfil → passo 2 do registo, exceto se já estiver no registo', () => {
    expect(redirectFor('onboarding', ['(auth)', 'login'])).toBe('/register/role');
    expect(redirectFor('onboarding', ['(auth)', 'register', 'role'])).toBeNull();
  });
  it('pronto no login → perfil; pronto no registo (passo 3) fica', () => {
    expect(redirectFor('ready', ['(auth)', 'login'])).toBe('/profile');
    expect(redirectFor('ready', ['(auth)', 'register', 'vehicle'])).toBeNull();
  });
});

describe('redirectFor (revisão final)', () => {
  it('sem sessão nos passos 2/3 do registo → boas-vindas; no passo 1 fica', () => {
    expect(redirectFor('signedOut', ['(auth)', 'register', 'role'])).toBe('/welcome');
    expect(redirectFor('signedOut', ['(auth)', 'register', 'vehicle'])).toBe('/welcome');
    expect(redirectFor('signedOut', ['(auth)', 'register'])).toBeNull();
  });
  it('erro fora do index → index (ecrã com "Tentar novamente")', () => {
    expect(redirectFor('error', ['(auth)', 'login'])).toBe('/');
    expect(redirectFor('error', ['(app)', 'profile'])).toBe('/');
  });
  it('sem sessão por falta de rede → error', () => {
    expect(resolveStatus({ sessionLoaded: true, hasSession: false, me: null, offline: true })).toBe('error');
  });
});

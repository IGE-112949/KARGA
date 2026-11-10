import { createRemoteJWKSet, errors, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { AppError, unauthorized } from '../lib/errors.js';

export interface AuthVerifier {
  verify(token: string): Promise<{ userId: string }>;
}

async function verifyWith(token: string, key: JWTVerifyGetKey | Uint8Array, issuer: string) {
  try {
    const { payload } = await jwtVerify(token, key as JWTVerifyGetKey, { issuer, audience: 'authenticated' });
    if (!payload.sub) throw new Error('sem sub');
    return { userId: payload.sub };
  } catch (e) {
    // Sem acesso às chaves da Supabase (rede, tempo esgotado) não é culpa do token: 503 e a app não termina a sessão.
    if (e instanceof errors.JWKSTimeout || !(e instanceof errors.JOSEError || (e as Error)?.message === 'sem sub')) {
      throw new AppError(503, 'AUTH_UNAVAILABLE', 'Não foi possível validar a sessão. Tenta novamente.');
    }
    throw unauthorized();
  }
}

// Verificador com uma função de chaves qualquer (a da Supabase usa o JWKS remoto).
export function createKeyVerifier(getKey: JWTVerifyGetKey, issuer: string): AuthVerifier {
  return { verify: (token) => verifyWith(token, getKey, issuer) };
}

// Tokens emitidos pela Supabase Auth (chaves públicas JWKS do projeto).
export function createSupabaseVerifier(supabaseUrl: string): AuthVerifier {
  const base = supabaseUrl.replace(/\/$/, '');
  const jwks = createRemoteJWKSet(new URL(`${base}/auth/v1/.well-known/jwks.json`));
  return createKeyVerifier(jwks, `${base}/auth/v1`);
}

// Só para testes: tokens HS256 assinados com uma chave conhecida.
export function createHs256Verifier(secret: string, issuer: string): AuthVerifier {
  const key = new TextEncoder().encode(secret);
  return { verify: (token) => verifyWith(token, key, issuer) };
}

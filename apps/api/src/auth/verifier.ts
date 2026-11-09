import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { unauthorized } from '../lib/errors.js';

export interface AuthVerifier {
  verify(token: string): Promise<{ userId: string }>;
}

async function verifyWith(token: string, key: JWTVerifyGetKey | Uint8Array, issuer: string) {
  try {
    const { payload } = await jwtVerify(token, key as JWTVerifyGetKey, { issuer, audience: 'authenticated' });
    if (!payload.sub) throw new Error('sem sub');
    return { userId: payload.sub };
  } catch {
    throw unauthorized();
  }
}

// Tokens emitidos pela Supabase Auth (chaves públicas JWKS do projeto).
export function createSupabaseVerifier(supabaseUrl: string): AuthVerifier {
  const base = supabaseUrl.replace(/\/$/, '');
  const jwks = createRemoteJWKSet(new URL(`${base}/auth/v1/.well-known/jwks.json`));
  return { verify: (token) => verifyWith(token, jwks, `${base}/auth/v1`) };
}

// Só para testes: tokens HS256 assinados com uma chave conhecida.
export function createHs256Verifier(secret: string, issuer: string): AuthVerifier {
  const key = new TextEncoder().encode(secret);
  return { verify: (token) => verifyWith(token, key, issuer) };
}

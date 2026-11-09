// Teste de ponta a ponta contra o Supabase real.
// Cria um utilizador de teste, chama a API (/me e /me/vehicles) e apaga tudo no fim.
// Uso: com a API a correr (npm run dev -w apps/api), noutro terminal: npm run smoke -w apps/api
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY;
const api = process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
if (!url || !key) throw new Error('Faltam SUPABASE_URL e/ou SUPABASE_PUBLISHABLE_KEY');

const supabase = createClient(url, key, { auth: { persistSession: false } });
const email = `smoke-${Date.now()}@karga.test`;
const password = `Karga-${Math.random().toString(36).slice(2)}9`;

async function call(method: string, path: string, token: string, body?: unknown) {
  const res = await fetch(api + path, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  console.log(`${method} ${path} → ${res.status}`, text ? text.slice(0, 200) : '');
  return res.status;
}

const { data, error } = await supabase.auth.signUp({ email, password });
if (error || !data.session) {
  console.error('Registo falhou:', error?.message ?? 'sem sessão (a confirmação de email está desligada?)');
  process.exit(1);
}
const token = data.session.access_token;
const alg = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString()).alg;
console.log(`Utilizador de teste ${email} criado. Algoritmo do JWT: ${alg} (esperado ES256/RS256)`);

const results = [
  (await call('GET', '/me', token)) === 404,
  (await call('POST', '/me', token, { fullName: 'Teste Smoke', isDriver: true, isHost: false, acceptTerms: true })) === 201,
  (await call('POST', '/me/vehicles', token, { makeModel: 'Renault Zoe', plate: `${Date.now()}`.slice(-2) + 'ZZ' + '99', plugType: 'type2' })) === 201,
  (await call('GET', '/me', token)) === 200,
  (await call('DELETE', '/me', token)) === 204,
];
const ok = results.every(Boolean);
console.log(ok ? '\n✅ Tudo OK: a API funciona contra o Supabase real.' : '\n❌ Algum passo falhou (ver acima).');
process.exit(ok ? 0 : 1);

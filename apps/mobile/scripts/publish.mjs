// Publica a app para o grupo (Expo Go) com `eas update`.
// Uso (em apps/mobile):  node scripts/publish.mjs "mensagem da versão"
// Lê as variáveis de apps/mobile/.env.production (local, fora do git) e confirma que apontam para a API publicada.
import { readFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const file = resolve(ROOT, '.env.production');
if (!existsSync(file)) {
  console.error('Falta o ficheiro apps/mobile/.env.production (vê docs/DEPLOY.md).');
  process.exit(1);
}
const vars = Object.fromEntries(readFileSync(file, 'utf8').split(/\r?\n/)
  .map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && l.includes('='))
  .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));

const need = ['EXPO_PUBLIC_API_URL', 'EXPO_PUBLIC_SUPABASE_URL', 'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY'];
const missing = need.filter((k) => !vars[k]);
if (missing.length) {
  console.error(`Faltam em .env.production: ${missing.join(', ')}`);
  process.exit(1);
}
if (!/^https:\/\//.test(vars.EXPO_PUBLIC_API_URL) || /localhost|10\.0\.2\.2/.test(vars.EXPO_PUBLIC_API_URL)) {
  console.error(`EXPO_PUBLIC_API_URL tem de ser o endereço https do Render (está: ${vars.EXPO_PUBLIC_API_URL}).`);
  process.exit(1);
}

const message = process.argv[2] ?? 'Atualização para testes';
console.log(`A publicar para o canal "preview" com a API ${vars.EXPO_PUBLIC_API_URL} …`);
// As variáveis do processo têm prioridade sobre o .env (que aponta para localhost).
// No Windows o npx corre pela shell, que parte os argumentos com espaços: vão entre aspas.
const win = process.platform === 'win32';
const args = ['eas-cli@latest', 'update', '--channel', 'preview', '--message', message, '--non-interactive']
  .map((a) => (win && /[\s"]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a));
const r = spawnSync('npx', args, {
  cwd: ROOT, stdio: 'inherit', shell: win, env: { ...process.env, ...vars, NODE_ENV: 'production' },
});
process.exit(r.status ?? 1);

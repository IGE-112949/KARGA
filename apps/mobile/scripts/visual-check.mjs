// Verificação visual: exporta a app para web, captura os ecrãs com Playwright e põe-nos lado a lado com o mockup.
// Uso (em apps/mobile): node scripts/visual-check.mjs [--no-export]   → gera visual-check/<ecrã>.png
import { execSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = resolve(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const OUT = join(ROOT, 'visual-check');
const MOCKUP = resolve(ROOT, '../../docs/design/mockup/Main.dc.html');
const FONTS = resolve(ROOT, '../../node_modules/@expo-google-fonts/outfit');
const W = 390, H = 844;

if (!process.argv.includes('--no-export')) execSync('npx expo export -p web', { cwd: ROOT, stdio: 'inherit' });
mkdirSync(OUT, { recursive: true });

// --- servidor estático (SPA) para dist/ e recursos do mockup ---
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf', '.ico': 'image/x-icon', '.json': 'application/json' };
const pages = {};
const server = createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (url.startsWith('/__mock/')) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(pages[url.slice(8)] ?? '');
  }
  if (url.startsWith('/__font/')) {
    const f = url.slice(8);
    res.writeHead(200, { 'Content-Type': 'font/ttf' });
    return res.end(readFileSync(join(FONTS, f.replace(/^Outfit_(\d+)(\w+)\.ttf$/, '$1$2'), f)));
  }
  if (url.startsWith('/_blob/')) {
    res.writeHead(200, { 'Content-Type': 'image/png' });
    return res.end(readFileSync(resolve(ROOT, '../../docs/design/mockup/logo.png')));
  }
  let file = join(DIST, url);
  if (!existsSync(file) || !extname(file)) file = join(DIST, 'index.html');
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://127.0.0.1:${server.address().port}`;

// --- ecrãs do mockup, extraídos do .dc.html (sem o runtime do Claude Design) ---
const src = readFileSync(MOCKUP, 'utf8');
const style = src.match(/<style>([\s\S]*?)<\/style>/)[1];
const VALUES = {
  accent: '#10B981', 'authCopy.title': 'Bem-vindo de volta', 'authCopy.sub': 'Entra para encontrar lugares com carregamento perto de ti.',
  'authCopy.cta': 'Entrar', 'authCopy.switchQ': 'Ainda não tens conta?', 'authCopy.switchLabel': 'Criar conta', 'form.pwType': 'password',
  'terms.box': 'background:#10B981', 'terms.opacity': '1', 'roles.driver.border': 'border: 2px solid #10B981',
  'roles.host.border': 'border: 1.5px solid #D5DCD9', 'roles.both.border': 'border: 1.5px solid #D5DCD9',
  'roles.driver.dot': 'border: 7px solid #10B981', 'roles.host.dot': 'border: 2px solid #D5DCD9', 'roles.both.dot': 'border: 2px solid #D5DCD9',
  'mode.badge': 'Modo Condutor', 'mode.badgeBg': '#ECF8F2', 'mode.badgeFg': '#065F46', 'mode.switchLabel': 'Mudar para Modo Proprietário',
  'mode.switchSub': 'Aluga o teu lugar com tomada', 'profile.initials': 'AS', 'profile.name': 'Ana Silva', 'profile.email': 'ana@mail.pt',
  'profile.vehicle': 'Renault Zoe · AA-12-BB', 'tc.perfil': '#047857', 'tc.mapa': '#5B6670', 'tc.sessao': '#5B6670', 'tc.carteira': '#5B6670',
};
function section(marker) {
  const start = src.indexOf('-->', src.indexOf(marker)) + 3;
  const end = src.indexOf('<!-- ============', start + marker.length);
  return src.slice(start, end);
}
function mockPage(html, withTabs = false) {
  let body = html.replace(/<\/?sc-(if|for)[^>]*>/g, '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => VALUES[k] ?? '');
  if (withTabs) body += section('TAB BAR · CONDUTOR').replace(/<\/?sc-(if|for)[^>]*>/g, '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, k) => VALUES[k] ?? '');
  const faces = [['400Regular', 400], ['500Medium', 500], ['600SemiBold', 600], ['700Bold', 700]]
    .map(([f, w]) => `@font-face{font-family:Outfit;font-weight:${w};src:url(/__font/Outfit_${f}.ttf)}`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${faces}${style} body{margin:0;background:#fff}</style></head><body>
<div style="width:${W}px;height:${H}px;overflow:hidden;background:#FFFFFF;display:flex;flex-direction:column;font-family:'Outfit',system-ui,sans-serif;color:#13263A;position:relative">
${withTabs ? `<div style="flex-grow:1;position:relative">${body.split('<!-- ============ TAB BAR')[0]}</div>${body.slice(body.indexOf('<nav'))}` : body}
</div></body></html>`;
}

// --- dados simulados para a app ---
const now = Math.floor(Date.now() / 1000);
const user = { id: 'u1', aud: 'authenticated', role: 'authenticated', email: 'ana@mail.pt', user_metadata: { full_name: 'Ana Silva', phone: '+351912345678' }, app_metadata: {}, created_at: new Date().toISOString() };
const session = { access_token: 'x.y.z', refresh_token: 'r', token_type: 'bearer', expires_in: 3600, expires_at: now + 3600, user };
const profile = { id: 'u1', fullName: 'Ana Silva', phone: '+351912345678', avatarUrl: null, isDriver: true, isHost: false, termsAcceptedAt: new Date().toISOString(),
  vehicles: [{ id: 'v1', makeModel: 'Renault Zoe', plate: 'AA-12-BB', plugType: 'type2', isDefault: true }] };

const SCREENS = [
  { name: 'boas-vindas', path: '/welcome', mock: 'AUTENTICAÇÃO · 1' },
  { name: 'login', path: '/login', mock: 'AUTENTICAÇÃO · 2' },
  { name: 'registo-1', path: '/register', mock: 'AUTENTICAÇÃO · 3' },
  { name: 'registo-2', path: '/register/role', mock: 'AUTENTICAÇÃO · 4', session: true, me: 404 },
  { name: 'registo-3', path: '/register/vehicle', mock: 'AUTENTICAÇÃO · 5', session: true, me: 200 },
  { name: 'perfil', path: '/profile', mock: 'PERFIL (condutor', session: true, me: 200, tabs: true },
];

const browser = await chromium.launch();
for (const s of SCREENS) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  if (s.session) {
    await page.addInitScript((v) => localStorage.setItem('sb-vfpgzvhfxezszjrajuyv-auth-token', v), JSON.stringify(session));
  }
  await page.route(/\/me(\?|$)/, (route) => route.fulfill(s.me === 200
    ? { status: 200, contentType: 'application/json', body: JSON.stringify(profile) }
    : { status: 404, contentType: 'application/json', body: JSON.stringify({ error: { code: 'PROFILE_NOT_FOUND', message: 'Perfil não encontrado' } }) }));
  await page.route(/supabase\.co/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
  await page.goto(BASE + s.path);
  await page.waitForTimeout(2500);
  const app = await page.screenshot();
  pages[s.name] = mockPage(section(s.mock), s.tabs);
  await page.goto(`${BASE}/__mock/${s.name}`);
  await page.waitForTimeout(500);
  const mock = await page.screenshot();
  await page.setViewportSize({ width: W * 2 + 60, height: H + 50 });
  await page.setContent(`<body style="margin:0;background:#E9EDEB;font:14px sans-serif;display:flex;gap:20px;padding:10px 20px">
    <div><div>App</div><img src="data:image/png;base64,${app.toString('base64')}"></div>
    <div><div>Mockup</div><img src="data:image/png;base64,${mock.toString('base64')}"></div></body>`);
  writeFileSync(join(OUT, `${s.name}.png`), await page.screenshot());
  console.log('✓', s.name);
  await ctx.close();
}
await browser.close();
server.close();

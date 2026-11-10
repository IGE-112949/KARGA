// Dados de teste: 3 proprietários e 20 garagens na zona de Odivelas/Loures (com fotos geradas aqui).
// Uso (no PC, com apps/api/.env preenchido):
//   npm run seed -w apps/api             → cria (ou recria) os dados de teste
//   npm run seed -w apps/api -- --apagar → apaga só o que este script criou
//   npm run seed -w apps/api -- --dry    → mostra o que seria criado, sem tocar em nada
import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { createClient } from '@supabase/supabase-js';
import { inArray, sql } from 'drizzle-orm';
import { loadConfig } from '../src/config.js';
import { createDb } from '../src/db/client.js';
import { profiles, spaceAvailability, spaceBlocks, spacePhotos, spaces } from '../src/db/schema.js';
import { createSupabaseSpacePhotoStore } from '../src/storage/spacePhotoStore.js';

export const SEED_PASSWORD = 'KargaTeste2026!';
export const SEED_USERS = [
  { email: 'ana.teste@karga.pt', name: 'Ana Ribeiro' },
  { email: 'bruno.teste@karga.pt', name: 'Bruno Matos' },
  { email: 'carla.teste@karga.pt', name: 'Carla Nunes' },
];

type Sched = 'noite' | 'semana' | 'fds' | 'sempre' | 'misto';
const SCHED: Record<Sched, { weekday: number; startTime: string; endTime: string }[]> = {
  noite: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, startTime: '19:00', endTime: '08:00' })),
  semana: [0, 1, 2, 3, 4].map((weekday) => ({ weekday, startTime: '08:00', endTime: '19:00' })),
  fds: [5, 6].map((weekday) => ({ weekday, startTime: '00:00', endTime: '24:00' })),
  sempre: [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, startTime: '00:00', endTime: '24:00' })),
  misto: [
    ...[0, 1, 2, 3, 4].map((weekday) => ({ weekday, startTime: '19:00', endTime: '08:00' })),
    ...[5, 6].map((weekday) => ({ weekday, startTime: '00:00', endTime: '24:00' })),
  ],
};

type Seed = {
  owner: number; title: string; address: string; area: string; lat: number; lng: number;
  type: 'closed_garage' | 'covered' | 'outdoor'; plug: 'schuko' | 'type2'; kw: number; price: number; energy: number | null;
  sched: Sched; inactive?: boolean; blocked?: boolean;
};

// 20 garagens. As três do "Edifício Jardim" ficam no mesmo prédio (mesma morada e coordenadas).
export const SEED_SPACES: Seed[] = [
  { owner: 0, title: 'Garagem Jardim · Lugar 3', address: 'Rua Guilherme Gomes Fernandes, 12, Odivelas', area: 'Odivelas', lat: 38.79265, lng: -9.18321, type: 'closed_garage', plug: 'type2', kw: 7.4, price: 0.3, energy: 0.16, sched: 'sempre' },
  { owner: 1, title: 'Garagem Jardim · Lugar 8', address: 'Rua Guilherme Gomes Fernandes, 12, Odivelas', area: 'Odivelas', lat: 38.79265, lng: -9.18321, type: 'closed_garage', plug: 'schuko', kw: 2.3, price: 0.2, energy: 0.15, sched: 'noite' },
  { owner: 2, title: 'Garagem Jardim · Lugar 15', address: 'Rua Guilherme Gomes Fernandes, 12, Odivelas', area: 'Odivelas', lat: 38.79265, lng: -9.18321, type: 'closed_garage', plug: 'type2', kw: 11, price: 0.4, energy: 0.17, sched: 'misto' },
  { owner: 0, title: 'Box no Bairro Arroja', address: 'Rua Pedro Álvares Cabral, 5, Odivelas', area: 'Odivelas', lat: 38.7962, lng: -9.1789, type: 'closed_garage', plug: 'schuko', kw: 3, price: 0.25, energy: 0.15, sched: 'noite' },
  { owner: 1, title: 'Lugar coberto Colinas', address: 'Avenida Dom Dinis, 40, Odivelas', area: 'Odivelas', lat: 38.7889, lng: -9.1832, type: 'covered', plug: 'type2', kw: 7.4, price: 0.35, energy: 0.18, sched: 'semana' },
  { owner: 2, title: 'Garagem da Arroja', address: 'Rua Alfredo Roque Gameiro, 9, Odivelas', area: 'Odivelas', lat: 38.7991, lng: -9.1855, type: 'closed_garage', plug: 'type2', kw: 3.7, price: 0.22, energy: null, sched: 'sempre' },
  { owner: 0, title: 'Exterior junto ao metro', address: 'Rua Major Caldas Xavier, 20, Odivelas', area: 'Odivelas', lat: 38.7934, lng: -9.1746, type: 'outdoor', plug: 'schuko', kw: 2.3, price: 0.15, energy: 0.14, sched: 'fds' },
  { owner: 1, title: 'Garagem Póvoa Centro', address: 'Rua Luís de Camões, 18, Póvoa de Santo Adrião', area: 'Póvoa de Santo Adrião', lat: 38.8002, lng: -9.1638, type: 'closed_garage', plug: 'type2', kw: 7.4, price: 0.3, energy: 0.16, sched: 'misto' },
  { owner: 2, title: 'Lugar coberto Póvoa', address: 'Rua 25 de Abril, 7, Póvoa de Santo Adrião', area: 'Póvoa de Santo Adrião', lat: 38.8031, lng: -9.1662, type: 'covered', plug: 'schuko', kw: 3.7, price: 0.2, energy: 0.15, sched: 'noite', blocked: true },
  { owner: 0, title: 'Garagem Santo António', address: 'Rua Ferreira de Castro, 3, Santo António dos Cavaleiros', area: 'Santo António dos Cavaleiros', lat: 38.8132, lng: -9.1598, type: 'closed_garage', plug: 'type2', kw: 11, price: 0.45, energy: 0.17, sched: 'sempre' },
  { owner: 1, title: 'Box Torre 4', address: 'Avenida Bento Gonçalves, 44, Santo António dos Cavaleiros', area: 'Santo António dos Cavaleiros', lat: 38.8098, lng: -9.1631, type: 'closed_garage', plug: 'schuko', kw: 2.3, price: 0.18, energy: null, sched: 'semana' },
  { owner: 2, title: 'Garagem Loures Centro', address: 'Rua da República, 60, Loures', area: 'Loures', lat: 38.8309, lng: -9.1685, type: 'closed_garage', plug: 'type2', kw: 7.4, price: 0.28, energy: 0.16, sched: 'noite' },
  { owner: 0, title: 'Lugar coberto Infantado', address: 'Rua Mouzinho de Albuquerque, 11, Loures', area: 'Loures', lat: 38.8262, lng: -9.1641, type: 'covered', plug: 'type2', kw: 3.7, price: 0.25, energy: 0.15, sched: 'misto', inactive: true },
  { owner: 1, title: 'Exterior Loures Parque', address: 'Rua Dr. Manuel de Arriaga, 2, Loures', area: 'Loures', lat: 38.8345, lng: -9.1732, type: 'outdoor', plug: 'schuko', kw: 1.8, price: 0.12, energy: 0.14, sched: 'sempre' },
  { owner: 2, title: 'Garagem Ramada', address: 'Rua Heróis de Chaimite, 15, Ramada', area: 'Ramada', lat: 38.8034, lng: -9.1898, type: 'closed_garage', plug: 'type2', kw: 22, price: 0.6, energy: 0.18, sched: 'semana' },
  { owner: 0, title: 'Box Ramada Norte', address: 'Rua Fernão de Magalhães, 8, Ramada', area: 'Ramada', lat: 38.8071, lng: -9.1932, type: 'closed_garage', plug: 'schuko', kw: 3, price: 0.2, energy: 0.15, sched: 'noite', blocked: true },
  { owner: 1, title: 'Garagem Pontinha', address: 'Rua Sete Moinhos, 21, Pontinha', area: 'Pontinha', lat: 38.7694, lng: -9.1968, type: 'closed_garage', plug: 'type2', kw: 7.4, price: 0.32, energy: 0.16, sched: 'sempre' },
  { owner: 2, title: 'Lugar coberto Famões', address: 'Rua Eça de Queiroz, 6, Famões', area: 'Famões', lat: 38.7911, lng: -9.2112, type: 'covered', plug: 'type2', kw: 3.7, price: 0.24, energy: null, sched: 'fds', inactive: true },
  { owner: 0, title: 'Garagem Frielas', address: 'Rua do Ribeiro, 4, Frielas', area: 'Frielas', lat: 38.8215, lng: -9.1489, type: 'closed_garage', plug: 'schuko', kw: 2.3, price: 0.16, energy: 0.14, sched: 'misto' },
  { owner: 1, title: 'Garagem Sacavém Rio', address: 'Rua Estrada Militar, 30, Sacavém', area: 'Sacavém', lat: 38.7936, lng: -9.1059, type: 'closed_garage', plug: 'type2', kw: 11, price: 0.38, energy: 0.17, sched: 'noite' },
];

// ---------- PNG simples (porta de garagem) gerado com zlib ----------
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = CRC[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type: string, data: Buffer) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
export function garagePng(seed: number, w = 640, h = 480): Buffer {
  const hue = [[52, 120, 94], [70, 92, 140], [140, 96, 60], [96, 104, 112], [120, 70, 90]][seed % 5];
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const i = y * (w * 3 + 1) + 1 + x * 3;
      const door = x > w * 0.18 && x < w * 0.82 && y > h * 0.22 && y < h * 0.92;
      let c: number[];
      if (door) {
        const stripe = Math.floor((y - h * 0.22) / 26) % 2 === 0 ? 1 : 0.86;
        c = hue.map((v) => Math.min(255, v * 1.6 * stripe));
      } else {
        const g = 0.75 + 0.25 * (y / h);
        c = [232 * g, 228 * g, 220 * g];
      }
      if (y > h * 0.92) c = [80, 84, 88];
      raw[i] = c[0]; raw[i + 1] = c[1]; raw[i + 2] = c[2];
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const addDaysUtc = (n: number) => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); d.setUTCDate(d.getUTCDate() + n); return d; };

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--dry')) {
    console.log(`${SEED_USERS.length} utilizadores, ${SEED_SPACES.length} espaços; PNG de exemplo com ${garagePng(1).length} bytes.`);
    return;
  }
  const config = loadConfig();
  const admin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const db = createDb(config.DATABASE_URL);
  const store = createSupabaseSpacePhotoStore(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY);

  const { data: list, error } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (error) throw error;
  const existing = list.users.filter((u) => SEED_USERS.some((s) => s.email === u.email));

  // Apagar sempre o que existir (assim "seed" recria do zero e "--apagar" só apaga).
  if (existing.length) {
    const ids = existing.map((u) => u.id);
    const own = await db.select({ id: spaces.id }).from(spaces).where(inArray(spaces.ownerId, ids));
    if (own.length) {
      const photos = await db.select({ path: spacePhotos.storagePath }).from(spacePhotos).where(inArray(spacePhotos.spaceId, own.map((s) => s.id)));
      await store.remove(photos.map((p) => p.path)).catch((e) => console.warn('Aviso ao apagar fotos:', e.message));
    }
    for (const u of existing) {
      const { error: e } = await admin.auth.admin.deleteUser(u.id);
      if (e) throw e;
    }
    console.log(`Apagados ${existing.length} utilizadores de teste e ${own.length} espaços.`);
  }
  if (args.includes('--apagar')) return process.exit(0);

  const userIds: string[] = [];
  for (const u of SEED_USERS) {
    const { data, error: e } = await admin.auth.admin.createUser({
      email: u.email, password: SEED_PASSWORD, email_confirm: true, user_metadata: { full_name: u.name, seed: true },
    });
    if (e || !data.user) throw e ?? new Error('createUser falhou');
    userIds.push(data.user.id);
    await db.insert(profiles).values({ id: data.user.id, fullName: u.name, isDriver: true, isHost: true, termsAcceptedAt: new Date() });
  }

  let n = 0;
  for (const s of SEED_SPACES) {
    const id = randomUUID();
    const owner = userIds[s.owner];
    const paths = [await store.upload(owner, id, garagePng(n), 'image/png' as never), await store.upload(owner, id, garagePng(n + 2), 'image/png' as never)];
    await db.insert(spaces).values({
      id, ownerId: owner, title: s.title, address: s.address, area: s.area, spotDetails: null,
      location: sql`ST_SetSRID(ST_MakePoint(${s.lng}, ${s.lat}), 4326)` as never,
      spaceType: s.type, plugType: s.plug, powerKw: String(s.kw), pricePerHour: String(s.price),
      energyPriceKwh: s.energy == null ? null : String(s.energy),
      accessInstructions: 'Dados de teste: portão automático, a tomada fica à direita.', accessCode: '1234',
      status: s.inactive ? 'inactive' : 'active',
    });
    await db.insert(spaceAvailability).values(SCHED[s.sched].map((w) => ({ spaceId: id, ...w })));
    await db.insert(spacePhotos).values(paths.map((storagePath, position) => ({ spaceId: id, storagePath, position })));
    if (s.blocked) await db.insert(spaceBlocks).values({ spaceId: id, startsAt: addDaysUtc(1), endsAt: addDaysUtc(3), reason: 'Dados de teste' });
    n++;
  }
  const count = await db.select({ c: sql<number>`count(*)` }).from(spaces).where(inArray(spaces.ownerId, userIds));
  console.log(`✅ Criados ${userIds.length} utilizadores e ${count[0].c} espaços. Password de todos: ${SEED_PASSWORD}`);
  console.log(SEED_USERS.map((u) => `   ${u.email}`).join('\n'));
  process.exit(0);
}

main().catch((e) => {
  console.error('❌', e);
  process.exit(1);
});

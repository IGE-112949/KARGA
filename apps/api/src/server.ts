import 'dotenv/config';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { createDb } from './db/client.js';
import { createSupabaseVerifier } from './auth/verifier.js';
import { createSupabaseAuthAdmin } from './auth/admin.js';
import { createSupabaseAvatarStore } from './storage/avatarStore.js';
import { createSupabaseSpacePhotoStore } from './storage/spacePhotoStore.js';

const config = loadConfig();
const app = createApp({
  db: createDb(config.DATABASE_URL),
  auth: createSupabaseVerifier(config.SUPABASE_URL),
  authAdmin: createSupabaseAuthAdmin(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY),
  avatars: createSupabaseAvatarStore(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY),
  spacePhotos: createSupabaseSpacePhotoStore(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY),
  // A chave service_role já é um segredo só do servidor; serve de chave para o deslocamento da localização.
  locationSecret: `karga-location:${config.SUPABASE_SERVICE_ROLE_KEY}`,
});

app.listen(config.PORT, () => {
  console.log(`API KARGA a correr em http://localhost:${config.PORT}`);
});

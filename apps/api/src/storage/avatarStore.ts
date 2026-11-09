import { createClient } from '@supabase/supabase-js';

export type ImageType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface AvatarStore {
  /** Guarda a imagem e devolve o URL público. */
  upload(userId: string, data: Buffer, contentType: ImageType): Promise<string>;
  /** Apaga a imagem a partir do URL público. */
  remove(url: string): Promise<void>;
}

const BUCKET = 'avatars';
const EXT: Record<ImageType, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

// Bucket público "avatars" no Supabase Storage; escrita só pelo servidor (service role).
export function createSupabaseAvatarStore(supabaseUrl: string, serviceRoleKey: string): AvatarStore {
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const storage = supabase.storage.from(BUCKET);
  const marker = `/object/public/${BUCKET}/`;
  return {
    async upload(userId, data, contentType) {
      const path = `${userId}/${Date.now()}.${EXT[contentType]}`;
      const { error } = await storage.upload(path, data, { contentType, upsert: false });
      if (error) throw error;
      return storage.getPublicUrl(path).data.publicUrl;
    },
    async remove(url) {
      const i = url.indexOf(marker);
      if (i < 0) return;
      const { error } = await storage.remove([decodeURIComponent(url.slice(i + marker.length))]);
      if (error) throw error;
    },
  };
}

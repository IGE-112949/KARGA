import { randomUUID } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { IMAGE_EXT as EXT, type ImageType } from '../lib/images.js';
export type { ImageType };

export interface AvatarStore {
  /** Guarda a imagem e devolve o URL público (nome aleatório: o URL é público e não deve revelar o id da conta). */
  upload(userId: string, data: Buffer, contentType: ImageType): Promise<string>;
  /** Apaga a imagem a partir do URL público. */
  remove(url: string): Promise<void>;
}

const BUCKET = 'avatars';

// Bucket público "avatars" no Supabase Storage; escrita só pelo servidor (service role).
export function createSupabaseAvatarStore(supabaseUrl: string, serviceRoleKey: string): AvatarStore {
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const storage = supabase.storage.from(BUCKET);
  const marker = `/object/public/${BUCKET}/`;
  return {
    async upload(_userId, data, contentType) {
      const path = `${randomUUID()}.${EXT[contentType]}`;
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

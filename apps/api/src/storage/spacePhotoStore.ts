import { createClient } from '@supabase/supabase-js';
import { IMAGE_EXT, type ImageType } from '../lib/images.js';

export interface SpacePhotoStore {
  /** Guarda a imagem e devolve o caminho no bucket. */
  upload(ownerId: string, spaceId: string, data: Buffer, contentType: ImageType): Promise<string>;
  /** Apaga as imagens (caminhos no bucket). */
  remove(paths: string[]): Promise<void>;
  publicUrl(path: string): string;
}

const BUCKET = 'space-photos';

// Bucket público "space-photos"; escrita só pelo servidor (service role).
export function createSupabaseSpacePhotoStore(supabaseUrl: string, serviceRoleKey: string): SpacePhotoStore {
  const storage = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } }).storage.from(BUCKET);
  let n = 0;
  return {
    async upload(ownerId, spaceId, data, contentType) {
      const path = `${ownerId}/${spaceId}/${Date.now()}-${n++}.${IMAGE_EXT[contentType]}`;
      const { error } = await storage.upload(path, data, { contentType, upsert: false });
      if (error) throw error;
      return path;
    },
    async remove(paths) {
      if (!paths.length) return;
      const { error } = await storage.remove(paths);
      if (error) throw error;
    },
    publicUrl(path) {
      return storage.getPublicUrl(path).data.publicUrl;
    },
  };
}

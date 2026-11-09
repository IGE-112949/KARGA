import { createClient } from '@supabase/supabase-js';

export interface AuthAdmin {
  deleteUser(userId: string): Promise<void>;
}

// Usa a chave service_role: só no servidor.
export function createSupabaseAuthAdmin(supabaseUrl: string, serviceRoleKey: string): AuthAdmin {
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  return {
    async deleteUser(userId) {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
    },
  };
}

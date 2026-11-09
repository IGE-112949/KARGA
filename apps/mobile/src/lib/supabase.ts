import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { config } from './config';
import { sessionStorage } from './sessionStorage';

// Só para autenticação: os dados vêm da API KARGA.
export const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
  auth: { storage: sessionStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
});

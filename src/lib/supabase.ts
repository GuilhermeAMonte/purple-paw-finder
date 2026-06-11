// ============================================================================
// Cliente Supabase (singleton)
// ----------------------------------------------------------------------------
// As credenciais vêm de variáveis de ambiente Vite (prefixo VITE_).
// A chave anon é pública por design — quem protege os dados é a RLS no banco.
// NUNCA use a chave service_role no frontend.
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Configuração do Supabase ausente. Crie um arquivo .env.local na raiz com ' +
    'VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (veja .env.example).'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,       // mantém a sessão entre reloads
    autoRefreshToken: true,     // renova o JWT automaticamente
    detectSessionInUrl: true,   // necessário para fluxos de e-mail (confirmação/reset)
  },
});

import { createClient } from "@supabase/supabase-js";

// Cliente Supabase para uso no servidor (Server Components e Server Actions).
// Usa a chave pública (anon) — a segurança vem da RLS no banco.
// A escrita de turnos passa pela função SECURITY DEFINER `importar_turnos`,
// então não precisamos da chave de serviço aqui.
export function criarClienteSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Variáveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias (veja o .env.local)."
    );
  }

  return createClient(url, anonKey, {
    auth: { persistSession: false },
  });
}

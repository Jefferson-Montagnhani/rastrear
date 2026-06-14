"use server";

import { redirect } from "next/navigation";
import { criarClienteSupabase } from "@/lib/supabase/server";

export type EstadoLogin = { erro: string } | null;

// Server Action: autentica com e-mail e senha (Supabase Auth).
export async function entrarAction(
  _prev: EstadoLogin,
  formData: FormData
): Promise<EstadoLogin> {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const senha = (formData.get("senha") as string | null) ?? "";

  if (!email || !senha) {
    return { erro: "Informe e-mail e senha." };
  }

  const supabase = await criarClienteSupabase();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: senha,
  });

  if (error) {
    return { erro: "E-mail ou senha inválidos." };
  }

  // O destino certo (admin -> início; mecânico -> Relatório 3) é resolvido
  // pelo gating das páginas.
  redirect("/");
}

// Server Action: encerra a sessão.
export async function sairAction() {
  const supabase = await criarClienteSupabase();
  await supabase.auth.signOut();
  redirect("/login");
}

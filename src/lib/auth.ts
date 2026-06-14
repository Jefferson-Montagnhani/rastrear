import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { criarClienteSupabase } from "@/lib/supabase/server";

export type Papel = "admin" | "mecanico";
export type Perfil = {
  id: string;
  nome: string | null;
  papel: Papel;
  ativo: boolean;
};

export type UsuarioLogado = {
  id: string;
  email: string | null;
  perfil: Perfil | null;
};

// Retorna o usuário logado (com seu perfil) ou null. Memoizado por requisição.
export const usuarioAtual = cache(async (): Promise<UsuarioLogado | null> => {
  const supabase = await criarClienteSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: perfil } = await supabase
    .from("profiles")
    .select("id, nome, papel, ativo")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    perfil: (perfil as Perfil | null) ?? null,
  };
});

// Exige usuário logado (qualquer papel). Redireciona para /login se não houver.
export async function exigirUsuario(): Promise<UsuarioLogado> {
  const u = await usuarioAtual();
  if (!u) redirect("/login");
  return u;
}

// Exige papel admin. Mecânico é mandado para a sua tela (Relatório 3).
export async function exigirAdmin(): Promise<UsuarioLogado> {
  const u = await usuarioAtual();
  if (!u) redirect("/login");
  if (u.perfil?.papel !== "admin") redirect("/relatorio-3");
  return u;
}

export function ehAdmin(u: UsuarioLogado | null): boolean {
  return u?.perfil?.papel === "admin";
}

"use server";

import { revalidatePath } from "next/cache";
import { criarClienteSupabase } from "@/lib/supabase/server";
import { usuarioAtual, ehAdmin } from "@/lib/auth";

export type EstadoUsuario = { ok: boolean; mensagem: string } | null;

// Server Action: atualiza nome, papel e situação (ativo) de um usuário.
export async function atualizarUsuarioAction(
  _prev: EstadoUsuario,
  formData: FormData
): Promise<EstadoUsuario> {
  const eu = await usuarioAtual();
  if (!ehAdmin(eu)) {
    return { ok: false, mensagem: "Apenas administradores." };
  }

  const id = (formData.get("id") as string | null)?.trim();
  const nome = (formData.get("nome") as string | null)?.trim() || null;
  const papel =
    (formData.get("papel") as string | null) === "admin" ? "admin" : "mecanico";
  const ativo = formData.get("ativo") === "on";

  if (!id) return { ok: false, mensagem: "Usuário inválido." };

  // Proteção contra auto-bloqueio: não dá para tirar o próprio acesso de admin.
  if (id === eu!.id && (papel !== "admin" || !ativo)) {
    return {
      ok: false,
      mensagem: "Você não pode remover o próprio acesso de admin.",
    };
  }

  const supabase = await criarClienteSupabase();
  const { error } = await supabase
    .from("profiles")
    .update({ nome, papel, ativo })
    .eq("id", id);

  if (error) {
    return { ok: false, mensagem: `Erro ao salvar: ${error.message}` };
  }

  revalidatePath("/usuarios");
  return { ok: true, mensagem: "Salvo." };
}

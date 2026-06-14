"use server";

import { revalidatePath } from "next/cache";
import { criarClienteSupabase } from "@/lib/supabase/server";

export type EstadoApelido = { ok: boolean; mensagem: string } | null;

// Server Action: grava o "conhecido como" (apelido) de um material no catálogo.
export async function salvarApelidoAction(
  _prev: EstadoApelido,
  formData: FormData
): Promise<EstadoApelido> {
  const codigo = (formData.get("codigo") as string | null)?.trim();
  const nome = (formData.get("conhecido_como") as string | null) ?? "";

  if (!codigo) {
    return { ok: false, mensagem: "Código do material ausente." };
  }

  const supabase = criarClienteSupabase();
  const { error } = await supabase.rpc("definir_conhecido_como", {
    p_codigo: codigo,
    p_nome: nome,
  });

  if (error) {
    return { ok: false, mensagem: `Erro ao salvar: ${error.message}` };
  }

  revalidatePath("/materiais");
  revalidatePath("/relatorio-3");
  return { ok: true, mensagem: "Salvo." };
}

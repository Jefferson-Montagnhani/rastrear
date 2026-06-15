"use server";

import { revalidatePath } from "next/cache";
import { criarClienteSupabase } from "@/lib/supabase/server";
import { usuarioAtual, ehAdmin } from "@/lib/auth";
import { parsearMM60 } from "@/lib/parse-mm60";

export type EstadoImportacao = { ok: boolean; mensagem: string } | null;

// Server Action: importa a lista de preço (MM60) para o catálogo de materiais.
export async function importarMM60Action(
  _prev: EstadoImportacao,
  formData: FormData
): Promise<EstadoImportacao> {
  if (!ehAdmin(await usuarioAtual())) {
    return { ok: false, mensagem: "Apenas administradores podem importar." };
  }

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { ok: false, mensagem: "Selecione o arquivo do MM60." };
  }

  let precos;
  try {
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    precos = parsearMM60(arquivo.name, buffer);
  } catch (e) {
    return {
      ok: false,
      mensagem: `Falha ao ler o arquivo: ${(e as Error).message}`,
    };
  }

  if (precos.length === 0) {
    return {
      ok: false,
      mensagem: "Nenhum preço encontrado (confira se a aba MM60 está no arquivo).",
    };
  }

  const supabase = await criarClienteSupabase();
  const { data, error } = await supabase.rpc("importar_mm60", {
    p_arquivo: arquivo.name,
    p_precos: precos,
  });

  if (error) {
    return { ok: false, mensagem: `Erro ao gravar no banco: ${error.message}` };
  }

  revalidatePath("/relatorio-1");
  revalidatePath("/materiais");

  const n = (data as { materiais?: number } | null)?.materiais ?? precos.length;
  return { ok: true, mensagem: `Preços atualizados: ${n} material(is).` };
}

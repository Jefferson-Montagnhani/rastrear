"use server";

import { revalidatePath } from "next/cache";
import { criarClienteSupabase } from "@/lib/supabase/server";
import { usuarioAtual, ehAdmin } from "@/lib/auth";
import { parsearEstoque } from "@/lib/parse-estoque";

export type EstadoImportacao = { ok: boolean; mensagem: string } | null;

// Server Action: recebe o export de estoque do SAP, parseia e grava via RPC.
export async function importarEstoqueAction(
  _prev: EstadoImportacao,
  formData: FormData
): Promise<EstadoImportacao> {
  if (!ehAdmin(await usuarioAtual())) {
    return { ok: false, mensagem: "Apenas administradores podem importar." };
  }

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { ok: false, mensagem: "Selecione o arquivo de estoque do SAP." };
  }

  let estoque;
  try {
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    estoque = parsearEstoque(arquivo.name, buffer);
  } catch (e) {
    return {
      ok: false,
      mensagem: `Falha ao ler o arquivo: ${(e as Error).message}`,
    };
  }

  if (estoque.length === 0) {
    return {
      ok: false,
      mensagem:
        "Nenhuma linha de estoque encontrada (confira se as colunas têm os nomes esperados).",
    };
  }

  const supabase = await criarClienteSupabase();
  const { data, error } = await supabase.rpc("importar_estoque", {
    p_arquivo: arquivo.name,
    p_estoque: estoque,
  });

  if (error) {
    return { ok: false, mensagem: `Erro ao gravar no banco: ${error.message}` };
  }

  revalidatePath("/relatorio-3");
  revalidatePath("/materiais");

  const linhas = (data as { linhas?: number } | null)?.linhas ?? estoque.length;
  return {
    ok: true,
    mensagem: `Estoque importado: ${linhas} linha(s).`,
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { criarClienteSupabase } from "@/lib/supabase/server";
import { parsearBaixas } from "@/lib/parse-baixas";

export type EstadoImportacao = { ok: boolean; mensagem: string } | null;

// Server Action: recebe o export do Manfro, parseia e grava via RPC.
export async function importarBaixasAction(
  _prev: EstadoImportacao,
  formData: FormData
): Promise<EstadoImportacao> {
  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { ok: false, mensagem: "Selecione o arquivo de baixas (Manfro)." };
  }

  let baixas;
  try {
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    baixas = parsearBaixas(arquivo.name, buffer);
  } catch (e) {
    return {
      ok: false,
      mensagem: `Falha ao ler o arquivo: ${(e as Error).message}`,
    };
  }

  if (baixas.length === 0) {
    return {
      ok: false,
      mensagem:
        "Nenhuma baixa encontrada (confira se as colunas têm os nomes esperados).",
    };
  }

  const supabase = criarClienteSupabase();
  const { data, error } = await supabase.rpc("importar_baixas", {
    p_arquivo: arquivo.name,
    p_baixas: baixas,
  });

  if (error) {
    return { ok: false, mensagem: `Erro ao gravar no banco: ${error.message}` };
  }

  revalidatePath("/relatorio-1");

  const linhas = (data as { linhas?: number } | null)?.linhas ?? baixas.length;
  return { ok: true, mensagem: `Baixas importadas: ${linhas} linha(s).` };
}

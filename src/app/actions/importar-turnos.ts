"use server";

import { revalidatePath } from "next/cache";
import { criarClienteSupabase } from "@/lib/supabase/server";
import { usuarioAtual, ehAdmin } from "@/lib/auth";
import { parsearTurnos } from "@/lib/parse-turnos";

// Estado retornado para a UI (usado com useActionState).
export type EstadoImportacao = { ok: boolean; mensagem: string } | null;

// Server Action: recebe o arquivo de turnos, parseia e grava via RPC.
export async function importarTurnosAction(
  _prev: EstadoImportacao,
  formData: FormData
): Promise<EstadoImportacao> {
  if (!ehAdmin(await usuarioAtual())) {
    return { ok: false, mensagem: "Apenas administradores podem importar." };
  }

  const arquivo = formData.get("arquivo");
  if (!(arquivo instanceof File) || arquivo.size === 0) {
    return { ok: false, mensagem: "Selecione um arquivo de turnos." };
  }

  let turnos;
  try {
    const buffer = Buffer.from(await arquivo.arrayBuffer());
    turnos = parsearTurnos(arquivo.name, buffer);
  } catch (e) {
    return {
      ok: false,
      mensagem: `Falha ao ler o arquivo: ${(e as Error).message}`,
    };
  }

  if (turnos.length === 0) {
    return {
      ok: false,
      mensagem: "Nenhuma linha de turno encontrada no arquivo.",
    };
  }

  const supabase = await criarClienteSupabase();
  const { data, error } = await supabase.rpc("importar_turnos", {
    p_arquivo: arquivo.name,
    p_turnos: turnos,
  });

  if (error) {
    return { ok: false, mensagem: `Erro ao gravar no banco: ${error.message}` };
  }

  // Atualiza os dados exibidos no relatório.
  revalidatePath("/relatorio-2");

  const linhas = (data as { linhas?: number } | null)?.linhas ?? turnos.length;
  return {
    ok: true,
    mensagem: `Importação concluída: ${linhas} turno(s) processado(s).`,
  };
}

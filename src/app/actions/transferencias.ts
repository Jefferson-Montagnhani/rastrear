"use server";

import { revalidatePath } from "next/cache";
import { criarClienteSupabase } from "@/lib/supabase/server";
import { usuarioAtual, ehAdmin } from "@/lib/auth";

export type EstadoTransferencia = { ok: boolean; mensagem: string } | null;

// Registra uma transferência de óleo (delivery -> caminhão-oficina).
export async function registrarTransferenciaAction(
  _prev: EstadoTransferencia,
  formData: FormData
): Promise<EstadoTransferencia> {
  if (!ehAdmin(await usuarioAtual())) {
    return { ok: false, mensagem: "Apenas administradores podem registrar." };
  }

  const data = (formData.get("data") as string | null)?.trim() || undefined;
  const destino = (formData.get("destino") as string | null)?.trim() ?? "";
  const material = (formData.get("material") as string | null)?.trim() ?? "";
  const quantidade = Number(formData.get("quantidade"));
  const observacao =
    (formData.get("observacao") as string | null)?.trim() || null;

  if (!destino || !material || !Number.isFinite(quantidade) || quantidade <= 0) {
    return {
      ok: false,
      mensagem: "Preencha caminhão de destino, óleo e quantidade (> 0).",
    };
  }

  const supabase = await criarClienteSupabase();

  // Frente do caminhão de destino (apoio para o histórico).
  const { data: dep } = await supabase
    .from("depositos")
    .select("frente")
    .eq("codigo_deposito", destino)
    .maybeSingle();

  const { error } = await supabase.from("transferencias_oleo").insert({
    data,
    deposito_destino: destino,
    frente: (dep?.frente as string | null) ?? null,
    codigo_material: material,
    quantidade,
    observacao,
  });

  if (error) {
    return { ok: false, mensagem: `Erro ao registrar: ${error.message}` };
  }

  revalidatePath("/transferencias");
  return { ok: true, mensagem: "Transferência registrada." };
}

// Exclui uma transferência (corrigir lançamento errado).
export async function excluirTransferenciaAction(formData: FormData) {
  if (!ehAdmin(await usuarioAtual())) return;
  const id = (formData.get("id") as string | null)?.trim();
  if (!id) return;

  const supabase = await criarClienteSupabase();
  await supabase.from("transferencias_oleo").delete().eq("id", id);
  revalidatePath("/transferencias");
}

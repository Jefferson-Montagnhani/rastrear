import Link from "next/link";
import { criarClienteSupabase } from "@/lib/supabase/server";
import { exigirAdmin } from "@/lib/auth";
import { BarraUsuario } from "@/components/BarraUsuario";
import { formatarData } from "@/lib/turnos";
import { formatarNumero } from "@/lib/estoque";
import { excluirTransferenciaAction } from "@/app/actions/transferencias";
import { FormTransferencia } from "./_components/FormTransferencia";

export const dynamic = "force-dynamic";

// Tela de transferências de óleo (delivery -> caminhão-oficina). Só admin.
export default async function TransferenciasPage() {
  await exigirAdmin();
  const supabase = await criarClienteSupabase();

  const [{ data: depsRaw }, { data: oleosRaw }, { data: transfRaw }] =
    await Promise.all([
      supabase
        .from("depositos")
        .select("codigo_deposito, nome_deposito, frente, is_delivery, ativo")
        .order("nome_deposito", { ascending: true }),
      supabase
        .from("materiais")
        .select("codigo_material, abreviacao")
        .eq("is_oleo", true)
        .order("abreviacao", { ascending: true }),
      supabase
        .from("transferencias_oleo")
        .select(
          "id, data, deposito_destino, frente, codigo_material, quantidade, observacao"
        )
        .order("data", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(500),
    ]);

  const deps = depsRaw ?? [];
  // Caminhões-oficina (destinos): exclui o delivery e inativos.
  const caminhoes = deps
    .filter((d) => !d.is_delivery && d.ativo)
    .map((d) => ({
      valor: d.codigo_deposito as string,
      rotulo: `${d.nome_deposito ?? d.codigo_deposito}${
        d.frente ? ` — ${d.frente}` : ""
      }`,
    }));

  const oleos = (oleosRaw ?? []).map((o) => ({
    valor: o.codigo_material as string,
    rotulo: `${o.abreviacao ?? o.codigo_material} (${o.codigo_material})`,
  }));

  // Mapas para exibir nome do caminhão e abreviação do óleo no histórico.
  const nomePorDeposito = new Map(
    deps.map((d) => [d.codigo_deposito as string, d.nome_deposito as string | null])
  );
  const abrevPorOleo = new Map(
    (oleosRaw ?? []).map((o) => [
      o.codigo_material as string,
      o.abreviacao as string | null,
    ])
  );

  const hoje = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });

  const transferencias = transfRaw ?? [];

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <BarraUsuario />
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
        ← Início
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">
        Transferências de óleo
      </h1>
      <p className="mt-1 mb-4 text-sm text-slate-500">
        Registre a transferência do caminhão delivery (CB04) para o
        caminhão-oficina, depois que o motorista avisar o abastecimento.
      </p>

      <section className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Nova transferência
        </h2>
        <FormTransferencia hoje={hoje} caminhoes={caminhoes} oleos={oleos} />
      </section>

      <h2 className="mb-2 text-sm font-semibold text-slate-700">Histórico</h2>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left text-slate-600">
              <th className="px-3 py-2 font-semibold">Data</th>
              <th className="px-3 py-2 font-semibold">Frente</th>
              <th className="px-3 py-2 font-semibold">Caminhão</th>
              <th className="px-3 py-2 font-semibold">Óleo</th>
              <th className="px-3 py-2 text-right font-semibold">Qtd</th>
              <th className="px-3 py-2 font-semibold">Obs.</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {transferencias.map((t) => (
              <tr key={t.id as string} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-700">
                  {formatarData(t.data as string | null)}
                </td>
                <td className="px-3 py-2 text-slate-700">
                  {(t.frente as string | null) ?? "—"}
                </td>
                <td className="px-3 py-2 text-slate-700">
                  {nomePorDeposito.get(t.deposito_destino as string) ??
                    (t.deposito_destino as string | null) ??
                    "—"}
                </td>
                <td className="px-3 py-2 font-medium text-slate-900">
                  {abrevPorOleo.get(t.codigo_material as string) ??
                    (t.codigo_material as string)}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-800">
                  {formatarNumero(Number(t.quantidade ?? 0))}
                </td>
                <td className="px-3 py-2 text-slate-500">
                  {(t.observacao as string | null) ?? ""}
                </td>
                <td className="px-3 py-2 text-right">
                  <form action={excluirTransferenciaAction}>
                    <input type="hidden" name="id" value={t.id as string} />
                    <button
                      type="submit"
                      className="text-xs font-medium text-red-600 hover:underline"
                    >
                      excluir
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {transferencias.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-slate-400">
                  Nenhuma transferência registrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

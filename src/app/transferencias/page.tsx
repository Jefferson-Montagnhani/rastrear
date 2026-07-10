import type { Metadata } from "next";
import { criarClienteSupabase } from "@/lib/supabase/server";
import { exigirAdmin } from "@/lib/auth";
import { formatarData } from "@/lib/turnos";
import { formatarNumero } from "@/lib/estoque";
import { FormTransferencia } from "./_components/FormTransferencia";
import { BotaoExcluir } from "./_components/BotaoExcluir";
import { CabecalhoPagina, Td, Th } from "@/components/ui";

export const metadata: Metadata = { title: "Transferências de óleo" };

export const dynamic = "force-dynamic";

// Tela de transferências de óleo (delivery -> caminhão-oficina). Só admin.
export default async function TransferenciasPage() {
  await exigirAdmin();
  const supabase = await criarClienteSupabase();

  const [{ data: depsRaw }, { data: oleosRaw }, { data: transfRaw }] =
    await Promise.all([
      supabase
        .from("depositos")
        .select("codigo_deposito, nome_deposito, frente, abastece_delivery, ativo")
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
  // Destinos da transferência: só os caminhões abastecidos pelo delivery.
  const caminhoes = deps
    .filter((d) => d.abastece_delivery && d.ativo)
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
      <CabecalhoPagina
        titulo="Transferências de óleo"
        descricao="Registre a transferência do caminhão delivery (CB04) para o caminhão-oficina, depois que o motorista avisar o abastecimento."
      />

      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Nova transferência
        </h2>
        <FormTransferencia hoje={hoje} caminhoes={caminhoes} oleos={oleos} />
      </section>

      <h2 className="mb-2 text-sm font-semibold text-slate-700">
        Histórico{" "}
        <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
          {transferencias.length}
        </span>
      </h2>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left text-slate-600">
              <Th>Data</Th>
              <Th>Frente</Th>
              <Th>Caminhão</Th>
              <Th>Óleo</Th>
              <Th className="text-right">Qtd</Th>
              <Th>Obs.</Th>
              <Th />
            </tr>
          </thead>
          <tbody>
            {transferencias.map((t) => {
              const nomeCaminhao =
                nomePorDeposito.get(t.deposito_destino as string) ??
                (t.deposito_destino as string | null) ??
                "—";
              const nomeOleo =
                abrevPorOleo.get(t.codigo_material as string) ??
                (t.codigo_material as string);
              return (
                <tr key={t.id as string} className="border-t border-slate-100">
                  <Td>{formatarData(t.data as string | null)}</Td>
                  <Td>{(t.frente as string | null) ?? "—"}</Td>
                  <Td>{nomeCaminhao}</Td>
                  <Td className="font-medium text-slate-900">{nomeOleo}</Td>
                  <Td className="text-right tabular-nums">
                    {formatarNumero(Number(t.quantidade ?? 0))}
                  </Td>
                  <Td className="text-slate-500">
                    {(t.observacao as string | null) ?? ""}
                  </Td>
                  <Td className="text-right">
                    <BotaoExcluir
                      id={t.id as string}
                      resumo={`${formatarData(t.data as string | null)} · ${nomeCaminhao} · ${nomeOleo} · qtd ${formatarNumero(Number(t.quantidade ?? 0))}`}
                    />
                  </Td>
                </tr>
              );
            })}
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

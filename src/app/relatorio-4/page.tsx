import Link from "next/link";
import { criarClienteSupabase } from "@/lib/supabase/server";
import { exigirAdmin } from "@/lib/auth";
import { formatarCarimbo, formatarData } from "@/lib/turnos";
import { formatarNumero } from "@/lib/estoque";
import {
  calcular,
  ordenarOleos,
  type OleoCalculado,
  type OleoEntrada,
} from "@/lib/oleo";
import { ExportavelRelatorio } from "@/components/ExportavelRelatorio";
import { BarraUsuario } from "@/components/BarraUsuario";
import { SeletorSnapshot } from "@/components/SeletorSnapshot";
import { UploadEstoque } from "@/app/relatorio-3/_components/UploadEstoque";

// Sempre renderiza no servidor a cada requisição (dados vivos do banco).
export const dynamic = "force-dynamic";

// Relatório 4 — Reposição de óleo por frente (para o motorista do delivery).
export default async function Relatorio4Page(props: {
  searchParams: Promise<{ snap?: string }>;
}) {
  await exigirAdmin();
  const { snap: snapParam } = await props.searchParams;
  const supabase = await criarClienteSupabase();

  const [{ data: snapsRaw }, { data: oleosCat }, { data: depsRaw }] =
    await Promise.all([
      supabase
        .from("importacoes")
        .select("id, created_at, periodo_fim")
        .eq("tipo", "estoque")
        .order("created_at", { ascending: false }),
      supabase
        .from("materiais")
        .select("codigo_material, abreviacao")
        .eq("is_oleo", true),
      supabase
        .from("depositos")
        .select("codigo_deposito, nome_deposito, frente, is_delivery, ativo"),
    ]);

  const snaps = snapsRaw ?? [];

  if (snaps.length === 0) {
    return (
      <Pagina atualizadoEm="—" snapshots={[]} snapSelecionado="">
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Nenhum estoque importado ainda. Importe o export do SAP (painel
          abaixo).
        </div>
        <AreaAdmin />
      </Pagina>
    );
  }

  const snapSelecionado =
    snapParam && snaps.some((s) => (s.id as string) === snapParam)
      ? snapParam
      : (snaps[0].id as string);
  const snapAtual = snaps.find((s) => (s.id as string) === snapSelecionado)!;
  const importacaoId = snapSelecionado;
  const atualizadoEm = formatarCarimbo(
    (snapAtual.created_at as string | undefined) ?? null
  );
  const opcoesSnapshot = snaps.map((s) => ({
    id: s.id as string,
    rotulo: formatarCarimbo((s.created_at as string | undefined) ?? null),
  }));

  // Mapa código de óleo -> abreviação, e mapa depósito -> frente/nome.
  const mapaOleo = new Map(
    (oleosCat ?? []).map((m) => [
      m.codigo_material as string,
      (m.abreviacao as string | null) ?? (m.codigo_material as string),
    ])
  );
  const codigosOleo = [...mapaOleo.keys()];
  const mapaDeposito = new Map(
    (depsRaw ?? []).map((d) => [
      d.codigo_deposito as string,
      {
        nome: (d.nome_deposito as string | null) ?? null,
        frente: (d.frente as string | null) ?? null,
      },
    ])
  );
  // Caminhões-oficina (frentes a abastecer): exclui o delivery e depósitos
  // que não são caminhão (ex.: central de lubrificação fora do cadastro).
  const caminhoesValidos = new Set(
    (depsRaw ?? [])
      .filter((d) => !d.is_delivery && d.ativo)
      .map((d) => d.codigo_deposito as string)
  );

  // Linhas de estoque dos óleos no snapshot mais recente.
  const { data: rows } = codigosOleo.length
    ? await supabase
        .from("estoque")
        .select(
          "deposito_codigo, nome_deposito, codigo_material, estoque_disponivel, ponto_reposicao, estoque_maximo, reservas_pendentes"
        )
        .eq("importacao_id", importacaoId)
        .in("codigo_material", codigosOleo)
    : { data: [] as Record<string, unknown>[] };

  const calculados: OleoCalculado[] = (rows ?? [])
    .filter((r) =>
      caminhoesValidos.has((r.deposito_codigo as string | null) ?? "")
    )
    .map((r) => {
      const cod = (r.deposito_codigo as string | null) ?? "—";
      const mestre = mapaDeposito.get(cod);
      const entrada: OleoEntrada = {
        frente: mestre?.frente ?? "—",
        deposito: cod,
        // Nome vem do SAP (fonte da verdade); cai no mestre se faltar.
        nomeDeposito:
          (r.nome_deposito as string | null) ?? mestre?.nome ?? cod,
        codigoMaterial: (r.codigo_material as string | null) ?? "—",
        abreviacao: mapaOleo.get(r.codigo_material as string) ?? "",
        estoqueDisponivel: Number(r.estoque_disponivel ?? 0),
        pontoReposicao:
          r.ponto_reposicao == null ? null : Number(r.ponto_reposicao),
        estoqueMaximo:
          r.estoque_maximo == null ? null : Number(r.estoque_maximo),
        reservasPendentes:
          r.reservas_pendentes == null ? null : Number(r.reservas_pendentes),
      };
      return calcular(entrada);
    });

  const ordenados = ordenarOleos(calculados);
  const resumo = ordenados.filter((o) => o.abastecer > 0); // o que vai pro motorista
  const totalAbastecer = resumo.reduce((s, o) => s + o.abastecer, 0);

  // Detalhado agrupado por caminhão.
  const porCaminhao = new Map<string, OleoCalculado[]>();
  for (const o of ordenados) {
    const chave = o.nomeDeposito;
    if (!porCaminhao.has(chave)) porCaminhao.set(chave, []);
    porCaminhao.get(chave)!.push(o);
  }

  return (
    <Pagina
      atualizadoEm={atualizadoEm}
      snapshots={opcoesSnapshot}
      snapSelecionado={snapSelecionado}
    >
      <p className="text-xs text-slate-400">
        Estoque de{" "}
        {formatarData((snapAtual.periodo_fim as string | null) ?? null)}
      </p>

      {/* Resumo do motorista (o que vai pro WhatsApp) */}
      <ExportavelRelatorio nomeArquivo="relatorio4-reposicao-oleo.png">
        <h2 className="mb-1 text-lg font-bold text-slate-900">
          Reposição de óleo — resumo
        </h2>
        <p className="mb-3 text-sm text-slate-500">
          O que o delivery precisa repor em cada frente.
        </p>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 text-left text-slate-600">
                <th className="px-3 py-2 font-semibold">Frente</th>
                <th className="px-3 py-2 font-semibold">Caminhão</th>
                <th className="px-3 py-2 font-semibold">Material</th>
                <th className="px-3 py-2 font-semibold">Abrev.</th>
                <th className="px-3 py-2 text-right font-semibold">Abastecer</th>
              </tr>
            </thead>
            <tbody>
              {resumo.map((o, i) => (
                <tr key={`${o.codigoMaterial}-${i}`} className="border-t border-slate-100">
                  <td className="px-3 py-2 text-slate-700">{o.frente}</td>
                  <td className="px-3 py-2 text-slate-700">{o.nomeDeposito}</td>
                  <td className="px-3 py-2 font-mono text-slate-600">
                    {o.codigoMaterial}
                  </td>
                  <td className="px-3 py-2 font-semibold text-slate-900">
                    {o.abreviacao}
                  </td>
                  <td className="px-3 py-2 text-right font-bold tabular-nums text-emerald-700">
                    {formatarNumero(o.abastecer)}
                  </td>
                </tr>
              ))}
              {resumo.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                    Nada a repor — todos os óleos acima do ponto de reposição.
                  </td>
                </tr>
              )}
              {resumo.length > 0 && (
                <tr className="border-t-2 border-slate-300 bg-slate-800 text-white">
                  <td className="px-3 py-2 font-bold" colSpan={4}>
                    TOTAL A ABASTECER
                  </td>
                  <td className="px-3 py-2 text-right font-bold tabular-nums">
                    {formatarNumero(totalAbastecer)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ExportavelRelatorio>

      {/* Detalhado por caminhão (apoio do admin) */}
      <details className="rounded-lg border border-slate-200 bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-700">
          Detalhamento por caminhão (estoque, ponto, máximo, reservas)
        </summary>
        <div className="mt-3 flex flex-col gap-5">
          {[...porCaminhao.entries()].map(([nome, itens]) => (
            <div key={nome}>
              <h3 className="mb-1 text-sm font-semibold text-slate-800">{nome}</h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-left text-slate-600">
                      <th className="px-2 py-1.5 font-semibold">Material</th>
                      <th className="px-2 py-1.5 font-semibold">Abrev.</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Disp.</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Ponto</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Máx.</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Reservas</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Saldo falta</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Abastecer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((o, i) => (
                      <tr key={`${o.codigoMaterial}-${i}`} className="border-t border-slate-100">
                        <td className="px-2 py-1.5 font-mono text-slate-600">{o.codigoMaterial}</td>
                        <td className="px-2 py-1.5 font-medium text-slate-800">{o.abreviacao}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{formatarNumero(o.estoqueDisponivel)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{formatarNumero(o.pontoReposicao)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{formatarNumero(o.estoqueMaximo)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{formatarNumero(o.reservasPendentes)}</td>
                        <td className="px-2 py-1.5 text-right tabular-nums">{formatarNumero(o.saldoEmFalta)}</td>
                        <td className={`px-2 py-1.5 text-right font-bold tabular-nums ${o.abastecer > 0 ? "text-emerald-700" : "text-slate-400"}`}>
                          {formatarNumero(o.abastecer)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </details>

      <AreaAdmin />
    </Pagina>
  );
}

// ---- Layout ---------------------------------------------------------------

function Pagina({
  children,
  atualizadoEm,
  snapshots,
  snapSelecionado,
}: {
  children: React.ReactNode;
  atualizadoEm: string;
  snapshots: { id: string; rotulo: string }[];
  snapSelecionado: string;
}) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <BarraUsuario />
      <div className="mb-3 flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← Início
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            Relatório 4 — Reposição de óleo
          </h1>
        </div>
        <span className="text-xs text-slate-400">Atualizado em {atualizadoEm}</span>
      </div>
      <div className="mb-4">
        <SeletorSnapshot snapshots={snapshots} selecionado={snapSelecionado} />
      </div>
      <div className="flex flex-col gap-4">{children}</div>
    </main>
  );
}

function AreaAdmin() {
  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h2 className="mb-1 text-sm font-semibold text-slate-700">
        Área do administrador
      </h2>
      <p className="mb-3 text-xs text-slate-500">
        Importar o export de estoque do SAP (mesmo arquivo do Relatório 3). Os
        pontos de reposição e estoques máximos vêm do próprio SAP.
      </p>
      <UploadEstoque />
    </section>
  );
}

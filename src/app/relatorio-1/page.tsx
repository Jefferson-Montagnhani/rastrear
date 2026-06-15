import Link from "next/link";
import { criarClienteSupabase } from "@/lib/supabase/server";
import { exigirAdmin } from "@/lib/auth";
import { formatarCarimbo, formatarData } from "@/lib/turnos";
import {
  agrupar,
  formatarQtd,
  formatarReais,
  type BaixaEntrada,
} from "@/lib/baixas";
import { ExportavelRelatorio } from "@/components/ExportavelRelatorio";
import { UploadBaixas } from "./_components/UploadBaixas";
import { UploadMM60 } from "./_components/UploadMM60";
import { FiltroData } from "./_components/FiltroData";

// Sempre renderiza no servidor a cada requisição (dados vivos do banco).
export const dynamic = "force-dynamic";

// Relatório 1 — Custo das baixas do dia anterior (Frente -> Depósito -> Material).
export default async function Relatorio1Page(props: {
  searchParams: Promise<{ data?: string }>;
}) {
  await exigirAdmin();
  const { data: dataParam } = await props.searchParams;
  const supabase = await criarClienteSupabase();

  const [{ data: datasRaw }, { data: ultima }, { data: depsRaw }, { data: precosRaw }] =
    await Promise.all([
      supabase
        .from("v_datas_baixas")
        .select("data_referencia")
        .order("data_referencia", { ascending: false }),
      supabase
        .from("importacoes")
        .select("created_at")
        .eq("tipo", "manfro")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("depositos")
        .select("codigo_deposito, nome_deposito, frente"),
      supabase
        .from("materiais")
        .select("codigo_material, preco_unitario")
        .limit(20000),
    ]);

  const datas = (datasRaw ?? []).map((d) => d.data_referencia as string);
  const atualizadoEm = formatarCarimbo(
    (ultima?.created_at as string | undefined) ?? null
  );

  // Mapa de depósitos (código -> nome/frente) para resolver nomes e frentes.
  const mapaDeposito = new Map(
    (depsRaw ?? []).map((d) => [
      d.codigo_deposito as string,
      {
        nome: (d.nome_deposito as string | null) ?? null,
        frente: (d.frente as string | null) ?? null,
      },
    ])
  );

  // Preço unitário por material (vindo do MM60) para calcular o custo.
  const mapaPreco = new Map(
    (precosRaw ?? []).map((m) => [
      m.codigo_material as string,
      Number(m.preco_unitario ?? 0),
    ])
  );

  if (datas.length === 0) {
    return (
      <Pagina atualizadoEm="—">
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Nenhuma baixa importada ainda. Importe um export do Manfro no painel
          abaixo.
        </div>
        <AreaAdmin />
      </Pagina>
    );
  }

  const dataSelecionada =
    dataParam && datas.includes(dataParam) ? dataParam : datas[0];

  const { data: linhasRaw } = await supabase
    .from("baixas")
    .select(
      "frente, deposito_codigo, codigo_material, descricao_material, quantidade, total_rs, status"
    )
    .eq("data_referencia", dataSelecionada)
    .limit(50000);

  // Só baixas efetivas: o Manfro traz muitas canceladas. (Ajustável.)
  const STATUS_EFETIVOS = new Set([
    "T - Atendimento Total",
    "S - Integrado",
  ]);
  const linhasEfetivas = (linhasRaw ?? []).filter(
    (b) =>
      b.status == null ||
      STATUS_EFETIVOS.has((b.status as string | null) ?? "")
  );

  // Resolve frente e nome do depósito (usando o mestre como apoio).
  const entradas: BaixaEntrada[] = linhasEfetivas.map((b) => {
    const cod = (b.deposito_codigo as string | null) ?? "—";
    const mestre = mapaDeposito.get(cod);
    const frenteArquivo = (b.frente as string | null)?.trim();
    const codMaterial = (b.codigo_material as string | null) ?? "—";
    const quantidade = Number(b.quantidade ?? 0);
    const preco = mapaPreco.get(codMaterial) ?? 0;
    return {
      frente: frenteArquivo || mestre?.frente || "—",
      deposito: cod,
      nomeDeposito: mestre?.nome || cod,
      codigoMaterial: codMaterial,
      descricao: (b.descricao_material as string | null) ?? "",
      quantidade,
      // Total = Quantidade x Preço (MM60). Material sem preço entra como 0.
      total: quantidade * preco,
    };
  });

  const relatorio = agrupar(entradas);
  const nomePng = `relatorio1-custos-${dataSelecionada}.png`;

  return (
    <Pagina atualizadoEm={atualizadoEm}>
      <FiltroData datas={datas} selecionada={dataSelecionada} />

      <ExportavelRelatorio nomeArquivo={nomePng}>
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">
            Custo das baixas — dia anterior
          </h2>
          <p className="text-sm text-slate-500">
            Data de referência: <strong>{formatarData(dataSelecionada)}</strong>
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 text-left text-slate-600">
                <th className="px-3 py-2 font-semibold">Código</th>
                <th className="px-3 py-2 font-semibold">Descrição</th>
                <th className="px-3 py-2 text-right font-semibold">
                  Soma de Quantidade
                </th>
                <th className="px-3 py-2 text-right font-semibold">
                  Soma de Total (R$)
                </th>
              </tr>
            </thead>
            <tbody>
              {relatorio.frentes.map((f) => (
                <FrenteSecao key={f.frente} frente={f} />
              ))}

              {/* Total Geral */}
              <tr className="border-t-2 border-slate-300 bg-slate-800 text-white">
                <td className="px-3 py-2 font-bold" colSpan={2}>
                  TOTAL GERAL
                </td>
                <td className="px-3 py-2 text-right font-bold tabular-nums">
                  {formatarQtd(relatorio.totalQuantidade)}
                </td>
                <td className="px-3 py-2 text-right font-bold tabular-nums">
                  {formatarReais(relatorio.totalGeral)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </ExportavelRelatorio>

      <AreaAdmin />
    </Pagina>
  );
}

// ---- Seções da tabela -----------------------------------------------------

function FrenteSecao({
  frente,
}: {
  frente: ReturnType<typeof agrupar>["frentes"][number];
}) {
  return (
    <>
      <tr className="bg-emerald-50">
        <td
          className="px-3 py-2 text-sm font-bold text-emerald-900"
          colSpan={4}
        >
          Frente: {frente.frente}
        </td>
      </tr>

      {frente.depositos.map((d) => (
        <DepositoSecao key={d.deposito} deposito={d} />
      ))}

      <tr className="bg-emerald-100/60">
        <td className="px-3 py-1.5 text-right font-semibold text-emerald-900" colSpan={2}>
          Subtotal frente {frente.frente}
        </td>
        <td className="px-3 py-1.5 text-right font-semibold tabular-nums text-emerald-900">
          {formatarQtd(frente.subQuantidade)}
        </td>
        <td className="px-3 py-1.5 text-right font-semibold tabular-nums text-emerald-900">
          {formatarReais(frente.subTotal)}
        </td>
      </tr>
    </>
  );
}

function DepositoSecao({
  deposito,
}: {
  deposito: ReturnType<typeof agrupar>["frentes"][number]["depositos"][number];
}) {
  return (
    <>
      <tr className="bg-slate-50">
        <td className="px-3 py-1.5 pl-6 text-xs font-semibold text-slate-600" colSpan={4}>
          {deposito.nome}
          {deposito.deposito !== deposito.nome ? ` (${deposito.deposito})` : ""}
        </td>
      </tr>

      {deposito.materiais.map((m) => (
        <tr key={m.codigo} className="border-t border-slate-100">
          <td className="px-3 py-2 pl-6 font-mono text-slate-700">{m.codigo}</td>
          <td className="px-3 py-2 text-slate-700">{m.descricao || "—"}</td>
          <td className="px-3 py-2 text-right tabular-nums text-slate-800">
            {formatarQtd(m.quantidade)}
          </td>
          <td className="px-3 py-2 text-right tabular-nums text-slate-800">
            {formatarReais(m.total)}
          </td>
        </tr>
      ))}

      <tr className="border-t border-slate-200">
        <td className="px-3 py-1 pl-6 text-right text-xs font-medium text-slate-500" colSpan={2}>
          Subtotal {deposito.nome}
        </td>
        <td className="px-3 py-1 text-right text-xs font-medium tabular-nums text-slate-600">
          {formatarQtd(deposito.subQuantidade)}
        </td>
        <td className="px-3 py-1 text-right text-xs font-medium tabular-nums text-slate-600">
          {formatarReais(deposito.subTotal)}
        </td>
      </tr>
    </>
  );
}

// ---- Layout ---------------------------------------------------------------

function Pagina({
  children,
  atualizadoEm,
}: {
  children: React.ReactNode;
  atualizadoEm: string;
}) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
            ← Início
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">
            Relatório 1 — Custos
          </h1>
        </div>
        <span className="text-xs text-slate-400">
          Atualizado em {atualizadoEm}
        </span>
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
        Importar o export de baixas do Manfro (.csv / .xls). Reenviar um dia
        substitui as baixas daquele dia.
      </p>
      <UploadBaixas />
      <p className="mt-4 mb-3 text-xs text-slate-500">
        Importar a lista de preço (MM60) para o custo em R$. Reenvie sempre que
        os preços mudarem.
      </p>
      <UploadMM60 />
    </section>
  );
}

import type { Metadata } from "next";
import { criarClienteSupabase } from "@/lib/supabase/server";
import { exigirAdmin } from "@/lib/auth";
import {
  calcularResumo,
  formatarCarimbo,
  formatarData,
  formatarDataHora,
  type TurnoBanco,
} from "@/lib/turnos";
import { UploadTurnos } from "./_components/UploadTurnos";
import { FiltrosRelatorio2 } from "./_components/FiltrosRelatorio2";
import { ExportavelRelatorio } from "@/components/ExportavelRelatorio";
import {
  AreaAdmin,
  CabecalhoPagina,
  CartaoResumo,
  EstadoVazio,
  Td,
  Th,
} from "@/components/ui";

export const metadata: Metadata = { title: "Relatório 2 — Turnos" };

// Sempre renderiza no servidor a cada requisição (dados vivos do banco).
export const dynamic = "force-dynamic";

// Página dinâmica: depende de searchParams (data / instância).
export default async function Relatorio2Page(props: {
  searchParams: Promise<{ data?: string; instancia?: string }>;
}) {
  await exigirAdmin();
  const { data: dataParam, instancia: instanciaParam } =
    await props.searchParams;
  const supabase = await criarClienteSupabase();

  // Datas e instâncias disponíveis (para os seletores).
  const [{ data: datasRaw }, { data: instanciasRaw }, { data: ultimaImport }] =
    await Promise.all([
      supabase
        .from("v_datas_turnos")
        .select("data_turno")
        .order("data_turno", { ascending: false }),
      supabase
        .from("v_instancias_turnos")
        .select("instancia")
        .order("instancia", { ascending: true }),
      supabase
        .from("importacoes")
        .select("created_at")
        .eq("tipo", "turnos")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const datas = (datasRaw ?? []).map((d) => d.data_turno as string);
  const instancias = (instanciasRaw ?? []).map((i) => i.instancia as string);
  const atualizadoEm = formatarCarimbo(
    (ultimaImport?.created_at as string | undefined) ?? null
  );

  // Sem dados ainda: mostra só o upload.
  if (datas.length === 0) {
    return (
      <Pagina atualizadoEm="—" adminAberta>
        <EstadoVazio
          titulo="Nenhum turno importado ainda"
          descricao="Faça o upload de um arquivo de turnos (.csv / .xls) na área do administrador abaixo para gerar o relatório."
        />
      </Pagina>
    );
  }

  // Resolve os filtros selecionados (com padrões sensatos).
  const dataSelecionada =
    dataParam && datas.includes(dataParam) ? dataParam : datas[0];
  const instanciaSelecionada =
    instanciaParam && (instanciaParam === "TODAS" || instancias.includes(instanciaParam))
      ? instanciaParam
      : instancias.includes("MUND")
        ? "MUND"
        : "TODAS";

  // Busca os turnos da data (e instância) selecionada.
  let query = supabase
    .from("turnos")
    .select(
      "cd_turno,instancia,cd_equipamento,inicio_turno,fim_turno,status_turno,qtd_material,turno,baixou"
    )
    .eq("data_turno", dataSelecionada)
    .order("inicio_turno", { ascending: true });

  if (instanciaSelecionada !== "TODAS") {
    query = query.eq("instancia", instanciaSelecionada);
  }

  const { data: linhasRaw } = await query;
  const linhas = (linhasRaw ?? []) as TurnoBanco[];
  const resumo = calcularResumo(linhas);

  const nomeArquivoPng = `relatorio2-turnos-${dataSelecionada}-${instanciaSelecionada}.png`;

  return (
    <Pagina atualizadoEm={atualizadoEm}>
      <FiltrosRelatorio2
        datas={datas}
        instancias={instancias}
        dataSelecionada={dataSelecionada}
        instanciaSelecionada={instanciaSelecionada}
      />

      <ExportavelRelatorio nomeArquivo={nomeArquivoPng}>
        {/* Cabeçalho do relatório */}
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Turnos x Baixas — dia anterior
            </h2>
            <p className="text-sm text-slate-500">
              Data de referência:{" "}
              <strong>{formatarData(dataSelecionada)}</strong>
              {"  ·  "}
              Instância:{" "}
              <strong>
                {instanciaSelecionada === "TODAS"
                  ? "Todas"
                  : instanciaSelecionada}
              </strong>
            </p>
          </div>
          <span className="rounded-md bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            Atualizado em {atualizadoEm}
          </span>
        </div>

        {/* Cartões de resumo */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <CartaoResumo
            titulo="Total de turnos"
            valor={resumo.totalTurnos.toLocaleString("pt-BR")}
          />
          <CartaoResumo
            titulo="Turnos com baixa"
            valor={`${resumo.turnosComBaixa.toLocaleString("pt-BR")} (${Math.round(
              resumo.percentualComBaixa
            )}%)`}
            destaque="emerald"
          />
          <CartaoResumo
            titulo="Turnos sem baixa"
            valor={(resumo.totalTurnos - resumo.turnosComBaixa).toLocaleString(
              "pt-BR"
            )}
            destaque="red"
          />
          <CartaoResumo
            titulo="Qtd. total baixada"
            valor={resumo.qtdTotalBaixada.toLocaleString("pt-BR")}
          />
        </div>

        {/* Tabela de turnos */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100 text-left text-slate-600">
                <Th>Cód. do turno</Th>
                <Th>Equipamento</Th>
                {instanciaSelecionada === "TODAS" && <Th>Instância</Th>}
                <Th>Turno</Th>
                <Th>Início</Th>
                <Th>Fim</Th>
                <Th>Baixou?</Th>
                <Th className="text-right">Qtd. material</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr
                  key={l.cd_turno}
                  className={`border-t border-slate-100 ${
                    l.baixou ? "" : "bg-red-50/50"
                  }`}
                >
                  <Td className="font-mono text-xs">{l.cd_turno}</Td>
                  <Td>{l.cd_equipamento ?? "—"}</Td>
                  {instanciaSelecionada === "TODAS" && (
                    <Td>{l.instancia ?? "—"}</Td>
                  )}
                  <Td className="font-semibold">{l.turno ?? "—"}</Td>
                  <Td>{formatarDataHora(l.inicio_turno)}</Td>
                  <Td>{formatarDataHora(l.fim_turno)}</Td>
                  <Td>
                    <BadgeBaixou baixou={l.baixou} />
                  </Td>
                  <Td className="text-right tabular-nums">
                    {Number(l.qtd_material).toLocaleString("pt-BR")}
                  </Td>
                  <Td>{l.status_turno ?? "—"}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          BAIXOU = SIM quando o turno registrou consumo de material
          (qtd. &gt; 0). Turnos que usaram material mas não baixaram aparecem
          destacados em vermelho.
        </p>
      </ExportavelRelatorio>
    </Pagina>
  );
}

// ---- Componentes de apresentação (Server Components) ----------------------

function Pagina({
  children,
  atualizadoEm,
  adminAberta = false,
}: {
  children: React.ReactNode;
  atualizadoEm: string;
  adminAberta?: boolean;
}) {
  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <CabecalhoPagina
        titulo="Relatório 2 — Turnos"
        descricao="Quais turnos baixaram material no dia de referência."
        atualizadoEm={atualizadoEm}
      />

      <div className="flex flex-col gap-4">
        {children}

        <AreaAdmin abertaPorPadrao={adminAberta}>
          <p className="mb-3 text-xs text-slate-500">
            Importar o arquivo de turnos (.csv / .xls). Reenviar um arquivo
            mais novo atualiza os turnos que estavam em aberto.
          </p>
          <UploadTurnos />
        </AreaAdmin>
      </div>
    </main>
  );
}

function BadgeBaixou({ baixou }: { baixou: boolean }) {
  return baixou ? (
    <span className="inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">
      SIM
    </span>
  ) : (
    <span className="inline-block rounded-md bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">
      NÃO
    </span>
  );
}

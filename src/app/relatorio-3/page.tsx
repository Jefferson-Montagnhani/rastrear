import type { Metadata } from "next";
import Link from "next/link";
import { criarClienteSupabase } from "@/lib/supabase/server";
import { exigirUsuario, ehAdmin } from "@/lib/auth";
import { SeletorSnapshot } from "@/components/SeletorSnapshot";
import { formatarCarimbo, formatarData } from "@/lib/turnos";
import { type DepositoOpcao, type EstoqueLinha } from "@/lib/estoque";
import { SeletorDeposito } from "./_components/SeletorDeposito";
import { EstoqueTabela } from "./_components/EstoqueTabela";
import { UploadEstoque } from "./_components/UploadEstoque";
import { AreaAdmin, CabecalhoPagina, EstadoVazio } from "@/components/ui";

export const metadata: Metadata = { title: "Relatório 3 — Saldo por caminhão" };

// Sempre renderiza no servidor a cada requisição (dados vivos do banco).
export const dynamic = "force-dynamic";

// Relatório 3 — Saldo de estoque por caminhão (tela de leitura do mecânico).
export default async function Relatorio3Page(props: {
  searchParams: Promise<{ deposito?: string; snap?: string }>;
}) {
  // Mecânico e admin acessam (leitura); o painel de admin só aparece p/ admin.
  const u = await exigirUsuario();
  const admin = ehAdmin(u);
  const { deposito: depositoParam, snap: snapParam } = await props.searchParams;
  const supabase = await criarClienteSupabase();

  // Snapshots de estoque (histórico): cada upload do SAP é um snapshot.
  const { data: snapsRaw } = await supabase
    .from("importacoes")
    .select("id, created_at, periodo_fim")
    .eq("tipo", "estoque")
    .order("created_at", { ascending: false });

  const snaps = snapsRaw ?? [];

  // Sem estoque importado ainda.
  if (snaps.length === 0) {
    return (
      <Pagina
        atualizadoEm="—"
        dataSnapshot={null}
        snapshots={[]}
        snapSelecionado=""
      >
        <EstadoVazio
          titulo="Nenhum estoque importado ainda"
          descricao="O administrador precisa importar o export do SAP para o saldo aparecer aqui."
        />
        {admin && <PainelAdmin abertaPorPadrao />}
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

  // Lista de caminhões (depósitos) do snapshot.
  const { data: depsRaw } = await supabase
    .from("v_estoque_depositos")
    .select("deposito_codigo, nome_deposito")
    .eq("importacao_id", importacaoId);

  const depositos: DepositoOpcao[] = (depsRaw ?? [])
    .map((d) => ({
      codigo: (d.deposito_codigo as string | null) ?? "—",
      nome:
        (d.nome_deposito as string | null) ??
        (d.deposito_codigo as string | null) ??
        "—",
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const selecionado =
    depositoParam && depositos.some((d) => d.codigo === depositoParam)
      ? depositoParam
      : (depositos[0]?.codigo ?? "");

  // Linhas de estoque do caminhão selecionado.
  const { data: rows } = await supabase
    .from("estoque")
    .select(
      "deposito_codigo, nome_deposito, codigo_material, descricao_material, estoque_disponivel"
    )
    .eq("importacao_id", importacaoId)
    .eq("deposito_codigo", selecionado)
    .order("codigo_material", { ascending: true });

  // Apelidos (conhecido como) do catálogo para os materiais exibidos.
  const codigos = [
    ...new Set(
      (rows ?? [])
        .map((r) => r.codigo_material as string | null)
        .filter((c): c is string => !!c)
    ),
  ];
  const { data: mats } = codigos.length
    ? await supabase
        .from("materiais")
        .select("codigo_material, conhecido_como")
        .in("codigo_material", codigos)
    : { data: [] as { codigo_material: string; conhecido_como: string | null }[] };

  const mapaApelido = new Map(
    (mats ?? []).map((m) => [m.codigo_material, m.conhecido_como])
  );

  const linhas: EstoqueLinha[] = (rows ?? []).map((r) => ({
    deposito_codigo: r.deposito_codigo as string | null,
    nome_deposito: r.nome_deposito as string | null,
    codigo_material: r.codigo_material as string | null,
    descricao_material: r.descricao_material as string | null,
    estoque_disponivel: Number(r.estoque_disponivel ?? 0),
    conhecido_como: mapaApelido.get(r.codigo_material as string) ?? null,
  }));

  return (
    <Pagina
      atualizadoEm={atualizadoEm}
      dataSnapshot={(snapAtual.periodo_fim as string | null) ?? null}
      snapshots={opcoesSnapshot}
      snapSelecionado={snapSelecionado}
    >
      <SeletorDeposito depositos={depositos} selecionado={selecionado} />
      <EstoqueTabela linhas={linhas} />
      {admin && <PainelAdmin />}
    </Pagina>
  );
}

// ---- Apresentação ---------------------------------------------------------

function Pagina({
  children,
  atualizadoEm,
  dataSnapshot,
  snapshots,
  snapSelecionado,
}: {
  children: React.ReactNode;
  atualizadoEm: string;
  dataSnapshot: string | null;
  snapshots: { id: string; rotulo: string }[];
  snapSelecionado: string;
}) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <CabecalhoPagina
        titulo="Relatório 3 — Saldo por caminhão"
        descricao="Estoque por caminhão para conferir físico × sistema."
      />

      {/* Carimbo de atualização em destaque (requisito do mecânico) */}
      <div className="my-4 flex flex-wrap items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5 text-emerald-700"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
        <span className="text-sm font-semibold text-emerald-800">
          Atualizado em {atualizadoEm}
        </span>
        {dataSnapshot && (
          <span className="text-xs text-emerald-700">
            (estoque de {formatarData(dataSnapshot)})
          </span>
        )}
      </div>

      <div className="mb-4">
        <SeletorSnapshot
          snapshots={snapshots}
          selecionado={snapSelecionado}
        />
      </div>

      <div className="flex flex-col gap-4">{children}</div>
    </main>
  );
}

function PainelAdmin({ abertaPorPadrao = false }: { abertaPorPadrao?: boolean }) {
  return (
    <AreaAdmin abertaPorPadrao={abertaPorPadrao}>
      <p className="mb-3 text-xs text-slate-500">
        Importar o export de estoque do SAP (.csv / .xls). Os apelidos das
        peças são cadastrados no{" "}
        <Link href="/materiais" className="text-emerald-700 underline">
          catálogo de materiais
        </Link>
        .
      </p>
      <UploadEstoque />
    </AreaAdmin>
  );
}

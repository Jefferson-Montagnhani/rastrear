import Link from "next/link";
import { criarClienteSupabase } from "@/lib/supabase/server";
import { formatarCarimbo, formatarData } from "@/lib/turnos";
import { type DepositoOpcao, type EstoqueLinha } from "@/lib/estoque";
import { SeletorDeposito } from "./_components/SeletorDeposito";
import { EstoqueTabela } from "./_components/EstoqueTabela";
import { UploadEstoque } from "./_components/UploadEstoque";

// Sempre renderiza no servidor a cada requisição (dados vivos do banco).
export const dynamic = "force-dynamic";

// Relatório 3 — Saldo de estoque por caminhão (tela de leitura do mecânico).
export default async function Relatorio3Page(props: {
  searchParams: Promise<{ deposito?: string }>;
}) {
  const { deposito: depositoParam } = await props.searchParams;
  const supabase = criarClienteSupabase();

  // Snapshot mais recente de estoque.
  const { data: ultima } = await supabase
    .from("importacoes")
    .select("id, created_at, periodo_fim")
    .eq("tipo", "estoque")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const atualizadoEm = formatarCarimbo(
    (ultima?.created_at as string | undefined) ?? null
  );

  // Sem estoque importado ainda.
  if (!ultima?.id) {
    return (
      <Pagina atualizadoEm="—" dataSnapshot={null}>
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          Nenhum estoque importado ainda. O administrador precisa importar o
          export do SAP (painel abaixo).
        </div>
        <AreaAdmin />
      </Pagina>
    );
  }

  const importacaoId = ultima.id as string;

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
      dataSnapshot={(ultima.periodo_fim as string | null) ?? null}
    >
      <SeletorDeposito depositos={depositos} selecionado={selecionado} />
      <EstoqueTabela linhas={linhas} />
      <AreaAdmin />
    </Pagina>
  );
}

// ---- Apresentação ---------------------------------------------------------

function Pagina({
  children,
  atualizadoEm,
  dataSnapshot,
}: {
  children: React.ReactNode;
  atualizadoEm: string;
  dataSnapshot: string | null;
}) {
  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
        ← Início
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">
        Relatório 3 — Saldo por caminhão
      </h1>

      {/* Carimbo de atualização em destaque (requisito do mecânico) */}
      <div className="my-4 flex flex-wrap items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
        <span className="text-sm font-semibold text-emerald-800">
          Atualizado em {atualizadoEm}
        </span>
        {dataSnapshot && (
          <span className="text-xs text-emerald-700">
            (estoque de {formatarData(dataSnapshot)})
          </span>
        )}
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
        Importar o export de estoque do SAP (.csv / .xls). Os apelidos das peças
        são cadastrados no{" "}
        <Link href="/materiais" className="text-emerald-700 underline">
          catálogo de materiais
        </Link>
        .
      </p>
      <UploadEstoque />
    </section>
  );
}

import Link from "next/link";

/* =======================================================================
   Componentes de apresentação compartilhados (Server Components).
   Padronizam cabeçalho de página, cartões de resumo, tabelas, estados
   vazios e a área do administrador (colapsável) em todas as telas.
   ======================================================================= */

// Cabeçalho padrão das páginas internas: título, descrição e carimbo.
export function CabecalhoPagina({
  titulo,
  descricao,
  atualizadoEm,
}: {
  titulo: string;
  descricao?: string;
  atualizadoEm?: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          {titulo}
        </h1>
        {descricao && (
          <p className="mt-1 max-w-2xl text-sm text-slate-500">{descricao}</p>
        )}
      </div>
      {atualizadoEm !== undefined && (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" />
          </svg>
          Atualizado em {atualizadoEm}
        </span>
      )}
    </div>
  );
}

// Cartão de indicador (resumo) usado no topo dos relatórios.
export function CartaoResumo({
  titulo,
  valor,
  destaque,
}: {
  titulo: string;
  valor: string;
  destaque?: "emerald" | "red";
}) {
  const cor =
    destaque === "emerald"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : destaque === "red"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-slate-200 bg-white text-slate-800";
  return (
    <div className={`rounded-xl border p-3 shadow-sm ${cor}`}>
      <div className="text-xs font-medium uppercase tracking-wide opacity-70">
        {titulo}
      </div>
      <div className="mt-1 text-xl font-bold tabular-nums">{valor}</div>
    </div>
  );
}

// Células padrão de tabela.
export function Th({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return <th className={`px-3 py-2 font-semibold ${className}`}>{children}</th>;
}

export function Td({
  children,
  className = "",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <td className={`px-3 py-2 text-slate-700 ${className}`}>{children}</td>
  );
}

// Estado vazio padrão (sem dados importados / nada encontrado).
export function EstadoVazio({
  titulo,
  descricao,
}: {
  titulo: string;
  descricao?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-10 w-10 text-slate-300"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 7v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6L10 5H6a2 2 0 0 0-2 2Z" />
        <path d="M9 13h6" />
      </svg>
      <p className="text-sm font-semibold text-slate-600">{titulo}</p>
      {descricao && (
        <p className="max-w-md text-sm text-slate-400">{descricao}</p>
      )}
    </div>
  );
}

// Área do administrador (uploads e afins) — colapsável para não disputar
// espaço com o relatório. Fica fechada por padrão; abre com um clique.
export function AreaAdmin({
  titulo = "Área do administrador",
  abertaPorPadrao = false,
  children,
}: {
  titulo?: string;
  abertaPorPadrao?: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={abertaPorPadrao || undefined}
      className="group rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <summary className="flex cursor-pointer select-none items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 6 6 6-6 6" />
        </svg>
        {titulo}
        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Importações
        </span>
      </summary>
      <div className="border-t border-slate-100 px-4 py-4">{children}</div>
    </details>
  );
}

// Link "voltar ao início" usado nas telas internas (apoio no celular).
export function VoltarInicio() {
  return (
    <Link
      href="/"
      className="mb-2 inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-emerald-700"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m15 18-6-6 6-6" />
      </svg>
      Início
    </Link>
  );
}

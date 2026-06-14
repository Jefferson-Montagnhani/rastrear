import Link from "next/link";

// Página inicial — por enquanto leva ao Relatório 2 (primeira parte construída).
export default function Home() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-slate-900">Rastrear</h1>
      <p className="mt-2 text-slate-500">
        PCM · Manutenção Automotiva — relatórios diários dos caminhões-oficina.
      </p>

      <div className="mt-8 grid gap-3">
        <Link
          href="/relatorio-2"
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow"
        >
          <div className="text-lg font-semibold text-slate-900">
            Relatório 2 — Turnos x Baixas
          </div>
          <div className="mt-1 text-sm text-slate-500">
            Quais turnos baixaram material no dia anterior, com destaque para os
            que usaram material e não baixaram.
          </div>
        </Link>

        {/* Os demais relatórios entram nas próximas partes. */}
        <div className="rounded-lg border border-dashed border-slate-200 p-5 text-sm text-slate-400">
          Relatórios 1 (Custos), 3 (Saldo por caminhão) e 4 (Reposição de óleo)
          — em breve.
        </div>
      </div>
    </main>
  );
}

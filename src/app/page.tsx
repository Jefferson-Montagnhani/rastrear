import Link from "next/link";
import { exigirAdmin } from "@/lib/auth";
import { BarraUsuario } from "@/components/BarraUsuario";

export const dynamic = "force-dynamic";

// Página inicial (admin) — menu dos relatórios. Mecânico é levado ao R3.
export default async function Home() {
  await exigirAdmin();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <BarraUsuario />
      <h1 className="text-3xl font-bold text-slate-900">Rastrear</h1>
      <p className="mt-2 text-slate-500">
        PCM · Manutenção Automotiva — relatórios diários dos caminhões-oficina.
      </p>

      <div className="mt-8 grid gap-3">
        <Link
          href="/relatorio-1"
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow"
        >
          <div className="text-lg font-semibold text-slate-900">
            Relatório 1 — Custos
          </div>
          <div className="mt-1 text-sm text-slate-500">
            Custo das baixas do dia anterior, agrupado por frente → depósito →
            material, com Total Geral.
          </div>
        </Link>

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

        <Link
          href="/relatorio-3"
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow"
        >
          <div className="text-lg font-semibold text-slate-900">
            Relatório 3 — Saldo por caminhão
          </div>
          <div className="mt-1 text-sm text-slate-500">
            Estoque por caminhão para o mecânico conferir físico × sistema, com a
            data da última atualização em destaque.
          </div>
        </Link>

        <Link
          href="/materiais"
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow"
        >
          <div className="text-lg font-semibold text-slate-900">
            Catálogo de materiais
          </div>
          <div className="mt-1 text-sm text-slate-500">
            Cadastrar o nome “conhecido como” das peças (apoio ao Relatório 3).
          </div>
        </Link>

        <Link
          href="/relatorio-4"
          className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow"
        >
          <div className="text-lg font-semibold text-slate-900">
            Relatório 4 — Reposição de óleo
          </div>
          <div className="mt-1 text-sm text-slate-500">
            Quanto o delivery precisa repor de óleo em cada frente, com resumo
            pronto para o motorista.
          </div>
        </Link>
      </div>
    </main>
  );
}

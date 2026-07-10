import Link from "next/link";
import { exigirAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Página inicial (admin) — painel com os relatórios e as telas de apoio.
// Mecânico é levado direto ao Relatório 3 pelo gating de papel.
export default async function Home() {
  const u = await exigirAdmin();
  const nome = u.perfil?.nome || u.email || "";

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">
        {nome ? `Olá, ${nome.split(" ")[0]}` : "Rastrear"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Relatórios diários dos caminhões-oficina — escolha abaixo o que você
        precisa gerar ou consultar.
      </p>

      <Secao titulo="Relatórios diários">
        <CartaoLink
          href="/relatorio-1"
          numero="R1"
          titulo="Custos"
          descricao="Custo das baixas do dia anterior por frente, depósito e material, com total geral em R$."
          icone={<IconeDinheiro />}
        />
        <CartaoLink
          href="/relatorio-2"
          numero="R2"
          titulo="Turnos x Baixas"
          descricao="Quais turnos baixaram material, com destaque para os que usaram material e não baixaram."
          icone={<IconeRelogio />}
        />
        <CartaoLink
          href="/relatorio-3"
          numero="R3"
          titulo="Saldo por caminhão"
          descricao="Estoque por caminhão para o mecânico conferir físico × sistema, com a data da última atualização."
          icone={<IconeCaminhao />}
        />
        <CartaoLink
          href="/relatorio-4"
          numero="R4"
          titulo="Reposição de óleo"
          descricao="Quanto o delivery precisa repor de óleo em cada frente, com resumo pronto para o motorista."
          icone={<IconeGota />}
        />
      </Secao>

      <Secao titulo="Operação e administração">
        <CartaoLink
          href="/transferencias"
          titulo="Transferências de óleo"
          descricao="Registrar a transferência do delivery (CB04) para o caminhão-oficina, com histórico."
          icone={<IconeSetas />}
        />
        <CartaoLink
          href="/materiais"
          titulo="Catálogo de materiais"
          descricao="Cadastrar o nome “conhecido como” das peças (apoio ao Relatório 3)."
          icone={<IconeEtiqueta />}
        />
        <CartaoLink
          href="/usuarios"
          titulo="Usuários"
          descricao="Definir papel (admin/mecânico) e situação de cada usuário."
          icone={<IconeUsuarios />}
        />
      </Secao>
    </main>
  );
}

// ---- Apresentação ----------------------------------------------------------

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
        {titulo}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function CartaoLink({
  href,
  titulo,
  descricao,
  icone,
  numero,
}: {
  href: string;
  titulo: string;
  descricao: string;
  icone: React.ReactNode;
  numero?: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 transition-colors group-hover:bg-emerald-100">
        {icone}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          {numero && (
            <span className="rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-lime">
              {numero}
            </span>
          )}
          <span className="text-base font-semibold text-slate-900">
            {titulo}
          </span>
        </span>
        <span className="mt-1 block text-sm text-slate-500">{descricao}</span>
      </span>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m9 6 6 6-6 6" />
      </svg>
    </Link>
  );
}

// ---- Ícones (SVG inline, traço 2px) ---------------------------------------

function base(props: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {props.children}
    </svg>
  );
}

function IconeDinheiro() {
  return base({
    children: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
        <path d="M6.5 9.5h.01M17.5 14.5h.01" />
      </>
    ),
  });
}

function IconeRelogio() {
  return base({
    children: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </>
    ),
  });
}

function IconeCaminhao() {
  return base({
    children: (
      <>
        <path d="M3 7h11v9H3zM14 10h4l3 3v3h-7" />
        <circle cx="7" cy="17.5" r="1.5" />
        <circle cx="17" cy="17.5" r="1.5" />
      </>
    ),
  });
}

function IconeGota() {
  return base({
    children: (
      <>
        <path d="M12 3.5s6 6.2 6 10.5a6 6 0 0 1-12 0C6 9.7 12 3.5 12 3.5Z" />
        <path d="M9.5 14a2.5 2.5 0 0 0 2.5 2.5" />
      </>
    ),
  });
}

function IconeSetas() {
  return base({
    children: (
      <>
        <path d="M4 8h13l-3-3M20 16H7l3 3" />
      </>
    ),
  });
}

function IconeEtiqueta() {
  return base({
    children: (
      <>
        <path d="m3.5 12.5 8-8H20v8.5l-8 8z" />
        <circle cx="16" cy="8" r="1" />
      </>
    ),
  });
}

function IconeUsuarios() {
  return base({
    children: (
      <>
        <circle cx="9" cy="8.5" r="3" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 5.8a3 3 0 0 1 0 5.4M20.5 19a5.5 5.5 0 0 0-4-5.2" />
      </>
    ),
  });
}

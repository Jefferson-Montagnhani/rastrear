import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { usuarioAtual } from "@/lib/auth";
import { sairAction } from "@/app/actions/auth";
import { NavPrincipal, type ItemNav } from "@/components/NavPrincipal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Rastrear — PCM Manutenção",
    template: "%s · Rastrear",
  },
  description: "Relatórios diários dos caminhões-oficina (projeto Rastrear).",
};

// Itens de navegação por papel. Rótulos curtos para caber no celular.
const NAV_ADMIN: ItemNav[] = [
  { href: "/", rotulo: "Início" },
  { href: "/relatorio-1", rotulo: "R1 · Custos" },
  { href: "/relatorio-2", rotulo: "R2 · Turnos" },
  { href: "/relatorio-3", rotulo: "R3 · Saldo" },
  { href: "/relatorio-4", rotulo: "R4 · Óleo" },
  { href: "/transferencias", rotulo: "Transferências" },
  { href: "/materiais", rotulo: "Materiais" },
  { href: "/usuarios", rotulo: "Usuários" },
];

const NAV_MECANICO: ItemNav[] = [
  { href: "/relatorio-3", rotulo: "Saldo por caminhão" },
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const u = await usuarioAtual();
  const admin = u?.perfil?.papel === "admin";
  const itensNav = u ? (admin ? NAV_ADMIN : NAV_MECANICO) : [];
  const nome = u?.perfil?.nome || u?.email || null;

  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        {/* Cabeçalho global (identidade Raízen) */}
        <header className="sticky top-0 z-40 bg-brand text-white shadow-md">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
            <span className="flex items-center gap-2">
              {/* Marca */}
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-6 w-6 text-lime"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
              <span className="text-lg font-bold tracking-tight">Rastrear</span>
            </span>
            <span className="hidden text-xs text-emerald-100/80 sm:inline">
              PCM · Manutenção Automotiva · Raízen
            </span>

            {u && (
              <div className="ml-auto flex items-center gap-2">
                <span
                  className="max-w-40 truncate text-xs text-emerald-100/90 sm:max-w-none sm:text-sm"
                  title={nome ?? undefined}
                >
                  {nome}
                  <span className="ml-1 hidden rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-lime sm:inline">
                    {admin ? "Admin" : "Mecânico"}
                  </span>
                </span>
                <form action={sairAction}>
                  <button
                    type="submit"
                    className="rounded-md border border-white/25 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-white/10"
                  >
                    Sair
                  </button>
                </form>
              </div>
            )}
          </div>

          <NavPrincipal itens={itensNav} />
          <div className="h-1 bg-lime" />
        </header>

        <div className="flex-1">{children}</div>

        <footer className="mt-10 border-t border-slate-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 text-xs text-slate-400">
            <span>Rastrear · PCM Manutenção Automotiva — Raízen</span>
            <span>Relatórios diários dos caminhões-oficina</span>
          </div>
        </footer>
      </body>
    </html>
  );
}

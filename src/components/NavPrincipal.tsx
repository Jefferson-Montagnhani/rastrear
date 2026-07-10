"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type ItemNav = { href: string; rotulo: string };

// Barra de navegação principal (abas). Recebe os itens já filtrados por
// papel (admin vê tudo; mecânico só o Relatório 3) e destaca a aba ativa.
export function NavPrincipal({ itens }: { itens: ItemNav[] }) {
  const pathname = usePathname();
  if (itens.length === 0) return null;

  return (
    <nav
      aria-label="Navegação principal"
      className="bg-brand-dark/60"
    >
      <div className="mx-auto flex max-w-6xl items-stretch gap-1 overflow-x-auto px-2 sm:px-4">
        {itens.map((item) => {
          const ativo =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm transition-colors ${
                ativo
                  ? "border-lime font-semibold text-white"
                  : "border-transparent font-medium text-emerald-100/75 hover:border-emerald-300/40 hover:text-white"
              }`}
            >
              {item.rotulo}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

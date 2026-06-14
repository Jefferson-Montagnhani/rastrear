"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DepositoOpcao } from "@/lib/estoque";

type Props = {
  depositos: DepositoOpcao[];
  selecionado: string;
};

// Seletor de caminhão (depósito) — atualiza a URL e recarrega o relatório.
export function SeletorDeposito({ depositos, selecionado }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function escolher(valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("deposito", valor);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-600">Caminhão</span>
      <select
        value={selecionado}
        onChange={(e) => escolher(e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        {depositos.map((d) => (
          <option key={d.codigo} value={d.codigo}>
            {d.nome}
            {d.codigo && d.codigo !== d.nome ? ` (${d.codigo})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

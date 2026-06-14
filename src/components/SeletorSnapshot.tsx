"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Opcao = { id: string; rotulo: string };

type Props = {
  snapshots: Opcao[];
  selecionado: string;
  label?: string;
};

// Seletor de snapshot de estoque (histórico) — atualiza ?snap= na URL.
export function SeletorSnapshot({
  snapshots,
  selecionado,
  label = "Estoque (data da importação)",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function escolher(valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("snap", valor);
    router.push(`${pathname}?${params.toString()}`);
  }

  // Com um só snapshot não faz sentido mostrar o seletor.
  if (snapshots.length <= 1) return null;

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-600">{label}</span>
      <select
        value={selecionado}
        onChange={(e) => escolher(e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        {snapshots.map((s) => (
          <option key={s.id} value={s.id}>
            {s.rotulo}
          </option>
        ))}
      </select>
    </label>
  );
}

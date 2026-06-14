"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatarData } from "@/lib/turnos";

type Props = {
  datas: string[]; // YYYY-MM-DD, já ordenadas (desc)
  selecionada: string;
};

// Seletor da data de referência (atualiza a URL e recarrega o relatório).
export function FiltroData({ datas, selecionada }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function escolher(valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("data", valor);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-600">Data de referência</span>
      <select
        value={selecionada}
        onChange={(e) => escolher(e.target.value)}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        {datas.map((d) => (
          <option key={d} value={d}>
            {formatarData(d)}
          </option>
        ))}
      </select>
    </label>
  );
}

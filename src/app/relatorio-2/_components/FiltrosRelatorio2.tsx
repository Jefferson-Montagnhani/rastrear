"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatarData } from "@/lib/turnos";

type Props = {
  datas: string[]; // datas disponíveis (YYYY-MM-DD), já ordenadas
  instancias: string[]; // instâncias disponíveis
  dataSelecionada: string;
  instanciaSelecionada: string; // "TODAS" ou uma instância
};

// Seletores de data de referência e de instância (atualizam a URL).
export function FiltrosRelatorio2({
  datas,
  instancias,
  dataSelecionada,
  instanciaSelecionada,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function atualizar(chave: string, valor: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(chave, valor);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-600">Data de referência</span>
        <select
          value={dataSelecionada}
          onChange={(e) => atualizar("data", e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          {datas.map((d) => (
            <option key={d} value={d}>
              {formatarData(d)}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-600">Instância</span>
        <select
          value={instanciaSelecionada}
          onChange={(e) => atualizar("instancia", e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="TODAS">Todas</option>
          {instancias.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

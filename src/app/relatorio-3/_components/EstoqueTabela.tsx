"use client";

import { useMemo, useState } from "react";
import { formatarNumero, type EstoqueLinha } from "@/lib/estoque";

type Props = {
  linhas: EstoqueLinha[];
};

// Tabela do Relatório 3 com busca por código, descrição ou apelido.
export function EstoqueTabela({ linhas }: Props) {
  const [busca, setBusca] = useState("");

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return linhas;
    return linhas.filter((l) =>
      [l.codigo_material, l.descricao_material, l.conhecido_como]
        .filter(Boolean)
        .some((campo) => campo!.toLowerCase().includes(termo))
    );
  }, [busca, linhas]);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por código, descrição ou nome conhecido…"
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm sm:max-w-md"
      />

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left text-slate-600">
              <th className="px-3 py-2 font-semibold">Material</th>
              <th className="px-3 py-2 font-semibold">Descrição</th>
              <th className="px-3 py-2 font-semibold">Conhecido como</th>
              <th className="px-3 py-2 text-right font-semibold">
                Estoque disponível
              </th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map((l, i) => (
              <tr
                key={`${l.codigo_material}-${i}`}
                className="border-t border-slate-100"
              >
                <td className="px-3 py-2 font-mono text-slate-700">
                  {l.codigo_material ?? "—"}
                </td>
                <td className="px-3 py-2 text-slate-700">
                  {l.descricao_material ?? "—"}
                </td>
                <td className="px-3 py-2 font-medium text-slate-900">
                  {l.conhecido_como ?? (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-800">
                  {formatarNumero(l.estoque_disponivel)}
                </td>
              </tr>
            ))}
            {filtradas.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                  Nenhum item encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">
        {filtradas.length} item(ns)
        {busca ? ` (de ${linhas.length})` : ""}.
      </p>
    </div>
  );
}

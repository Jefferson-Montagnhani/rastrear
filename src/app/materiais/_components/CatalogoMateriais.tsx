"use client";

import { useMemo, useState } from "react";
import { LinhaMaterial, type Material } from "./LinhaMaterial";

// Catálogo de materiais com busca; cada linha edita o "conhecido como".
export function CatalogoMateriais({ materiais }: { materiais: Material[] }) {
  const [busca, setBusca] = useState("");

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return materiais;
    return materiais.filter((m) =>
      [m.codigo_material, m.descricao, m.conhecido_como, m.abreviacao]
        .filter(Boolean)
        .some((campo) => campo!.toLowerCase().includes(termo))
    );
  }, [busca, materiais]);

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar material por código, descrição ou apelido…"
        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm sm:max-w-md"
      />

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left text-slate-600">
              <th className="px-3 py-2 font-semibold">Material</th>
              <th className="px-3 py-2 font-semibold">Descrição (SAP)</th>
              <th className="px-3 py-2 font-semibold">Conhecido como</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((m) => (
              <LinhaMaterial key={m.codigo_material} material={m} />
            ))}
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-slate-400">
                  Nenhum material. Importe um estoque do SAP para popular o
                  catálogo, ou adicione um código acima.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-400">{filtrados.length} material(is).</p>
    </div>
  );
}

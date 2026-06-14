"use client";

import { useState, useTransition } from "react";
import { salvarApelidoAction } from "@/app/actions/salvar-apelido";

export type Material = {
  codigo_material: string;
  descricao: string | null;
  conhecido_como: string | null;
  is_oleo: boolean;
  abreviacao: string | null;
};

// Uma linha do catálogo: edita e salva o "conhecido como" de um material.
export function LinhaMaterial({ material }: { material: Material }) {
  const [valor, setValor] = useState(material.conhecido_como ?? "");
  const [status, setStatus] = useState<"idle" | "salvo" | "erro">("idle");
  const [pending, startTransition] = useTransition();

  function salvar() {
    const fd = new FormData();
    fd.set("codigo", material.codigo_material);
    fd.set("conhecido_como", valor);
    startTransition(async () => {
      const r = await salvarApelidoAction(null, fd);
      setStatus(r?.ok ? "salvo" : "erro");
    });
  }

  return (
    <tr className="border-t border-slate-100">
      <td className="px-3 py-2 font-mono text-slate-700">
        {material.codigo_material}
        {material.is_oleo && (
          <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
            ÓLEO
          </span>
        )}
      </td>
      <td className="px-3 py-2 text-slate-600">{material.descricao ?? "—"}</td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <input
            value={valor}
            onChange={(e) => {
              setValor(e.target.value);
              setStatus("idle");
            }}
            placeholder="nome conhecido…"
            className="w-48 rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
          <button
            type="button"
            onClick={salvar}
            disabled={pending}
            className="rounded-md bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {pending ? "…" : "Salvar"}
          </button>
          {status === "salvo" && (
            <span className="text-xs font-medium text-emerald-700">✓ salvo</span>
          )}
          {status === "erro" && (
            <span className="text-xs font-medium text-red-600">erro</span>
          )}
        </div>
      </td>
    </tr>
  );
}

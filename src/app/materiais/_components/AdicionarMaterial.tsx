"use client";

import { useActionState } from "react";
import {
  salvarApelidoAction,
  type EstadoApelido,
} from "@/app/actions/salvar-apelido";

// Adiciona/atualiza um material pelo código com seu "conhecido como".
export function AdicionarMaterial() {
  const [estado, formAction, pending] = useActionState<EstadoApelido, FormData>(
    salvarApelidoAction,
    null
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2 sm:flex-row sm:items-end"
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-600">Código do material</span>
        <input
          name="codigo"
          required
          placeholder="ex.: 9800159"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-600">Conhecido como</span>
        <input
          name="conhecido_como"
          placeholder="ex.: 15W40"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {pending ? "Salvando…" : "Adicionar / atualizar"}
      </button>
      {estado && (
        <span
          className={`text-sm font-medium ${
            estado.ok ? "text-emerald-700" : "text-red-600"
          }`}
        >
          {estado.mensagem}
        </span>
      )}
    </form>
  );
}

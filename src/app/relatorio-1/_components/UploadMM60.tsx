"use client";

import { useActionState } from "react";
import {
  importarMM60Action,
  type EstadoImportacao,
} from "@/app/actions/importar-mm60";

// Upload da lista de preço (MM60), que alimenta o custo (R$) do Relatório 1.
export function UploadMM60() {
  const [estado, formAction, pending] = useActionState<
    EstadoImportacao,
    FormData
  >(importarMM60Action, null);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <input
        type="file"
        name="arquivo"
        accept=".csv,.xls,.xlsx,.xlsm"
        required
        className="block text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600 disabled:opacity-60"
      >
        {pending ? "Importando…" : "Importar preços (MM60)"}
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

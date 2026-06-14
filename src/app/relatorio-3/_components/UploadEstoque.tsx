"use client";

import { useActionState } from "react";
import {
  importarEstoqueAction,
  type EstadoImportacao,
} from "@/app/actions/importar-estoque";

// Upload do export de estoque do SAP (.csv / .xls / .xlsx). Área do admin.
export function UploadEstoque() {
  const [estado, formAction, pending] = useActionState<
    EstadoImportacao,
    FormData
  >(importarEstoqueAction, null);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:items-center"
    >
      <input
        type="file"
        name="arquivo"
        accept=".csv,.xls,.xlsx"
        required
        className="block text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {pending ? "Importando…" : "Importar estoque"}
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

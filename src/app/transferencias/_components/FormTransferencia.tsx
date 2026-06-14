"use client";

import { useActionState } from "react";
import {
  registrarTransferenciaAction,
  type EstadoTransferencia,
} from "@/app/actions/transferencias";

type Opcao = { valor: string; rotulo: string };

type Props = {
  hoje: string; // YYYY-MM-DD
  caminhoes: Opcao[]; // destinos (caminhões-oficina)
  oleos: Opcao[]; // materiais de óleo
};

// Formulário para registrar uma transferência de óleo.
export function FormTransferencia({ hoje, caminhoes, oleos }: Props) {
  const [estado, formAction, pending] = useActionState<
    EstadoTransferencia,
    FormData
  >(registrarTransferenciaAction, null);

  return (
    <form action={formAction} className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-600">Data</span>
        <input
          type="date"
          name="data"
          defaultValue={hoje}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-600">
          Caminhão de destino (frente)
        </span>
        <select
          name="destino"
          required
          defaultValue=""
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="" disabled>
            selecione…
          </option>
          {caminhoes.map((c) => (
            <option key={c.valor} value={c.valor}>
              {c.rotulo}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-600">Óleo</span>
        <select
          name="material"
          required
          defaultValue=""
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="" disabled>
            selecione…
          </option>
          {oleos.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.rotulo}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-600">Quantidade</span>
        <input
          type="number"
          name="quantidade"
          min="0"
          step="any"
          required
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-medium text-slate-600">Observação (opcional)</span>
        <input
          type="text"
          name="observacao"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </label>

      <div className="flex items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          {pending ? "Registrando…" : "Registrar transferência"}
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
      </div>
    </form>
  );
}

"use client";

import { excluirTransferenciaAction } from "@/app/actions/transferencias";

// Botão de excluir com confirmação — evita apagar um registro sem querer.
export function BotaoExcluir({ id, resumo }: { id: string; resumo: string }) {
  return (
    <form
      action={excluirTransferenciaAction}
      onSubmit={(e) => {
        if (!confirm(`Excluir esta transferência?\n\n${resumo}`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="rounded-md px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
      >
        Excluir
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { entrarAction, type EstadoLogin } from "@/app/actions/auth";

// Formulário de login (e-mail + senha) usando Supabase Auth.
export function FormLogin() {
  const [estado, formAction, pending] = useActionState<EstadoLogin, FormData>(
    entrarAction,
    null
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-600">E-mail</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-600">Senha</span>
        <input
          type="password"
          name="senha"
          required
          autoComplete="current-password"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>

      {estado?.erro && (
        <p className="text-sm font-medium text-red-600">{estado.erro}</p>
      )}
    </form>
  );
}

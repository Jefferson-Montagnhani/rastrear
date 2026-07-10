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
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-slate-700">E-mail</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          autoFocus
          placeholder="voce@empresa.com"
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-300 focus:border-emerald-500"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-slate-700">Senha</span>
        <input
          type="password"
          name="senha"
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm shadow-sm transition-colors placeholder:text-slate-300 focus:border-emerald-500"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-light disabled:opacity-60"
      >
        {pending && (
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
        )}
        {pending ? "Entrando…" : "Entrar"}
      </button>

      {estado?.erro && (
        <p
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
        >
          {estado.erro}
        </p>
      )}
    </form>
  );
}

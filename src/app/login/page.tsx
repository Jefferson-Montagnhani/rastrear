import type { Metadata } from "next";
import { FormLogin } from "./FormLogin";

export const metadata: Metadata = { title: "Entrar" };

// Página de login (pública). O proxy.ts já redireciona quem está logado.
export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-sm flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-lime">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 3" />
            </svg>
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Rastrear
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            PCM · Manutenção Automotiva — entre para continuar.
          </p>
        </div>
        <FormLogin />
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">
        Acesso restrito. Fale com o administrador para criar seu usuário.
      </p>
    </main>
  );
}

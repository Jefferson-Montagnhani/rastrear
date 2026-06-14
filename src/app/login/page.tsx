import { FormLogin } from "./FormLogin";

// Página de login (pública). O proxy.ts já redireciona quem está logado.
export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="text-2xl font-bold text-slate-900">Rastrear</h1>
      <p className="mb-6 text-sm text-slate-500">
        PCM · Manutenção Automotiva — entre para continuar.
      </p>
      <FormLogin />
    </main>
  );
}

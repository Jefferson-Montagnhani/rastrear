import Link from "next/link";

// Página 404 — mantém o usuário dentro do sistema.
export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center">
      <p className="text-5xl font-bold tracking-tight text-slate-200">404</p>
      <h1 className="mt-2 text-xl font-bold text-slate-900">
        Página não encontrada
      </h1>
      <p className="mt-1 max-w-md text-sm text-slate-500">
        O endereço que você abriu não existe ou foi movido.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-light"
      >
        Voltar ao início
      </Link>
    </main>
  );
}

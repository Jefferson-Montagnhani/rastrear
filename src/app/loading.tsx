// Indicador global de carregamento entre navegações (páginas dinâmicas).
export default function Loading() {
  return (
    <main className="mx-auto flex max-w-6xl items-center justify-center px-4 py-24">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <span
          aria-hidden="true"
          className="h-8 w-8 animate-spin rounded-full border-[3px] border-emerald-200 border-t-emerald-600"
        />
        <span className="text-sm">Carregando…</span>
      </div>
    </main>
  );
}

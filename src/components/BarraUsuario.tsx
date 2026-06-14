import { usuarioAtual } from "@/lib/auth";
import { sairAction } from "@/app/actions/auth";

// Barra com o nome do usuário logado e o botão de sair.
export async function BarraUsuario() {
  const u = await usuarioAtual();
  if (!u) return null;

  const nome = u.perfil?.nome ?? u.email ?? "usuário";
  const papel = u.perfil?.papel === "admin" ? "Admin" : "Mecânico";

  return (
    <div className="mb-4 flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm shadow-sm">
      <span className="text-slate-600">
        {nome} <span className="text-slate-400">· {papel}</span>
      </span>
      <form action={sairAction}>
        <button
          type="submit"
          className="rounded-md border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          Sair
        </button>
      </form>
    </div>
  );
}

import Link from "next/link";
import { criarClienteSupabase } from "@/lib/supabase/server";
import { exigirAdmin } from "@/lib/auth";
import { BarraUsuario } from "@/components/BarraUsuario";
import { LinhaUsuario, type Usuario } from "./_components/LinhaUsuario";

export const dynamic = "force-dynamic";

// Tela de usuários (admin): gerenciar papel (admin/mecânico) e situação.
export default async function UsuariosPage() {
  const eu = await exigirAdmin();
  const supabase = await criarClienteSupabase();

  const { data } = await supabase
    .from("profiles")
    .select("id, email, nome, papel, ativo")
    .order("email", { ascending: true });

  const usuarios = (data ?? []) as Usuario[];

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <BarraUsuario />
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
        ← Início
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">Usuários</h1>
      <p className="mt-1 mb-4 text-sm text-slate-500">
        Defina o papel (admin ou mecânico) e a situação de cada usuário. Para{" "}
        <strong>criar</strong> um novo login, use{" "}
        <em>Authentication › Users › Add user</em> no Supabase — o usuário nasce
        como mecânico e aparece aqui para você ajustar.
      </p>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left text-slate-600">
              <th className="px-3 py-2 font-semibold">E-mail</th>
              <th className="px-3 py-2 font-semibold">Nome</th>
              <th className="px-3 py-2 font-semibold">Papel</th>
              <th className="px-3 py-2 font-semibold">Situação</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <LinhaUsuario
                key={u.id}
                usuario={u}
                ehProprio={u.id === eu.id}
              />
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                  Nenhum usuário ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

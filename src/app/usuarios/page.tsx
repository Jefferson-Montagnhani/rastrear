import type { Metadata } from "next";
import { criarClienteSupabase } from "@/lib/supabase/server";
import { exigirAdmin } from "@/lib/auth";
import { LinhaUsuario, type Usuario } from "./_components/LinhaUsuario";
import { CabecalhoPagina, Th } from "@/components/ui";

export const metadata: Metadata = { title: "Usuários" };

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
      <CabecalhoPagina
        titulo="Usuários"
        descricao="Defina o papel (admin ou mecânico) e a situação de cada usuário."
      />

      <div className="mb-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
        Para <strong>criar</strong> um novo login, use{" "}
        <em>Authentication › Users › Add user</em> no Supabase — o usuário
        nasce como mecânico e aparece aqui para você ajustar.
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left text-slate-600">
              <Th>E-mail</Th>
              <Th>Nome</Th>
              <Th>Papel</Th>
              <Th>Situação</Th>
              <Th />
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

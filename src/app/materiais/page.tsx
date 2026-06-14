import Link from "next/link";
import { criarClienteSupabase } from "@/lib/supabase/server";
import { CatalogoMateriais } from "./_components/CatalogoMateriais";
import { AdicionarMaterial } from "./_components/AdicionarMaterial";
import type { Material } from "./_components/LinhaMaterial";

// Sempre renderiza no servidor a cada requisição (dados vivos do banco).
export const dynamic = "force-dynamic";

// Catálogo de materiais: cadastrar o "conhecido como" (apelido) das peças,
// que ajuda o mecânico a reconhecer o item no Relatório 3.
export default async function MateriaisPage() {
  const supabase = criarClienteSupabase();

  const { data } = await supabase
    .from("materiais")
    .select("codigo_material, descricao, conhecido_como, is_oleo, abreviacao")
    .order("is_oleo", { ascending: false })
    .order("codigo_material", { ascending: true })
    .limit(5000);

  const materiais = (data ?? []) as Material[];

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-700">
        ← Início
      </Link>
      <h1 className="text-2xl font-bold text-slate-900">
        Catálogo de materiais
      </h1>
      <p className="mt-1 mb-4 text-sm text-slate-500">
        Cadastre o nome mais conhecido de cada peça. O catálogo é preenchido
        automaticamente (código + descrição) quando você importa o estoque do
        SAP; aqui você só ajusta os apelidos.
      </p>

      <section className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">
          Adicionar / atualizar um material
        </h2>
        <AdicionarMaterial />
      </section>

      <CatalogoMateriais materiais={materiais} />
    </main>
  );
}

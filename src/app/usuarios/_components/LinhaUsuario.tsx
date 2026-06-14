"use client";

import { useState, useTransition } from "react";
import { atualizarUsuarioAction } from "@/app/actions/atualizar-usuario";

export type Usuario = {
  id: string;
  email: string | null;
  nome: string | null;
  papel: "admin" | "mecanico";
  ativo: boolean;
};

// Uma linha da tela de usuários: edita nome, papel e situação.
export function LinhaUsuario({
  usuario,
  ehProprio,
}: {
  usuario: Usuario;
  ehProprio: boolean;
}) {
  const [nome, setNome] = useState(usuario.nome ?? "");
  const [papel, setPapel] = useState<"admin" | "mecanico">(usuario.papel);
  const [ativo, setAtivo] = useState(usuario.ativo);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(
    null
  );
  const [pending, startTransition] = useTransition();

  function salvar() {
    const fd = new FormData();
    fd.set("id", usuario.id);
    fd.set("nome", nome);
    fd.set("papel", papel);
    fd.set("ativo", ativo ? "on" : "off");
    startTransition(async () => {
      const r = await atualizarUsuarioAction(null, fd);
      setStatus(r ? { ok: r.ok, msg: r.mensagem } : null);
    });
  }

  return (
    <tr className="border-t border-slate-100">
      <td className="px-3 py-2 text-slate-700">{usuario.email ?? "—"}</td>
      <td className="px-3 py-2">
        <input
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            setStatus(null);
          }}
          placeholder="nome"
          className="w-40 rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </td>
      <td className="px-3 py-2">
        <select
          value={papel}
          onChange={(e) => {
            setPapel(e.target.value as "admin" | "mecanico");
            setStatus(null);
          }}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm"
        >
          <option value="mecanico">Mecânico</option>
          <option value="admin">Admin</option>
        </select>
      </td>
      <td className="px-3 py-2">
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(e) => {
              setAtivo(e.target.checked);
              setStatus(null);
            }}
          />
          Ativo
        </label>
      </td>
      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={salvar}
            disabled={pending}
            className="rounded-md bg-slate-800 px-3 py-1 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {pending ? "…" : "Salvar"}
          </button>
          {ehProprio && (
            <span className="text-[10px] font-medium text-slate-400">você</span>
          )}
          {status && (
            <span
              className={`text-xs font-medium ${
                status.ok ? "text-emerald-700" : "text-red-600"
              }`}
            >
              {status.ok ? "✓ salvo" : status.msg}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

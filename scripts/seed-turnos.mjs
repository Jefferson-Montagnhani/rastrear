// Script de seed/verificação do Relatório 2.
// Lê um CSV de turnos, normaliza as linhas e chama a RPC importar_turnos
// (mesmo caminho que o app usa). Serve para popular o banco com dados reais
// e validar a função de importação ponta a ponta.
//
// Uso: node --env-file=.env.local scripts/seed-turnos.mjs <caminho-do-csv>
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const arquivo = process.argv[2];
if (!arquivo) {
  console.error("Informe o caminho do CSV.");
  process.exit(1);
}

// --- Parse de CSV (mesma semântica do parser do app) ---
function detectarDelimitador(cab) {
  const pv = (cab.match(/;/g) ?? []).length;
  const v = (cab.match(/,/g) ?? []).length;
  return pv >= v ? ";" : ",";
}
function parseCsv(texto) {
  const conteudo = texto.replace(/^﻿/, "");
  const quebra = conteudo.indexOf("\n");
  const delim = detectarDelimitador(
    quebra >= 0 ? conteudo.slice(0, quebra) : conteudo
  );
  const linhas = [];
  let campo = "";
  let registro = [];
  let aspas = false;
  for (let i = 0; i < conteudo.length; i++) {
    const ch = conteudo[i];
    if (aspas) {
      if (ch === '"') {
        if (conteudo[i + 1] === '"') {
          campo += '"';
          i++;
        } else aspas = false;
      } else campo += ch;
    } else if (ch === '"') aspas = true;
    else if (ch === delim) {
      registro.push(campo);
      campo = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && conteudo[i + 1] === "\n") i++;
      registro.push(campo);
      campo = "";
      if (registro.some((c) => c !== "")) linhas.push(registro);
      registro = [];
    } else campo += ch;
  }
  if (campo !== "" || registro.length > 0) {
    registro.push(campo);
    if (registro.some((c) => c !== "")) linhas.push(registro);
  }
  const cab = linhas[0].map((c) => c.trim().toLowerCase());
  return linhas.slice(1).map((cols) => {
    const o = {};
    cab.forEach((h, i) => (o[h] = (cols[i] ?? "").trim()));
    return o;
  });
}
function normalizarDataHora(v) {
  if (!v) return "";
  const t = v.replace("T", " ");
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})[ ]+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m)
    return `${m[1]}-${m[2]}-${m[3]} ${m[4].padStart(2, "0")}:${m[5]}:${m[6] ?? "00"}`;
  return t;
}

const texto = fs.readFileSync(arquivo, "utf8");
const linhas = parseCsv(texto);
const turnos = linhas
  .filter((l) => l.cd_turno)
  .map((l) => ({
    cd_turno: l.cd_turno,
    instancia: l.instancia ?? "",
    cd_equipamento: l.cd_equipamento ?? "",
    inicio_turno: normalizarDataHora(l.inicio_turno ?? ""),
    fim_turno: normalizarDataHora(l.fim_turno ?? ""),
    status_turno: l.status_turno ?? "",
    qtd_material: l.qtd_material ? Number(l.qtd_material) : 0,
  }));

console.log(`Linhas parseadas: ${turnos.length}`);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  { auth: { persistSession: false } }
);

const { data, error } = await supabase.rpc("importar_turnos", {
  p_arquivo: path.basename(arquivo),
  p_turnos: turnos,
});

if (error) {
  console.error("Erro:", error);
  process.exit(1);
}
console.log("Resultado RPC:", data);

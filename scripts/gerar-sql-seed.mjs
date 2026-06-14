// Gera um arquivo .sql que chama importar_turnos com as linhas de uma instância,
// para semear/validar via MCP (sem depender de rede direta ao Supabase).
// Uso: node scripts/gerar-sql-seed.mjs <csv> <INSTANCIA> <saida.sql>
import fs from "node:fs";

const [csv, instanciaAlvo = "MUND", saida = "scripts/seed.sql"] =
  process.argv.slice(2);

function parseCsv(texto) {
  const conteudo = texto.replace(/^﻿/, "");
  const delim = (conteudo.slice(0, conteudo.indexOf("\n")).match(/;/g) ?? [])
    .length
    ? ";"
    : ",";
  const linhas = [];
  let campo = "",
    reg = [],
    aspas = false;
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
      reg.push(campo);
      campo = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && conteudo[i + 1] === "\n") i++;
      reg.push(campo);
      campo = "";
      if (reg.some((c) => c !== "")) linhas.push(reg);
      reg = [];
    } else campo += ch;
  }
  if (campo !== "" || reg.length) {
    reg.push(campo);
    if (reg.some((c) => c !== "")) linhas.push(reg);
  }
  const cab = linhas[0].map((c) => c.trim().toLowerCase());
  return linhas.slice(1).map((cols) => {
    const o = {};
    cab.forEach((h, i) => (o[h] = (cols[i] ?? "").trim()));
    return o;
  });
}
const norm = (v) => (v ? v.replace("T", " ") : "");
const classif = (iso) => {
  const h = Number(iso.slice(11, 13));
  return h >= 4 && h < 13 ? "A" : h >= 13 && h < 21 ? "B" : "C";
};

const linhas = parseCsv(fs.readFileSync(csv, "utf8")).filter(
  (l) => l.cd_turno && l.instancia === instanciaAlvo
);

const turnos = linhas.map((l) => ({
  cd_turno: l.cd_turno,
  instancia: l.instancia,
  cd_equipamento: l.cd_equipamento ?? "",
  inicio_turno: norm(l.inicio_turno ?? ""),
  fim_turno: norm(l.fim_turno ?? ""),
  status_turno: l.status_turno ?? "",
  qtd_material: l.qtd_material ? Number(l.qtd_material) : 0,
}));

const json = JSON.stringify(turnos);
const sql = `select importar_turnos('seed_${instanciaAlvo}.csv', $j$${json}$j$::jsonb);`;
fs.writeFileSync(saida, sql);

// Resumo esperado (cross-check com o que o banco vai calcular)
const porDia = {};
for (const t of turnos) {
  const dia = t.inicio_turno.slice(0, 10);
  porDia[dia] ??= { total: 0, baixou: 0, A: 0, B: 0, C: 0 };
  porDia[dia].total++;
  if (t.qtd_material > 0) porDia[dia].baixou++;
  porDia[dia][classif(t.inicio_turno)]++;
}
console.log(`Instância ${instanciaAlvo}: ${turnos.length} turnos`);
console.log("Esperado por dia (total/baixou | A/B/C):");
for (const d of Object.keys(porDia).sort()) {
  const p = porDia[d];
  console.log(
    `  ${d}: ${p.total}/${p.baixou}  | A=${p.A} B=${p.B} C=${p.C}`
  );
}
console.log(`\nSQL gravado em ${saida} (${(sql.length / 1024).toFixed(1)} KB)`);

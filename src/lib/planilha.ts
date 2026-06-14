import "server-only";
import * as XLSX from "xlsx";

// Helpers genéricos para ler planilhas (.csv / .xls / .xlsx) no servidor.

// Normaliza o nome de uma coluna: minúsculo, sem acento, espaços -> "_".
export function chaveNormalizada(nome: string): string {
  return nome
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, "_");
}

// Procura no objeto-linha o primeiro cabeçalho que bate com algum candidato.
export function pegar(
  linha: Record<string, string>,
  ...candidatos: string[]
): string {
  for (const c of candidatos) {
    const alvo = chaveNormalizada(c);
    for (const chave of Object.keys(linha)) {
      if (chaveNormalizada(chave) === alvo) {
        return (linha[chave] ?? "").toString().trim();
      }
    }
  }
  return "";
}

// Converte texto em número aceitando formato pt-BR ("1.234,56") e "1234.56".
// Vazio -> 0.
export function paraNumero(valor: string): number {
  let s = valor.trim();
  if (s === "") return 0;
  if (s.includes(",")) {
    // pt-BR: ponto é separador de milhar, vírgula é decimal
    s = s.replace(/\./g, "").replace(",", ".");
  }
  const n = Number(s.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

// Igual a paraNumero, mas devolve null quando a célula está vazia.
export function paraNumeroOuNull(valor: string): number | null {
  return valor.trim() === "" ? null : paraNumero(valor);
}

// Detecta o delimitador do CSV pela linha de cabeçalho (";" ou ",").
function detectarDelimitador(cabecalho: string): string {
  const pv = (cabecalho.match(/;/g) ?? []).length;
  const v = (cabecalho.match(/,/g) ?? []).length;
  return pv >= v ? ";" : ",";
}

// Parser de CSV que trata campos entre aspas e aspas duplicadas ("").
function parseCsv(texto: string): Record<string, string>[] {
  const conteudo = texto.replace(/^﻿/, ""); // remove BOM
  const primeiraQuebra = conteudo.indexOf("\n");
  const delim = detectarDelimitador(
    primeiraQuebra >= 0 ? conteudo.slice(0, primeiraQuebra) : conteudo
  );

  const linhas: string[][] = [];
  let campo = "";
  let registro: string[] = [];
  let dentroAspas = false;

  for (let i = 0; i < conteudo.length; i++) {
    const ch = conteudo[i];
    if (dentroAspas) {
      if (ch === '"') {
        if (conteudo[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          dentroAspas = false;
        }
      } else {
        campo += ch;
      }
    } else if (ch === '"') {
      dentroAspas = true;
    } else if (ch === delim) {
      registro.push(campo);
      campo = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && conteudo[i + 1] === "\n") i++;
      registro.push(campo);
      campo = "";
      if (registro.some((c) => c !== "")) linhas.push(registro);
      registro = [];
    } else {
      campo += ch;
    }
  }
  if (campo !== "" || registro.length > 0) {
    registro.push(campo);
    if (registro.some((c) => c !== "")) linhas.push(registro);
  }

  if (linhas.length === 0) return [];
  const cabecalhos = linhas[0].map((c) => c.trim());
  return linhas.slice(1).map((cols) => {
    const obj: Record<string, string> = {};
    cabecalhos.forEach((h, idx) => (obj[h] = (cols[idx] ?? "").trim()));
    return obj;
  });
}

// Lê o arquivo bruto e devolve as linhas como objetos {cabeçalho: valor}.
export function lerComoLinhas(
  nomeArquivo: string,
  dados: Buffer
): Record<string, string>[] {
  const ehBinario = /\.xlsx?$/i.test(nomeArquivo);
  if (!ehBinario) {
    return parseCsv(dados.toString("utf8"));
  }
  const wb = XLSX.read(dados, { type: "buffer", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
    defval: "",
    raw: false,
  });
}

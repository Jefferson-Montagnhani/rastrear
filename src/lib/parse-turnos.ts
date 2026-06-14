import "server-only";
import * as XLSX from "xlsx";
import type { TurnoNormalizado } from "@/lib/turnos";

// Lê o arquivo de turnos (.xls/.xlsx binário ou .csv texto) e devolve
// as linhas normalizadas, prontas para a função importar_turnos.

// Normaliza o nome de uma coluna para comparação (minúsculo, sem espaços).
function chaveNormalizada(nome: string): string {
  return nome.trim().toLowerCase().replace(/\s+/g, "_");
}

// Procura, num objeto-linha, o primeiro cabeçalho que bate com algum candidato.
function pegar(linha: Record<string, string>, ...candidatos: string[]): string {
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

// Converte vários formatos de data/hora para "YYYY-MM-DD HH:MM:SS".
function normalizarDataHora(valor: unknown): string {
  if (valor == null || valor === "") return "";
  if (valor instanceof Date) {
    const p = (n: number) => String(n).padStart(2, "0");
    return (
      `${valor.getFullYear()}-${p(valor.getMonth() + 1)}-${p(valor.getDate())} ` +
      `${p(valor.getHours())}:${p(valor.getMinutes())}:${p(valor.getSeconds())}`
    );
  }
  const texto = valor.toString().trim().replace("T", " ");
  // 2026-06-02 08:23[:00]
  let m = texto.match(/^(\d{4})-(\d{2})-(\d{2})[ ]+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    const [, a, mes, d, hh, mm, ss] = m;
    return `${a}-${mes}-${d} ${hh.padStart(2, "0")}:${mm}:${ss ?? "00"}`;
  }
  // 02/06/2026 08:23[:00]
  m = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})[ ]+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    const [, d, mes, a, hh, mm, ss] = m;
    return `${a}-${mes}-${d} ${hh.padStart(2, "0")}:${mm}:${ss ?? "00"}`;
  }
  // Só data
  m = texto.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${texto} 00:00:00`;
  return texto;
}

// Converte texto em número (aceita vírgula decimal). Vazio -> 0.
function paraNumero(valor: string): number {
  const limpo = valor.replace(/\./g, "").replace(",", ".").trim();
  if (limpo === "") return 0;
  const n = Number(limpo);
  return Number.isFinite(n) ? n : 0;
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
  const linhaCabecalho =
    primeiraQuebra >= 0 ? conteudo.slice(0, primeiraQuebra) : conteudo;
  const delim = detectarDelimitador(linhaCabecalho);

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
  // último registro sem quebra de linha final
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
function lerComoLinhas(
  nomeArquivo: string,
  dados: Buffer
): Record<string, string>[] {
  const ehBinario = /\.xlsx?$/i.test(nomeArquivo);
  if (!ehBinario) {
    return parseCsv(dados.toString("utf8"));
  }
  // Binário .xls/.xlsx — primeira planilha.
  const wb = XLSX.read(dados, { type: "buffer", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
    defval: "",
    raw: false,
  });
}

// Função principal: arquivo -> turnos normalizados.
export function parsearTurnos(
  nomeArquivo: string,
  dados: Buffer
): TurnoNormalizado[] {
  const linhas = lerComoLinhas(nomeArquivo, dados);
  const resultado: TurnoNormalizado[] = [];

  for (const linha of linhas) {
    const cd_turno = pegar(linha, "cd_turno");
    if (!cd_turno) continue; // ignora linhas sem identificador de turno

    resultado.push({
      cd_turno,
      instancia: pegar(linha, "instancia"),
      cd_equipamento: pegar(linha, "cd_equipamento"),
      inicio_turno: normalizarDataHora(pegar(linha, "inicio_turno")),
      fim_turno: normalizarDataHora(pegar(linha, "fim_turno")),
      status_turno: pegar(linha, "status_turno"),
      qtd_material: paraNumero(pegar(linha, "qtd_material")),
    });
  }

  return resultado;
}

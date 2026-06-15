import "server-only";
import * as XLSX from "xlsx";
import { chaveNormalizada, paraNumero, normalizarDataHora } from "@/lib/planilha";

// Linha de baixa normalizada (export do Manfro).
export type BaixaNormalizada = {
  data_envio: string; // "YYYY-MM-DD HH:MM:SS" ou ""
  codigo_material: string;
  descricao_material: string;
  quantidade: number; // Quantidade Solicitada
  valor_unitario: number | null; // não vem no Manfro (preço vem do MM60)
  total_rs: number;
  deposito_codigo: string;
  frente: string; // não vem no Manfro (derivado do cadastro no R1)
  turno: string; // não vem no Manfro
  status: string; // ex.: "T - Atendimento Total", "C - Cancelado"
};

// Combina cabeçalho de 2 linhas (grupos + sub-rótulos), com forward-fill dos
// grupos (células mescladas). Devolve os cabeçalhos finais e a linha de início.
function montarCabecalhos(aoa: unknown[][]): {
  cabecalhos: string[];
  inicio: number;
} {
  const top = (aoa[0] ?? []).map((c) =>
    (c ?? "").toString().replace(/\s+/g, " ").trim()
  );
  const sub = (aoa[1] ?? []).map((c) => (c ?? "").toString().trim());

  const rotulosSub = new Set(["codigo", "descricao", "solicitada", "atendida", "saldo"]);
  const ehDuasLinhas = sub.some((s) => rotulosSub.has(chaveNormalizada(s)));

  if (!ehDuasLinhas) {
    return { cabecalhos: top, inicio: 1 };
  }

  const ncol = Math.max(top.length, sub.length);
  const grupos: string[] = [];
  let ultimo = "";
  for (let c = 0; c < ncol; c++) {
    if (top[c]) ultimo = top[c];
    grupos[c] = ultimo;
  }
  const cabecalhos = Array.from({ length: ncol }, (_, c) =>
    [grupos[c], sub[c] ?? ""].filter(Boolean).join(" ")
  );
  return { cabecalhos, inicio: 2 };
}

// Lê o export do Manfro (.xls/.xlsx/.csv) e devolve as baixas normalizadas.
export function parsearBaixas(
  _nomeArquivo: string,
  dados: Buffer
): BaixaNormalizada[] {
  const wb = XLSX.read(dados, { type: "buffer", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    raw: true,
    blankrows: false,
  });
  if (aoa.length < 2) return [];

  const { cabecalhos, inicio } = montarCabecalhos(aoa);

  // Busca um campo na linha por candidatos de cabeçalho (sem acento/caixa).
  function pegar(
    linha: Record<string, unknown>,
    ...candidatos: string[]
  ): unknown {
    for (const cand of candidatos) {
      const alvo = chaveNormalizada(cand);
      for (const chave of Object.keys(linha)) {
        if (chaveNormalizada(chave) === alvo) return linha[chave];
      }
    }
    return "";
  }

  const resultado: BaixaNormalizada[] = [];
  for (let r = inicio; r < aoa.length; r++) {
    const row = aoa[r];
    if (!row || row.every((v) => v == null || v === "")) continue;

    const linha: Record<string, unknown> = {};
    cabecalhos.forEach((h, c) => {
      if (h) linha[h] = row[c];
    });

    const codigo_material = (pegar(linha, "Material Código", "Material", "Código do Material") ?? "")
      .toString()
      .trim();
    // só linhas com material numérico (pula sub-cabeçalho/rodapé)
    if (!/^\d+$/.test(codigo_material)) continue;

    resultado.push({
      data_envio: normalizarDataHora(
        pegar(linha, "Data de Envio", "Data Envio", "Data de Baixa", "Data")
      ),
      codigo_material,
      descricao_material: (
        pegar(linha, "Material Descrição", "Descrição Material", "Descrição do Material", "Descrição") ?? ""
      )
        .toString()
        .trim(),
      quantidade: paraNumero(
        (pegar(linha, "Quantidade Solicitada", "Quantidade", "Solicitada") ?? "").toString()
      ),
      valor_unitario: null,
      total_rs: 0,
      deposito_codigo: (
        pegar(linha, "Depósito ERP Código", "Depósito ERP", "Depósito", "Deposito") ?? ""
      )
        .toString()
        .trim(),
      frente: "",
      turno: "",
      status: (pegar(linha, "Status") ?? "").toString().trim(),
    });
  }

  return resultado;
}

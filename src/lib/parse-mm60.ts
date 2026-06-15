import "server-only";
import * as XLSX from "xlsx";
import { chaveNormalizada, paraNumeroOuNull } from "@/lib/planilha";

// Linha de preço normalizada (MM60).
export type PrecoMaterial = {
  codigo_material: string;
  descricao_material: string;
  preco_unitario: number | null;
};

// Lê o export do MM60 (lista de preço do SAP). Aceita o arquivo só da aba MM60
// ou a planilha inteira (procura a aba "MM60").
export function parsearMM60(
  _nomeArquivo: string,
  dados: Buffer
): PrecoMaterial[] {
  const wb = XLSX.read(dados, { type: "buffer", cellDates: true });
  const aba =
    wb.SheetNames.find((n) => chaveNormalizada(n).includes("mm60")) ??
    wb.SheetNames[0];
  const ws = wb.Sheets[aba];
  const linhas = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
    defval: "",
    raw: false,
  });

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

  const resultado: PrecoMaterial[] = [];
  for (const linha of linhas) {
    const codigo_material = pegar(
      linha,
      "Material",
      "Código do Material",
      "Código Material"
    );
    if (!/^\d+$/.test(codigo_material)) continue;

    resultado.push({
      codigo_material,
      descricao_material: pegar(
        linha,
        "Texto breve material",
        "Descrição",
        "Descrição Material"
      ),
      preco_unitario: paraNumeroOuNull(
        pegar(linha, "Preço", "Preco", "Valor Unitário", "Preço Unitário")
      ),
    });
  }

  return resultado;
}

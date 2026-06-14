import "server-only";
import {
  lerComoLinhas,
  pegar,
  paraNumero,
  paraNumeroOuNull,
  normalizarDataHora,
} from "@/lib/planilha";

// Linha de baixa normalizada, pronta para a função importar_baixas.
export type BaixaNormalizada = {
  data_envio: string; // "YYYY-MM-DD HH:MM:SS" ou ""
  codigo_material: string;
  descricao_material: string;
  quantidade: number;
  valor_unitario: number | null;
  total_rs: number;
  deposito_codigo: string;
  frente: string;
  turno: string;
};

// Lê o export do Manfro (.xls/.csv) e devolve as baixas normalizadas.
// Mapeamento flexível de cabeçalhos (aceita variações de grafia/acento).
export function parsearBaixas(
  nomeArquivo: string,
  dados: Buffer
): BaixaNormalizada[] {
  const linhas = lerComoLinhas(nomeArquivo, dados);
  const resultado: BaixaNormalizada[] = [];

  for (const linha of linhas) {
    const codigo_material = pegar(
      linha,
      "Código do Material",
      "Codigo do Material",
      "Material",
      "Cód. Material",
      "Cod Material"
    );
    if (!codigo_material) continue; // ignora linhas sem código de material

    resultado.push({
      data_envio: normalizarDataHora(
        pegar(linha, "Data de Envio", "Data Envio", "Data de Baixa", "Data")
      ),
      codigo_material,
      descricao_material: pegar(
        linha,
        "Descrição Material",
        "Descricao Material",
        "Descrição do Material",
        "Descrição",
        "Texto breve material"
      ),
      quantidade: paraNumero(pegar(linha, "Quantidade", "Qtd", "Qtde")),
      valor_unitario: paraNumeroOuNull(
        pegar(
          linha,
          "Valor Unitário",
          "Valor Unitario",
          "Vlr Unitário",
          "Preço Unitário"
        )
      ),
      total_rs: paraNumero(
        pegar(linha, "Total (R$)", "Total R$", "Valor Total", "Total")
      ),
      deposito_codigo: pegar(linha, "Depósito", "Deposito", "Dep."),
      frente: pegar(linha, "Frente"),
      turno: pegar(linha, "Turno"),
    });
  }

  return resultado;
}

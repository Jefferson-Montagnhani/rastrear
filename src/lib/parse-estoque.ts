import "server-only";
import {
  lerComoLinhas,
  pegar,
  paraNumero,
  paraNumeroOuNull,
} from "@/lib/planilha";
import type { EstoqueNormalizado } from "@/lib/estoque";

// Lê o export de estoque do SAP (.xls/.csv) e devolve as linhas normalizadas.
// O mapeamento de cabeçalhos aceita variações de grafia/acento — se o seu
// arquivo usar outro nome de coluna, é só acrescentar o candidato aqui.
export function parsearEstoque(
  nomeArquivo: string,
  dados: Buffer
): EstoqueNormalizado[] {
  const linhas = lerComoLinhas(nomeArquivo, dados);
  const resultado: EstoqueNormalizado[] = [];

  for (const linha of linhas) {
    const codigo_material = pegar(
      linha,
      "Material",
      "Código do Material",
      "Codigo do Material",
      "Cód. Material",
      "Cod Material"
    );
    if (!codigo_material) continue; // ignora linhas sem código de material

    resultado.push({
      centro: pegar(linha, "Centro", "Centro (Werks)"),
      nome_centro: pegar(
        linha,
        "Nome do Centro",
        "Nome Centro",
        "Denominação do Centro"
      ),
      deposito_codigo: pegar(linha, "Depósito", "Deposito", "Dep."),
      nome_deposito: pegar(
        linha,
        "Nome do Depósito",
        "Nome do Deposito",
        "Nome Depósito",
        "Denominação do Depósito"
      ),
      codigo_material,
      descricao_material: pegar(
        linha,
        "Descrição",
        "Descricao",
        "Descrição Material",
        "Descrição do Material",
        "Texto breve material"
      ),
      estoque_disponivel: paraNumero(
        pegar(
          linha,
          "Estoque Disponível",
          "Estoque Disponivel",
          "Estoque disp.",
          "Livre utilização",
          "Utilização livre",
          "Disponível"
        )
      ),
      ponto_reposicao: paraNumeroOuNull(
        pegar(
          linha,
          "Ponto de Reposição",
          "Ponto de Reposicao",
          "Ponto Reposição",
          "Ponto de reabastecimento"
        )
      ),
      estoque_maximo: paraNumeroOuNull(
        pegar(
          linha,
          "Estoque Máximo",
          "Estoque Maximo",
          "Estoque Max",
          "Nível máximo de estoque"
        )
      ),
      reservas_pendentes: paraNumeroOuNull(
        pegar(
          linha,
          "Estoque em Reservas Pendentes",
          "Reservas Pendentes",
          "Reservas",
          "Reservado"
        )
      ),
    });
  }

  return resultado;
}

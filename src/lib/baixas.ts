// Tipos e agregação do Relatório 1 (Custo das baixas).
// Módulo puro — pode ser usado no cliente.

// Entrada já resolvida (frente/depósito/nome definidos pela página).
export type BaixaEntrada = {
  frente: string;
  deposito: string; // código do depósito (chave de agrupamento)
  nomeDeposito: string;
  codigoMaterial: string;
  descricao: string;
  quantidade: number;
  total: number;
};

export type MaterialAgrupado = {
  codigo: string;
  descricao: string;
  quantidade: number;
  total: number;
};

export type DepositoAgrupado = {
  deposito: string;
  nome: string;
  materiais: MaterialAgrupado[];
  subQuantidade: number;
  subTotal: number;
};

export type FrenteAgrupada = {
  frente: string;
  depositos: DepositoAgrupado[];
  subQuantidade: number;
  subTotal: number;
};

export type Relatorio1 = {
  frentes: FrenteAgrupada[];
  totalQuantidade: number;
  totalGeral: number;
};

// Agrupa as baixas por Frente -> Depósito -> Material, somando quantidade e R$.
export function agrupar(entradas: BaixaEntrada[]): Relatorio1 {
  // estrutura intermediária: frente -> deposito -> material
  const frentes = new Map<
    string,
    Map<string, { nome: string; materiais: Map<string, MaterialAgrupado> }>
  >();

  for (const e of entradas) {
    const frente = e.frente || "—";
    const deposito = e.deposito || "—";

    if (!frentes.has(frente)) frentes.set(frente, new Map());
    const deps = frentes.get(frente)!;

    if (!deps.has(deposito))
      deps.set(deposito, { nome: e.nomeDeposito || deposito, materiais: new Map() });
    const dep = deps.get(deposito)!;

    if (!dep.materiais.has(e.codigoMaterial)) {
      dep.materiais.set(e.codigoMaterial, {
        codigo: e.codigoMaterial,
        descricao: e.descricao,
        quantidade: 0,
        total: 0,
      });
    }
    const mat = dep.materiais.get(e.codigoMaterial)!;
    mat.quantidade += e.quantidade;
    mat.total += e.total;
    if (!mat.descricao && e.descricao) mat.descricao = e.descricao;
  }

  // monta a saída ordenada e calcula subtotais/total
  let totalQuantidade = 0;
  let totalGeral = 0;

  const frentesArr: FrenteAgrupada[] = [...frentes.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "pt-BR"))
    .map(([frente, deps]) => {
      let subFQtd = 0;
      let subFTotal = 0;

      const depositosArr: DepositoAgrupado[] = [...deps.entries()]
        .sort((a, b) => a[1].nome.localeCompare(b[1].nome, "pt-BR"))
        .map(([deposito, info]) => {
          const materiais = [...info.materiais.values()].sort((a, b) =>
            a.codigo.localeCompare(b.codigo, "pt-BR")
          );
          const subQuantidade = materiais.reduce((s, m) => s + m.quantidade, 0);
          const subTotal = materiais.reduce((s, m) => s + m.total, 0);
          subFQtd += subQuantidade;
          subFTotal += subTotal;
          return { deposito, nome: info.nome, materiais, subQuantidade, subTotal };
        });

      totalQuantidade += subFQtd;
      totalGeral += subFTotal;
      return {
        frente,
        depositos: depositosArr,
        subQuantidade: subFQtd,
        subTotal: subFTotal,
      };
    });

  return { frentes: frentesArr, totalQuantidade, totalGeral };
}

// Formata valor em Reais (pt-BR).
export function formatarReais(valor: number | null | undefined): string {
  return Number(valor ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

// Formata quantidade (pt-BR, sem casas desnecessárias).
export function formatarQtd(valor: number | null | undefined): string {
  return Number(valor ?? 0).toLocaleString("pt-BR", {
    maximumFractionDigits: 3,
  });
}

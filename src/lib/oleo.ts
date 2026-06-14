// Tipos e cálculo do Relatório 4 (Reposição de óleo). Módulo puro.

export type OleoEntrada = {
  frente: string;
  deposito: string; // código do depósito
  nomeDeposito: string;
  codigoMaterial: string;
  abreviacao: string;
  estoqueDisponivel: number;
  pontoReposicao: number | null;
  estoqueMaximo: number | null;
  reservasPendentes: number | null;
};

export type OleoCalculado = OleoEntrada & {
  saldoEmFalta: number;
  abastecer: number;
};

// Calcula Saldo em Falta e Abastecer de uma linha de óleo.
// Regras definidas pelo usuário:
//   - Abastecer só dispara quando Estoque Disponível <= Ponto de Reposição;
//   - Abastecer = máx(Estoque Máximo - Estoque Disponível, 0) (sem descontar reservas);
//   - Saldo em Falta = máx(Ponto de Reposição - Estoque Disponível, 0).
export function calcular(e: OleoEntrada): OleoCalculado {
  const disp = Number(e.estoqueDisponivel ?? 0);
  const ponto = Number(e.pontoReposicao ?? 0);
  const maximo = Number(e.estoqueMaximo ?? 0);

  const saldoEmFalta = Math.max(ponto - disp, 0);
  const abaixoDoPonto = disp <= ponto;
  const abastecer = abaixoDoPonto ? Math.max(maximo - disp, 0) : 0;

  return { ...e, saldoEmFalta, abastecer };
}

// Ordena por frente, depósito e abreviação (para exibição estável).
export function ordenarOleos(linhas: OleoCalculado[]): OleoCalculado[] {
  return [...linhas].sort(
    (a, b) =>
      a.frente.localeCompare(b.frente, "pt-BR") ||
      a.nomeDeposito.localeCompare(b.nomeDeposito, "pt-BR") ||
      (a.abreviacao || a.codigoMaterial).localeCompare(
        b.abreviacao || b.codigoMaterial,
        "pt-BR"
      )
  );
}

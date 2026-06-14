// Tipos e helpers do Relatório 3 (Saldo de estoque por caminhão).
// Módulo puro (sem dependências de Node) — pode ser usado no cliente.

// Linha de estoque normalizada, pronta para enviar ao banco.
export type EstoqueNormalizado = {
  centro: string;
  nome_centro: string;
  deposito_codigo: string;
  nome_deposito: string;
  codigo_material: string;
  descricao_material: string;
  estoque_disponivel: number;
  ponto_reposicao: number | null;
  estoque_maximo: number | null;
  reservas_pendentes: number | null;
};

// Linha de estoque como exibida no Relatório 3 (já com o apelido do catálogo).
export type EstoqueLinha = {
  deposito_codigo: string | null;
  nome_deposito: string | null;
  codigo_material: string | null;
  descricao_material: string | null;
  estoque_disponivel: number;
  conhecido_como: string | null;
};

// Um caminhão (depósito) para o seletor.
export type DepositoOpcao = {
  codigo: string;
  nome: string;
};

// Extrai a lista de caminhões (depósitos) presentes no snapshot, ordenada.
export function listarDepositos(linhas: EstoqueLinha[]): DepositoOpcao[] {
  const mapa = new Map<string, string>();
  for (const l of linhas) {
    const codigo = l.deposito_codigo ?? l.nome_deposito ?? "—";
    const nome = l.nome_deposito ?? l.deposito_codigo ?? "—";
    if (!mapa.has(codigo)) mapa.set(codigo, nome);
  }
  return [...mapa.entries()]
    .map(([codigo, nome]) => ({ codigo, nome }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

// Formata número no padrão pt-BR (sem casas desnecessárias).
export function formatarNumero(valor: number | null | undefined): string {
  const n = Number(valor ?? 0);
  return n.toLocaleString("pt-BR", { maximumFractionDigits: 3 });
}

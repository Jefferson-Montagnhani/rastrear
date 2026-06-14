// Tipos e regras de negócio do Relatório 2 (Turnos).
// Este módulo é "puro" (sem dependências de Node), então pode ser importado
// tanto no servidor quanto no cliente.

// Um turno já normalizado, pronto para enviar ao banco.
export type TurnoNormalizado = {
  cd_turno: string;
  instancia: string;
  cd_equipamento: string;
  // Datas em texto "YYYY-MM-DD HH:MM:SS" (hora local da usina) ou "".
  inicio_turno: string;
  fim_turno: string;
  status_turno: string;
  qtd_material: number;
};

// Uma linha de turno como vem do banco (para exibição no relatório).
export type TurnoBanco = {
  cd_turno: string;
  instancia: string | null;
  cd_equipamento: string | null;
  inicio_turno: string | null;
  fim_turno: string | null;
  status_turno: string | null;
  qtd_material: number;
  turno: string | null; // A / B / C (coluna gerada no banco)
  baixou: boolean; // qtd_material > 0 (coluna gerada no banco)
};

// Classifica o turno A/B/C pela hora de início.
// Regra do Power Query do usuário:
//   Hora >= 4 e < 13  -> "A"
//   Hora >= 13 e < 21 -> "B"
//   caso contrário    -> "C"
export function classificarTurno(hora: number): "A" | "B" | "C" {
  if (hora >= 4 && hora < 13) return "A";
  if (hora >= 13 && hora < 21) return "B";
  return "C";
}

// Métricas do cabeçalho do relatório.
export type ResumoRelatorio2 = {
  totalTurnos: number;
  turnosComBaixa: number;
  percentualComBaixa: number; // 0..100
  qtdTotalBaixada: number;
};

// Calcula o resumo a partir das linhas filtradas (data + instância já aplicados).
export function calcularResumo(linhas: TurnoBanco[]): ResumoRelatorio2 {
  const totalTurnos = linhas.length;
  const turnosComBaixa = linhas.filter((l) => l.baixou).length;
  const qtdTotalBaixada = linhas.reduce(
    (soma, l) => soma + (Number(l.qtd_material) || 0),
    0
  );
  const percentualComBaixa =
    totalTurnos > 0 ? (turnosComBaixa / totalTurnos) * 100 : 0;

  return { totalTurnos, turnosComBaixa, percentualComBaixa, qtdTotalBaixada };
}

// ---- Formatadores (pt-BR) -------------------------------------------------

// "2026-06-08T08:23:00" / "2026-06-08 08:23:00" -> "08/06/2026 08:23"
export function formatarDataHora(valor: string | null): string {
  if (!valor) return "—";
  const texto = valor.replace("T", " ");
  const m = texto.match(/^(\d{4})-(\d{2})-(\d{2})[ ]?(\d{2})?:?(\d{2})?/);
  if (!m) return valor;
  const [, ano, mes, dia, hh, mm] = m;
  const hora = hh && mm ? ` ${hh}:${mm}` : "";
  return `${dia}/${mes}/${ano}${hora}`;
}

// "2026-06-08" -> "08/06/2026"
export function formatarData(valor: string | null): string {
  if (!valor) return "—";
  const m = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return valor;
  const [, ano, mes, dia] = m;
  return `${dia}/${mes}/${ano}`;
}

// Carimbo "Atualizado em dd/mm/aaaa hh:mm" no fuso de São Paulo.
export function formatarCarimbo(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return fmt.format(d);
}

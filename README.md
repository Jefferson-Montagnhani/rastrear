# Rastrear

Sistema web do PCM da Manutenção Automotiva (Raízen — Unidade Mundial) para
substituir os 4 relatórios diários que hoje são montados numa planilha Excel
(.xlsm com Power Query) e enviados no WhatsApp.

> **Estado atual:** Parte 1 entregue — **Relatório 2 (Turnos x Baixas)**.
> Os Relatórios 1 (Custos), 3 (Saldo por caminhão) e 4 (Reposição de óleo),
> além de login por papel, transferências de óleo e histórico, entram nas
> próximas partes.

## Stack

- **Next.js 16** (App Router, Server Components, Server Actions) + TypeScript
- **Tailwind CSS v4**
- **Supabase** (Postgres + RLS) — projeto `Rastrear` (`hiukokgrsbvmpimtvbwg`)
- **SheetJS (xlsx)** para ler `.xls`/`.csv`, **html-to-image** para exportar PNG

> ⚠️ Esta versão do Next.js tem mudanças em relação a versões antigas. Os guias
> ficam em `node_modules/next/dist/docs/` — leia antes de codar (ver `AGENTS.md`).

## Configuração local

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo `.env.local` na raiz (as chaves abaixo são públicas e
   protegidas por RLS):

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://hiukokgrsbvmpimtvbwg.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key do projeto Rastrear>
   ```

3. Rode em desenvolvimento:

   ```bash
   npm run dev
   ```

   Acesse `http://localhost:3000` → **Relatório 2 — Turnos**.

> O upload do arquivo de turnos funciona direto na tela. Uma função SQL
> (`importar_turnos`, `SECURITY DEFINER`) faz o `UPSERT` por `cd_turno`, então
> não é preciso chave de serviço — só as chaves públicas acima.

## Importar dados

- **Pela tela:** em `/relatorio-2`, use "Importar arquivo de turnos" e suba o
  `.csv`/`.xls`. Reupload de um arquivo mais novo atualiza os turnos que estavam
  "Aberto"/sem baixa (chave natural `cd_turno`).
- **Por script (seed/validação):**

  ```bash
  node --env-file=.env.local scripts/seed-turnos.mjs caminho/arquivo.csv
  ```

## Como o Relatório 2 funciona

- **Fonte:** export de turnos (colunas `cd_turno`, `INSTANCIA`,
  `cd_equipamento`, `INICIO_TURNO`, `FIM_TURNO`, `STATUS_TURNO`,
  `QTD_MATERIAL`). O arquivo é multi-instância e multi-dia.
- **Filtros:** data de referência + instância (padrão **MUND**).
- **Turno A/B/C:** derivado da hora de início — `A` 04h–12h59, `B` 13h–20h59,
  `C` 21h–03h59 (coluna gerada no banco).
- **BAIXOU?** `SIM` (verde) quando `QTD_MATERIAL > 0`, senão `NÃO` (vermelho).
- **Cabeçalho:** total de turnos, turnos com baixa (qtd e %), qtd total baixada,
  e carimbo "Atualizado em".
- **Exportar PNG:** gera a imagem do relatório para mandar no WhatsApp.

## Modelo de dados (parte atual)

| Tabela | Papel |
|---|---|
| `profiles` | usuários e papel (`admin`/`mecanico`) — usado quando ligarmos o Auth |
| `importacoes` | lotes de upload; `created_at` = carimbo "Atualizado em" |
| `turnos` | fonte do Relatório 2; colunas geradas `data_turno`, `turno`, `baixou` |

Views de apoio: `v_datas_turnos`, `v_instancias_turnos` (seletores).
Função: `importar_turnos(p_arquivo, p_turnos jsonb)`.

## Observação sobre o ambiente de sandbox

No ambiente de execução remota onde este código foi construído, o host do
Supabase fica fora da allowlist de rede — por isso a verificação foi feita via
MCP (seed + queries de conferência). **Na sua máquina local o acesso é normal**,
então `npm run dev` e os uploads funcionam direto.

## Próximos passos

- Relatório 1 (Custos), Relatório 3 (Saldo por caminhão, leitura p/ mecânico),
  Relatório 4 (Reposição de óleo)
- Login por papel (Supabase Auth) e RLS por perfil
- Registro de transferências de óleo (delivery → caminhão-oficina)
- Histórico por data e exportação em PDF

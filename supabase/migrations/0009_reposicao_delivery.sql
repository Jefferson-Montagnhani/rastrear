-- =========================================================
-- Rastrear — Migração 0009: regra de reposição via delivery + cadastro
-- Requer migrações anteriores aplicadas.
--
-- Como aplicar: cole no SQL Editor do Supabase e Run (idempotente).
-- =========================================================

-- Marca quais caminhões SÃO abastecidos pelo delivery (entram no Relatório 4).
-- Ficam de fora os que pegam óleo direto no almoxarifado:
--   - o próprio delivery (CB04);
--   - os caminhões de preventiva, que vêm à usina todo dia (CB03, CO02, CO03);
--   - a central de lubrificação (LU03) já fica de fora por não estar no cadastro.
alter table public.depositos
  add column if not exists abastece_delivery boolean not null default true;

update public.depositos set abastece_delivery = false
where codigo_deposito in ('CB04', 'CB03', 'CO02', 'CO03');

-- Correção de cadastro: o depósito CO07 é a frota 72530.
update public.depositos
set frota = '72530', nome_deposito = 'CAM OF F 72530'
where codigo_deposito = 'CO07';

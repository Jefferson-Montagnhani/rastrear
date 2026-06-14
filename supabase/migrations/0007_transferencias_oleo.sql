-- =========================================================
-- Rastrear — Migração 0007: Transferências de óleo (delivery -> caminhão-oficina)
-- Requer a 0006 aplicada (usa is_admin() e profiles).
--
-- Como aplicar: cole no SQL Editor do Supabase e Run (idempotente).
-- =========================================================

create table if not exists public.transferencias_oleo (
  id uuid primary key default gen_random_uuid(),
  data date not null default (now() at time zone 'America/Sao_Paulo')::date,
  deposito_origem text not null default 'CB04',   -- caminhão delivery (340210)
  deposito_destino text,                          -- caminhão-oficina que recebeu
  frente text,                                    -- frente do destino (apoio)
  codigo_material text not null,                  -- óleo transferido
  quantidade numeric not null,
  observacao text,
  usuario_id uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now()
);
comment on table public.transferencias_oleo is
  'Registro das transferências de óleo do delivery para o caminhão-oficina.';

create index if not exists idx_transf_data on public.transferencias_oleo (data desc);

-- RLS: só admin lê, registra e remove.
alter table public.transferencias_oleo enable row level security;

drop policy if exists transf_select on public.transferencias_oleo;
create policy transf_select on public.transferencias_oleo
  for select using (public.is_admin());

drop policy if exists transf_insert on public.transferencias_oleo;
create policy transf_insert on public.transferencias_oleo
  for insert with check (public.is_admin());

drop policy if exists transf_delete on public.transferencias_oleo;
create policy transf_delete on public.transferencias_oleo
  for delete using (public.is_admin());

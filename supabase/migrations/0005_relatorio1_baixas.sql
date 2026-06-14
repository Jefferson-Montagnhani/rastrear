-- =========================================================
-- Rastrear — Migração 0005: Relatório 1 (Custo das baixas)
-- Fonte: export do Manfro Manutenção (uma linha por baixa).
--
-- Como aplicar: cole no SQL Editor do Supabase e Run (idempotente).
-- =========================================================

-- baixas: uma linha por baixa de material (export do Manfro)
create table if not exists public.baixas (
  id uuid primary key default gen_random_uuid(),
  importacao_id uuid references public.importacoes(id),
  data_referencia date,          -- dia da baixa (derivado da Data de Envio)
  data_envio timestamp,
  codigo_material text,
  descricao_material text,
  quantidade numeric not null default 0,
  valor_unitario numeric,
  total_rs numeric not null default 0,
  deposito_codigo text,
  frente text,
  turno text,
  created_at timestamptz not null default now()
);
comment on table public.baixas is 'Baixas de material (export Manfro) — fonte do Relatorio 1.';

create index if not exists idx_baixas_data on public.baixas (data_referencia);
create index if not exists idx_baixas_importacao on public.baixas (importacao_id);

-- RLS: leitura liberada (MVP); escrita via funcao SECURITY DEFINER
alter table public.baixas enable row level security;
drop policy if exists leitura_baixas on public.baixas;
create policy leitura_baixas on public.baixas for select using (true);

-- view de apoio: datas distintas com baixas (para o seletor)
create or replace view public.v_datas_baixas
  with (security_invoker = true) as
  select distinct data_referencia
  from public.baixas
  where data_referencia is not null;
grant select on public.v_datas_baixas to anon, authenticated;

-- importar_baixas: registra o lote e SUBSTITUI as baixas das datas do arquivo
-- (reupload de um dia corrige o dia, sem duplicar).
create or replace function public.importar_baixas(
  p_arquivo text,
  p_baixas jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_imp uuid;
  v_total int;
  v_inicio date;
  v_fim date;
begin
  select
    min((nullif(b->>'data_envio','')::timestamp)::date),
    max((nullif(b->>'data_envio','')::timestamp)::date),
    count(*) filter (where coalesce(b->>'codigo_material','') <> '')
  into v_inicio, v_fim, v_total
  from jsonb_array_elements(p_baixas) b;

  insert into public.importacoes (tipo, arquivo_nome, periodo_inicio, periodo_fim, linhas_processadas)
  values ('manfro', p_arquivo, v_inicio, v_fim, coalesce(v_total, 0))
  returning id into v_imp;

  -- substitui as baixas das datas presentes no arquivo
  delete from public.baixas
  where data_referencia in (
    select distinct (nullif(b->>'data_envio','')::timestamp)::date
    from jsonb_array_elements(p_baixas) b
    where nullif(b->>'data_envio','') is not null
  );

  insert into public.baixas (
    importacao_id, data_referencia, data_envio, codigo_material, descricao_material,
    quantidade, valor_unitario, total_rs, deposito_codigo, frente, turno
  )
  select
    v_imp,
    (nullif(b->>'data_envio','')::timestamp)::date,
    nullif(b->>'data_envio','')::timestamp,
    b->>'codigo_material',
    nullif(b->>'descricao_material',''),
    coalesce(nullif(b->>'quantidade','')::numeric, 0),
    nullif(b->>'valor_unitario','')::numeric,
    coalesce(nullif(b->>'total_rs','')::numeric, 0),
    nullif(b->>'deposito_codigo',''),
    nullif(b->>'frente',''),
    nullif(b->>'turno','')
  from jsonb_array_elements(p_baixas) b
  where coalesce(b->>'codigo_material','') <> '';

  return jsonb_build_object('importacao_id', v_imp, 'linhas', coalesce(v_total, 0),
                            'periodo_inicio', v_inicio, 'periodo_fim', v_fim);
end;
$$;

grant execute on function public.importar_baixas(text, jsonb) to anon, authenticated;

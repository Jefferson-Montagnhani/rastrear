-- =========================================================
-- Rastrear — Migração 0004: Relatório 3
-- estoque (snapshot do SAP) + catálogo de materiais + depósitos (mestre)
--
-- Como aplicar:
--   - Supabase SQL Editor: cole e execute; ou
--   - Supabase CLI: supabase db push
-- =========================================================

-- depositos: dados mestre (depósito -> frota -> frente)
create table if not exists public.depositos (
  id uuid primary key default gen_random_uuid(),
  codigo_deposito text unique not null,
  frota text,
  frente text,
  nome_deposito text,
  is_delivery boolean not null default false,
  ativo boolean not null default true
);
comment on table public.depositos is 'Dados mestre: deposito -> frota -> frente (caminhoes).';

insert into public.depositos (codigo_deposito, frota, frente, nome_deposito, is_delivery) values
  ('CO02','112233','Prev','CAM OF F 112233', false),
  ('CO03','112240','Prev','CAM OF F 112240', false),
  ('CO04','112241','Plantio','CAM OF F 112241', false),
  ('CO05','112244','663','CAM OF F 112244', false),
  ('CO06','340212','661','CAM CB F 340212', false),
  ('CO07','112254','662','CAM OF F 112254', false),
  ('CO09','530103','Muda','CAM OF F 530103', false),
  ('CO10','96650',null,'CAM OF F 96650', false),
  ('CB03','112249','Prev','CAM CB F 112249', false),
  ('CB04','340210','Delivery','CAM CB F 340210', true)
on conflict (codigo_deposito) do nothing;

-- materiais: catalogo (apelido "conhecido como" e oleos)
create table if not exists public.materiais (
  codigo_material text primary key,
  descricao text,
  conhecido_como text,
  is_oleo boolean not null default false,
  abreviacao text,
  updated_at timestamptz not null default now()
);
comment on table public.materiais is 'Catalogo de materiais; conhecido_como (apelido) editado pelo usuario.';

insert into public.materiais (codigo_material, abreviacao, conhecido_como, is_oleo) values
  ('9800156','10W30','10W30', true),
  ('9800159','15W40','15W40', true),
  ('9800299','68','68', true),
  ('9800196','85W140','85W140', true),
  ('9800360','80W90','80W90', true),
  ('9801190','Graxa','Graxa', true),
  ('9801504','ADITIVO','ADITIVO', true)
on conflict (codigo_material) do nothing;

-- estoque: snapshot do export do SAP (fonte dos Relatorios 3 e 4)
create table if not exists public.estoque (
  id uuid primary key default gen_random_uuid(),
  importacao_id uuid references public.importacoes(id),
  data_referencia date,
  centro text,
  nome_centro text,
  deposito_codigo text,
  nome_deposito text,
  codigo_material text,
  descricao_material text,
  estoque_disponivel numeric not null default 0,
  ponto_reposicao numeric,
  estoque_maximo numeric,
  reservas_pendentes numeric,
  created_at timestamptz not null default now()
);
comment on table public.estoque is 'Snapshot de estoque do SAP (Relatorios 3 e 4).';

create index if not exists idx_estoque_importacao on public.estoque (importacao_id);
create index if not exists idx_estoque_deposito on public.estoque (deposito_codigo);

-- view de apoio: caminhoes (depositos) distintos por snapshot
create or replace view public.v_estoque_depositos
  with (security_invoker = true) as
  select distinct importacao_id, deposito_codigo, nome_deposito
  from public.estoque;
grant select on public.v_estoque_depositos to anon, authenticated;

-- RLS: leitura liberada (MVP); escrita via funcoes SECURITY DEFINER
alter table public.depositos enable row level security;
alter table public.materiais enable row level security;
alter table public.estoque enable row level security;

drop policy if exists leitura_depositos on public.depositos;
create policy leitura_depositos on public.depositos for select using (true);
drop policy if exists leitura_materiais on public.materiais;
create policy leitura_materiais on public.materiais for select using (true);
drop policy if exists leitura_estoque on public.estoque;
create policy leitura_estoque on public.estoque for select using (true);

-- importar_estoque: registra snapshot, grava linhas e popula catalogo
create or replace function public.importar_estoque(
  p_arquivo text,
  p_estoque jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_imp uuid;
  v_total int;
  v_data date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  select count(*) into v_total
  from jsonb_array_elements(p_estoque) e
  where coalesce(e->>'codigo_material','') <> '';

  insert into public.importacoes (tipo, arquivo_nome, periodo_inicio, periodo_fim, linhas_processadas)
  values ('estoque', p_arquivo, v_data, v_data, coalesce(v_total, 0))
  returning id into v_imp;

  -- popula o catalogo (1 linha por codigo; mantem conhecido_como/is_oleo/abreviacao)
  insert into public.materiais (codigo_material, descricao)
  select codigo, descricao from (
    select distinct on (e->>'codigo_material')
      e->>'codigo_material' as codigo,
      nullif(e->>'descricao_material','') as descricao
    from jsonb_array_elements(p_estoque) e
    where coalesce(e->>'codigo_material','') <> ''
    order by e->>'codigo_material'
  ) s
  on conflict (codigo_material) do update
    set descricao = coalesce(excluded.descricao, public.materiais.descricao),
        updated_at = now();

  insert into public.estoque (
    importacao_id, data_referencia, centro, nome_centro, deposito_codigo,
    nome_deposito, codigo_material, descricao_material, estoque_disponivel,
    ponto_reposicao, estoque_maximo, reservas_pendentes
  )
  select
    v_imp, v_data,
    nullif(e->>'centro',''),
    nullif(e->>'nome_centro',''),
    nullif(e->>'deposito_codigo',''),
    nullif(e->>'nome_deposito',''),
    e->>'codigo_material',
    nullif(e->>'descricao_material',''),
    coalesce(nullif(e->>'estoque_disponivel','')::numeric, 0),
    nullif(e->>'ponto_reposicao','')::numeric,
    nullif(e->>'estoque_maximo','')::numeric,
    nullif(e->>'reservas_pendentes','')::numeric
  from jsonb_array_elements(p_estoque) e
  where coalesce(e->>'codigo_material','') <> '';

  return jsonb_build_object('importacao_id', v_imp, 'linhas', coalesce(v_total, 0), 'data_referencia', v_data);
end;
$$;

grant execute on function public.importar_estoque(text, jsonb) to anon, authenticated;

-- definir_conhecido_como: tela de catalogo grava o apelido
create or replace function public.definir_conhecido_como(
  p_codigo text,
  p_nome text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.materiais (codigo_material, conhecido_como)
  values (p_codigo, nullif(trim(p_nome), ''))
  on conflict (codigo_material) do update
    set conhecido_como = nullif(trim(p_nome), ''),
        updated_at = now();
end;
$$;

grant execute on function public.definir_conhecido_como(text, text) to anon, authenticated;

-- =========================================================
-- Rastrear — Migração 0006: Autenticação, papéis e RLS por perfil
--
-- Como aplicar: cole no SQL Editor do Supabase e Run (idempotente).
--
-- BOOTSTRAP DO ADMIN (passo manual, uma vez):
--   1) Crie o usuário em Authentication > Users > Add user (e-mail + senha).
--   2) Promova-o a admin rodando (troque o e-mail):
--        update public.profiles set papel = 'admin'
--        where id = (select id from auth.users where email = 'voce@empresa.com');
-- =========================================================

-- is_admin(): o usuário logado é admin e está ativo?
-- SECURITY DEFINER para ler profiles sem cair na própria RLS (evita recursão).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and papel = 'admin' and ativo
  );
$$;

-- Cria automaticamente um perfil (papel 'mecanico') quando nasce um auth.user.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, papel)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    'mecanico'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------
-- RLS por perfil (substitui as policies de leitura abertas do MVP)
-- ---------------------------------------------------------

-- profiles: usuário lê o próprio; admin lê/edita todos.
drop policy if exists perfil_select on public.profiles;
create policy perfil_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());
drop policy if exists perfil_update_admin on public.profiles;
create policy perfil_update_admin on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- Dados que o mecânico precisa ver (Relatório 3 + carimbo): qualquer logado.
drop policy if exists leitura_depositos on public.depositos;
create policy leitura_depositos on public.depositos
  for select using (auth.uid() is not null);

drop policy if exists leitura_materiais on public.materiais;
create policy leitura_materiais on public.materiais
  for select using (auth.uid() is not null);

drop policy if exists leitura_estoque on public.estoque;
create policy leitura_estoque on public.estoque
  for select using (auth.uid() is not null);

drop policy if exists leitura_importacoes on public.importacoes;
create policy leitura_importacoes on public.importacoes
  for select using (auth.uid() is not null);

-- Dados só de admin (turnos e baixas).
drop policy if exists leitura_turnos on public.turnos;
create policy leitura_turnos on public.turnos
  for select using (public.is_admin());

drop policy if exists leitura_baixas on public.baixas;
create policy leitura_baixas on public.baixas
  for select using (public.is_admin());

-- ---------------------------------------------------------
-- Funções de escrita: agora exigem admin e não são mais chamáveis por anon.
-- ---------------------------------------------------------

revoke execute on function public.importar_turnos(text, jsonb) from anon;
revoke execute on function public.importar_estoque(text, jsonb) from anon;
revoke execute on function public.importar_baixas(text, jsonb) from anon;
revoke execute on function public.definir_conhecido_como(text, text) from anon;

-- Guard de admin dentro de cada função (defesa no banco, além do app).
create or replace function public.importar_turnos(p_arquivo text, p_turnos jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_importacao_id uuid; v_inicio date; v_fim date; v_total int;
begin
  if not public.is_admin() then raise exception 'acesso negado: requer admin'; end if;

  select min(nullif(t->>'inicio_turno','')::timestamp::date),
         max(nullif(t->>'inicio_turno','')::timestamp::date), count(*)
  into v_inicio, v_fim, v_total
  from jsonb_array_elements(p_turnos) as t;

  insert into public.importacoes (tipo, arquivo_nome, periodo_inicio, periodo_fim, linhas_processadas)
  values ('turnos', p_arquivo, v_inicio, v_fim, coalesce(v_total, 0))
  returning id into v_importacao_id;

  insert into public.turnos as tu (
    cd_turno, instancia, cd_equipamento, inicio_turno, fim_turno,
    status_turno, qtd_material, importacao_id, updated_at)
  select t->>'cd_turno', nullif(t->>'instancia',''), nullif(t->>'cd_equipamento',''),
    nullif(t->>'inicio_turno','')::timestamp, nullif(t->>'fim_turno','')::timestamp,
    nullif(t->>'status_turno',''), coalesce(nullif(t->>'qtd_material','')::numeric, 0),
    v_importacao_id, now()
  from jsonb_array_elements(p_turnos) as t
  where coalesce(t->>'cd_turno','') <> ''
  on conflict (cd_turno) do update set
    instancia = excluded.instancia, cd_equipamento = excluded.cd_equipamento,
    inicio_turno = excluded.inicio_turno, fim_turno = excluded.fim_turno,
    status_turno = excluded.status_turno, qtd_material = excluded.qtd_material,
    importacao_id = excluded.importacao_id, updated_at = now();

  return jsonb_build_object('importacao_id', v_importacao_id, 'linhas', coalesce(v_total, 0),
                            'periodo_inicio', v_inicio, 'periodo_fim', v_fim);
end; $$;

create or replace function public.importar_estoque(p_arquivo text, p_estoque jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_imp uuid; v_total int; v_data date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if not public.is_admin() then raise exception 'acesso negado: requer admin'; end if;

  select count(*) into v_total from jsonb_array_elements(p_estoque) e
  where coalesce(e->>'codigo_material','') <> '';

  insert into public.importacoes (tipo, arquivo_nome, periodo_inicio, periodo_fim, linhas_processadas)
  values ('estoque', p_arquivo, v_data, v_data, coalesce(v_total, 0)) returning id into v_imp;

  insert into public.materiais (codigo_material, descricao)
  select codigo, descricao from (
    select distinct on (e->>'codigo_material') e->>'codigo_material' as codigo,
      nullif(e->>'descricao_material','') as descricao
    from jsonb_array_elements(p_estoque) e
    where coalesce(e->>'codigo_material','') <> '' order by e->>'codigo_material'
  ) s
  on conflict (codigo_material) do update
    set descricao = coalesce(excluded.descricao, public.materiais.descricao), updated_at = now();

  insert into public.estoque (importacao_id, data_referencia, centro, nome_centro, deposito_codigo,
    nome_deposito, codigo_material, descricao_material, estoque_disponivel,
    ponto_reposicao, estoque_maximo, reservas_pendentes)
  select v_imp, v_data, nullif(e->>'centro',''), nullif(e->>'nome_centro',''),
    nullif(e->>'deposito_codigo',''), nullif(e->>'nome_deposito',''), e->>'codigo_material',
    nullif(e->>'descricao_material',''), coalesce(nullif(e->>'estoque_disponivel','')::numeric, 0),
    nullif(e->>'ponto_reposicao','')::numeric, nullif(e->>'estoque_maximo','')::numeric,
    nullif(e->>'reservas_pendentes','')::numeric
  from jsonb_array_elements(p_estoque) e where coalesce(e->>'codigo_material','') <> '';

  return jsonb_build_object('importacao_id', v_imp, 'linhas', coalesce(v_total, 0), 'data_referencia', v_data);
end; $$;

create or replace function public.importar_baixas(p_arquivo text, p_baixas jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_imp uuid; v_total int; v_inicio date; v_fim date;
begin
  if not public.is_admin() then raise exception 'acesso negado: requer admin'; end if;

  select min((nullif(b->>'data_envio','')::timestamp)::date),
         max((nullif(b->>'data_envio','')::timestamp)::date),
         count(*) filter (where coalesce(b->>'codigo_material','') <> '')
  into v_inicio, v_fim, v_total from jsonb_array_elements(p_baixas) b;

  insert into public.importacoes (tipo, arquivo_nome, periodo_inicio, periodo_fim, linhas_processadas)
  values ('manfro', p_arquivo, v_inicio, v_fim, coalesce(v_total, 0)) returning id into v_imp;

  delete from public.baixas where data_referencia in (
    select distinct (nullif(b->>'data_envio','')::timestamp)::date
    from jsonb_array_elements(p_baixas) b where nullif(b->>'data_envio','') is not null);

  insert into public.baixas (importacao_id, data_referencia, data_envio, codigo_material, descricao_material,
    quantidade, valor_unitario, total_rs, deposito_codigo, frente, turno)
  select v_imp, (nullif(b->>'data_envio','')::timestamp)::date, nullif(b->>'data_envio','')::timestamp,
    b->>'codigo_material', nullif(b->>'descricao_material',''),
    coalesce(nullif(b->>'quantidade','')::numeric, 0), nullif(b->>'valor_unitario','')::numeric,
    coalesce(nullif(b->>'total_rs','')::numeric, 0), nullif(b->>'deposito_codigo',''),
    nullif(b->>'frente',''), nullif(b->>'turno','')
  from jsonb_array_elements(p_baixas) b where coalesce(b->>'codigo_material','') <> '';

  return jsonb_build_object('importacao_id', v_imp, 'linhas', coalesce(v_total, 0),
                            'periodo_inicio', v_inicio, 'periodo_fim', v_fim);
end; $$;

create or replace function public.definir_conhecido_como(p_codigo text, p_nome text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'acesso negado: requer admin'; end if;
  insert into public.materiais (codigo_material, conhecido_como)
  values (p_codigo, nullif(trim(p_nome), ''))
  on conflict (codigo_material) do update
    set conhecido_como = nullif(trim(p_nome), ''), updated_at = now();
end; $$;

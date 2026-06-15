-- =========================================================
-- Rastrear — Migração 0010: status da baixa (Manfro)
-- Permite filtrar no R1 só as baixas efetivas (o Manfro traz muitas canceladas).
-- Requer migrações anteriores aplicadas.
--
-- Como aplicar: cole no SQL Editor do Supabase e Run (idempotente).
-- =========================================================

alter table public.baixas add column if not exists status text;

-- Recria importar_baixas para gravar o status (mantém o guard de admin).
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

  -- substitui as baixas das datas presentes no arquivo
  delete from public.baixas where data_referencia in (
    select distinct (nullif(b->>'data_envio','')::timestamp)::date
    from jsonb_array_elements(p_baixas) b where nullif(b->>'data_envio','') is not null);

  insert into public.baixas (importacao_id, data_referencia, data_envio, codigo_material, descricao_material,
    quantidade, valor_unitario, total_rs, deposito_codigo, frente, turno, status)
  select v_imp, (nullif(b->>'data_envio','')::timestamp)::date, nullif(b->>'data_envio','')::timestamp,
    b->>'codigo_material', nullif(b->>'descricao_material',''),
    coalesce(nullif(b->>'quantidade','')::numeric, 0), nullif(b->>'valor_unitario','')::numeric,
    coalesce(nullif(b->>'total_rs','')::numeric, 0), nullif(b->>'deposito_codigo',''),
    nullif(b->>'frente',''), nullif(b->>'turno',''), nullif(b->>'status','')
  from jsonb_array_elements(p_baixas) b where coalesce(b->>'codigo_material','') <> '';

  return jsonb_build_object('importacao_id', v_imp, 'linhas', coalesce(v_total, 0),
                            'periodo_inicio', v_inicio, 'periodo_fim', v_fim);
end; $$;

-- =========================================================
-- Rastrear — Migração 0011: preço unitário (MM60) para o custo do R1
-- Requer migrações anteriores aplicadas.
--
-- Como aplicar: cole no SQL Editor do Supabase e Run (idempotente).
-- =========================================================

alter table public.materiais add column if not exists preco_unitario numeric;

-- Importa a lista de preço (MM60): atualiza o preço por código de material,
-- sem mexer no apelido/óleo/abreviação.
create or replace function public.importar_mm60(p_arquivo text, p_precos jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_total int;
begin
  if not public.is_admin() then raise exception 'acesso negado: requer admin'; end if;

  select count(*) into v_total
  from jsonb_array_elements(p_precos) e
  where coalesce(e->>'codigo_material','') <> '';

  insert into public.materiais (codigo_material, descricao, preco_unitario)
  select codigo, descricao, preco from (
    select distinct on (e->>'codigo_material')
      e->>'codigo_material' as codigo,
      nullif(e->>'descricao_material','') as descricao,
      nullif(e->>'preco_unitario','')::numeric as preco
    from jsonb_array_elements(p_precos) e
    where coalesce(e->>'codigo_material','') <> ''
    order by e->>'codigo_material'
  ) s
  on conflict (codigo_material) do update
    set preco_unitario = excluded.preco_unitario,
        descricao = coalesce(excluded.descricao, public.materiais.descricao),
        updated_at = now();

  return jsonb_build_object('materiais', coalesce(v_total, 0));
end;
$$;

grant execute on function public.importar_mm60(text, jsonb) to authenticated;

-- =========================================================
-- Rastrear — Migração 0008: e-mail no profiles (tela de usuários)
-- Requer a 0006 aplicada.
--
-- Como aplicar: cole no SQL Editor do Supabase e Run (idempotente).
-- =========================================================

-- Guarda o e-mail no perfil para listar usuários sem precisar ler auth.users.
alter table public.profiles add column if not exists email text;

-- Preenche os perfis já existentes.
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is distinct from u.email;

-- Atualiza o trigger para gravar o e-mail no cadastro e mantê-lo sincronizado.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nome, email, papel)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    new.email,
    'mecanico'
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

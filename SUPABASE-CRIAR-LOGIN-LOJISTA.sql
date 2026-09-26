-- Phase 18: criação segura de acesso do lojista pelo Super Admin.
-- Execute UMA vez no novo projeto Supabase.
-- Depois disso, o Super Admin cria os acessos pelo painel, sem abrir o Supabase.

create extension if not exists pgcrypto;

create or replace function public.create_store_owner(
  p_store_id uuid,
  p_email text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  caller_role public.user_role;
  existing_owner uuid;
  new_user_id uuid;
  clean_email text := lower(trim(p_email));
begin
  select role into caller_role from public.profiles where id = auth.uid();
  if caller_role is distinct from 'super_admin'::public.user_role then
    raise exception 'Somente o Super Admin pode criar acessos de lojista.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.stores where id = p_store_id) then
    raise exception 'Loja não encontrada.';
  end if;

  if clean_email = '' or position('@' in clean_email) < 2 then
    raise exception 'E-mail inválido.';
  end if;

  if length(coalesce(p_password,'')) < 6 then
    raise exception 'A senha precisa ter pelo menos 6 caracteres.';
  end if;

  if exists (select 1 from auth.users where lower(email) = clean_email) then
    raise exception 'Este e-mail já possui uma conta no Supabase Auth.';
  end if;

  select id into existing_owner
  from public.profiles
  where store_id = p_store_id and role in ('owner'::public.user_role, 'staff'::public.user_role)
  limit 1;

  if existing_owner is not null then
    raise exception 'Esta loja já possui um usuário administrativo. Use outro acesso ou faça a troca de responsável.';
  end if;

  new_user_id := gen_random_uuid();

  insert into auth.users (
    id, instance_id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, confirmation_token,
    recovery_token, email_change_token_new, email_change, raw_app_meta_data,
    raw_user_meta_data
  ) values (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    clean_email,
    crypt(p_password, gen_salt('bf')),
    now(), now(), now(), '', '', '', '',
    jsonb_build_object('provider','email','providers',jsonb_build_array('email')),
    jsonb_build_object('role','owner','store_id',p_store_id)
  );

  -- O trigger de novos usuários normalmente cria o profile. O upsert abaixo
  -- garante o vínculo mesmo em instalações onde o trigger foi alterado.
  insert into public.profiles (id, role, store_id)
  values (new_user_id, 'owner'::public.user_role, p_store_id)
  on conflict (id) do update set role = 'owner'::public.user_role, store_id = p_store_id;

  return jsonb_build_object(
    'user_id', new_user_id,
    'email', clean_email,
    'store_id', p_store_id
  );
exception
  when unique_violation then
    raise exception 'Este e-mail já possui uma conta ou houve conflito ao criar o acesso.';
end;
$$;

revoke all on function public.create_store_owner(uuid,text,text) from public;
grant execute on function public.create_store_owner(uuid,text,text) to authenticated;

-- Phase 19: exclusão da loja + acesso do lojista pelo Super Admin.
-- Execute este bloco UMA vez no mesmo projeto Supabase.
-- A exclusão exige duas confirmações no painel e só pode ser executada por super_admin.

create or replace function public.delete_store_and_owner(
  p_store_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth, extensions
as $$
declare
  caller_role public.user_role;
  store_name text;
  owner_ids uuid[];
  owner_email text;
  uid uuid;
begin
  select role into caller_role
  from public.profiles
  where id = auth.uid();

  if caller_role is distinct from 'super_admin'::public.user_role then
    raise exception 'Somente o Super Admin pode excluir lojas.' using errcode = '42501';
  end if;

  select name into store_name
  from public.stores
  where id = p_store_id;

  if store_name is null then
    raise exception 'Loja não encontrada.';
  end if;

  select coalesce(array_agg(id), '{}') into owner_ids
  from public.profiles
  where store_id = p_store_id
    and role in ('owner'::public.user_role, 'staff'::public.user_role);

  -- Guarda o primeiro e-mail para retorno ao painel.
  if coalesce(array_length(owner_ids,1),0) > 0 then
    select email into owner_email from auth.users where id = owner_ids[1];
  end if;

  -- Remove itens de pedidos antes dos pedidos, caso a instalação não esteja
  -- usando ON DELETE CASCADE nessa relação.
  if to_regclass('public.order_items') is not null
     and to_regclass('public.orders') is not null then
    execute 'delete from public.order_items where order_id in (select id from public.orders where store_id = $1)'
      using p_store_id;
  end if;

  if to_regclass('public.orders') is not null then
    execute 'delete from public.orders where store_id = $1' using p_store_id;
  end if;

  if to_regclass('public.customers') is not null then
    execute 'delete from public.customers where store_id = $1' using p_store_id;
  end if;

  if to_regclass('public.addons') is not null then
    execute 'delete from public.addons where store_id = $1' using p_store_id;
  end if;

  if to_regclass('public.products') is not null then
    execute 'delete from public.products where store_id = $1' using p_store_id;
  end if;

  if to_regclass('public.categories') is not null then
    execute 'delete from public.categories where store_id = $1' using p_store_id;
  end if;

  if to_regclass('public.store_settings') is not null then
    execute 'delete from public.store_settings where store_id = $1' using p_store_id;
  end if;

  if to_regclass('public.store_subscriptions') is not null then
    execute 'delete from public.store_subscriptions where store_id = $1' using p_store_id;
  end if;

  -- A loja é removida antes dos usuários. Se houver FKs com CASCADE,
  -- os profiles vinculados também serão removidos.
  delete from public.stores where id = p_store_id;

  -- Por último, remove os usuários do Auth capturados antes da exclusão.
  -- Isso libera o e-mail para um novo cadastro.
  if owner_ids is not null then
    foreach uid in array owner_ids loop
      delete from auth.users where id = uid;
    end loop;
  end if;

  return jsonb_build_object(
    'store_id', p_store_id,
    'store_name', store_name,
    'email', owner_email
  );
end;
$$;

revoke all on function public.delete_store_and_owner(uuid) from public;
grant execute on function public.delete_store_and_owner(uuid) to authenticated;

-- Execute depois de criar o usuário administrador em Authentication > Users.
-- Substitua apenas o UUID pelo User UID exibido pelo Supabase.
-- Este comando não cria usuário nem altera senha. Ele apenas autoriza o UID no painel.

insert into public.admins (id, ativo)
values ('COLE-AQUI-O-USER-UID', true)
on conflict (id) do update set ativo = excluded.ativo;

-- Verificação opcional:
select id, ativo from public.admins
where id = 'COLE-AQUI-O-USER-UID';

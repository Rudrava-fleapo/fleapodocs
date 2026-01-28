-- Add user_roles table and roles support

-- Create user_roles table
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null check (role in ('admin', 'user')),
  created_at timestamptz default now(),
  unique(user_id)
);

alter table public.user_roles enable row level security;

-- Policies for user_roles

-- Admins can manage user roles (using the recursive check via is_admin -> user_roles is safe due to SECURITY DEFINER in is_admin)
create policy "Admins can manage user roles"
  on public.user_roles
  for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

create policy "Users can read own role"
  on public.user_roles
  for select
  to authenticated
  using (
    user_id = auth.uid()
  );

-- Function to sync role to app_metadata (So middleware/clients can check JWT)
create or replace function public.handle_role_update()
returns trigger as $$
begin
  update auth.users
  set raw_app_meta_data = 
    jsonb_set(
      coalesce(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(new.role)
    )
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to sync role on insert/update
drop trigger if exists on_role_insert_update on public.user_roles;
create trigger on_role_insert_update
  after insert or update on public.user_roles
  for each row execute procedure public.handle_role_update();

-- Function to remove role from metadata on delete
create or replace function public.handle_role_delete()
returns trigger as $$
begin
  update auth.users
  set raw_app_meta_data = raw_app_meta_data - 'role'
  where id = old.user_id;
  return old;
end;
$$ language plpgsql security definer;

drop trigger if exists on_role_delete on public.user_roles;
create trigger on_role_delete
  after delete on public.user_roles
  for each row execute procedure public.handle_role_delete();

-- Seed the initial admin (hr@fleapo.com) so they don't lose access
do $$
declare
  admin_uid uuid;
begin
  select id into admin_uid from auth.users where email = 'hr@fleapo.com';
  
  if admin_uid is not null then
    insert into public.user_roles (user_id, role)
    values (admin_uid, 'admin')
    on conflict (user_id) do update set role = 'admin';
  end if;
end $$;

-- Update is_admin function to check TABLE (Real-time) instead of JWT
-- This is critical so that RLS works immediately after role assignment, without relogin.
-- The function must be SECURITY DEFINER to bypass RLS on user_roles when checking for admin status.
create or replace function is_admin()
returns boolean as $$
begin
  -- Check user_roles table
  return exists (
    select 1 from public.user_roles 
    where user_id = auth.uid() 
    and role = 'admin'
  );
end;
$$ language plpgsql security definer;

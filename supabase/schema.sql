-- CV Builder SaaS schema
-- Run in Supabase SQL Editor

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'admin')),
  plan_expires_at timestamptz,
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- QRIS payments (static → dynamic, match by unique amount)
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null default 'pro' check (plan in ('pro')),
  amount_idr integer not null,
  base_amount_idr integer not null,
  reference text not null unique,
  qris_payload text not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'expired', 'cancelled')),
  expires_at timestamptz not null,
  paid_at timestamptz,
  confirmed_by uuid references public.profiles(id),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_user_id_idx on public.payments(user_id);
create index if not exists payments_status_amount_idx
  on public.payments(status, amount_idr)
  where status = 'pending';
create unique index if not exists payments_pending_amount_uidx
  on public.payments(amount_idr)
  where status = 'pending';

-- CVs
create table if not exists public.cvs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default 'Untitled CV',
  template text not null default 'jake' check (template in (
    'jake', 'modern', 'compact', 'elegant', 'sidebar', 'corporate', 'tech', 'minimal',
    'harvard', 'executive', 'creative', 'terminal'
  )),
  data jsonb not null default '{}'::jsonb,
  share_slug text unique,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists cvs_user_id_idx on public.cvs(user_id);
create index if not exists cvs_share_slug_idx on public.cvs(share_slug) where share_slug is not null;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists cvs_updated_at on public.cvs;
create trigger cvs_updated_at
  before update on public.cvs
  for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.cvs enable row level security;

-- Helper function for checking admin status without RLS recursion
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Profiles policies
drop policy if exists "Users read own profile" on public.profiles;
drop policy if exists "Users update own profile" on public.profiles;
drop policy if exists "Admins read all profiles" on public.profiles;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- CVs policies
create policy "Users manage own cvs"
  on public.cvs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Public can read shared cvs"
  on public.cvs for select
  using (is_public = true and share_slug is not null);

drop policy if exists "Admins read all cvs" on public.cvs;
create policy "Admins read all cvs"
  on public.cvs for select
  using (public.is_admin());

-- Prevent non-admin users from escalating plan or is_admin fields
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if (new.plan is distinct from old.plan or new.is_admin is distinct from old.is_admin or new.plan_expires_at is distinct from old.plan_expires_at) then
    if not public.is_admin() then
      raise exception 'Forbidden: Only admins can alter plan or admin rights';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_fields_trigger on public.profiles;
create trigger protect_profile_fields_trigger
  before update on public.profiles
  for each row execute function public.protect_profile_fields();
create or replace function public.enforce_cv_limit()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  user_plan text;
  cv_count int;
  max_allowed int;
begin
  select plan into user_plan from public.profiles where id = new.user_id;
  select count(*) into cv_count from public.cvs where user_id = new.user_id;

  max_allowed := case
    when user_plan = 'free' then 1
    when user_plan = 'pro' then 50
    else 999
  end;

  if tg_op = 'INSERT' and cv_count >= max_allowed then
    raise exception 'CV limit reached for plan %', user_plan;
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_cv_limit_trigger on public.cvs;
create trigger enforce_cv_limit_trigger
  before insert on public.cvs
  for each row execute function public.enforce_cv_limit();

-- Migration helper if table already exists with old check:
-- alter table public.cvs drop constraint if exists cvs_template_check;
-- alter table public.cvs add constraint cvs_template_check check (template in (
--   'jake', 'modern', 'compact', 'elegant', 'sidebar', 'corporate', 'tech', 'minimal'
-- ));

drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- Stored procedure for atomic payment confirmation
-- p_admin_id nullable: null = auto-confirm via mutasi webhook
create or replace function public.confirm_payment_and_upgrade(
  p_payment_id uuid,
  p_admin_id uuid,
  p_expires_at timestamptz
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  v_user_id uuid;
  v_status text;
begin
  select user_id, status into v_user_id, v_status
  from public.payments
  where id = p_payment_id
  for update;

  if not found then
    raise exception 'Payment not found';
  end if;

  if v_status != 'pending' then
    raise exception 'Status is %', v_status;
  end if;

  update public.payments
  set status = 'paid',
      paid_at = now(),
      confirmed_by = p_admin_id,
      notes = case
        when p_admin_id is null then coalesce(notes || ' | ', '') || 'auto-confirmed'
        else notes
      end
  where id = p_payment_id;

  update public.profiles
  set plan = 'pro',
      plan_expires_at = p_expires_at
  where id = v_user_id;
end;
$$;

-- Auto-confirm by unique amount (mutasi match)
-- Returns payment id if matched & confirmed, null if no pending match
create or replace function public.auto_confirm_payment_by_amount(
  p_amount_idr integer,
  p_expires_at timestamptz,
  p_source text default 'webhook'
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_payment_id uuid;
  v_user_id uuid;
  v_status text;
  v_expires timestamptz;
begin
  select id, user_id, status, expires_at
  into v_payment_id, v_user_id, v_status, v_expires
  from public.payments
  where amount_idr = p_amount_idr
    and status = 'pending'
  order by created_at desc
  limit 1
  for update skip locked;

  if v_payment_id is null then
    return null;
  end if;

  if v_expires is not null and v_expires < now() then
    update public.payments
    set status = 'expired'
    where id = v_payment_id;
    return null;
  end if;

  update public.payments
  set status = 'paid',
      paid_at = now(),
      confirmed_by = null,
      notes = coalesce(notes || ' | ', '') || ('auto:' || p_source)
  where id = v_payment_id;

  update public.profiles
  set plan = 'pro',
      plan_expires_at = p_expires_at
  where id = v_user_id;

  return v_payment_id;
end;
$$;
-- Plan pricing (single-row settings, editable by admin)
create table if not exists public.plan_settings (
  id text primary key default 'default' check (id = 'default'),
  pro_price_idr integer not null default 49000
    check (pro_price_idr >= 1 and pro_price_idr <= 10000000),
  pro_period_days integer not null default 30
    check (pro_period_days >= 1 and pro_period_days <= 365),
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id)
);

insert into public.plan_settings (id, pro_price_idr, pro_period_days)
values ('default', 49000, 30)
on conflict (id) do nothing;

alter table public.plan_settings enable row level security;

drop policy if exists "Anyone can read plan settings" on public.plan_settings;
create policy "Anyone can read plan settings"
  on public.plan_settings for select
  using (true);

drop policy if exists "Admins update plan settings" on public.plan_settings;
create policy "Admins update plan settings"
  on public.plan_settings for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins insert plan settings" on public.plan_settings;
create policy "Admins insert plan settings"
  on public.plan_settings for insert
  with check (public.is_admin());

alter table public.payments enable row level security;

create policy "Users read own payments"
  on public.payments for select
  using (auth.uid() = user_id);

create policy "Users insert own payments"
  on public.payments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Admins manage all payments" on public.payments;
create policy "Admins manage all payments"
  on public.payments for all
  using (public.is_admin())
  with check (public.is_admin());

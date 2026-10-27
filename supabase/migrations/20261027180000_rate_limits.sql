-- Fixed-window rate limiter.
--
-- Vercel runs many concurrent lambda instances, so an in-memory counter would be
-- per-instance and effectively useless. One row per key in Postgres, incremented
-- in a single atomic upsert, is the cheapest thing that actually holds across
-- instances and needs no extra service.

create table if not exists public.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);

alter table public.rate_limits enable row level security;

-- No policies on purpose: only service_role (which bypasses RLS) may touch it.
revoke all on table public.rate_limits from public, anon, authenticated;

create or replace function public.consume_rate_limit(
  p_key text,
  p_window_seconds integer,
  p_max integer
)
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_row public.rate_limits;
begin
  if p_window_seconds <= 0 or p_max <= 0 then
    raise exception 'window and max must be positive';
  end if;

  insert into public.rate_limits as rl (key, window_start, hits)
  values (p_key, v_now, 1)
  on conflict (key) do update
    set hits = case
                 when rl.window_start < v_now - make_interval(secs => p_window_seconds) then 1
                 else rl.hits + 1
               end,
        window_start = case
                 when rl.window_start < v_now - make_interval(secs => p_window_seconds) then v_now
                 else rl.window_start
               end
  returning * into v_row;

  return query
    select v_row.hits <= p_max,
           greatest(p_max - v_row.hits, 0),
           v_row.window_start + make_interval(secs => p_window_seconds);
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer)
  to service_role;

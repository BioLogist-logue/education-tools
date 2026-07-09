create table if not exists public.mbti_stats (
  type_id text primary key,
  count integer not null default 0,
  updated_at timestamptz not null default now()
);

insert into public.mbti_stats (type_id, count)
values
  ('광감교우', 0),
  ('광운교우', 0),
  ('광감부우', 0),
  ('광운부우', 0),
  ('광감교열', 0),
  ('광운교열', 0),
  ('광감부열', 0),
  ('광운부열', 0),
  ('호감교우', 0),
  ('호운교우', 0),
  ('호감부우', 0),
  ('호운부우', 0),
  ('호감교열', 0),
  ('호운교열', 0),
  ('호감부열', 0),
  ('호운부열', 0)
on conflict (type_id) do nothing;

alter table public.mbti_stats enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.mbti_stats to anon, authenticated;

drop policy if exists "mbti_stats_select_all" on public.mbti_stats;

create policy "mbti_stats_select_all"
on public.mbti_stats
for select
to anon, authenticated
using (true);

create or replace function public.increment_mbti_count(p_type_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_type_id not in (
    '광감교우',
    '광운교우',
    '광감부우',
    '광운부우',
    '광감교열',
    '광운교열',
    '광감부열',
    '광운부열',
    '호감교우',
    '호운교우',
    '호감부우',
    '호운부우',
    '호감교열',
    '호운교열',
    '호감부열',
    '호운부열'
  ) then
    return;
  end if;

  update public.mbti_stats
  set
    count = count + 1,
    updated_at = now()
  where type_id = p_type_id;
end;
$$;

revoke all on function public.increment_mbti_count(text) from public;
grant execute on function public.increment_mbti_count(text) to anon, authenticated;

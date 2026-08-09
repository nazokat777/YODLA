-- ============================================================
-- YODLA (PolyglotPro) — liga backend
-- Supabase → SQL Editor → New query → shu faylni joylang → RUN
-- Idempotent: qayta ishga tushirsa ham xato bermaydi.
-- Focus AI jadvallariga tegmaydi (yodla_ prefiksi).
-- ============================================================

create table if not exists public.yodla_profiles (
  code       text primary key,
  name       text not null,
  created_at timestamptz default now()
);

create table if not exists public.yodla_daily (
  code    text not null,
  d       date not null,
  xp      int  not null default 0,
  words   int  not null default 0,
  primary key (code, d)
);

alter table public.yodla_profiles enable row level security;
alter table public.yodla_daily    enable row level security;

-- O'qish ochiq: reyting ommaviy ma'lumot
drop policy if exists yp_read on public.yodla_profiles;
drop policy if exists yd_read on public.yodla_daily;
create policy yp_read on public.yodla_profiles for select to public using (true);
create policy yd_read on public.yodla_daily    for select to public using (true);

-- YOZISH TO'G'RIDAN-TO'G'RI YOPIQ.
-- Sabab: anon kalit ochiq (repozitoriy ham ochiq). To'g'ridan-to'g'ri
-- yozishga ruxsat berilsa, kimdir "million XP" yozib reytingni buzardi.
-- Yozuv faqat quyidagi RPC orqali — u chegara qo'yadi.

create or replace function public.yodla_upsert_day(
  p_code  text,
  p_name  text,
  p_xp    int,
  p_words int
) returns void
language plpgsql security definer set search_path = public as $$
begin
  -- Kod formati qat'iy: 6 ta katta harf/raqam
  if p_code !~ '^[A-Z0-9]{6}$' then
    raise exception 'Kod formati notogri';
  end if;

  insert into public.yodla_profiles (code, name)
  values (upper(p_code), left(coalesce(nullif(trim(p_name), ''), 'Nomsiz'), 24))
  on conflict (code) do update set name = excluded.name;

  -- SANA SERVERDA qo'yiladi: o'tmishni qayta yozib bo'lmaydi.
  -- XP kunlik chegara bilan qisiladi: 2000 XP = 200 to'g'ri javob,
  -- haqiqiy foydalanuvchi bunga yetmaydi.
  insert into public.yodla_daily (code, d, xp, words)
  values (
    upper(p_code),
    current_date,
    least(greatest(p_xp, 0), 2000),
    least(greatest(p_words, 0), 500)
  )
  on conflict (code, d) do update
    set xp    = least(greatest(excluded.xp, 0), 2000),
        words = least(greatest(excluded.words, 0), 500);
end $$;

grant execute on function public.yodla_upsert_day(text, text, int, int) to anon, authenticated;

-- Haftalik reyting: oxirgi 7 kun yig'indisi
create or replace view public.yodla_week as
  select
    p.code,
    p.name,
    coalesce(sum(d.xp), 0)::int    as xp,
    coalesce(sum(d.words), 0)::int as words
  from public.yodla_profiles p
  left join public.yodla_daily d
    on d.code = p.code and d.d > current_date - 7
  group by p.code, p.name;

grant select on public.yodla_week to anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.yodla_profiles, public.yodla_daily to anon, authenticated;

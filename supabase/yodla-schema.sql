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

-- ============================================================
-- DO'STLAR (keyingi bosqich)
-- ============================================================

create table if not exists public.yodla_links (
  follower    text not null,
  target_code text not null,
  created_at  timestamptz default now(),
  primary key (follower, target_code)
);

alter table public.yodla_links enable row level security;

drop policy if exists yl_read on public.yodla_links;
create policy yl_read on public.yodla_links for select to public using (true);

-- Yozuv faqat RPC orqali (kod formati tekshiriladi)
create or replace function public.yodla_add_friend(p_me text, p_friend text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_me !~ '^[A-Z0-9]{6}$' or p_friend !~ '^[A-Z0-9]{6}$' then
    raise exception 'Kod formati notogri';
  end if;

  -- O'zini o'ziga qo'shish ma'nosiz
  if upper(p_me) = upper(p_friend) then
    return;
  end if;

  insert into public.yodla_links (follower, target_code)
  values (upper(p_me), upper(p_friend))
  on conflict do nothing;
end $$;

create or replace function public.yodla_remove_friend(p_me text, p_friend text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  delete from public.yodla_links
  where follower = upper(p_me) and target_code = upper(p_friend);
end $$;

grant execute on function public.yodla_add_friend(text, text)    to anon, authenticated;
grant execute on function public.yodla_remove_friend(text, text) to anon, authenticated;
grant select on public.yodla_links to anon, authenticated;

-- ============================================================
-- TAYYOR XABARLAR ("cheers")
-- Erkin matn YO'Q: faqat oldindan belgilangan ro'yxatdan.
-- Sabab: moderatsiya imkoni yo'q, ilovadan bolalar ham foydalanadi.
-- ============================================================

create table if not exists public.yodla_cheers (
  from_code  text not null,
  to_code    text not null,
  kind       text not null,
  d          date not null default current_date,
  created_at timestamptz default now(),
  -- Kunlik kalit spamni BAZA DARAJASIDA to'xtatadi: bir xil xabarni
  -- bir kishiga kuniga bir marta yuborish mumkin
  primary key (from_code, to_code, kind, d)
);

alter table public.yodla_cheers enable row level security;

drop policy if exists yc_read on public.yodla_cheers;
create policy yc_read on public.yodla_cheers for select to public using (true);

create or replace function public.yodla_send_cheer(p_from text, p_to text, p_kind text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_from !~ '^[A-Z0-9]{6}$' or p_to !~ '^[A-Z0-9]{6}$' then
    raise exception 'Kod formati notogri';
  end if;

  -- Ro'yxat qat'iy: mijoz istalgan matn yubora olmaydi
  if p_kind not in ('bravo', 'streak', 'keep', 'wow') then
    raise exception 'Notanish xabar turi';
  end if;

  if upper(p_from) = upper(p_to) then
    return;
  end if;

  insert into public.yodla_cheers (from_code, to_code, kind)
  values (upper(p_from), upper(p_to), p_kind)
  on conflict do nothing;
end $$;

grant execute on function public.yodla_send_cheer(text, text, text) to anon, authenticated;
grant select on public.yodla_cheers to anon, authenticated;

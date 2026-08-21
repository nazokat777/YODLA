-- ============================================================
-- YODLA (PolyglotPro) — push eslatmalar
-- Supabase → SQL Editor → New query → shu faylni joylang → RUN
-- Idempotent: qayta ishga tushirsa ham xato bermaydi.
-- ============================================================

create table if not exists public.yodla_push_subscriptions (
  endpoint           text primary key,
  p256dh             text not null,
  auth               text not null,
  -- Foydalanuvchi tanlagan MAHALLIY soat
  reminder_hour      smallint not null check (reminder_hour between 0 and 23),
  -- UTC'dan farq, daqiqada (sharqda musbat). Brauzer beradi.
  utc_offset_minutes smallint not null check (utc_offset_minutes between -840 and 840),
  last_active_on     date,
  failure_count      smallint not null default 0,
  created_at         timestamptz default now()
);

alter table public.yodla_push_subscriptions enable row level security;

-- Hech qanday policy YO'Q: `anon` bu jadvalni na o'qiy, na yoza oladi.
-- Obuna manzili — shaxsiy ma'lumot, reyting kabi ommaviy emas.
-- Yozish faqat quyidagi `security definer` funksiyalar orqali;
-- Edge Function esa `service_role` bilan RLS'dan tashqarida o'qiydi.

-- --- Obunani saqlash --------------------------------------------------
drop function if exists public.yodla_save_push(text, text, text, int, int);
create function public.yodla_save_push(
  p_endpoint text,
  p_p256dh   text,
  p_auth     text,
  p_hour     int,
  p_offset   int
) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  -- Manzil brauzer bergan HTTPS URL bo'lishi shart: bu jadvalni
  -- tasodifiy axlat bilan to'ldirishga arzimas to'siq
  if p_endpoint is null or p_endpoint !~ '^https://' then
    return false;
  end if;

  if p_hour < 0 or p_hour > 23 then
    return false;
  end if;

  insert into public.yodla_push_subscriptions
    (endpoint, p256dh, auth, reminder_hour, utc_offset_minutes)
  values (p_endpoint, p_p256dh, p_auth, p_hour, p_offset)
  on conflict (endpoint) do update set
    p256dh             = excluded.p256dh,
    auth               = excluded.auth,
    reminder_hour      = excluded.reminder_hour,
    utc_offset_minutes = excluded.utc_offset_minutes,
    -- Qayta obuna bo'lganda oldingi nosozliklar hisobi tozalanadi
    failure_count      = 0;

  return true;
end $$;

-- --- Obunani o'chirish ------------------------------------------------
drop function if exists public.yodla_remove_push(text);
create function public.yodla_remove_push(p_endpoint text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  delete from public.yodla_push_subscriptions where endpoint = p_endpoint;
  return found;
end $$;

-- --- "Bugun mashq qildim" ---------------------------------------------
drop function if exists public.yodla_touch_push(text, date);
create function public.yodla_touch_push(p_endpoint text, p_day date)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.yodla_push_subscriptions
     set last_active_on = p_day
   where endpoint = p_endpoint;

  return found;
end $$;

grant execute on function public.yodla_save_push(text, text, text, int, int) to anon;
grant execute on function public.yodla_remove_push(text) to anon;
grant execute on function public.yodla_touch_push(text, date) to anon;

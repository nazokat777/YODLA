# Push eslatmalarni ishga tushirish

Bu qadamlarni **siz** bajarasiz: ular Supabase akkauntingizga kirishni
talab qiladi.

## 0. Supabase loyihasi (AVVAL SHU)

> **2026-08-26 holati:** eski loyiha (`gexoravwgbbynzjdvzpa`) **mavjud emas**
> — DNS uni topmayapti, ya'ni u o'chirilgan. Liga backendi ham shu bilan
> ishlamay qolgan.

Yangi loyiha ochilgach, uning `URL` va `anon` kalitini quyidagi joylarga
yozing:

- `.env.local` → `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Vercel → Settings → Environment Variables → o'sha ikkitasi

So'ng **ikkala** sxemani ham qo'ying (ikkalasi ham idempotent):

| fayl | nima uchun |
| ---- | ---------- |
| `supabase/yodla-schema.sql` | liga (reyting, do'stlar, xabarlar) |
| `supabase/yodla-push-schema.sql` | push eslatmalar |

Tekshirish:

    node scripts/check-supabase.mjs      # liga
    node scripts/check-push-backend.mjs  # eslatmalar

## 1. VAPID kalitlari

    node scripts/generate-vapid.mjs

Kalitlar allaqachon generatsiya qilingan va `vapid-keys.local` faylida
turibdi (u `.gitignore` da — repoga tushmaydi).

- **Ochiq kalit** → `.env.local` ga yozilgan (`VITE_VAPID_PUBLIC_KEY`).
  Shu qiymatni **Vercel** ga ham qo'shing: Settings → Environment
  Variables → `VITE_VAPID_PUBLIC_KEY`. Ochiq kalit maxfiy emas — u
  brauzerga baribir yetib boradi.

  **Bu qadamsiz eslatma sozlamasi umuman ko'rinmaydi** — bu ataylab:
  ishlamaydigan tugmani ko'rsatishdan ko'ra, uni yashirgan ma'qul.
- **Maxfiy kalit** → faqat 3-bo'limdagi Supabase secrets ichiga.
  **Repoga hech qachon commit qilmang.** Secrets o'rnatilgandan keyin
  `vapid-keys.local` faylini o'chirib tashlashingiz mumkin.

## 2. Baza sxemasi

Supabase → SQL Editor → New query → `supabase/yodla-push-schema.sql`
faylini joylang → RUN. Kutilgan javob: `Success. No rows returned`.

Keyin tekshiring:

    node scripts/check-push-backend.mjs

Hamma qator ✅ bo'lishi kerak.

## 3. Edge Function

Supabase CLI kerak:

    npm i -g supabase
    supabase login
    supabase link --project-ref <PROJECT_REF>
    supabase secrets set VAPID_PUBLIC_KEY=<ochiq> VAPID_PRIVATE_KEY=<maxfiy> VAPID_SUBJECT=mailto:<pochtangiz>
    supabase functions deploy send-reminders

`SUPABASE_URL` va `SUPABASE_SERVICE_ROLE_KEY` avtomatik beriladi — ularni
qo'lda kiritish shart emas.

Sinash:

    supabase functions invoke send-reminders

Javob `{"candidates":0,"sent":0,"removed":0}` bo'lsa — ishlayapti
(hozircha hech kim tanlagan soatda emas).

## 4. Soatlik cron

Supabase → SQL Editor:

```sql
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.schedule(
  'yodla-reminders',
  '0 * * * *',
  $$
  select net.http_post(
    url     := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer <ANON_KEY>'
    )
  );
  $$
);
```

Tekshirish: `select * from cron.job;`

## Xavfsizlik haqida

Obunani yangilash yoki o'chirish uchun `endpoint` ni bilish kerak — u
brauzer generatsiya qiladigan uzun, taxmin qilib bo'lmaydigan manzil,
ya'ni kalit vazifasini bajaradi. Jadvalning o'zi `anon` uchun butunlay
yopiq: obuna manzillari — reyting kabi ommaviy ma'lumot emas.

## Cheklovlar

- **iPhone:** eslatma faqat ilova bosh ekranga qo'shilgan bo'lsa ishlaydi
  (iOS 16.4+). Oddiy brauzer tabida — yo'q.
- Ruxsat foydalanuvchi tugmani bosgandan keyin so'raladi.

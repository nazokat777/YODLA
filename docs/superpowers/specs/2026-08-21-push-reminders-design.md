# Push eslatmalar — dizayn

**Sana:** 2026-08-21
**Holat:** tasdiqlangan

## Maqsad

Foydalanuvchi o'zi tanlagan soatda telefoniga eslatma keladi — ilova yopiq
bo'lsa ham. Maqsad: mashq odatini saqlab qolish.

## Yondashuv: haqiqiy Web Push (Supabase orqali)

Muqobillar ko'rib chiqildi va rad etildi:

- **Ilova ichidagi ogohlantirish** — ilovani ochgan odamga aytiladi, ya'ni
  ochmagan odamni qaytarmaydi. Bu "eslatma" degan so'zning ma'nosini
  bajarmaydi.
- **Periodic Background Sync** — serversiz, lekin faqat Chrome/Android va
  faqat o'rnatilgan PWA uchun; vaqtni brauzer O'ZI tanlaydi, ya'ni "19:00 da"
  deb aytib bo'lmaydi.

Brauzerda "ertaga soat 19:00 da eslat" deb rejalashtirishning ishonchli yo'li
yo'q — Notification Triggers API hech qachon chiqmadi. Shuning uchun eslatma
serverdan yuboriladi.

## Vaqt

Foydalanuvchi Profilda soat tanlaydi (masalan 19:00). Mahalliy soat va vaqt
mintaqasi ofseti birga saqlanadi; `pg_cron` har soatda ishlaydi va o'sha
mintaqada belgilangan soat bo'lganlarni tanlaydi.

Nega qat'iy vaqt emas: o'quvchi kechqurun, ishlaydigan odam ertalab mashq
qiladi. Noto'g'ri vaqtdagi eslatma — o'chiriladigan eslatma. Nega "aqlli"
vaqt emas: har mashq VAQTINI serverga yuborishni talab qilardi (ancha ko'p
shaxsiy ma'lumot), natijasi esa oddiy tanlovdan sezilarli yaxshi bo'lmaydi.

## Bugun mashq qilganlarga yuborilmaydi

Serverda `last_active_on` (faqat SANA, vaqtsiz) saqlanadi. Ansiz cron bugun
allaqachon mashq qilgan odamga ham eslatma yuborardi — bu eslatmani
o'chirishga olib keladigan eng tez yo'l.

Tanlov aynan SERVERDA qilinishi shart: Web Push `userVisibleOnly: true`
talab qiladi, ya'ni push kelgach bildirishnomani yashirib bo'lmaydi.

## Baza

`supabase/yodla-push-schema.sql`:

```sql
create table yodla_push_subscriptions (
  endpoint            text primary key,
  p256dh              text not null,
  auth                text not null,
  reminder_hour       smallint not null,   -- 0..23, MAHALLIY soat
  utc_offset_minutes  smallint not null,
  last_active_on      date,
  failure_count       smallint not null default 0,
  created_at          timestamptz default now()
);
```

RLS yoqiladi va to'g'ridan-to'g'ri yozish TAQIQLANADI — hammasi
`security definer` RPC orqali: `yodla_save_push`, `yodla_remove_push`,
`yodla_touch_push`. Sabab ligadagi bilan bir xil: `anon` kaliti ochiq repoda
turadi va uni har kim ko'radi.

Akkaunt, elektron pochta, telefon — hech qanday shaxsiy ma'lumot yo'q.
Yozuvni identifikatsiya qiladigan yagona narsa brauzer bergan `endpoint`.

## Edge Function `send-reminders`

`pg_cron` uni har soatda chaqiradi:

1. `reminder_hour` o'sha mintaqadagi hozirgi soatga teng yozuvlarni tanlaydi;
2. `last_active_on` bugundan eski bo'lganlarini qoldiradi;
3. VAPID bilan push yuboradi;
4. `404`/`410` javobida yozuvni o'chiradi — obuna o'lgan.

## Mijoz tomoni

- `public/sw.js` — `push` va `notificationclick` ishlovchilari. Bosilganda
  `/review` ochiladi yoki allaqachon ochiq oyna fokuslanadi.
- `src/lib/push.ts` — `isPushSupported()`, `enablePush(hour)`, `disablePush()`.
- Profil ekrani — kalit va soat tanlash.
- Seans tugaganda `yodla_touch_push` chaqiriladi (`useLeagueSync` naqshi).

## Foydalanuvchi bajaradigan qadamlar

1. VAPID kalitlari `node:crypto` bilan generatsiya qilinadi (yangi paketsiz).
   Ochiq kalit `.env.local` ga, MAXFIY kalit faqat Supabase secrets ichiga —
   u hech qachon repoga tushmaydi.
2. SQL ni Supabase SQL Editor'ga qo'yish.
3. Edge Function'ni deploy qilish (Supabase CLI talab qiladi).

## Ochiq cheklovlar

- **iPhone'da** push faqat ilova BOSH EKRANGA QO'SHILGAN bo'lsa ishlaydi
  (iOS 16.4+). Brauzer tabida — yo'q. Bu sozlama yonida ochiq yoziladi.
- Ruxsat foydalanuvchi bosishi bilan so'raladi, avtomatik emas.
- Vaqt mintaqasi ofset sifatida saqlanadi; yozgi vaqt o'zgarsa keyingi
  kirishda yangilanadi.

## Tekshirib bo'lmaydigan qism (ochiq)

Haqiqiy push yetkazilishi sinalmaydi — u Google/Apple serverlaridan o'tadi.
RPC'lar va SQL tanlov haqiqiy bazada skript bilan tekshiriladi (liga
uchun yozilgan `check-supabase.mjs` kabi), SW ishlovchilari brauzerda qo'lda
push yuborib sinaladi. Oxirgi tasdiq — foydalanuvchining telefoni.

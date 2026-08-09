# Liga va statistika (dizayn)

**Sana:** 2026-08-09
**Holat:** tasdiqlangan
**Qamrov:** Faza 7 — haftalik liga (barcha foydalanuvchilar) va statistika ekrani.

## Muammo

`LeagueScreen` bo'sh joy egallab turibdi. Ilova butunlay lokal: XP va
streak faqat shu qurilmada, foydalanuvchi o'z natijasini hech kim bilan
solishtira olmaydi.

## Naqsh: Focus AI

Foydalanuvchining `D:/focus-ai-final` loyihasi shu masalani allaqachon
yechgan va biz o'sha modelni takrorlaymiz:

| Element | Nima uchun |
| ------- | ---------- |
| **Kod bilan tanishuv** (`profiles.code`), parol/email yo'q | Ro'yxatdan o'tish to'sig'i yo'q |
| Ma'lumot lokal; **Liga ochilgandagina** serverga yuboriladi | Foydalanuvchi o'zi tanlaydi |
| Kalit bo'lmasa — **lokal rejim** | Server yo'q bo'lsa ham ilova ishlaydi |

Focus AI'ning o'z qoidasi: *"Halol bo'l. Soxta statistika yo'q, dark
pattern yo'q."* Shu qoida bu yerda ham amal qiladi — **to'qib chiqarilgan
raqiblar bo'lmaydi**. Reytingda faqat haqiqiy foydalanuvchilar; yolg'iz
bo'lsangiz, ro'yxatda bitta o'zingiz turasiz va buni ochiq yozamiz.

## 1. Tanishuv va roziligi

- Birinchi marta Liga ochilganda ism so'raladi va **6 belgilik kod**
  yaratiladi (lokal, `useSettingsStore`).
- Aynan shu paytda tushuntiriladi: *"Ismingiz va haftalik XP'ingiz
  serverga yuboriladi. So'zlaringiz va xatolaringiz qurilmada qoladi."*
- Rozilik berilmasa — lokal rejim: faqat o'z statistikangiz ko'rinadi.

Serverga **hech qachon** yuborilmaydigan narsalar: so'zlar, javoblar,
xatolar, mnemonikalar, sozlamalar.

## 2. Ma'lumotlar bazasi

Focus AI'ning mavjud Supabase loyihasida, `yodla_` prefiksi bilan
(ikki ilova jadvallari aralashmasligi uchun):

```sql
yodla_profiles (code text pk, name text, created_at timestamptz)
yodla_daily    (code text, d date, xp int, words int, primary key (code, d))
```

Haftalik liga — oxirgi 7 kunning yig'indisi (`sum(xp)`), server tomonda
`yodla_week` ko'rinishi (view) orqali.

### Xavfsizlik: ochiq kalit muammosi

Ochiq (publishable) kalit brauzerga ketadi va **YODLA repozitoriysi
ochiq**. Focus AI'dagi siyosatlar (`using(true) with check(true)`) har
kimga istalgan qatorni yozishga ruxsat beradi — kimdir soxta XP kiritib
reytingni buzishi mumkin.

Shuning uchun `yodla_daily` ga **to'g'ridan-to'g'ri yozish yopiladi**;
yozuv faqat RPC orqali:

```sql
yodla_upsert_day(p_code text, p_name text, p_xp int, p_words int)
```

RPC ichida ikkita himoya:

1. **Kunlik chegara** — `p_xp` `LEAST(p_xp, 2000)` bilan qisiladi. 2000 XP
   — 200 ta to'g'ri javob; haqiqiy foydalanuvchi bunga yetmaydi, soxta
   "million XP" esa o'tmaydi.
2. **Faqat bugungi kun** — sana serverda (`current_date`) qo'yiladi,
   mijozdan olinmaydi. O'tmishni qayta yozib bo'lmaydi.

O'qish ochiq qoladi: reyting ommaviy ma'lumot.

> Bu mutlaq himoya emas — autentifikatsiyasiz uni qurib bo'lmaydi. Lekin
> "kalitni topib, cheksiz XP yozish" imkonini yopadi va halol reytingni
> saqlaydi. To'liq himoya kerak bo'lsa — keyingi bosqichda Supabase Auth.

## 3. Liga darajalari

Haftalik XP bo'yicha, sof funksiya (`core/league/tier.ts`):

| Daraja | Haftalik XP |
| ------ | ----------- |
| Bronza | 0 – 199 |
| Kumush | 200 – 499 |
| Oltin | 500 – 999 |
| Olmos | 1000+ |

Duolingo'dan farqi: **tushirish yo'q**. Daraja — joriy haftalik natija
ko'rsatkichi, jazo emas. Ilovaning "xatoda jazolamaslik" tamoyiliga mos.

## 4. Ekranlar

**Liga** (`/league`):
- Yuqorida: sizning darajangiz, haftalik XP, o'rningiz
- Ro'yxat: barcha foydalanuvchilar haftalik XP bo'yicha (siz ajratilgan)
- Rozilik berilmagan bo'lsa: taklif kartasi

**Statistika** (Profil ichida yoki `/stats`):
- Haftalik ustunli diagramma (7 kun, kunlik XP)
- Streak, jami XP, o'rganilgan so'zlar, aniqlik
- Nishonlar (mavjud `BADGE_BY_ID`)

Diagramma **SVG bilan qo'lda** chiziladi — grafik kutubxona qo'shilmaydi
(7 ta ustun uchun bog'liqlik ortiqcha).

## 5. Sof funksiyalar (testlanadi)

`core/league/`:
- `leagueTier(weeklyXp: number): TierCode`
- `rankEntries(rows: LeagueRow[], myCode: string): RankedEntry[]` — XP
  bo'yicha kamayish, teng bo'lsa ism bo'yicha; `isMe` belgisi
- `generateCode(random): string` — 6 belgi, chalkash belgilarsiz
  (`0/O`, `1/I` ishlatilmaydi)

`core/stats/`:
- `buildWeeklySeries(dailyStats, now): DayPoint[]` — oxirgi 7 kun, bo'sh
  kunlar nol bilan to'ldiriladi

## 6. Tarmoq qatlami

`src/lib/supabase.ts`:
- Kalitlar **Vercel env** dan (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
  — git tarixiga tushmaydi va almashtirish oson
- Kalit yo'q → `null` qaytaradi → **lokal rejim** (ilova buzilmaydi)
- Barcha so'rovlar `try/catch` — tarmoq yo'qligi xato emas, kutilgan holat

Supabase JS kutubxonasi **dangasa yuklanadi** (`await import(...)`), GSAP
kabi: liga ochilmasa umuman yuklanmaydi.

## 7. Testlar

- `leagueTier` — chegaralar (199/200, 999/1000)
- `rankEntries` — tartib, teng XP, `isMe`
- `generateCode` — uzunlik, chalkash belgilar yo'q, urug' bilan takrorlanadi
- `buildWeeklySeries` — 7 kun, bo'sh kunlar nol, kun chegarasi
- `LeagueScreen` — rozilik berilmaganda taklif; lokal rejimda xato yo'q

**Qoplanmaydi:** haqiqiy Supabase so'rovlari (tarmoq). Ular qo'lda
tekshiriladi.

## 8. Qamrovdan tashqarida (bu bosqichda)

- Do'stlar va taklif havolasi — keyingi bosqich
- Xabarlar/chat
- Supabase Auth
- Haftalik yakunda mukofot berish

## Xavflar

- **Bo'sh reyting.** Boshida faqat siz bo'lasiz. Ekranda ochiq yoziladi:
  *"Hozircha ligada 1 kishi — havolani do'stlaringizga yuboring."*
- **Ism maxfiyligi.** Ism ochiq ko'rinadi; taklif matnida shu aytiladi va
  taxallus ishlatish mumkinligi eslatiladi.

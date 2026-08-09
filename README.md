# PolyglotPro

Ingliz, rus va arab tillarini interaktiv o'yinlar orqali o'rgatuvchi mobil-birinchi ilova.

**Ilmiy yadro:** spaced repetition (SM-2) + retrieval practice (testing effect) + mnemonika,
ustiga Duolingo uslubidagi geymifikatsiya.

## Buyruqlar

```bash
npm run dev        # dev server (http://localhost:5173)
npm run build      # tiplarni tekshirish + production build
npm test           # unit testlar (Vitest)
npm run test:watch # testlar kuzatuv rejimida
npm run lint       # oxlint
```

## Texnologiyalar

| Qatlam   | Tanlov                        |
| -------- | ----------------------------- |
| Frontend | React 19 + TypeScript + Vite  |
| Styling  | Tailwind CSS v4 (`@theme`)    |
| State    | Zustand (+ `persist`)         |
| Saqlash  | IndexedDB — Dexie.js (Faza 2) |
| Routing  | React Router v7               |
| Testlar  | Vitest + Testing Library      |
| Audio    | Web Speech API (Faza 5)       |
| PWA      | Manifest + qo'lda yozilgan service worker (Faza 7) |

## Papka strukturasi

```
src/
├── app/                     # ilova karkasi
│   ├── App.tsx              # marshrutlar daraxti
│   ├── paths.ts             # barcha URL yo'llari bir joyda
│   ├── guards/
│   │   └── RequireOnboarding.tsx
│   └── layouts/
│       ├── AppShell.tsx     # pastki navigatsiyali qobiq
│       └── FocusLayout.tsx  # chalg'itmaydigan qobiq (dars/onboarding)
│
├── components/ui/           # qayta ishlatiladigan primitivlar
│   ├── Button.tsx           # <button>
│   ├── LinkButton.tsx       # tugma ko'rinishidagi <Link>
│   ├── buttonStyles.ts      # ikkalasi uchun umumiy uslublar
│   ├── Panel.tsx            # oq karta konteyner
│   ├── ProgressBar.tsx
│   └── PhaseNotice.tsx      # vaqtinchalik: "bu qism falon fazada"
│
├── core/                    # domen yadrosi (UI'ga bog'liq emas)
│   ├── types/               # Card, Grade, ExerciseType, LanguageCode
│   ├── config/
│   │   ├── languages.ts     # tillar ro'yxati + RTL/TTS metama'lumoti
│   │   └── levels.ts        # LEVEL_ORDER (A1→A2→B1) + levelRank
│   ├── lesson/order.ts      # pickLessonCards — darsga qaysi so'z chiqadi
│   ├── placement/           # daraja testi — sof funksiyalar
│   │   ├── score.ts         # natijadan boshlang'ich darajani aniqlash
│   │   └── questions.ts     # savollarni kontentdan yasash
│   ├── text/transliterate.ts # notanish yozuvning o'qilishi
│   ├── srs/                 # SM-2 algoritmi — sof funksiyalar
│   │   ├── constants.ts     # EF chegaralari, intervallar, o'tish bahosi
│   │   ├── sm2.ts           # nextEaseFactor / nextInterval / reviewSrsState
│   │   └── card.ts          # createCard / reviewCard / makeCardId
│   ├── db/                  # IndexedDB (Dexie)
│   │   ├── db.ts            # sxema va indekslar
│   │   ├── schema.ts        # CardRecord
│   │   └── cards.repo.ts    # so'rovlar: due, grade, stats, mnemonika
│   ├── gamification/        # streak, XP/darajalar, nishonlar
│   │   ├── streak.ts        # computeStreak + Streak Freeze
│   │   ├── xp.ts            # XP va daraja egri chizig'i
│   │   └── badges.ts        # nishon ta'riflari (sof shartlar)
│   └── exercises/           # mashqlar (retrieval practice)
│       ├── types.ts         # 4 mashq turining tiplari
│       ├── generate.ts      # generator + adaptiv qiyinlik zinasi
│       ├── normalize.ts     # javob normallashtirish + editDistance
│       └── check.ts         # tekshirish → SM-2 bahosi
│
├── features/                # ekranlar, har biri o'z papkasida
│   ├── session/             # MASHQ SEANSI — review va lesson uchun umumiy
│   │   ├── SessionRunner.tsx    # holat mashinasi: mashq → javob → feedback
│   │   ├── ExerciseView.tsx     # 4 turning ko'rinishi
│   │   ├── FeedbackBar.tsx      # instant feedback + mnemonika yozish
│   │   └── ChoiceGrid.tsx, WordDisplay.tsx, SessionSummaryPanel.tsx
│   ├── onboarding/          # til → daraja testi → maqsad → birinchi dars
│   │   └── steps/           # har qadam alohida komponent
│   ├── home/                # streak, kunlik maqsad, o'quv yo'li
│   ├── lesson/              # yangi so'zlarni o'rganish
│   ├── review/              # SRS bo'yicha takrorlash
│   ├── profile/             # statistika, nishonlar
│   ├── league/              # haftalik leaderboard (Faza 7)
│   └── misc/                # 404
│
├── stores/                  # Zustand do'konlari
│   └── useSettingsStore.ts  # til, kunlik maqsad, onboarding holati
│
├── hooks/                   # umumiy React hook'lari
│   ├── useDocumentDirection.ts  # <html dir="rtl"> boshqaruvi
│   ├── useStarterDeck.ts        # boshlang'ich so'zlarni bazaga yozish
│   └── useNowTick.ts            # vaqt o'tishini kuzatish (kun almashuvi)
│
├── lib/                     # sof yordamchilar
│   ├── cn.ts                # sinf nomlarini birlashtirish
│   ├── date.ts              # startOfDay / addDays (DST'ga chidamli)
│   └── format.ts            # "6 kun", "ertaga" ko'rinishidagi matnlar
├── content/                 # o'quv kontenti
│   ├── decks/en.ts ru.ts ar.ts  # har til: A1/A2/B1 bo'yicha 102 so'z
│   └── starterDecks.ts      # daraja tartibida yig'uvchi (STARTER_DECKS)
└── test/setup.ts            # Vitest global sozlamalari
```

### Nega shunday bo'lingan

- **`core/`** — sof TypeScript, React'siz. SRS algoritmini React'ni yuklamasdan
  test qilish mumkin; kelajakda backendga ham ko'chirsa bo'ladi.
- **`features/`** — har ekran o'z papkasida. Komponent faqat bitta joyda ishlatilsa,
  shu papkada qoladi; ikkinchi joyda kerak bo'lganda `components/ui/` ga ko'chadi.
- **`@/` taxallusi** — chuqur `../../..` importlarining oldini oladi
  (`vite.config.ts` va `tsconfig.app.json` da sozlangan).

## SRS yadrosi (SM-2)

Barcha hisob [src/core/srs/sm2.ts](src/core/srs/sm2.ts) dagi **sof funksiyalarda** —
`now` argument sifatida beriladi, shuning uchun vaqt testlarda to'liq boshqariladi.

```
reviewSrsState(state, grade, now) → yangi state
```

| Baho | Ma'nosi   | easeFactor | Interval               |
| ---- | --------- | ---------- | ---------------------- |
| 5    | Oson      | +0.10      | 1 → 6 → interval × EF  |
| 4    | Yaxshi    | 0.00       | 1 → 6 → interval × EF  |
| 3    | Qiyin     | −0.14      | 1 → 6 → interval × EF  |
| 0–2  | Bilmadim  | −0.32…−0.80| 1 kun (qaytadan)       |

Uchta ongli qaror (kodda ham izohlangan):

1. **`dueDate` kun chegarasiga tekislanadi** — `startOfDay(now) + interval kun`.
   Kechqurun 22:00 da o'rganilgan so'z ertasi kuni **ertalab** takrorlashga chiqadi.
   Aks holda foydalanuvchi "ertalab mashq qilaman" odatini shakllantira olmasdi.
2. **easeFactor xato javobda ham yangilanadi.** Asl 1987-yilgi SM-2'da xatoda EF
   o'zgarmasdi; biz uni pasaytiramiz, chunki doimiy xato qilinadigan so'z haqiqatan
   qiyin. Natija har doim `[1.3, 2.5]` oralig'iga qisiladi (TZ 3.1).
3. **Xato javob berilgan karta shu seansning oxiriga qaytariladi** — bazadagi
   `dueDate` baribir 1 kun bo'lib qoladi, lekin darhol qayta eslab chaqirish
   (retrieval practice) ancha samarali.

## Mashqlar (retrieval practice)

Har bir takrorlash **aktiv eslab chaqirish** talab qiladi — passiv o'qish emas.
To'rt tur, qiyinligi bo'yicha:

| Tur            | Nima qilinadi                | Qachon beriladi   |
| -------------- | ---------------------------- | ----------------- |
| `recognition`  | 4 variantdan tarjimani tanla | repetitions 0–1   |
| `listening`    | audio eshitib, ma'nosini tanla | repetitions 1–3 |
| `recall`       | so'zni klaviaturadan yoz     | repetitions 2+    |
| `construction` | so'zlardan jumla tuz         | repetitions 4+    |

Qiyinlik [generate.ts](src/core/exercises/generate.ts) dagi zina bo'yicha
avtomatik oshadi (Flow nazariyasi). Tur mavjud bo'lmasa — audio yo'q, jumla
yozilmagan yoki lug'at kichik — bir pog'ona pastga tushiladi. Generator hech
qachon "hech narsa" qaytarmaydi.

**Foydalanuvchi o'zini baholamaydi** — SM-2 bahosi mashq natijasidan chiqadi:

| Natija                    | Baho | Oqibat                        |
| ------------------------- | ---- | ----------------------------- |
| xato                      | 0    | interval 1 kunga qaytadi      |
| kichik imlo xatosi        | 3    | o'tdi, easeFactor pasayadi    |
| to'g'ri (oson tur)        | 4    | easeFactor o'zgarmaydi        |
| to'g'ri (yozish / jumla)  | 5    | easeFactor oshadi             |

Javob solishtirishdan oldin normallashtiriladi
([normalize.ts](src/core/exercises/normalize.ts)): arab harakalari tushiriladi,
rus `ё` → `е`, o'zbekcha tutuq belgisining barcha ko'rinishlari (`'` `‘` `ʻ` `` ` ``)
tenglashtiriladi. Qo'shni harflarning o'rin almashuvi (`sayohta` → `sayohat`) —
eng ko'p uchraydigan klaviatura xatosi — bitta tahrir deb sanaladi.

### Mashq UI'sidagi qulaylik qoidalari

- **Ma'no faqat rang bilan berilmaydi** (WCAG 1.4.1): to'g'ri/xato variant
  ikonka (`✓`/`✕`), chegara uslubi va ekran o'quvchi uchun ko'rinmas matn bilan
  ham belgilanadi — qizil-yashil daltonizm erkaklarning ~8% ida uchraydi.
- **Javobdan keyin fokus feedback panelga ko'chadi.** "Tekshirish" tugmasi
  DOM'dan olib tashlanadi; fokus boshqarilmasa `<body>` ga tushib, klaviatura
  foydalanuvchisi har savolda qaytadan Tab bosardi.
- **Javob ochilgach variantlar `aria-disabled`** (`disabled` emas) — ular Tab
  tartibida qoladi va ekran o'quvchi ularni qayta o'qiy oladi.
- **Jumla qurishda tugmalar `aria-label` oladi** (`so'z — qo'shish` /
  `so'z — olib tashlash`), aks holda ikkala ro'yxatdagi bir xil so'zlar
  farqlanmasdi. So'z tanlangach fokus keyingi mavjud so'zga ko'chiriladi.

## Kontent va darajalar

Har til uchun **102 so'z**, CEFR bo'yicha: A1 42, A2 35, B1 25
([src/content/decks](src/content/decks)). Uch to'plam bir xil tushunchalarni
qamraydi — foydalanuvchi tilni almashtirganda o'sha mavzular ketma-ketligini
ko'radi.

**Dars qaysi so'zni beradi** — [order.ts](src/core/lesson/order.ts) dagi sof
funksiya hal qiladi: ko'rilmaganlar → daraja (A1→A2→B1) → kam ko'rilgani →
zaifi.

> "Ko'rilmagan" mezoni **darajadan ustun**. Aks holda o'rganib bo'lingan A1
> kartalari doim A2 dan oldin turib, dars A1 da abadiy qolib ketardi. Shu
> tartib "eng past **tugallanmagan** darajadan" qoidasini beradi: A1 ning
> yangi so'zlari tugagach A2 o'zi ochiladi. Yangi so'z qolmasa, ro'yxat
> mustahkamlashga o'tadi — dars hech qachon bo'sh qaytmaydi.

Kontent sifati testlar bilan qo'riqlanadi
([decks.test.ts](src/content/decks.test.ts)): majburiy maydonlar, dublikat
so'z yo'qligi va **ikki so'zning tarjimasi bir xil emasligi** (aks holda
chalg'ituvchi variantlar orasida ikkita "to'g'ri" javob paydo bo'lardi).
Alohida tekshiruv so'zlar **normallashtirilgandan keyin** ham farqlanishini
kafolatlaydi — arab harakalari tushganda `مَطَار` va `مَطَر` ustma-ust
tushmasligi kerak.

## O'qishga yordam (transliteratsiya)

Arabcha va ruscha so'z ostida uning o'zbek lotinida o'qilishi ko'rsatiladi
(`آسِف` → *asif*, `жёлтый` → *joltiy*). So'zni o'qiy olmagan foydalanuvchi
uni yodlay olmaydi — bu qulaylik emas, zaruriyat.

O'qilish **hisoblab chiqariladi** ([transliterate.ts](src/core/text/transliterate.ts)),
kontentga qo'lda yozilmaydi: arabcha so'zlar harakat bilan kiritilgan, ya'ni
unlilar matnning o'zida bor. Shu tufayli yangi so'z qo'shilganda qo'shimcha
maydon to'ldirish shart emas.

Bu ilmiy transliteratsiya emas — diakritikasiz, o'zbekcha odatiy yozilishga
moslangan (`خ` → x, `ش` → sh, `غ` → g'). Uchta nozik qoida testlar bilan
qo'riqlanadi: shadda undoshni ikkilantiradi (`تُفَّاحَة` → tuffaha), so'z
boshidagi tayanch alif harakat bilan qo'shilib ketmaydi (`أَب` → ab), so'z
ichidagi hamza esa bo'g'iz to'xtami (`يَأْكُل` → ya'kul).

## Daraja testi (onboarding)

Yangi foydalanuvchi 9 savolga javob beradi (A1/A2/B1 dan 3 tadan).
Darajadan 2 ta to'g'ri javob — o'tilgan; boshlang'ich daraja esa
**o'tilmagan eng past daraja** ([score.ts](src/core/placement/score.ts)).

> Test SRS holatiga **tegmaydi**: `SessionRunner` ishlatilmaydi va bazaga
> hech narsa yozilmaydi. Aks holda foydalanuvchi o'rganishni boshlamasdan
> turib bilmagan so'zlari "unutilgan" deb belgilanardi va streak/XP
> sun'iy boshlanardi.

Natija `startingLevel` sifatida saqlanadi va `pickLessonCards` ga
uzatiladi: past darajadagi ko'rilmagan so'zlar **o'chirilmaydi**, faqat
zaxiraga suriladi — shunda A2 dan boshlagan foydalanuvchi so'zlari
tugaganda ham dars bo'sh qaytmaydi.

## Ma'lumotlar bazasi

IndexedDB, Dexie orqali. Asosiy indeks — `[language+dueDate]` qo'shma indeksi:
"shu tildagi, muddati yetgan kartalar" so'rovi bitta indeks skani bilan bajariladi
va natija `dueDate` bo'yicha tartiblangan holda keladi.

Kartaning `id` si **aniq** (`en:hello`), tasodifiy UUID emas — shu tufayli
kontentni qayta yuklash dublikat yaratmaydi va progressni o'chirmaydi
(`addMissingCards` idempotent).

## Marshrutlar

| Yo'l                 | Ekran       | Qobiq    | Himoya            |
| -------------------- | ----------- | -------- | ----------------- |
| `/onboarding`        | Til tanlash | Focus    | —                 |
| `/`                  | Bosh sahifa | AppShell | onboarding kerak  |
| `/review`            | Takrorlash  | AppShell | onboarding kerak  |
| `/league`            | Liga        | AppShell | onboarding kerak  |
| `/profile`           | Profil      | AppShell | onboarding kerak  |
| `/lesson/:lessonId?` | Dars        | Focus    | onboarding kerak  |
| `*`                  | 404         | Focus    | —                 |

> `/review` va `/lesson` bitta `SessionRunner` komponentini ishlatadi —
> farq faqat kartalar qayerdan olinishida: takrorlashda `dueDate` yetganlar,
> darsda esa hali ko'rilmagan so'zlar.

## RTL (arab tili)

Arab tili tanlanganda `useDocumentDirection` hook'i `<html dir="rtl">` o'rnatadi.
Shuning uchun uslublarda **yo'nalishga bog'liq** utilitalarni ishlatmang:

| ❌ Ishlatmang   | ✅ Ishlating    |
| --------------- | --------------- |
| `ml-2` / `mr-2` | `ms-2` / `me-2` |
| `pl-4` / `pr-4` | `ps-4` / `pe-4` |
| `text-left`     | `text-start`    |
| `left-0`        | `start-0`       |

## Geymifikatsiya

**Streak SAQLANMAYDI — HISOBLANADI.** Saqlangan hisoblagich eskirib qoladi
(ilova ochilmagan kunlarda uni hech kim kamaytirmaydi) va vaqt mintaqasi
o'zgarganda buziladi. `dailyStats` jadvalidagi faol kunlardan hisoblash esa
har doim haqiqatga mos: [streak.ts](src/core/gamification/streak.ts).

**Streak Freeze** (TZ 4) faqat **kechagi** bo'sh kunni yopadi. Ikki kun
o'tkazib yuborilsa streak baribir uziladi — aks holda muzlatish "cheksiz
kechikish" imkonini berardi va loss-aversion mexanizmi ma'nosini yo'qotardi.
Muzlatilgan kun ketma-ketlikni saqlaydi, lekin **uzunlikka qo'shilmaydi**:
foydalanuvchi o'sha kuni mashq qilmagan.

**Kunlik maqsad noyob so'zlar bilan o'lchanadi.** Bitta so'zni 20 marta
takrorlash "20 so'z" maqsadini bajarmaydi.

**XP:** to'g'ri 10, imlo xatosi 7, **xato ham 2** — TZ 4 dagi "xatoda
jazolamaslik" tamoyili. Kunlik maqsad bajarilganda bir marta +20 bonus.
Daraja egri chizig'i kvadratik: 2-daraja 100 XP, 3-daraja 300, 4-daraja 600.

**Nishonlar sof funksiyalar bilan aniqlanadi** va har safar qayta
tekshiriladi — shuning uchun keyinchalik qo'shilgan nishon eski yutuqlar
uchun ham ochiladi.

> Geymifikatsiya yozuvi o'z xatosini o'zi yutadi: XP yozilmasa ham
> takrorlash progressi (SRS) saqlanib qoladi. Ular alohida tranzaksiyalarda.

## Offline rejim (PWA)

Ilova telefonga o'rnatiladi va internetsiz ishlaydi — kontent ham,
progress ham allaqachon qurilmada (IndexedDB), tarmoqdan faqat ilova
qobig'i kerak edi.

[public/sw.js](public/sw.js) ikki strategiyani ishlatadi:

| So'rov | Strategiya | Sabab |
| ------ | ---------- | ----- |
| Navigatsiya (HTML) | Avval tarmoq | Yangi versiya darhol ko'rinadi; internetsiz keshdagi nusxa beriladi |
| `/assets/*` | Avval kesh | Fayl nomlari hash bilan — mazmuni o'zgarmaydi |

Precache ro'yxati **ataylab yo'q**: Vite fayl nomlarini har build'da
o'zgartiradi, qo'lda yozilgan ro'yxat esa eskirib qolardi.

Ikonkalar [scripts/make-icons.mjs](scripts/make-icons.mjs) bilan yasaladi —
rasm kutubxonasisiz, Node'ning ichki `zlib` moduli orqali (`node
scripts/make-icons.mjs`). Natija repoga commit qilinadi.

> Service worker unit test bilan qoplanmagan: `caches` va `fetch`
> hodisalari jsdom'da mavjud emas. U brauzerda tekshiriladi —
> DevTools → Application → Service Workers, so'ng Network → Offline
> bilan sahifani qayta yuklash.

## Vaqt va reaktivlik haqida bitta tuzoq

`useLiveQuery` faqat **bazaga yozuv** bo'lganda qayta ishga tushadi. Ichida
`Date.now()` ishlatilgan so'rov (masalan "muddati yetgan kartalar") esa vaqt
o'tishi bilan eskiradi: ilova ochiq turib yarim tundan o'tsa, ko'rsatkichlar
o'zgarmasdi.

Yechim — [useNowTick](src/hooks/useNowTick.ts): davriy yangilanadigan timestamp
(fokus qaytganda ham) so'rov bog'liqliklariga qo'shiladi.

```tsx
const now = useNowTick()
const stats = useLiveQuery(() => getLanguageStats(lang, now), [lang, now])
```

Vaqtga bog'liq har qanday yangi so'rovda shu naqshni takrorlang.

## Fazalar holati

- [x] **Faza 1** — setup, papka strukturasi, routing, dizayn tokenlari
- [x] **Faza 2** — SM-2 algoritmi + Dexie saqlash + unit testlar
- [x] **Faza 3** — 4 xil mashq turi + instant feedback
- [x] **Faza 4** — streak, XP, nishonlar, kunlik maqsad
- [x] **Faza 5** — uch til moduli + kontent (har tildan 102 so'z) + TTS
- [x] **Faza 6** — to'liq onboarding + daraja testi + mascot
- [ ] **Faza 7** — liga + PWA (offline) + polish

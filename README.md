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
| Motion   | GSAP (dangasa yuklanadi, Faza 7) |
| Liga     | Supabase (ixtiyoriy — kalitsiz lokal rejim) |

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
│   └── ProgressBar.tsx
│
├── core/                    # domen yadrosi (UI'ga bog'liq emas)
│   ├── types/               # Card, Grade, ExerciseType, LanguageCode
│   ├── config/
│   │   ├── languages.ts     # tillar ro'yxati + RTL/TTS metama'lumoti
│   │   └── levels.ts        # LEVEL_ORDER (A1→A2→B1) + levelRank
│   ├── lesson/order.ts      # pickLessonCards — darsga qaysi so'z chiqadi
│   ├── path/units.ts        # o'quv yo'li bo'limlari (kartalardan hisoblanadi)
│   ├── placement/           # daraja testi — sof funksiyalar
│   │   ├── score.ts         # natijadan boshlang'ich darajani aniqlash
│   │   └── questions.ts     # savollarni kontentdan yasash
│   ├── text/transliterate.ts # notanish yozuvning o'qilishi
│   ├── pronunciation/       # aytilgan so'zni kutilgani bilan solishtirish
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
│       ├── types.ts         # 7 mashq turining tiplari
│       ├── generate.ts      # generator + adaptiv qiyinlik zinasi
│       ├── normalize.ts     # javob normallashtirish + editDistance
│       └── check.ts         # tekshirish → SM-2 bahosi
│
├── features/                # ekranlar, har biri o'z papkasida
│   ├── session/             # MASHQ SEANSI — review va lesson uchun umumiy
│   │   ├── SessionRunner.tsx    # holat mashinasi: mashq → javob → feedback
│   │   ├── ExerciseView.tsx     # turlarning ko'rinishi
│   │   ├── MatchingView.tsx     # juft topish (ko'p-kartali)
│   │   ├── FeedbackBar.tsx      # instant feedback + mnemonika yozish
│   │   └── ChoiceGrid.tsx, WordDisplay.tsx, SessionSummaryPanel.tsx
│   ├── onboarding/          # til → daraja testi → maqsad → birinchi dars
│   │   └── steps/           # har qadam alohida komponent
│   ├── home/                # streak, kunlik maqsad, o'quv yo'li
│   ├── lesson/              # yangi so'zlarni o'rganish
│   ├── review/              # SRS bo'yicha takrorlash
│   ├── profile/             # statistika, nishonlar
│   ├── league/              # haftalik leaderboard (Faza 7)
│   ├── mnemonics/           # assotsiatsiyalarni boshqarish
│   └── misc/                # 404
│
├── stores/                  # Zustand do'konlari
│   └── useSettingsStore.ts  # til, kunlik maqsad, onboarding holati
│
├── hooks/                   # umumiy React hook'lari
│   ├── useDocumentDirection.ts  # <html dir="rtl"> boshqaruvi
│   ├── useStarterDeck.ts        # boshlang'ich so'zlarni bazaga yozish
│   ├── usePushActivity.ts       # "bugun mashq qildim" belgisi (eslatma uchun)
│   └── useNowTick.ts            # vaqt o'tishini kuzatish (kun almashuvi)
│
├── lib/                     # sof yordamchilar
│   ├── cn.ts                # sinf nomlarini birlashtirish
│   ├── date.ts              # startOfDay / addDays (DST'ga chidamli)
│   ├── push.ts              # Web Push obunasi (yoqish/o'chirish)
│   └── format.ts            # "6 kun", "ertaga" ko'rinishidagi matnlar
├── content/                 # o'quv kontenti
│   ├── decks/en.ts ru.ts ar.ts  # qo'lda yozilgan (132/til, jumlalari bilan)
│   ├── decks/imported-{ar,en}.ts   # AVTO: Mabdaul qiroat + Enterprise (OCR)
│   ├── decks/imported-en-app.ts    # AVTO: Enterprise app (qo'lda yozilgan, ustun)
│   ├── decks/sentences-{en,ru,ar}.ts # AVTO: Tatoeba jumlalari
│   ├── decks/ru-extra.ts           # qo'lda tanlangan ruscha
│   ├── decks/imported-ru.ts        # AVTO: Ru-Uz-Dictionary (ru.db)
│   └── starterDecks.ts      # loadLanguageDeck — tilni DANGASA yuklaydi
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
Bir so'z har safar **boshqacha** so'raladi: bir xil savol takrorlanaversa,
javob so'zning ma'nosiga emas, savolning ko'rinishiga bog'lanib qoladi.

Yetti tur, qiyinligi bo'yicha:

| Tur            | Nima qilinadi                    | Qachon beriladi |
| -------------- | -------------------------------- | --------------- |
| `recognition`  | 4 variantdan tarjimani tanla     | repetitions 0–1 |
| `matching`     | 5 so'zni tarjimasi bilan juftla  | repetitions 1+  |
| `listening`    | audio eshitib, ma'nosini tanla   | repetitions 1–3 |
| `cloze`        | jumlada tushgan so'zni tanla     | repetitions 2+  |
| `recall`       | so'zni klaviaturadan yoz         | repetitions 2+  |
| `spelling`     | aralash harflardan so'zni yig'   | repetitions 4+  |
| `construction` | so'zlardan jumla tuz             | repetitions 4+  |

Qiyinlik [generate.ts](src/core/exercises/generate.ts) dagi zina bo'yicha
avtomatik oshadi (Flow nazariyasi). Tur mavjud bo'lmasa — audio yo'q, jumla
yozilmagan, lug'at kichik yoki so'z arab yozuvida — bir pog'ona pastga
tushiladi. Generator hech qachon "hech narsa" qaytarmaydi.

Ikki turning o'z sharti bor:

- **`cloze`** jumlani talab qiladi va so'z jumlada **aynan** shu shaklda
  uchrashi kerak. "drink" so'zi "She drinks tea" jumlasida turlangan —
  bunday holatda bo'sh joy qoldirish noto'g'ri bo'lardi, shuning uchun tur
  yaratilmaydi.

  So'z chegarasi `\b` bilan **qaralmaydi**: JavaScript'da u faqat ASCII
  harflarga tayanadi, ya'ni arab va kirill yozuvida hech qachon mos
  kelmasdi va bu tillarda cloze umuman yaratilmasdi. O'rniga Unicode
  sinflari ishlatiladi — `(?<![\p{L}\p{M}])so'z(?![\p{L}\p{M}])`. `\p{M}`
  arab harakatlarini qamraydi: ular so'zning davomi, aks holda so'z
  o'rtasidan kesilardi.
- **`spelling`** faqat lotin/kirill yozuvida va 3–10 harfli bir so'zli
  kartalarda. Arab harflari so'z ichida ulanadi va ajratilganda boshqa
  shaklga kiradi — alohida harflardan yig'ish chalkash bo'lardi.

**`matching` — ko'p kartali istisno.** Qolgan oltitasi bitta kartani
so'raydi; juft topish esa bir mashqda 5 kartani baholaydi. Shuning uchun
[SessionRunner](src/features/session/SessionRunner.tsx) da alohida tarmoq
bor: FeedbackBar chetlab o'tiladi, har juft uchun SM-2 bahosi yoziladi
(to'g'ri 4, xato 2 — juft topish passivroq tur, u yerdagi xato so'z butunlay
unutilganini bildirmaydi), navbat esa bittaga suriladi.

**Foydalanuvchi o'zini baholamaydi** — SM-2 bahosi mashq natijasidan chiqadi:

| Natija                    | Baho | Oqibat                        |
| ------------------------- | ---- | ----------------------------- |
| xato                      | 0    | interval 1 kunga qaytadi      |
| kichik imlo xatosi        | 3    | o'tdi, easeFactor pasayadi    |
| to'g'ri (oson tur)        | 4    | easeFactor o'zgarmaydi        |
| to'g'ri (yozish / jumla / harfma-harf) | 5 | easeFactor oshadi        |

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

## Talaffuz (TTS)

Ovoz **aniq tanlanadi**, faqat `utterance.lang` ga tayanilmaydi
([speech.ts](src/lib/speech.ts)). Sabab jonli xatoda topilgan: agar ovoz
tanlanmasa, brauzer tizimdagi **standart** ovozni oladi — Windows'da faqat
ruscha ovoz o'rnatilgan bo'lsa, inglizcha `water` ruscha talaffuzda o'qilardi.
Foydalanuvchi buzuq talaffuzni to'g'ri deb yodlab qolardi.

Shuning uchun qoida qat'iy:

- avval aynan mos lokal (`en-US`), keyin o'sha til (`en-GB` ham bo'ladi);
- **mos ovoz topilmasa umuman o'qilmaydi** — noto'g'ri tildagi ovozdan
  ko'ra jimlik afzal;
- ovoz yo'q bo'lsa 🔊 tugmasi ham **ko'rsatilmaydi**
  ([useHasVoice](src/hooks/useHasVoice.ts)) — bosilsa hech narsa
  bo'lmaydigan tugma chalg'itadi.

Ovozlar ro'yxati asinxron yuklanadi va `voiceschanged` hodisasi ba'zan
komponent ulanmasidan oldin otib bo'ladi. Faqat hodisaga tayansak holat
"ovoz bor"da qotib qolardi, shuning uchun ro'yxat to'lguncha qisqa vaqt
qayta-qayta tekshiriladi.

> Inglizcha ovoz yo'q bo'lsa Windows'da:
> **Settings → Time & Language → Speech → Manage voices → Add voices**.

## Import qilingan lug'at

Qo'lda yozilgan 132 so'z (jumlalari bilan) ustiga tashqi manbalardan
lug'at qo'shilgan:

| Til | Manba | So'z |
| --- | ----- | ---- |
| Arab | Mabdaul qiroat / Madina (169 dars) | +2161 |
| Ingliz | Enterprise 1 | +1486 |
| Rus | Ru-Uz-Dictionary + qo'lda | +3411 +118 |

Daraja **chastota bo'yicha**: ingliz Enterprise `freq`, rus OpenSubtitles ru_50k. Ko'p ishlatiladigan so'z pastroq darajada (30% A1 / 35% A2 / 35% B1). Arab — Madina kitob tartibida.

[scripts/import-vocab.mjs](scripts/import-vocab.mjs) manba JSON'larini
o'qib `decks/imported-{ar,en}.ts` yaratadi (natija repoga commit qilinadi).
Lug'at **dangasa yuklanadi** (`loadLanguageDeck`): har til alohida bo'lakka chiqadi, asosiy JS ~129 KB gzip qoladi va faqat tanlangan til lug'ati yuklanadi.

### Jumlalar va "gap ichida" mashqi

Import qilingan so'zlarning ko'pida jumla **yo'q** — o'shanda "jumla qurish"
va "gap ichida" berilmaydi (qolgan 5 mashq ishlayveradi).

Istisno — **arab tili**: Mabdaul qiroat manbasida har darsning matni bor va
u toza raqamli yozuv (OCR emas). Skript so'z **aynan** qatnashgan eng qisqa
jumlani ajratib oladi (2–9 so'z, transliteratsiya jadvaliga sig'adigan) —
`هَذَا كِتَابٌ`, `اُقْعُدْ عَلَى الْكُرْسِيِّ`. Shu yo'l bilan 321 so'zga jumla
biriktirildi.

Bu jumlalarning **o'zbekcha tarjimasi yo'q**, va bu ataylab: "gap ichida"
mashqi jumlaning o'zini ko'rsatadi, tarjima kerak emas. "Jumla qurish" esa
savol sifatida aynan o'zbekcha jumlani talab qiladi, shuning uchun bunday
kartada u berilmaydi. Qoida `decks.test.ts` da: tarjima jumlasiz qolmasin
(teskarisi ruxsat), va tarjimasiz jumla o'z so'zini albatta ichiga olsin.

**Ikkita Enterprise manbasi bor va ular teng emas:**

| Manba | Nima beradi | Sifat |
| ----- | ----------- | ----- |
| `enterprise-app/.../unit_*.json` | 3298 so'z + 844 **tarjimali** jumla | qo'lda yozilgan |
| `enterprise-trainer/structured.json` | 616 so'z | skanerdan OCR |

App manbasi **ustun turadi**: to'qnashuvda o'sha qoladi
([import-enterprise-app.mjs](scripts/import-enterprise-app.mjs) OCR importidan
OLDIN ishlaydi va u band qilgan so'zlarni OCR importi chetlab o'tadi). Sabab —
OCR tarjimalarida xato bor edi (`adverb → "ergash gap"`, aslida "ravish").

App manbasidagi jumlalarning **o'zbekcha tarjimasi ham bor**, shuning uchun
ular "jumla qurish" mashqini ham ochadi (Tatoeba jumlalari faqat "gap ichida"
uchun yaraydi). Manbada so'z yasalish qoidalari ham shu maydonda uchraydi
(`studied → "Y → I + ED"`) — ular tarjima emas, filtrlanadi.

**Enterprise trainer'ning `example` maydonidan jumla OLINMADI.** 99% da bor,
lekin ular OCR parchalari: *"kts cloudy amd windy"*, *"PRM TON ES ... bedroom
downstairs"*.

App manbasida uch xil ma'lumot bor: `vocabulary` (darsning o'z lug'ati,
2026-08-15 da qo'shildi va eng sifatlisi), `wordFormation` (so'z yasalish
juftlari) va `sentencePatterns` (tarjimali jumlalar).

**O'zbekcha sizib chiqishi filtrlanadi.** Manbada grammatika qoidalari ham
lug'at qatori sifatida yozilgan: `harakat so'raladi → vaqt ketma-ketligi`,
`ko'rinish → What does she look like?`. Oddiy `^[a-z...]$` tekshiruvi ularni
ushlamaydi, chunki o'zbekcha ham lotin alifbosida. Ishonchli belgilar: `g'`
ingliz tilida umuman uchramaydi, `o'` faqat `o'clock`/`who's` da bo'ladi,
`-moq` esa o'zbek fe'li. Shu bilan 28 ta soxta yozuv tashlandi.


**Darslikdagi shaxs ismlari tashlanadi** (`PERSONAL_NAMES`). Ular mashqlarda
doim qatnashgani uchun chastotasi yuqori va chastota bo'yicha bo'linganda
hammasi A1'ga — boshlovchining ilk darslariga tushardi (`chris → Kris`).
Mamlakat va bayram nomlari qoladi — ular haqiqiy lug'at.

Ingliz va rus tillari uchun jumlalar **Tatoeba**dan olinadi
([scripts/add-sentences.py](scripts/add-sentences.py)) — odamlar yozgan,
qisqa va tabiiy. Ular lug'at yozuvlarining ICHIGA qo'shilmaydi: alohida
`sentences-{en,ru}.ts` xaritasi sifatida saqlanadi va `loadLanguageDeck`
ularni jumlasiz kartalarga biriktiradi. Sabab — jumlalar boshqa manbadan
keladi va o'z generatori bilan yangilanadi; ularni har yozuvga yozib
qo'yish ikkala faylni qo'lda sinxron ushlashni talab qilardi.

Jumla qamrovi: **6000+ / 9942** karta (ar 453, en 3100, ru 2551).

Bahosi: `sentences-en` +20 KB gzip, `sentences-ru` +41 KB gzip. Ikkalasi
ham TIL BO'LAGIDA — asosiy JS (~131 KB gzip) o'zgarmadi va foydalanuvchi
faqat o'zi tanlagan tilnikini yuklaydi.

### Kontent yangilanishi mavjud foydalanuvchilarga qanday yetadi

`addMissingCards` faqat YANGI kartani qo'shadi, shuning uchun kontent
yaxshilangani (yangi jumla, mavzu, daraja) ilovani allaqachon o'rnatganlarga
yetib bormasdi. `syncCardContent` shu bo'shliqni yopadi: u faqat kontent
maydonlarini ustiga yozadi va **SM-2 holatiga tegmaydi** (`interval`,
`easeFactor`, `dueDate`, `repetitions`). Oddiy `bulkPut` foydalanuvchining
oylar davomidagi takrorlash progressini nolga qaytarardi.

**Sinxronlash har ochilishda EMAS.** `syncCardContent` + `pruneRemovedCards`
3600 kartada ~170 ms oladi va deyarli har safar hech narsa topmaydi — lug'at
build artefakti, u faqat yangi versiya chiqqanda o'zgaradi. Shuning uchun
lug'atning **barmoq izi** (`deckFingerprint`, FNV-1a, ~9 ms) `localStorage`
da saqlanadi va mos kelsa ikkala qadam o'tkazib yuboriladi. O'lchangan
natija: takroriy ochilish 280 ms → 100 ms.

`addMissingCards` esa HAR DOIM ishlaydi — u xavfsizlik to'ri. Brauzer
IndexedDB'ni tozalab `localStorage` ni qoldirishi mumkin; faqat barmoq iziga
ishonsak, foydalanuvchi bo'sh ilova bilan qolardi. Sinab ko'rilgan: kartalar
o'chirilib qayta yuklanganda 3603 tasi ham tiklandi.

### Lug'at qachon UMUMAN yuklanmaydi

Barmoq izi qimmat qadamlarni o'tkazib yuborardi, lekin **lug'atning o'zi
baribir yuklanardi** — uni hisoblash uchun kerak edi. O'lchov: bu har
ochilishda ~106 ms JS bajarish + ~91 ms baza o'qish, telefonda 3-5 barobar
ko'p. Ustiga bosh ekran (`LearningPath`) lug'atni FAQAT mavzular tartibini
olish uchun ikkinchi marta yuklardi.

Yechim — build belgisi (`__DECK_BUILD_ID__`, `vite.config.ts` da `define`).
Lug'at build artefakti bo'lgani uchun u faqat yangi versiya bilan o'zgaradi:

1. belgi o'sha VA `countCards(language) > 0` bo'lsa — hech nima yuklanmaydi;
2. aks holda lug'at yuklanadi, bazaga yoziladi va **mavzular tartibi
   keshlanadi** (`topicOrderCache`) — bosh ekran uni lug'atsiz oladi.

Karta sonini tekshirish majburiy: u yuqoridagi xavfsizlik to'rini saqlaydi.

O'lchangan natija (production build, brauzer): birinchi ochilishda 4 ta
lug'at bo'lagi (120 kB), **ikkinchi ochilishda 0 ta**. Yangi versiya
chiqqanda belgi o'zgaradi va kontent bir marta yangilanadi.


### Rus lug'atidagi "ruscha sizib chiqishi"

Manba ta'riflari ba'zan o'zbekcha emas, **ruscha sinonim** bo'ladi. U ham
kirillda yozilgani uchun transliteratsiyadan bemalol o'tib, `приходить →
priezjat` kabi soxta tarjima yasardi. Ikki qoida buni to'xtatadi
([import-ru-dict.py](scripts/import-ru-dict.py)):

- lotinchada `-sya/-tsya` bilan tugasa — ruscha qaytim fe'li, o'zbekchada
  bunday qo'shimcha yo'q;
- bosh so'z **fe'l** bo'lsa va tarjima uning transliteratsiyasiga juda yaqin
  bo'lsa (nisbiy tahrir masofasi ≤ 0.6).

Fe'l sharti muhim: ruschadan o'zlashgan **otlar** o'zbek tilida ko'p
(`restoran`, `telefon`, `muzey`) va ular to'g'ri tarjima. Fe'lning noaniq
shakli esa hech qachon o'zlashmaydi. Fe'l `-ть` dan oldin UNLI oladi
(`приходи-ть`), ot esa undosh (`смер-ть`, `гос-ть`) — shu bilan ajratiladi.
`-moq` bilan tugagan tarjima ham ozod: `filtrlamoq`, `garantiyalamoq` —
ildizi ruscha bo'lsa ham haqiqiy o'zbek fe'li. Natija: 58 soxta yozuv
tashlandi.

Skript qo'lda yozilgan so'zlar bilan **to'qnashuvchi** (so'z, tarjima yoki
normallashtirilgan shakl) importlarni tashlaydi va sifat qoidalarini
(noyob tarjima, toza transliteratsiya) `decks.test.ts` bilan bir xil
qo'llaydi. Tashlangan: arab 1294, ingliz 1412 (app manbasi ustun bo'lgani uchun).

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

`interval` va `totalReviews` ham indekslangan (3-versiya). Ular nishonlar
uchun kerakli uchta sonni — "jami", "o'rganilgan", "mustahkam" — yozuvlarni
O'QIMASDAN sanashga imkon beradi. Ilgari `getGlobalCardStats` butun jadvalni
xotiraga ko'chirardi va bu **har seans oxirida** bajarilardi
(`finalizeSession` nishonlarni qayta hisoblaydi); bir necha til
o'rganayotgan foydalanuvchida bu 10 000 dan ortiq yozuv degani edi.

Xuddi shu sababdan bosh ekran kartalarni **bir marta** o'qiydi va ularni
ham statistikaga, ham o'quv yo'liga beradi: ilgari ikkala qism jadvalni
alohida skanerlardi.

## Marshrutlar

| Yo'l                 | Ekran       | Qobiq    | Himoya            |
| -------------------- | ----------- | -------- | ----------------- |
| `/onboarding`        | Til tanlash | Focus    | —                 |
| `/`                  | Bosh sahifa | AppShell | onboarding kerak  |
| `/review`            | Takrorlash  | AppShell | onboarding kerak  |
| `/league`            | Liga        | AppShell | onboarding kerak  |
| `/profile`           | Profil      | AppShell | onboarding kerak  |
| `/mnemonics`         | Assotsiatsiyalar | AppShell | onboarding kerak |
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

## O'quv yo'li

Bosh sahifadagi zanjir — **bo'lim = daraja + mavzu**. Ikkalasi ham
kartada bor, shuning uchun yo'l uchun alohida ma'lumot saqlanmaydi:
holat har safar progressdan hisoblanadi
([units.ts](src/core/path/units.ts)).

| Holat | Ma'nosi |
| ----- | ------- |
| `completed` | barcha so'zi kamida bir marta ko'rilgan |
| `current` | birinchi tugallanmagan bo'lim |
| `locked` | joriydan keyingilari |
| `skipped` | daraja testi "bilaman" degan, lekin ko'rilmagan |

`skipped` ataylab alohida: A2 dan boshlagan foydalanuvchining A1
bo'limlariga ✓ qo'yish yolg'on bo'lardi — ular so'nik ko'rinadi, lekin
ochib o'rganish mumkin.

Bo'lim bosilganda `/lesson/a1-oila` ochiladi va dars faqat o'sha mavzu
so'zlaridan tuziladi.

## Animatsiya

GSAP **dangasa yuklanadi** ([motion.ts](src/lib/motion.ts)) — birinchi
ochilish tezligiga tegmaydi.

> **Animatsiya — bezak.** Interfeys animatsiyasiz ham to'g'ri bo'lishi
> shart: GSAP yuklanmasa yoki `prefers-reduced-motion` yoqilgan bo'lsa,
> ekran shunchaki yakuniy holatida turadi.

Bu qoida testda qo'riqlanadi va u allaqachon bitta xatoni ushladi: kirish
animatsiyasi `opacity: 0` dan boshlangan edi, ya'ni animatsiya tugamay
qolsa (fon tab, to'xtatilgan `requestAnimationFrame`) bo'limlar ko'rinmas
bo'lib qolardi. Endi faqat siljish va masshtab animatsiya qilinadi —
yarim yo'lda ham matn o'qiladi.

`loadGsap()` harakat kamaytirilganda `null` qaytaradi: kutubxona umuman
yuklanmaydi. Bu did emas — harakat vestibulyar buzilishi bor odamlarda
ko'ngil aynishiga sabab bo'ladi.

Kuchli effektlar yo'l va bosh sahifada; mashq siklida harakatlar
≤200 ms — javob va keyingi savol orasidagi ritm buzilmasligi kerak.

## Liga va maxfiylik

> **Holat: JONLI.** Backend Supabase'da (Frankfurt) ishlayapti, kalitlar
> Vercel'da `production` va `preview` uchun o'rnatilgan. Uchidan-uchiga
> tekshirilgan: darsdagi XP qurilmadan bazaga borib, reytingda ko'rinadi.

Haftalik reyting (Bronza → Kumush → Oltin → Olmos). **Tushirish yo'q** —
daraja joriy haftaning ko'rsatkichi, jazo emas.

> **Soxta raqiblar yo'q.** Reytingda faqat haqiqiy foydalanuvchilar.
> Yolg'iz bo'lsangiz ro'yxatda bitta o'zingiz turasiz va ekranda shu
> ochiq yoziladi.

**Ma'lumot faqat rozilik bilan yuboriladi.** Liga ochilganda ism
so'raladi va qurilmada 6 belgilik kod yaratiladi. Serverga **faqat ism va
kunlik XP/so'z soni** ketadi. So'zlar, javoblar, xatolar va mnemonikalar
qurilmadan chiqmaydi.

Kalit bo'lmasa ilova **lokal rejimda** ishlaydi — faqat o'z natijangiz
ko'rinadi.

### Ishga tushirish

1. [supabase.com](https://supabase.com) da loyiha yarating (bepul reja yetadi).
2. **SQL Editor → New query** → [supabase/yodla-schema.sql](supabase/yodla-schema.sql)
   ni to'liq joylang → **RUN**. Fayl idempotent — qayta ishga tushirsa ham
   xato bermaydi.
3. **Project Settings → API** dan ikkita qiymatni oling va `.env.local` ga
   yozing:

   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```

4. Sozlash to'g'riligini tekshiring:

   ```bash
   node scripts/check-supabase.mjs
   ```

   Skript jadval va funksiyalar borligini, kalit ishlashini VA anon kalit
   bilan to'g'ridan-to'g'ri yozib bo'lmasligini tekshiradi. Ilovadagi xato
   xabari sozlash paytida chalg'ituvchi ("internet yo'q bo'lishi mumkin"),
   bu esa sababni aniq aytadi.

5. Vercel → **Settings → Environment Variables** ga o'sha ikki qiymatni
   qo'shing va qayta deploy qiling.

> **`service_role` kalitini ISHLATMANG.** Faqat `anon` kalit kerak — u
> brauzerga ketadi va ochiq bo'lishi ko'zda tutilgan. `service_role` esa
> barcha himoyani chetlab o'tadi.

### Nega yozuv RPC orqali

Anon kalit brauzerga ketadi va bu repozitoriy ochiq. Jadvalga
to'g'ridan-to'g'ri yozishga ruxsat berilsa, kimdir "million XP" yozib
reytingni buzardi. Shuning uchun yozuv faqat `yodla_upsert_day`
funksiyasi orqali: u XP'ni kunlik **2000** bilan cheklaydi va sanani
**serverda** qo'yadi (o'tmishni qayta yozib bo'lmaydi).

Bu mutlaq himoya emas — autentifikatsiyasiz uni qurib bo'lmaydi. Lekin
cheksiz soxta natijani yopadi.

### Nima OCHIQ ekanini bilib qo'ying

Ilovada login yo'q, ya'ni serverda "bu so'rov kim tomonidan" degan savolga
javob yo'q. Shuning uchun RLS faqat ikki holatni ajrata oladi: o'qish ochiq,
yozish yopiq (faqat RPC). Buning oqibati:

- reyting (ism + haftalik XP) — **ommaviy**, bu kutilgan;
- do'stlik bog'lanishlari (`yodla_links`) va yuborilgan xabarlar
  (`yodla_cheers`) ham **ommaviy o'qiladi** — kim kimni qo'shgani ko'rinadi.

Ma'lumot taxallusli (6 belgilik kod + o'zi yozgan ism), lekin ilova ichidagi
"faqat ism va XP yuboriladi" va'dasidan bu bir oz kengroq. Buni yopish uchun
autentifikatsiya kerak bo'ladi — o'shanda RLS `auth.uid()` ga tayana oladi.

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
- [x] **Faza 3** — 7 xil mashq turi + instant feedback
- [x] **Faza 4** — streak, XP, nishonlar, kunlik maqsad
- [x] **Faza 5** — uch til moduli + kontent (9942 so'z) + TTS
- [x] **Faza 6** — to'liq onboarding + daraja testi + mascot
- [x] **Faza 7** — liga + do'stlar + PWA (offline) + o'quv yo'li + statistika
      + GSAP animatsiyalari

# Faza 5 — kontent moduli va darajalar (dizayn)

**Sana:** 2026-08-09
**Holat:** tasdiqlangan, amalga oshirishga tayyor
**Qamrov:** TZ 7-bo'limi — uch til uchun to'liq kontent, CEFR darajalari, TTS.

## Muammo

Hozir har tilda atigi 10 ta namunaviy so'z bor va ular bitta
`src/content/starterDecks.ts` faylida yotibdi (fayl ichida "VAQTINCHALIK"
deb belgilangan). Kartada `level` maydoni mavjud, lekin hech qayerda
ishlatilmaydi: dars so'zlarni darajaga qaramay beradi. Natijada
foydalanuvchi bir necha kunda kontentni tugatadi va A1/A2/B1 tuzilmasi
faqat qog'ozda qoladi.

## Yechim (qisqacha)

Har til uchun ~100 so'z, uch darajaga bo'lingan; kontent tilma-til
fayllarga ajratiladi; dars yangi so'zlarni **eng past tugallanmagan
darajadan** beradi.

TTS allaqachon ishlaydi (`src/lib/speech.ts`) — bu fazada unga tegilmaydi.

## 1. Fayl tuzilmasi

```
src/content/
├── decks/
│   ├── en.ts      # EN_DECK: Record<LevelCode, NewCardRecordInput[]>
│   ├── ru.ts      # RU_DECK
│   └── ar.ts      # AR_DECK
├── decks.test.ts  # kontent yaxlitligi testlari
└── starterDecks.ts  # yig'uvchi
```

`starterDecks.ts` mavjud eksportni **o'sha nom va o'sha shaklda** saqlaydi:

```ts
export const STARTER_DECKS: Record<LanguageCode, NewCardRecordInput[]>
```

Darajalar `LEVEL_ORDER = ['A1', 'A2', 'B1']` bo'yicha ketma-ket `flat()`
qilinadi. Shu tufayli `useStarterDeck` va `addMissingCards` chaqiruvlari
o'zgarmaydi.

**Nega TS modul, JSON emas:** yozuv paytida TypeScript maydon nomlari va
`LanguageCode`/`LevelCode` qiymatlarini tekshiradi. JSON bo'lsa xuddi
shu ishonch uchun alohida validatsiya kodi yozish kerak bo'lardi (YAGNI).

**Nega tilma-til fayl:** ~100 yozuvli fayl ko'rib chiqishga qulay;
bitta ~300 yozuvli fayl esa tahrirlashda noqulay.

## 2. Kontent hajmi va sifati

Har til uchun taxminan:

| Daraja | So'z | Mavzular |
| ------ | ---- | -------- |
| A1 | ~40 | salomlashish, oila, raqamlar, ovqat, ranglar, kundalik fe'llar |
| A2 | ~35 | sayohat, xarid, ish, sog'liq, ob-havo, vaqt |
| B1 | ~25 | his-tuyg'u, fikr bildirish, jamiyat, texnologiya, mavhum tushunchalar |

Har bir yozuv to'liq bo'ladi: `word`, `translation` (o'zbekcha), `topic`,
`level`, `sentence`, `sentenceTranslation`.

**Jumla majburiy**, chunki `sentence` bo'lmasa "jumla qurish" mashqi
o'sha karta uchun yaratilmaydi (generator bir pog'ona pastga tushadi) —
ya'ni eng qiyin mashq turi kontent sababli yo'qoladi.

**Arab tili harakat bilan yoziladi** (`مَدِينَة`). Javob tekshirishda
`normalize.ts` harakatlarni tushiradi, shuning uchun foydalanuvchi
harakatsiz yozsa ham javob to'g'ri sanaladi; harakatlar esa to'g'ri
talaffuz uchun ko'rsatiladi.

**Mavjud 30 so'z saqlanadi.** Karta `id` si aniq (`en:hello`), shuning
uchun bir xil so'z qayta yozilsa ham `addMissingCards` uni o'tkazib
yuboradi va progress buzilmaydi.

## 3. Dars darajalar tartibida

Hozir tartiblash mantig'i `LessonScreen.tsx` ichidagi `useEffect` da,
testsiz. U sof funksiyaga ko'chiriladi:

**`src/core/lesson/order.ts`**

```ts
export function pickLessonCards(cards: CardRecord[], size: number): CardRecord[]
```

Tartiblash mezonlari (ketma-ket):

1. **Daraja** — A1 → A2 → B1. `level` yo'q karta oxirida turadi
   (eski/qo'lda qo'shilgan kartalar dars boshini egallab olmasligi uchun).
2. **Ko'rilmaganlar oldin** — `totalReviews` o'sish bo'yicha.
3. **Eng kam mustahkam** — `interval` o'sish bo'yicha.

Natijada A1 tugamaguncha A2 so'zlari yangi dars sifatida chiqmaydi.
`LessonScreen` faqat ko'rsatish bilan shug'ullanadi.

**Nega ekrandan chiqariladi:** tartib — domen qoidasi (qaysi so'z
keyingi o'rgatiladi), UI emas. `core/` da u React'siz test qilinadi.

## 4. Testlar

**`src/core/lesson/order.test.ts`**
- A1 kartalar A2/B1 dan oldin qaytariladi
- daraja ichida ko'rilmagan karta ko'rilganidan oldin
- A1 tugagach (hammasi ko'rilgan) A2 chiqadi
- `level` yo'q kartalar oxirida
- `size` dan ko'p qaytarmaydi; bo'sh ro'yxatda bo'sh natija

**`src/content/decks.test.ts`** (kontent yaxlitligi)
- har til ichida takrorlanuvchi so'z yo'q (id to'qnashuvi)
- har yozuvda majburiy maydonlar bor va bo'sh satr emas
- `language` maydoni fayl tiliga mos
- har daraja bo'sh emas
- `STARTER_DECKS` daraja tartibida yig'ilgan (A1 birinchi)

## 5. Bosqichlar

Kontent hajmi katta, shuning uchun tilma-til yoziladi va har bosqichdan
keyin testlar ishga tushiriladi:

1. **Tuzilma + ingliz tili** — `decks/en.ts`, yig'uvchi, `order.ts`,
   testlar. Foydalanuvchi ko'rib chiqadi.
2. **Rus tili** — `decks/ru.ts`.
3. **Arab tili** — `decks/ar.ts`.

Har bosqich mustaqil ishlaydigan holatda tugaydi (yarim yozilgan
kontent bilan qolmaydi).

## 6. Qamrovdan tashqarida (YAGNI)

- Daraja qulflash / o'quv yo'li UI — Faza 6
- Placement (daraja aniqlash) testi — Faza 6
- Audio fayllar — TTS brauzerdan ishlaydi, fayl kerak emas
- Rasm (`imageUrl`) — kontentda ishlatilmaydi
- `HomeScreen` dagi "Faza 5" bildirishnomasi kontent to'liq
  qo'shilganda (3-bosqich oxirida) olib tashlanadi

## Xavflar

- **Tarjima sifati** — so'zlar keng tarqalgan va bir ma'noli bo'lishi
  kerak, aks holda "to'g'ri javob" chalkash bo'ladi. Ko'p ma'noli
  so'zlardan qochiladi.
- **Chalg'ituvchi variantlar** — mashq generatori bir tildagi boshqa
  so'zlardan variant tanlaydi; shuning uchun bir mavzuda o'zaro juda
  yaqin tarjimalar (masalan "katta"/"ulkan") bo'lmasligi kerak.

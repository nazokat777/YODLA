# Yangi mashq turlari: gap ichida, harfma-harf, juft topish (dizayn)

**Sana:** 2026-08-09
**Holat:** tasdiqlangan, amalga oshirishga tayyor
**Qamrov:** Duolingo uslubidagi uch yangi mashq turi.

## Muammo

Hozir 4 tur bor: tanib olish, eshitish, eslab yozish, jumla qurish. Bir
xil so'z bir necha marta bir xil tarzda so'raladi — takrorlash zerikarli
va so'z faqat bitta kontekstda mustahkamlanadi. Duolingo so'zni **turli
usullarda** yodlatadi: gap ichida, juft qilib, harfma-harf.

## Yechim: uch yangi tur

Mavjud arxitektura (sof `generateExercise` + `checkExercise`, `Exercise`
union, `SessionRunner`) ustiga quriladi.

### 1. Gap ichida (`cloze`)

Jumla ko'rsatiladi, o'rganilayotgan so'z `___` bilan yashiriladi;
variantlardan to'g'ri so'z tanlanadi.

> "I drink ___ every morning" → variantlar: water · bread · tea · salt

```ts
interface ClozeExercise {
  type: 'cloze'
  prompt: string   // jumla, so'z o'rnida "___"
  options: string[] // O'RGANILAYOTGAN tildagi so'zlar (tarjima emas)
  correctIndex: number
  card
}
```

**Jumla kerak** — faqat qo'lda yozilgan so'zlarda bor (import qilinganlarda
yo'q). So'z jumlada topilmasa (turlanish/imlo farqi), tur yaratilmaydi —
bir pog'ona pastga tushiladi (mavjud "step down" naqshi). Chalg'ituvchilar
— o'sha tildagi boshqa so'zlar (`collectWordDistractors`, mavjud
`collectDistractors` ning so'z varianti). Javob = `choiceIndex`.

### 2. Harfma-harf (`spelling`)

So'z harflari aralashtiriladi; tarjima ko'rsatiladi; foydalanuvchi
harflarni tartib bilan bosib so'zni yig'adi.

> "suv" → `[t] [a] [w] [e] [r]` → water

```ts
interface SpellingExercise {
  type: 'spelling'
  prompt: string    // o'zbekcha tarjima — nima yozish kerakligi
  letters: string[] // aralashtirilgan harflar
  answer: string    // to'g'ri so'z
  card
}
```

**Faqat lotin/kirill** (`script !== 'arabic'`): arab harflari ajralganda
boshqa shaklga kiradi va RTL yig'ish chalkash. Faqat bitta so'zli (bo'sh
joysiz), 3–10 harfli so'zlar uchun. `ExerciseAnswerState.tokenOrder`
qayta ishlatiladi (jumla qurish kabi, faqat token = harf). Javob
harflarни birlashtirib `checkTextAnswer` bilan tekshiriladi (imlo
xatosiga bag'rikenglik shu yerda ham ishlaydi).

### 3. Juft topish (`matching`) — ko'p kartali

5 ta so'z va 5 ta aralash tarjima ko'rsatiladi; foydalanuvchi so'zни, so'ng
tarjimasini bosib juftlaydi. To'g'ri juft yashil, xato qizil (jazolanmaydi).

```ts
interface MatchingExercise {
  type: 'matching'
  card              // vakil karta (joriy navbatdagi)
  pairs: { cardId: string; word: string; translation: string }[]
}
```

Bu **ko'p kartali** — bir mashqda 5 karta baholanadi. Joriy navbat kartasi
+ `pool` dan 4 ta boshqa karta. Yaratish uchun kamida 5 karta kerak (kam
bo'lsa step down).

## SessionRunner o'zgarishi

Juft topish standart "javob → feedback" oqimidan farq qiladi, shuning
uchun `SessionRunner` da **alohida tarmoq**:

- `exercise.type === 'matching'` bo'lsa `<MatchingView pairs onComplete />`
  chiziladi (FeedbackBar va bir-javob mashinasi chetlab o'tiladi).
- `onComplete(results: { cardId; verdict }[])` — har juft uchun natija.
- SessionRunner har `cardId` ni `gradeCard` + `recordAnswer` bilan
  baholaydi (to'g'ri = baho 4, xato = baho 2 — "xatoda jazolamaslik"),
  `summary` ni yangilaydi va navbatni **bittaga** suradi (qo'shimcha 4
  karta bonus takror sifatida yoziladi).

Qolgan uch tur (cloze, spelling) mavjud bir-kartali oqimda ishlaydi:
javob → `checkExercise` → `FeedbackBar`.

## Fayl xaritasi

| Fayl | O'zgarish |
| ---- | --------- |
| `src/core/types/index.ts` | `ExerciseType` ga `'cloze' \| 'spelling' \| 'matching'` |
| `src/core/exercises/types.ts` | uch yangi interfeys + union |
| `src/core/exercises/generate.ts` | `buildCloze/buildSpelling/buildMatching`, `collectWordDistractors`, `scrambleLetters`, zinaga qo'shish |
| `src/core/exercises/check.ts` | cloze (choice), spelling (text); matching viewда |
| `src/features/session/ExerciseView.tsx` | `ClozeView`, `SpellingView` |
| `src/features/session/MatchingView.tsx` | yangi — juft topish UI + `onComplete` |
| `src/features/session/SessionRunner.tsx` | matching tarmog'i (ko'p karta baholash) |

## Qiyinlik zinasi

```
rep >= 4: recall, construction, spelling
rep >= 2: listening, recall, cloze
rep >= 1: recognition, listening, matching
rep >= 0: recognition
```

Matching rep>=1 da: u aralash kartalardan iborat, shuning uchun joriy
kartaning rep'iga qattiq bog'lanmaydi — mavjud bo'lsa variant sifatida
chiqadi. Cloze rep>=2 (jumlani o'qish kerak). Spelling rep>=4 (aktiv
ishlab chiqarish).

## Testlar

**`generate.test.ts`** (mavjud):
- cloze: jumlada `___` bor, so'z yo'q; options'da to'g'ri so'z; jumlasiz
  kartada cloze yaratilmaydi
- spelling: letters — so'z harflarining aralashmasi; arab kartada
  spelling yaratilmaydi; uzun/ko'p so'zli kartada yaratilmaydi
- matching: 5 juft; pool<5 da yaratilmaydi; juftlar noyob

**`check.test.ts`** (mavjud):
- cloze to'g'ri/xato indeks
- spelling: to'g'ri harflar → correct; bitta xato → almost

**`MatchingView.test.tsx`** (yangi):
- barcha juft to'g'ri bosilsa `onComplete` hammasini `correct` bilan
  chaqiradi
- xato juft `wrong` sifatida yoziladi; UI animatsiyasiz ham ishlaydi

**`ReviewScreen.test.tsx`** (mavjud): matching seansda 5 kartани
baholaydi (summary.answered oshadi)

## Qamrovdan tashqarida (YAGNI)

- Arab tili uchun harfma-harf (ajralgan harflar/RTL — alohida ish)
- Cloze uchun import qilingan so'zlarga jumla generatsiyasi
- Ovozli/talaffuzli juft topish
- Sudrab tashlash (drag-drop) — bosish yetarli va barmoqqa qulayroq

## Xavflar

- **Cloze kam chiqadi** — faqat ~382 jumlali so'zda. Bu normal: qo'shimcha
  tur, mavjud bo'lganda ishlatiladi.
- **Matching bonus baholash** — 4 qo'shimcha karta har safar qayta
  baholanadi. Zarari yo'q: SM-2 baribir intervalни to'g'ri suradi, ortiqcha
  takror foydali.

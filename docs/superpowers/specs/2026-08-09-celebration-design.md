# Tugma chuqurligi va seans yakuni tantanasi (dizayn + reja)

**Sana:** 2026-08-09
**Holat:** tasdiqlangan
**Qamrov:** Faza 7 ning oxirgi qismi — vizual sayqal.

## Boshlang'ich holat (tekshirilgan)

So'ralgan narsalarning katta qismi allaqachon mavjud:

- `buttonStyles.ts` da `primary` va `danger` uchun Duolingo naqshi bor:
  `shadow-[0_4px_0_0]` + `active:translate-y-[2px] active:shadow-none`
- `SessionSummaryPanel` da mascot, XP nishoni va uchta statistika
  kartasi bor

Shuning uchun bu sikl **noldan qurish emas, ikkita bo'shliqni yopish**:

1. `secondary` tugmada chuqurlik yo'q — bir ekranda ikki xil tugma
   fizikasi ko'rinadi
2. Yakun ekrani statik — GSAP aynan shu yerda kerak edi

## 1. Tugma chuqurligi

`secondary` variantga pastki chegara qo'shiladi (`border-b-4`), bosilganda
u ham cho'kadi. `ghost` **ataylab tekis qoladi**: u matn tugmasi, unga
soya berish ierarxiyani buzardi.

Barcha tugmalarga `tracking-wide` — Duolingo tipografiyasining bir qismi.
Bosh harfga o'tkazish (`uppercase`) **qilinmaydi**: o'zbekcha matnlar
uzun, bosh harflar qatorni kengaytirib, tugmaga sig'masdi.

## 2. Seans yakuni tantanasi

GSAP timeline (`prefers-reduced-motion` da umuman ishlamaydi):

| Bosqich | Harakat | Vaqt |
| ------- | ------- | ---- |
| 1 | Mascot yuqoridan sakrab tushadi (`back.out`) | 0.5 s |
| 2 | Konfetti otiladi — 24 zarra, tasodifiy yo'nalish | 0.9 s |
| 3 | XP raqami 0 dan yakuniy qiymatga sanaladi | 0.8 s |
| 4 | Statistika kartalari ketma-ket ko'tariladi | 0.3 s |

**Konfetti yangi bog'liqliksiz:** 24 ta kichik `div`, GSAP ularni tasodifiy
burchak ostida uchiradi va tushiradi. Zarralar `aria-hidden` — ekran
o'quvchi uchun ma'nosi yo'q.

### Animatsiya bezak qoidasi bu yerda ham

XP raqami JSX'da **yakuniy qiymati bilan** chiziladi; GSAP uni 0 dan
sanab chiqadi. Animatsiya ishlamasa foydalanuvchi to'g'ri sonni ko'radi —
0 ni emas.

Bu qoida `LearningPath` da bir marta xato ushlagan edi
(`opacity: 0` dan boshlangan kirish animatsiyasi), shuning uchun bu yerda
ham test bilan qo'riqlanadi.

## 3. Testlar

- `buttonStyles.test.ts` — `secondary` chuqurlik sinfini oladi, `ghost`
  olmaydi
- `SessionSummaryPanel.test.tsx` — XP va statistika **animatsiyasiz ham**
  to'g'ri chiqadi; konfetti `aria-hidden`

## 4. Qamrovdan tashqarida

- Tovushli tantana (mavjud `playCorrectSound` yetarli)
- Nishon ochilishida alohida animatsiya
- Konfetti rangini brend palitrasidan tashqariga chiqarish

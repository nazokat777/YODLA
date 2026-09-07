# O'zlashtirish halqasi (mastery loop)

**Maqsad:** dars so'zlar HAQIQATAN o'zlashtirilguncha davom etsin, so'ng
oldingi mavzular aralashtirilib qaytarilsin — eng zaif xotirali bola ham
darsni o'zlashtira olsin, lekin hech qachon cheksiz halqada qolmasin.

Bu — uch bosqichli ishning BIRINCHISI:

| # | Tizim | Holat |
| --- | --- | --- |
| 1 | O'zlashtirish halqasi | shu hujjat |
| 2 | Zaif nuqtalarni aniqlash (so'z + ko'nikma kesimida) | keyingi spec |
| 3 | O'yinlar va dofamin qatlami | keyingi spec |

---

## 1. Muammo

Hozir dars — QAT'IY 12 qadam. Bola so'zni bilmasa ham dars tugaydi;
bilsa ham 12 qadamni o'tirib chiqadi. Ikkalasi ham noto'g'ri:

- **Zaif o'quvchi** so'zni o'zlashtirmay keyingi darsga o'tadi va qarz
  to'planib boradi.
- **Kuchli o'quvchi** allaqachon bilgan so'zini uch marta takrorlaydi.

Ikkinchi muammo: dars tugagach, oldingi mavzular faqat SM-2 jadvali
bo'yicha, kunlar o'tib qaytadi. Yangi bilim eski bilim bilan
BOG'LANMAYDI.

## 2. Model

### 2.1 So'z holati (seans ichida)

```ts
interface WordProgress {
  cardId: string
  /** Ketma-ket to'g'ri javoblar */
  streak: number
  /** Oxirgi TO'G'RI javob qaysi turdagi mashqda bo'lgan */
  lastCorrectType: ExerciseType | null
  /** Shu seansda o'zlashtirilgan (qaytmas holat) */
  mastered: boolean
  /** Shu seansda nechta savol berilgan — cheksiz halqadan himoya */
  asked: number
}
```

### 2.2 O'zlashtirish qoidasi

So'z **o'zlashtirilgan** deb belgilanadi, agar:

1. `streak >= 2`, VA
2. oxirgi ikki to'g'ri javob TURLI mashq turlarida bo'lgan.

**Nega ikki xil tur:** to'rt variantli mashqda ko'r-ko'rona bosish 25%
ehtimol bilan to'g'ri chiqadi. Ikki xil turda ketma-ket to'g'ri
javob berish ehtimoli esa deyarli nol — ya'ni bu haqiqiy bilimning
dalili, tasodifning emas.

**Javob turlari:**

| Javob | Ta'sir |
| --- | --- |
| `correct` | `streak += 1`, tur yozib qo'yiladi |
| `almost` | `correct` kabi — imlo xatosi bilishni bekor qilmaydi |
| `wrong` | `streak = 0`, `lastCorrectType = null` |

`mastered` — QAYTMAS: bir marta o'zlashtirilgan so'z shu seansda qayta
"yo'qolmaydi". Bu ko'rsatkich orqaga ketmasligi uchun (progress
regressiyasi motivatsiyani buzadi).

### 2.3 Keyingi so'zni tanlash

Har javobdan keyin navbatdagi so'z DINAMIK tanlanadi:

1. `mastered` bo'lmagan so'zlar orasidan,
2. eng kichik `streak` li,
3. tenglikda — eng kam `asked` li,
4. **oxirgi ko'rsatilgan so'z chetlab o'tiladi** (agar boshqa nomzod
   bo'lsa): ketma-ket ikki marta bir so'z — javob ekranda turgan
   paytdagi nusxa ko'chirish, eslab chaqirish emas.

### 2.4 Mashq turini tanlash

`streak === 1` bo'lganda mashq turi `lastCorrectType` dan BOSHQA
bo'lishi SHART (2.2 qoidasi shuni talab qiladi).

`generateExercise` ga yangi ixtiyoriy parametr: `excludeTypes`.
Chetlab o'tish natijasida hech qanday tur qolmasa (masalan kartada
jumla yo'q va audio ishlamaydi), qoida yumshatiladi — mashq baribir
beriladi, aks holda so'z o'zlashtirilmay qolib ketardi.

### 2.5 Cheksiz halqadan himoya

**`MAX_SESSION_STEPS = 60`.**

Chegaraga yetilganda seans TUGAYDI, so'zlar o'zlashtirilmagan bo'lsa
ham. Yakun paneli halol yozadi:

> 5 ta so'z o'zlashtirildi · 2 tasi keyingi darsga qoldi

**Nega shart:** "100% gacha" qoidasi qattiq qo'llansa, qiynalayotgan
bola darsdan chiqolmaydi. Bu ilovaning butun maqsadiga — bolani
o'rganishga qaytarishga — zid. Qolgan so'zlar ertaga birinchi navbatda
qaytadi (ular `totalReviews` bo'yicha baribir birinchi o'rinda).

## 3. Ikki bosqich

### 3.1 Bosqich 1 — Yangi dars

Bo'limning O'Z so'zlari, hammasi o'zlashtirilguncha.

### 3.2 Bosqich 2 — Aralash takror

Bosqich 1 tugagach (yoki chegaraga yetgach) boshlanadi.

**Tanlov:** oldingi BARCHA bo'limlardan `MIXED_REVIEW_SIZE = 12` so'z,
zaiflik og'irligi bo'yicha saralanadi:

```
weakness(card, now) =
    card.lapses * 3
  + (DEFAULT_EASE_FACTOR - card.easeFactor) * 2
  + kunlar(now - lastReviewedAt) / 7
```

Yuqoridan 12 tasi olinadi. Ular ham o'zlashtirilguncha davom etadi
(o'sha 2.2 qoidasi), o'sha 60 qadam chegarasi ichida.

**Nega aralash:** interleaving — bloklab o'rganishdan (bir mavzuni
ketma-ket) uzoq muddatli xotira uchun kuchliroq ekani ko'p marta
o'lchangan. Aralashuv miyani "qaysi qoida kerak?" degan savolni har
safar qayta yechishga majbur qiladi.

**Oldingi so'z yo'q bo'lsa** (1-dars) bosqich 2 O'TKAZIB YUBORILADI.

## 4. Ko'rsatkich

`0/12 savol` → **`3/7 so'z o'zlashtirildi`**

Bola savollarni emas, SO'ZLARNI o'rganadi — ko'rsatkich shu modelga
mos bo'lishi kerak. Va u hech qachon orqaga ketmaydi (2.2).

Bosqich 2 da sarlavha o'zgaradi: `Aralash takror · 4/12 so'z`.

## 5. Fayllar

| Fayl | Mas'uliyat |
| --- | --- |
| `src/core/mastery/progress.ts` | `WordProgress`, `applyAnswer`, `isMastered` |
| `src/core/mastery/select.ts` | `pickNextCard`, `excludedTypesFor` |
| `src/core/mastery/weakness.ts` | `weakness`, `pickWeakest` |
| `src/core/mastery/index.ts` | qayta eksport |
| `src/core/exercises/generate.ts` | `excludeTypes` parametri |
| `src/features/session/SessionRunner.tsx` | dinamik navbat, ikki bosqich |
| `src/features/lesson/LessonScreen.tsx` | bosqich 2 uchun kartalar manbai |

`core/` — React'siz va sof: butun qoida shu yerda test qilinadi.

## 6. O'zgarmaydigan narsalar

- **SM-2 jadvali** — har karta uchun BIRINCHI javob baholanadi
  (`gradedRef` allaqachon shunday ishlaydi). Qayta urinishlar jadvalga
  ta'sir qilmaydi, aks holda o'lchov buzilardi.
- **Takrorlash (review) seansi** — o'zgarmaydi. U SM-2 tekshiruvi;
  bu yerdagi maqsad boshqa.
- XP, kombo, streak, nishonlar, so'z tanishtirish, yordam tugmasi.

## 7. Qamrov tashqarisida

- Ko'nikma (mashq turi) kesimida statistika — 2-spec.
- Yangi o'yin turlari va mukofot dizayni — 3-spec.
- Bosqich 2 uchun alohida ekran — hozircha bir seansning davomi.

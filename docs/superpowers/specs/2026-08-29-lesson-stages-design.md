# Dars bosqichlari — dizayn

**Muammo:** birinchi darsdagi barcha savollar bir xil. Qiyinlik zinapoyasi
mashq turini `repetitions` ga qarab tanlaydi, yangi so'zning `repetitions`
i esa 0 — ya'ni faqat "tanib olish" ochiq. Ilovada 7 xil mashq bor, lekin
yangi foydalanuvchi ulardan bittasini ko'radi. Bu "zerikarli" hissining
asosiy sababi.

**Yechim:** bir so'z bitta darsda bir necha marta, har safar qiyinroq
turda uchraydi (Duolingo modeli). So'z darsning O'ZIDA mustahkamlanadi.

## O'lchangan holat

| | hozir |
| --- | --- |
| Dars hajmi | 5 karta → 5 savol |
| Yangi so'z uchun mashq turlari | 1 (`recognition`) |
| Mavjud mashq turlari | 7 |
| Xato javobda takror | bor (karta navbat oxiriga qo'shiladi) |

## Maqsad

4 ta yangi so'z × 3 bosqich = 12 savol. ~5 daqiqa — til tanlash
ekranidagi va'daga mos.

```
1-bosqich   tanib olish
2-bosqich   eshitish / juftlash
3-bosqich   yozish / gap ichida / harf yig'ish
```

## Arxitektura

### 1. Navbat elementi — karta emas, QADAM

`SessionRunner` hozir `CardRecord[]` navbatini yuritadi. U
`LessonStep[]` ga almashadi:

```ts
interface LessonStep {
  card: CardRecord
  /** Shu so'z seans ichida nechanchi marta chiqyapti (0 dan) */
  stage: number
}
```

Yangi sof modul `src/core/lesson/queue.ts`:

```ts
export function buildLessonQueue(
  cards: readonly CardRecord[],
  stagesFor: (card: CardRecord) => number,
): LessonStep[]
```

**Tartib — bosqich bo'yicha aylanma.** Avval hamma so'zning 1-bosqichi,
keyin hamma so'zning 2-bosqichi, so'ng 3-bosqichi. Shunda bir so'zning
takrorlari orasida boshqa so'zlar turadi — ketma-ket uch marta bir xil
so'z so'ralsa, bu mashq emas, nusxa ko'chirish bo'lardi.

```
A₀ B₀ C₀ D₀ | A₁ B₁ C₁ D₁ | A₂ B₂ C₂ D₂
```

**Nechta bosqich:** `stagesFor` chaqiruvchi tomonidan beriladi.

| ekran | qoida |
| --- | --- |
| Dars | `totalReviews === 0` → 3 bosqich; aks holda 1 |
| Takrorlash | doim 1 |

Takrorlash seansida maqsad o'rgatish emas, **tekshirish** — u yerda
takror mashq SM-2 o'lchovini buzardi.

### 2. Zinapoyaga `stage` qo'shiladi

`pickExerciseType` va `generateExercise` yangi ixtiyoriy `stage`
parametrini oladi (sukut 0):

```ts
const effectiveRepetitions = card.repetitions + stage
```

Zinapoyaning o'zi va uning chegaralari O'ZGARMAYDI.

**Nega kartaning `repetitions` ini soxtalashtirmaymiz:** `exercise.card`
ekranlarga uzatiladi; o'sha obyektga yolg'on son yozish keyinchalik
boshqa joyda sezilmay chiqadigan xato manbai bo'lardi.

### 3. Baholash — faqat BIRINCHI javob

`SessionRunner` seans davomida baholangan karta id larini eslab qoladi.
So'z ikkinchi va uchinchi marta chiqqanda:

- `gradeCard` **chaqirilmaydi** — SM-2 jadvali tegilmaydi;
- javob to'g'ri/xato deb baholanadi, XP beriladi, aniqlikka kiradi;
- `FeedbackBar` da keyingi takrorlash muddati **ko'rsatilmaydi** (u
  o'zgarmagan).

**Nega:** har javob jadvalni yangilasa, bitta darsdan keyin interval
1 → 6 → 15 kunga sakrardi. Holbuki foydalanuvchi so'zni ikki daqiqa
ichida uch marta ko'rgan — bu uzoq muddatli xotira dalili emas. SM-2
kunlar oralig'iga mo'ljallangan, daqiqalarga emas.

**Juft topish (`matching`) ham shu qoidaga bo'ysunadi.** U bitta mashqda
bir nechta kartani baholaydi (`handleMatchingComplete`), ya'ni seansda
allaqachon baholangan so'zni ikkinchi marta baholab yuborishi mumkin.
Har bir `cardId` uchun ham o'sha "birinchi javob" tekshiruvi qo'llanadi:
baholanmagani jadvalga yoziladi, qolganlari faqat XP va aniqlikka
kiradi.

### 4. Navbat uzunligi chegarasi

Xato javob qadamni navbat oxiriga qayta qo'shadi (mavjud xatti-harakat,
o'zgarmaydi). Bosqichlar bilan birga bu 12 tadan ancha oshib ketishi
mumkin.

`MAX_LESSON_STEPS = 20`. Chegaraga yetilganda xato javob qadamni
qo'shmaydi — so'z keyingi darsda baribir qaytadi. Dars jazoga
aylanmasligi kerak.

Xato javobda qadam **o'sha bosqichda** qaytadi, keyingisiga o'tmaydi:
foydalanuvchi bu bosqichni hali o'tmadi.

## Fayllar

| fayl | vazifa |
| --- | --- |
| `src/core/lesson/queue.ts` (yangi) | `LessonStep`, `buildLessonQueue` — sof, React'siz |
| `src/core/exercises/generate.ts` | `stage` parametri |
| `src/features/session/SessionRunner.tsx` | navbat `LessonStep[]`, baholash bir marta |
| `src/features/lesson/LessonScreen.tsx` | `LESSON_SIZE` 5 → 4, `stagesFor` |
| `src/features/review/ReviewScreen.tsx` | `stagesFor` → doim 1 |

## Testlar

**`queue.test.ts`** — sof, tez:
- 4 karta × 3 bosqich → 12 qadam
- tartib aylanma: bir so'zning ikki qadami yonma-yon TURMAYDI
- `totalReviews > 0` karta 1 qadam oladi
- bo'sh ro'yxat → bo'sh navbat

**`generate.test.ts`** — `stage` zinapoyani ko'taradi:
- `repetitions 0, stage 0` → `recognition`
- `repetitions 0, stage 2` → `recognition` EMAS

**`SessionRunner.test.tsx`** — integratsiya:
- bir so'z uch marta chiqadi
- `gradeCard` bir marta chaqiriladi (bazada `totalReviews` 1 ga oshadi, 3 ga emas)
- takror javob ham XP beradi

## Nima o'zgarmaydi

SM-2 formulasi, XP hisobi, kunlik maqsad, o'quv yo'li, xato javobda
takrorlash mexanizmi, mashq turlarining o'zi.

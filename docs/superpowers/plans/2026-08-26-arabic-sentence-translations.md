# Arabcha jumla tarjimalari — implementatsiya rejasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Arabcha kartalarga "jumla qurish" mashqini ochish — darslikning o'z o'zbekcha tarjimasidan.

**Architecture:** `scripts/import-vocab.mjs` ichida dars matni va uning tarjimasi bir xil qoida bilan jumlalarga bo'linadi; sonlar teng bo'lgan darslarda juftlar indeks bo'yicha biriktiriladi. So'zga jumla tanlanganda tarjimasi ham birga olinadi.

**Spec:** `docs/superpowers/specs/2026-08-26-arabic-sentence-translations-design.md`

## Global Constraints

- **Mos kelmagan darsdan tarjima OLINMAYDI.** Jumlaning o'zi qoladi.
- Yangi npm paketi yo'q.
- `npm test | grep` ISHLATMANG: `npm test -- --run > /dev/null 2>&1; echo "TEST_EXIT=$?"`
- Yakunda `npm run build` ham ishlatiladi (`tsc --noEmit` yetarli emas).
- Izohlar o'zbek tilida, NEGA shundayligini tushuntiradi.

## O'lchangan qiymatlar

- Tarjimasi bor darslar: **52** (169 dan)
- Jumlalar soni mos keladiganlari: **39**
- Hosil bo'ladigan juftlar: **944**
- Bo'luvchi (ikkala tomon uchun bir xil): `/[.؟?!\n]+/`

---

### Task 1: Juftlash mantig'i

**Files:**
- Modify: `scripts/import-vocab.mjs`

**Interfaces:**
- Produces: `lessonPairs(lesson) → Array<{ sentence, translation: string | null }>`,
  `pickSentence(word, pairs) → { sentence, translation } | null`

- [ ] **Step 1: `sentenceForWord` o'rniga juft qaytaradigan funksiyalar**

Mavjud `sentenceForWord(word, reading)` ni quyidagilar bilan almashtiring:

```js
/** Ikkala tomon uchun BIR XIL bo'luvchi — aks holda sonlar noto'g'ri taqqoslanardi */
const SENTENCE_SPLIT = /[.؟?!\n]+/

function splitSentences(text) {
  return String(text ?? '')
    .split(SENTENCE_SPLIT)
    .map((part) => part.trim())
    .filter(Boolean)
}

/**
 * Juft ishonchlimi.
 *
 * "Mos" deb topilgan darsda ham bo'linish adashishi mumkin, shuning uchun
 * har juft alohida tekshiriladi. Noto'g'ri juftlangan tarjima
 * foydalanuvchiga NOTO'G'RI MA'NO o'rgatadi — bu tarjimasiz qolishdan
 * ancha yomon.
 */
function pairIsSafe(arabic, uzbek) {
  if (!uzbek) return false
  // O'zbekcha tomonda arab harfi — bo'linish siljib ketgani belgisi
  if (/[؀-ۿ]/.test(uzbek)) return false

  const ratio = uzbek.length / arabic.length
  return ratio >= 0.3 && ratio <= 4
}

/**
 * Dars uchun arabcha↔o'zbekcha jumla juftlari.
 *
 * Jumlalar soni teng bo'lmasa TARJIMA UMUMAN OLINMAYDI: 169 darsdan 13
 * tasida sonlar farq qiladi (24/15, 15/20) va ularni indeks bo'yicha
 * juftlash ma'nolarni aralashtirib yuborardi.
 */
function lessonPairs(lesson) {
  const arabic = splitSentences(lesson.reading)
  const uzbek = splitSentences(lesson.translation)

  const aligned = uzbek.length > 0 && arabic.length === uzbek.length

  return arabic.map((sentence, index) => ({
    sentence,
    translation:
      aligned && pairIsSafe(sentence, uzbek[index]) ? uzbek[index] : null,
  }))
}

/**
 * So'z qatnashgan eng qisqa jumlani (va bo'lsa tarjimasini) tanlaydi.
 *
 * Chegara `\b` bilan emas, Unicode sinflari bilan qaraladi: `\b` faqat
 * ASCII harflarga tayanadi va arab yozuvida hech qachon mos kelmaydi.
 * `\p{M}` — harakatlar, ular so'zning davomi.
 */
function pickSentence(word, pairs) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const boundary = new RegExp(`(?<![\\p{L}\\p{M}])${escaped}(?![\\p{L}\\p{M}])`, 'u')

  const candidates = pairs.filter((pair) => {
    if (!boundary.test(pair.sentence)) return false

    const words = pair.sentence.split(/\s+/)
    // Juda qisqa jumlada bo'sh joydan keyin kontekst qolmaydi; juda
    // uzunini telefon ekranida o'qish qiyin
    if (words.length < 2 || words.length > 9) return false

    // Transliteratsiya jadvaliga sig'masa, o'qilishida notanish belgi qolardi
    return arabicIsClean(pair.sentence)
  })

  if (candidates.length === 0) return null

  // Tarjimasi BORI afzal — u "jumla qurish" mashqini ochadi; teng bo'lsa
  // qisqarog'i, chunki bo'sh joy va konteksti bir qarashda ko'rinadi
  candidates.sort((a, b) => {
    if (Boolean(b.translation) !== Boolean(a.translation)) {
      return b.translation ? 1 : -1
    }
    return a.sentence.length - b.sentence.length
  })

  return candidates[0]
}
```

- [ ] **Step 2: Chaqiruv joyini yangilash**

`importArabic()` ichidagi tsiklda, `for (const v of lesson.vocab ?? [])` dan OLDIN:

```js
    const pairs = lessonPairs(lesson)
```

va `buckets[level].push(...)` qatorini almashtiring:

```js
      // Dars matnida shu so'z qatnashgan jumla bo'lsa — "gap ichida" mashqi;
      // tarjimasi ham bo'lsa — "jumla qurish" ham ochiladi
      const picked = pickSentence(word, pairs)
      buckets[level].push({
        word,
        uz,
        topic,
        sentence: picked?.sentence,
        sentenceTranslation: picked?.translation ?? undefined,
      })
```

- [ ] **Step 3: TS chiqarishga tarjimani qo'shish**

`toTs()` ichida `sentence` qatoridan keyin:

```js
        (w.sentenceTranslation
          ? `      sentenceTranslation: ${esc(w.sentenceTranslation)},\n`
          : '') +
```

- [ ] **Step 4: Importni ishga tushirish va natijani o'lchash**

```bash
node scripts/import-vocab.mjs
```

Keyin sanang:

```bash
grep -c "sentenceTranslation:" src/content/decks/imported-ar.ts
```

Kutilgan: 200 dan ko'p (aniq son o'lchanadi va hisobotda aytiladi).

- [ ] **Step 5: Commit**

```bash
git add scripts/import-vocab.mjs src/content/decks/imported-ar.ts
git commit -m "feat: arabcha jumlalarga darslik tarjimasi biriktirildi"
```

---

### Task 2: Testlar va tekshiruv

**Files:**
- Modify: `src/content/deckIntegrity.test.ts`

- [ ] **Step 1: Juft sifati uchun test yozish**

`deckIntegrity.test.ts` ga qo'shing:

```ts
  it('jumla tarjimasi ishonchli ko‘rinadi', async () => {
    const cards = await allCards(language)
    const pairs = cards.filter((card) => card.sentence && card.sentenceTranslation)

    // Tarjimada arab yoki kirill harfi — juftlash siljib ketgani belgisi
    const foreign = pairs.filter(
      (card) =>
        ARABIC.test(card.sentenceTranslation!) ||
        CYRILLIC.test(card.sentenceTranslation!),
    )
    expect(foreign.map((card) => card.word)).toEqual([])

    // Uzunliklar nisbati aqlli chegarada: 10 barobar farq juftlash
    // xatosidan boshqa narsa emas
    const skewed = pairs.filter((card) => {
      const ratio = card.sentenceTranslation!.length / card.sentence!.length
      return ratio < 0.2 || ratio > 5
    })
    expect(skewed.map((card) => `${card.sentence} → ${card.sentenceTranslation}`)).toEqual([])
  })
```

- [ ] **Step 2: Testlarni ishga tushirish**

```bash
npx vitest run src/content
```
Expected: hammasi PASS.

- [ ] **Step 3: Juftlarni QO'LDA o'qib tekshirish**

Tasodifiy 10 juftni chiqaring va ma'nosi mos kelishini o'zingiz o'qib solishtiring:

```bash
node -e "
const fs=require('fs');
const src=fs.readFileSync('src/content/decks/imported-ar.ts','utf8');
const re=/sentence: (?:'([^']*)'|\"([^\"]*)\"),\n\s*sentenceTranslation: (?:'([^']*)'|\"([^\"]*)\")/g;
const all=[...src.matchAll(re)].map(m=>[(m[1]??m[2]),(m[3]??m[4])]);
console.log('juftlar:', all.length);
for(let i=0;i<all.length;i+=Math.floor(all.length/10)) console.log(all[i][0],' => ',all[i][1]);
"
```

Bironta juft mos kelmasa — TO'XTANG va sababni toping.

- [ ] **Step 4: Yakuniy tekshiruv**

```bash
npm run lint
npx tsc --noEmit && echo "tsc ok"
npm test -- --run > /dev/null 2>&1; echo "TEST_EXIT=$?"
npm run build > /dev/null 2>&1; echo "BUILD_EXIT=$?"
```

- [ ] **Step 5: Brauzerda tirik tekshiruv**

Arab tilini tanlab, `repetitions >= 4` bo'lgan kartada "jumla qurish"
mashqi chiqishini va jumlani yig'ish ishlashini tasdiqlang.

- [ ] **Step 6: Commit va push**

```bash
git add -A
git commit -m "test: arabcha jumla juftlari sifati tekshiriladi"
git push
```

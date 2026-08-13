/**
 * Tashqi manbalardan lug'at import qiladi (bir martalik, qo'lda yugurtiriladi):
 *   - Arab:   D:/LEARN ARABIC EASILY  (Mabdaul qiroat / Madina, 169 dars)
 *   - Ingliz: D:/Enterprise           (Enterprise 1, ~2300 so'z)
 *
 * Natija: src/content/decks/imported-{ar,en}.ts (repoga commit qilinadi).
 *
 * QOIDALAR (decks.test.ts bilan bir xil):
 *   - qo'lda yozilgan 132 so'z QOLADI; ular bilan to'qnashuvchi (so'z yoki
 *     tarjima) importlar TASHLANADI
 *   - tarjima noyob bo'lishi shart (chalg'ituvchi variantlar uchun)
 *   - so'z NORMALLASHTIRILGANDAN keyin ham noyob bo'lishi shart
 *   - arab so'zi transliteratsiya jadvaliga to'liq sig'ishi shart, aks holda
 *     o'qilishida notanish belgi qolardi
 *   - shovqin (bo'sh tarjima, en=uz) tashlanadi
 *
 * Import qilingan so'zlarda JUMLA yo'q — "jumla qurish" mashqi ular uchun
 * berilmaydi (generator bir pog'ona pastga tushadi).
 *
 * Ishga tushirish:  node scripts/import-vocab.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'

const AR_SRC = 'D:/LEARN ARABIC EASILY/app/assets/content/qiroat_lessons.json'
const EN_SRC = 'D:/Enterprise/enterprise-trainer/data/parsed/structured.json'

/* ------------------------- normalize (arab) ------------------------- */
// normalize.ts bilan bir xil bo'lishi shart
const APOS = /['’‘ʻʼ`´′]/g
const AR_MARKS = /[\u064B-\u0670\u065F\u0640]/g
const AR_ALEF = /[آأإٱ]/g

function normalizeCommon(t) {
  return t.toLowerCase().replace(APOS, "'").replace(/\s+/g, ' ').trim()
}
function normalizeArabic(t) {
  return normalizeCommon(t)
    .replace(AR_MARKS, '')
    .replace(AR_ALEF, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
}

/* ------- arab transliteratsiya jadvalidagi belgilar (to'liqlik) ------- */
const AR_KNOWN = new Set(
  [...'اأإآبتثجحخدذرزسشصضطظعغفقكلمنهويىةءئؤ', ' ',
   '\u064B','\u064C','\u064D','\u064E','\u064F','\u0650','\u0651','\u0652','\u0653','\u0654','\u0655','\u0670','\u0640'],
)
const arabicIsClean = (w) => [...w].every((ch) => AR_KNOWN.has(ch))

/* ------------------- mavjud deck'dan olingan qiymatlar ------------------- */
function taken(file, normalizer) {
  const src = readFileSync(`src/content/decks/${file}`, 'utf8')
  const words = new Set()
  const translations = new Set()
  const norms = new Set()
  const re = /(word|translation): (?:'([^']*)'|"([^"]*)")/g
  let m
  while ((m = re.exec(src))) {
    const value = m[2] ?? m[3]
    if (m[1] === 'translation') translations.add(value.toLowerCase())
    else {
      words.add(value)
      // Normallashtirilgan shakl ham band: import qo'lda yozilgan so'z bilan
      // NORMALLASHTIRILGANDAN keyin ustma-ust tushmasligi kerak
      norms.add(normalizer(value))
    }
  }
  return { words, translations, norms }
}

/* -------------------- arab jumlasi (cloze uchun) -------------------- */

/**
 * Dars matnidan so'z QATNASHGAN jumlani ajratib oladi.
 *
 * Manba raqamli va toza (OCR emas), jumlalar esa darslik uslubida qisqa:
 * "هَذَا كِتَابٌ." Shu sababli ular "gap ichida" mashqi uchun juda mos.
 *
 * Chegara `\b` bilan emas, Unicode sinflari bilan qaraladi: `\b` faqat
 * ASCII harflarga tayanadi va arab yozuvida hech qachon mos kelmaydi.
 * `\p{M}` — harakatlar, ular so'zning davomi.
 */
function sentenceForWord(word, reading) {
  if (!reading) return null

  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const boundary = new RegExp(`(?<![\\p{L}\\p{M}])${escaped}(?![\\p{L}\\p{M}])`, 'u')

  const candidates = reading
    .split(/[.؟!\n]+/)
    .map((part) => part.trim())
    .filter((part) => {
      if (!boundary.test(part)) return false

      const words = part.split(/\s+/)
      // Juda qisqa jumlada bo'sh joydan keyin kontekst qolmaydi; juda
      // uzunini telefon ekranida o'qish qiyin
      if (words.length < 2 || words.length > 9) return false

      // Transliteratsiya jadvaliga sig'masa, o'qilishida notanish belgi qolardi
      return arabicIsClean(part)
    })

  if (candidates.length === 0) return null

  // Eng qisqasi — bo'sh joy va uning konteksti bir qarashda ko'rinadi
  candidates.sort((a, b) => a.length - b.length)
  return candidates[0]
}

/* ------------------------------ TS yozish ------------------------------ */
function esc(s) {
  return s.includes("'") ? `"${s}"` : `'${s}'`
}
function toTs(constName, lang, buckets) {
  const levels = ['A1', 'A2', 'B1']
  let body = ''
  for (const level of levels) {
    body += `  ${level}: [\n`
    for (const w of buckets[level]) {
      body +=
        '    {\n' +
        `      word: ${esc(w.word)},\n` +
        `      translation: ${esc(w.uz)},\n` +
        `      language: '${lang}',\n` +
        `      topic: ${esc(w.topic)},\n` +
        `      level: '${level}',\n` +
        // Jumla bo'lsa "gap ichida" mashqi ishlaydi. Tarjimasi yo'q —
        // "jumla qurish" uchun u shart, shuning uchun bu tur berilmaydi.
        (w.sentence ? `      sentence: ${esc(w.sentence)},\n` : '') +
        '    },\n'
    }
    body += '  ],\n'
  }
  return (
    "import type { NewCardRecordInput } from '@/core/db'\n" +
    "import type { LevelCode } from '@/core/types'\n\n" +
    '/**\n' +
    ` * AVTOMATIK YARATILGAN — qo'lda tahrirlamang.\n` +
    " * Manba: scripts/import-vocab.mjs. Import qilingan lug'at (jumlasiz).\n" +
    ' */\n' +
    `export const ${constName}: Record<LevelCode, NewCardRecordInput[]> = {\n` +
    body +
    '}\n'
  )
}

/* ------------------------------- Arab -------------------------------- */
function importArabic() {
  const t = taken('ar.ts', normalizeArabic)
  const data = JSON.parse(readFileSync(AR_SRC, 'utf8'))
  const buckets = { A1: [], A2: [], B1: [] }
  const seenWord = new Set()
  const seenNorm = new Set()
  const seenTr = new Set()
  let dropped = 0

  /*
   * Manbada UCHTA kitob birlashtirilgan va har birida dars raqami 1 dan
   * qayta boshlanadi (109 ta takroriy `num`). Kitob chegarasi — raqam
   * kamayib ketgan joy.
   *
   * Bu ikki narsa uchun muhim:
   *  1. DARAJA — Madina 1/2/3 aynan pedagogik ketma-ketlik: A1/A2/B1.
   *     `num` ni to'g'ridan-to'g'ri chegara sifatida ishlatish xato edi:
   *     2-kitobning 1-60 darslari ham "num <= 52" ga tushib, deyarli
   *     hamma so'z A1'da to'planib qolgan edi (2056 / 202 / 35).
   *  2. MAVZU nomi — `Qiroat 5-dars` uch xil darsga to'g'ri kelardi va
   *     o'quv yo'lida ular bitta bo'limga qo'shilib ketardi.
   */
  const lessons = data.lessons
  const bookOf = []
  let book = 0
  lessons.forEach((lesson, index) => {
    if (index > 0 && lesson.num < lessons[index - 1].num) book += 1
    bookOf[index] = book
  })

  const LEVEL_BY_BOOK = ['A1', 'A2', 'B1']

  for (const [index, lesson] of lessons.entries()) {
    const bookNumber = bookOf[index] + 1
    const level = LEVEL_BY_BOOK[Math.min(bookOf[index], LEVEL_BY_BOOK.length - 1)]
    const topic = `Qiroat ${bookNumber}-kitob ${lesson.num}-dars`

    for (const v of lesson.vocab ?? []) {
      const word = (v.ar ?? '').trim()
      const uz = (v.uz ?? '').trim()
      if (!word || !uz) { dropped++; continue }
      if (uz.toLowerCase() === word.toLowerCase()) { dropped++; continue }
      if (!arabicIsClean(word)) { dropped++; continue }

      const norm = normalizeArabic(word)
      const trKey = uz.toLowerCase()

      // Mavjud deck yoki avval import qilingan bilan to'qnashuv
      if (t.words.has(word) || seenWord.has(word)) { dropped++; continue }
      if (seenNorm.has(norm) || t.norms.has(norm)) { dropped++; continue }
      if (t.translations.has(trKey) || seenTr.has(trKey)) { dropped++; continue }

      seenWord.add(word)
      seenNorm.add(norm)
      seenTr.add(trKey)
      // Dars matnida shu so'z qatnashgan jumla bo'lsa — "gap ichida" mashqi
      buckets[level].push({ word, uz, topic, sentence: sentenceForWord(word, lesson.reading) })
    }
  }

  writeFileSync('src/content/decks/imported-ar.ts', toTs('AR_IMPORTED', 'ar', buckets))
  const total = buckets.A1.length + buckets.A2.length + buckets.B1.length
  const withSentence = Object.values(buckets)
    .flat()
    .filter((entry) => entry.sentence).length
  console.log(`arab: +${total} (A1 ${buckets.A1.length}, A2 ${buckets.A2.length}, B1 ${buckets.B1.length}) — tashlandi ${dropped}`)
  console.log(`  jumla biriktirildi: ${withSentence} (${Math.round((withSentence / total) * 100)}%)`)
}

/**
 * Darslikdagi SHAXS ISMLARI — lug'atga kirmasligi kerak.
 *
 * NEGA ALOHIDA RO'YXAT: manbada ularni ajratadigan belgi yo'q (`pos` maydoni
 * 2300 yozuvdan 2129 tasida bo'sh). Tarjimaning bosh harfliligi ham yaramaydi:
 * bir tomondan `nick → nik` kichik harf bilan yozilgan, ikkinchi tomondan
 * `england → Angliya` kabi FOYDALI so'zlar ham bosh harfli.
 *
 * NEGA MUHIM: ismlar darslik mashqlarida doim qatnashadi, shuning uchun
 * chastotasi juda yuqori (4.5–5.1) va chastota bo'yicha bo'linganda hammasi
 * A1'ga — boshlovchining ilk darslariga tushadi. Daraja testida 9 savoldan
 * biri "chris → Kris" bo'lib chiqqani shundan.
 *
 * Ro'yxat shu kitobga xos: yangi manba qo'shilsa qayta ko'rib chiqiladi.
 */
const PERSONAL_NAMES = new Set([
  'alice', 'ann', 'anna', 'betty', 'bob', 'charles', 'chris', 'david', 'diana',
  'emma', 'george', 'harry', 'helen', 'jack', 'james', 'jane', 'john', 'judy',
  'julie', 'kate', 'laura', 'linda', 'mary', 'michael', 'mike', 'nick', 'paul',
  'peter', 'robert', 'sam', 'sarah', 'steve', 'thomas', 'tom', 'william',
])

/* ------------------------------ Ingliz ------------------------------- */
function importEnglish() {
  const t = taken('en.ts', normalizeCommon)
  const vocab = JSON.parse(readFileSync(EN_SRC, 'utf8')).vocabulary

  const clean = []
  const seenWord = new Set()
  const seenTr = new Set()
  let dropped = 0

  for (const v of vocab) {
    const word = (v.en ?? '').trim().toLowerCase()
    const uz = (v.uz ?? '').trim()
    if (!word || !uz) { dropped++; continue }
    if (word === uz.toLowerCase()) { dropped++; continue }
    if (!/^[a-z][a-z' -]*$/.test(word)) { dropped++; continue }
    if (PERSONAL_NAMES.has(word)) { dropped++; continue }

    const trKey = uz.toLowerCase()
    if (t.words.has(word) || seenWord.has(word)) { dropped++; continue }
    if (t.translations.has(trKey) || seenTr.has(trKey)) { dropped++; continue }

    seenWord.add(word)
    seenTr.add(trKey)
    clean.push({ word, uz, freq: v.freq ?? 0 })
  }

  // Daraja CHASTOTA bo'yicha (Enterprise `freq` maydoni): ko'p ishlatiladigan
  // so'z pastroq darajada. Chastota tartibida taqsimlaymiz: 30% A1, 35% A2, 35% B1
  clean.sort((a, b) => b.freq - a.freq)
  const a1End = Math.floor(clean.length * 0.3)
  const a2End = Math.floor(clean.length * 0.65)
  const buckets = { A1: [], A2: [], B1: [] }
  clean.forEach((w, i) => {
    const level = i < a1End ? 'A1' : i < a2End ? 'A2' : 'B1'
    const list = buckets[level]
    list.push({ word: w.word, uz: w.uz, topic: `Enterprise ${level}-${Math.floor(list.length / 20) + 1}` })
  })

  writeFileSync('src/content/decks/imported-en.ts', toTs('EN_IMPORTED', 'en', buckets))
  const total = clean.length
  console.log(`ingliz: +${total} (A1 ${buckets.A1.length}, A2 ${buckets.A2.length}, B1 ${buckets.B1.length}) — tashlandi ${dropped}`)
}

importArabic()
importEnglish()

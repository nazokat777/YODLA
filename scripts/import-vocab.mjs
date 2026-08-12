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

  for (const lesson of data.lessons) {
    // Kitob chegaralari: 1-52 → A1, 53-112 → A2, 113+ → B1
    const level = lesson.num <= 52 ? 'A1' : lesson.num <= 112 ? 'A2' : 'B1'
    const topic = `Qiroat ${lesson.num}-dars`

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
      buckets[level].push({ word, uz, topic })
    }
  }

  writeFileSync('src/content/decks/imported-ar.ts', toTs('AR_IMPORTED', 'ar', buckets))
  const total = buckets.A1.length + buckets.A2.length + buckets.B1.length
  console.log(`arab: +${total} (A1 ${buckets.A1.length}, A2 ${buckets.A2.length}, B1 ${buckets.B1.length}) — tashlandi ${dropped}`)
}

/* ------------------------------ Ingliz ------------------------------- */
function importEnglish() {
  const t = taken('en.ts', normalizeCommon)
  const vocab = JSON.parse(readFileSync(EN_SRC, 'utf8')).vocabulary
  const levelOf = (module) =>
    module.startsWith('Module 1') ? 'A1' : module.startsWith('Module 2') ? 'A2' : 'B1'

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

    const trKey = uz.toLowerCase()
    if (t.words.has(word) || seenWord.has(word)) { dropped++; continue }
    if (t.translations.has(trKey) || seenTr.has(trKey)) { dropped++; continue }

    seenWord.add(word)
    seenTr.add(trKey)
    clean.push({ word, uz, level: levelOf(v.module) })
  }

  // Har daraja ichida 20 tadan mavzuga bo'linadi (o'quv yo'li bo'limlari)
  const buckets = { A1: [], A2: [], B1: [] }
  for (const level of ['A1', 'A2', 'B1']) {
    const list = clean.filter((w) => w.level === level)
    list.forEach((w, i) => {
      buckets[level].push({ word: w.word, uz: w.uz, topic: `Enterprise ${level}-${Math.floor(i / 20) + 1}` })
    })
  }

  writeFileSync('src/content/decks/imported-en.ts', toTs('EN_IMPORTED', 'en', buckets))
  const total = clean.length
  console.log(`ingliz: +${total} (A1 ${buckets.A1.length}, A2 ${buckets.A2.length}, B1 ${buckets.B1.length}) — tashlandi ${dropped}`)
}

importArabic()
importEnglish()

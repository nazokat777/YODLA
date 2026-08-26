/**
 * Enterprise APP kontentidan ingliz lug'atini import qiladi.
 *
 * Manba: D:/Enterprise/enterprise-app/assets/content/enterprise1/unit_*.json
 *
 * NEGA ALOHIDA MANBA: avvalgi `enterprise-trainer/structured.json` skanerdan
 * OCR bilan olingan edi — tarjimalarida xato bor ("adverb → ergash gap"), misol
 * jumlalari esa buzuq ("kts cloudy amd windy"). Bu yangi kontent QO'LDA
 * yozilgan: har so'zning o'zbekcha ma'nosi va har jumlaning tarjimasi bor.
 * Shuning uchun to'qnashuvda SHU manba ustun turadi.
 *
 * Ikki xil ma'lumot olinadi:
 *   - `wordFormation[].items[]` → so'z juftlari (base/baseUz, derived/derivedUz)
 *   - `sentencePatterns[]`      → exampleEn + exampleUz (TARJIMALI jumla)
 *
 * Tarjimali jumla qimmatli: "gap ichida" mashqidan tashqari "jumla qurish"
 * mashqini ham ochadi (uning savoli aynan o'zbekcha jumla bo'ladi).
 *
 * Natija: src/content/decks/imported-en-app.ts (repoga commit qilinadi).
 * Ishga tushirish:  node scripts/import-enterprise-app.mjs
 *   (import-vocab.mjs dan OLDIN — u shu fayl egallagan so'zlarni chetlab o'tadi)
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'

const SRC = 'D:/Enterprise/enterprise-app/assets/content/enterprise1'

/* --------------------------- sifat filtrlari --------------------------- */

/** Faqat kichik harfli inglizcha so'z yoki qisqa ibora */
const CLEAN_WORD = /^[a-z][a-z' -]*$/

/**
 * Tarjima o'rniga TRANSKRIPSIYA yozilgan yozuvlar.
 *
 * Manbada ba'zi so'zlarga ma'no o'rniga talaffuz qo'yilgan:
 * `you'll → "/juːl/"`. Bunday karta hech nima o'rgatmaydi va eng yomoni —
 * u boshqa savollarda CHALG'ITUVCHI variant bo'lib chiqadi
 * ("abbey" savolining variantlari orasida "/juːl/" turardi).
 *
 * IPA belgilari lotin alifbosida uchramaydi, shuning uchun ular bo'yicha
 * aniqlash ishonchli.
 */
function isTranscription(text) {
  const trimmed = text.trim()

  return (
    (trimmed.startsWith('/') && trimmed.endsWith('/')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    /[ˈˌːɪəʊæʌɜɒθðʃʒŋ]/.test(trimmed)
  )
}

/**
 * Butunlay BOSH HARFDA yozilgan yozuvlar.
 *
 * Manbadagi grammatika jadvallarida ustun yorlig'i tarjima maydoniga
 * tushib qolgan: `wish to → "RASMIY"`, `want to → "ODDIY"`,
 * `skidded → "D IKKILANADI"`. O'zbekcha tarjima hech qachon butunlay
 * bosh harfda yozilmaydi, shuning uchun bu belgi ishonchli.
 */
function isAllCaps(text) {
  const letters = text.replace(/[^\p{L}]/gu, '')

  return letters.length >= 3 && letters === letters.toUpperCase()
}

/**
 * QO'LDA TEKSHIRILGAN axlat ro'yxati.
 *
 * Bularda `word` va `translation` maydonlari almashib ketgan yoki
 * grammatika jadvalining katagi lug'at bo'lib tushgan:
 *   `ism → "What's your name?"`, `savol gapda → "Are there any chairs?"`
 *
 * NEGA RO'YXAT, EVRISTIKA EMAS: "tarjima inglizchami" degan avtomatik
 * tekshiruv to'g'ri kartalarni ham o'chirardi — `kennel → "it uyi"` da
 * "it" o'zbekcha KUCHUK, lekin har qanday inglizcha naqshga mos keladi.
 * Ro'yxat 22 ta nomzod qo'lda o'qib chiqilgandan keyin tuzilgan.
 */
const JUNK_WORDS = new Set([
  // Maydonlari almashgan
  'ism',
  'yosh',
  'kasb',
  'xarakter',
  'oila soni',
  'juft narsa',
  'restoranda buyurtma',
  // Grammatika jadvali kataklari
  'tasdiq gapda',
  'inkor gapda',
  'savol gapda',
  'oddiy fe\'l',
  'yordamchi fe\'l',
  'kelasi zamon',
  'artiklsiz',
  'buyurtma',
  'orqa tomonida',
  'nimadir',
  'sutemizuvchilarda',
  'jumped',
  'egalik olmoshi',
  'qila olmaydi',
  'sotib ololmaydi',
])

/**
 * Tarjima o'rniga GRAMMATIKA IZOHI yozilgan yozuvlar.
 *
 * Manbada so'z yasalish qoidalari ham shu maydonda uchraydi:
 * `studied → "Y → I + ED"`, `buying → "o'zgarmaydi"`. Ular lug'at emas.
 */
function isGrammarNote(text) {
  const lower = text.toLowerCase()

  return (
    isTranscription(text) ||
    isAllCaps(text) ||
    // So'z YASALISH jadvali: `pencil sharpeners → "sharp + -en + -er"`,
    // `notebooks → "note + book"`. O'zbekcha tarjimada " + " uchramaydi.
    / \+ /.test(text) ||
    // Daraja jadvali: `cheaper → "the cheapest"`, `taller → "the tallest"`.
    // Tarjima o'rnida inglizcha shakl turibdi — karta hech nima o'rgatmaydi.
    /^the\s/i.test(lower) ||
    // Qarama-qarshilik izohi: `too tight → "aksi: loose"`. Bu ma'no emas,
    // boshqa so'zga havola — ustiga havola INGLIZCHA.
    /^(aksi|teskari)\s*:/.test(lower) ||
    text.includes('→') ||
    text.includes('->') ||
    text.startsWith('-') ||
    text.length < 2 ||
    lower.includes("o'zgarmaydi") ||
    lower.includes('undosh') ||
    lower.includes('unli ')
  )
}

/**
 * Karta boshidagi ARTIKL va infinitiv belgisini olib tashlaydi.
 *
 * Manbada so'zlar ko'pincha grammatik shakli bilan yozilgan: `a museum`,
 * `the beach`, `an aircraft`, `to sell` — 2182 yozuvdan 540 tasi shunday.
 * Karta sifatida bu noto'g'ri: o'quvchi "museum" so'zini bilishi kerak,
 * "a museum" ni emas. Tanib olish mashqida ham `a museum` varianti
 * boshqalardan ajralib turib, javobni oshkor qilardi.
 */
function stripLeadingParticle(word) {
  return word.replace(/^(?:an?|the|to) +/, '').trim()
}

/**
 * "Inglizcha" maydonga O'ZBEKCHA matn tushib qolganmi.
 *
 * Manbada grammatika qoidalari ham lug'at qatori sifatida yozilgan:
 * `harakat so'raladi → vaqt ketma-ketligi`, `ko'rinish → What does she
 * look like?`. Ular tarjima emas va kartaga yaramaydi.
 *
 * Oddiy `^[a-z...]$` tekshiruvi ularni ushlamaydi — o'zbekcha ham lotin
 * alifbosida. Ishonchli belgilar:
 *   - `g'` ingliz tilida umuman uchramaydi;
 *   - `o'` faqat `o'clock` va `who's` da uchraydi;
 *   - `-moq` — o'zbek fe'lining noaniq shakli.
 */
const APOSTROPHE_OK = /(o'clock|^who's)$/

function isUzbekLeak(word) {
  if (word.includes("g'")) return true
  if (word.includes("o'") && !APOSTROPHE_OK.test(word)) return true

  return /moq$/.test(word)
}

/** So'z lug'atga yaroqlimi */
function isUsableWord(word) {
  if (!CLEAN_WORD.test(word)) return false
  if (word.length < 2 || word.length > 24) return false

  // Uch va undan ko'p so'zli iboralar karta sifatida og'ir
  return word.split(/\s+/).length <= 2
}

/**
 * Jumla mashqqa yaroqlimi.
 * Ikki muqobilli ("A? / B?") jumlalar "jumla qurish"da chalkash bo'ladi.
 */
function isUsableSentence(en, uz) {
  if (!en || !uz || en.includes('/') || uz.includes('/')) return false

  const words = en.split(/\s+/)
  return words.length >= 3 && words.length <= 10
}

/* ------------------------- so'z chegarasi ------------------------- */

/** So'z jumlada ALOHIDA so'z sifatida turibdimi (generate.ts bilan bir xil) */
function appearsIn(sentence, word) {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?<![\\p{L}\\p{M}])${escaped}(?![\\p{L}\\p{M}])`, 'iu').test(sentence)
}

/* --------------------- mavjud deck'dan band qiymatlar --------------------- */

const APOS = /['’‘ʻʼ`´′]/g
const normalize = (t) => t.toLowerCase().replace(APOS, "'").replace(/\s+/g, ' ').trim()

function taken(file) {
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
      norms.add(normalize(value))
    }
  }

  return { words, translations, norms }
}

/* ------------------------------ o'qish ------------------------------ */

/**
 * Tartiblash kaliti.
 *
 * "Bir tarjima — bitta so'z" qoidasi tufayli TARTIB muhim: bir xil ma'noli
 * ikki so'zdan BIRINCHI kelgani qoladi, ikkinchisi tashlanadi.
 *
 * Kitobning kirish qismi (muqova, titul varaq, mundarija — `order` 1 dan
 * kichik) DARS EMAS, lekin u ro'yxat boshida turgani uchun o'zining
 * tasodifiy so'zlari bilan asosiy lug'atni siqib chiqarardi:
 * muqovadagi `illustrator → rassom` 1-darsdagi `artist → rassom` ni
 * yo'q qilgan edi. Shuning uchun kirish qismi ENG OXIRIGA suriladi —
 * so'zlari baribir qo'shiladi, faqat bahsda yutqazadi.
 */
function lessonRank(data) {
  const order = data.order ?? data.unit

  return order < 1 ? Number.MAX_SAFE_INTEGER + order : order
}

const files = readdirSync(SRC)
  .filter((name) => /^unit_\d+\.json$/.test(name))
  .map((name) => ({ name, data: JSON.parse(readFileSync(`${SRC}/${name}`, 'utf8')) }))
  // Kitob tartibi — `order` maydoni (qo'shimcha epizodlar 3.5 kabi kasr oladi)
  .sort((a, b) => lessonRank(a.data) - lessonRank(b.data))

/** Jumlalar: inglizcha → o'zbekcha */
const sentences = []
for (const { data } of files) {
  for (const pattern of data.sentencePatterns ?? []) {
    const en = (pattern.exampleEn ?? '').trim()
    const uz = (pattern.exampleUz ?? '').trim()
    if (isUsableSentence(en, uz)) sentences.push({ en, uz })
  }
}

/** So'zlar — kitob tartibida */
const ordered = []
const seenWord = new Set()
let dropped = 0

for (const { data } of files) {
  const unitTitle = (data.title ?? '').trim()
  const topic = `Enterprise ${data.unit}-unit${unitTitle ? `: ${unitTitle}` : ''}`

  for (const rule of data.wordFormation ?? []) {
    for (const item of rule.items ?? []) {
      for (const [wordKey, uzKey] of [
        ['base', 'baseUz'],
        ['derived', 'derivedUz'],
      ]) {
        const raw = (item[wordKey] ?? '').trim()
        const uz = (item[uzKey] ?? '').trim()
        const lower = raw.toLowerCase()
        const word = stripLeadingParticle(lower)

        if (!raw || !uz) { dropped += 1; continue }
        // Katta harf — atoqli ot yoki qoida sarlavhasi ("play THE violin")
        if (raw !== lower) { dropped += 1; continue }
        if (!isUsableWord(word)) { dropped += 1; continue }
        if (isUzbekLeak(word)) { dropped += 1; continue }
        if (isGrammarNote(uz)) { dropped += 1; continue }
        if (word === uz.toLowerCase()) { dropped += 1; continue }
        if (seenWord.has(word)) { dropped += 1; continue }
        if (JUNK_WORDS.has(word)) { dropped += 1; continue }

        seenWord.add(word)
        ordered.push({ word, uz, topic })
      }
    }
  }

  /*
   * `vocabulary` — darslikning O'Z lug'at ro'yxati (2026-08-15 da qo'shildi).
   * Shakli sodda: `{en, uz}`. `wordFormation` dan farqi — u so'z YASALISH
   * qoidalari uchun, bu esa bevosita dars lug'ati, shuning uchun sifati
   * yuqoriroq va qamrovi kengroq.
   */
  for (const item of data.vocabulary ?? []) {
    const raw = (item.en ?? '').trim()
    const uz = (item.uz ?? '').trim()
    const lower = raw.toLowerCase()
    const word = stripLeadingParticle(lower)

    if (!raw || !uz) { dropped += 1; continue }
    // Katta harf — atoqli ot ("China", "Big Ben"): joy va shaxs nomlari
    // lug'at mashqi uchun yaramaydi
    if (raw !== lower) { dropped += 1; continue }
    if (!isUsableWord(word)) { dropped += 1; continue }
    if (isUzbekLeak(word)) { dropped += 1; continue }
    if (isGrammarNote(uz)) { dropped += 1; continue }
    if (word === uz.toLowerCase()) { dropped += 1; continue }
    if (seenWord.has(word)) { dropped += 1; continue }
    if (JUNK_WORDS.has(word)) { dropped += 1; continue }

    seenWord.add(word)
    ordered.push({ word, uz, topic })
  }
}

/* --------------------------- dedup + daraja --------------------------- */

const hand = taken('en.ts')
const clean = []
const seenTr = new Set()

for (const entry of ordered) {
  const trKey = entry.uz.toLowerCase()

  if (hand.words.has(entry.word) || hand.norms.has(normalize(entry.word))) { dropped += 1; continue }
  if (hand.translations.has(trKey) || seenTr.has(trKey)) { dropped += 1; continue }

  seenTr.add(trKey)

  // Shu so'z qatnashgan eng qisqa jumla — tarjimasi bilan
  const match = sentences
    .filter((s) => appearsIn(s.en, entry.word))
    .sort((a, b) => a.en.length - b.en.length)[0]

  clean.push({ ...entry, sentence: match?.en, sentenceTranslation: match?.uz })
}

// Daraja KITOB TARTIBIDAGI O'RIN bo'yicha (boshqa tillar bilan bir xil qoida)
const a1End = Math.floor(clean.length * 0.3)
const a2End = Math.floor(clean.length * 0.65)
const buckets = { A1: [], A2: [], B1: [] }

clean.forEach((entry, index) => {
  buckets[index < a1End ? 'A1' : index < a2End ? 'A2' : 'B1'].push(entry)
})

/* ------------------------------ TS yozish ------------------------------ */

const esc = (s) => (s.includes("'") ? `"${s.replace(/"/g, '\\"')}"` : `'${s}'`)

let body = ''
for (const level of ['A1', 'A2', 'B1']) {
  body += `  ${level}: [\n`
  for (const entry of buckets[level]) {
    body +=
      '    {\n' +
      `      word: ${esc(entry.word)},\n` +
      `      translation: ${esc(entry.uz)},\n` +
      "      language: 'en',\n" +
      `      topic: ${esc(entry.topic)},\n` +
      `      level: '${level}',\n` +
      (entry.sentence ? `      sentence: ${esc(entry.sentence)},\n` : '') +
      (entry.sentenceTranslation
        ? `      sentenceTranslation: ${esc(entry.sentenceTranslation)},\n`
        : '') +
      '    },\n'
  }
  body += '  ],\n'
}

writeFileSync(
  'src/content/decks/imported-en-app.ts',
  "import type { NewCardRecordInput } from '@/core/db'\n" +
    "import type { LevelCode } from '@/core/types'\n\n" +
    '/**\n' +
    " * AVTOMATIK YARATILGAN — qo'lda tahrirlamang.\n" +
    ' * Manba: Enterprise app kontenti. scripts/import-enterprise-app.mjs\n' +
    " * Qo'lda yozilgan kontent, shuning uchun to'qnashuvda shu manba ustun.\n" +
    ' */\n' +
    'export const EN_APP: Record<LevelCode, NewCardRecordInput[]> = {\n' +
    body +
    '}\n',
)

const total = clean.length
const withSentence = clean.filter((entry) => entry.sentence).length
console.log(
  `ingliz (app): +${total} (A1 ${buckets.A1.length}, A2 ${buckets.A2.length}, B1 ${buckets.B1.length}) — tashlandi ${dropped}`,
)
console.log(`  tarjimali jumla biriktirildi: ${withSentence}`)
console.log(`  manbadagi yaroqli jumlalar: ${sentences.length}`)

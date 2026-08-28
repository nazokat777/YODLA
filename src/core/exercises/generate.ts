import type { CardRecord } from '@/core/db'
import type { ExerciseType } from '@/core/types'
import { shuffle, type RandomSource } from '@/lib/random'
import { normalizeAnswer } from './normalize'
import { MAX_CHOICES, type Exercise, type MatchingPair } from './types'

/**
 * Adaptiv qiyinlik (Flow nazariyasi).
 *
 * Qiyinlik `repetitions` ga qarab bosqichma-bosqich oshadi: yangi so'z
 * eng oson turdan (tanib olish) boshlanadi, mustahkamlangani esa aktiv
 * ishlab chiqarishni talab qiladi (yozish, jumla qurish).
 *
 * Ro'yxat YUQORIDAN pastga tekshiriladi: agar bosqichning birorta turi
 * mavjud bo'lmasa (masalan audio yo'q yoki jumla yozilmagan), bir pog'ona
 * pastga tushiladi.
 */
const DIFFICULTY_LADDER: Array<{ minRepetitions: number; types: ExerciseType[] }> = [
  { minRepetitions: 4, types: ['recall', 'construction', 'spelling'] },
  { minRepetitions: 2, types: ['listening', 'recall', 'cloze'] },
  { minRepetitions: 1, types: ['recognition', 'listening', 'matching'] },
  { minRepetitions: 0, types: ['recognition'] },
]

export interface GenerateExerciseOptions {
  /** Mashq qaysi karta uchun */
  card: CardRecord
  /** Chalg'ituvchi variantlar manbai (odatda o'sha tildagi barcha kartalar) */
  pool: readonly CardRecord[]
  /** TTS mavjudmi — yo'q bo'lsa "eshitib tushunish" turi yaratilmaydi */
  allowAudio: boolean
  random?: RandomSource
}

/**
 * Chalg'ituvchi tarjimalar.
 * Bir xil mavzudagi so'zlar afzal ko'riladi — ular bir-biriga yaqinroq,
 * shuning uchun tanlov haqiqiy eslab chaqirishni talab qiladi
 * ("Ovqat" mavzusidagi so'zga "Sayohat" dan variant qo'yish juda oson).
 */
function collectDistractors(
  card: CardRecord,
  pool: readonly CardRecord[],
  random: RandomSource,
): string[] {
  // Tarjimalar o'zbekcha (lotin): `'en'` shu yerda "lotin yozuvi uchun
  // umumiy tozalash" degani — tutuq belgisi variantlari va tinish belgilari
  const seen = new Set([optionKey(card.translation, 'en')])
  const sameTopic: string[] = []
  const otherTopic: string[] = []

  for (const candidate of pool) {
    if (candidate.id === card.id) continue

    const key = optionKey(candidate.translation, 'en')
    if (seen.has(key)) continue
    seen.add(key)

    if (card.topic && candidate.topic === card.topic) sameTopic.push(candidate.translation)
    else otherTopic.push(candidate.translation)
  }

  return [...shuffle(sameTopic, random), ...shuffle(otherTopic, random)].slice(0, MAX_CHOICES - 1)
}

/**
 * Chalg'ituvchi SO'ZLAR (tarjima emas) — cloze uchun.
 * `collectDistractors` bilan bir xil mantiq, faqat `word` maydonini yig'adi:
 * gap ichidagi variantlar o'rganilayotgan tilda bo'lishi kerak.
 */
/**
 * Variantlarni taqqoslash kaliti.
 *
 * `toLowerCase()` YETARLI EMAS: lug'atda `dining table` va `dining-table`,
 * `open air` va `open-air` kabi juftlar bor. Ular bitta savolda birga
 * chiqsa, foydalanuvchi TO'G'RI javobni tanlab ham xato oladi — ikkala
 * variant ham to'g'ri ko'rinadi. Shuning uchun defis va tinish belgilari
 * ham tekislanadi.
 */
function optionKey(text: string, language: CardRecord['language']): string {
  return normalizeAnswer(text.replace(/-/g, ' '), language)
}

function collectWordDistractors(
  card: CardRecord,
  pool: readonly CardRecord[],
  random: RandomSource,
): string[] {
  const seen = new Set([optionKey(card.word, card.language)])
  const sameTopic: string[] = []
  const otherTopic: string[] = []

  for (const candidate of pool) {
    if (candidate.id === card.id) continue

    const key = optionKey(candidate.word, card.language)
    if (seen.has(key)) continue
    seen.add(key)

    if (card.topic && candidate.topic === card.topic) sameTopic.push(candidate.word)
    else otherTopic.push(candidate.word)
  }

  return [...shuffle(sameTopic, random), ...shuffle(otherTopic, random)].slice(0, MAX_CHOICES - 1)
}

/**
 * Jumlada so'zni "___" bilan almashtiradi (birinchi uchrashini, katta-kichik
 * harfga befarq, so'z chegarasi bilan).
 *
 * Topilmasa null — so'z jumlada TURLANGAN shaklda kelishi mumkin ("drink" /
 * "drinks"), unda bo'sh joy qoldirish noto'g'ri bo'lardi.
 *
 * NEGA `\b` EMAS: JavaScript'da `\b` faqat ASCII harflarga tayanadi, ya'ni
 * arab va kirill yozuvida u HECH QACHON mos kelmasdi va bu tillarda cloze
 * umuman yaratilmasdi. Unicode harf/belgi sinflari bilan qaralgan chegara
 * uchala yozuvda ham ishlaydi. `\p{M}` — arab harakatlari: ular so'zning
 * davomi hisoblanadi, aks holda so'z o'rtasidan kesilardi.
 */
function clozeBlank(sentence: string, word: string): string | null {
  const bare = word.replace(ARABIC_MARKS, '')
  if (bare.length === 0) return null

  /*
   * Har harf orasiga IXTIYORIY harakat qo'yiladi.
   *
   * Nega: lug'atda arabcha so'z harakatli yoziladi ("مَرْحَبًا"), jumlalarda
   * esa odatda harakatsiz ("مرحبا"). Oddiy taqqoslashda ular mos kelmaydi
   * va cloze mashqi arabcha kartalarning deyarli uchdan biriga umuman
   * yaratilmasdi. Lotin va kirill matnida bunday belgilar uchramaydi,
   * shuning uchun qo'shimcha ularga zarar qilmaydi.
   */
  const flexible = [...bare]
    .map((letter) => letter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join(`${ARABIC_MARKS_CLASS}*`)

  const pattern = new RegExp(
    `(?<![\\p{L}\\p{M}])${flexible}${ARABIC_MARKS_CLASS}*(?![\\p{L}\\p{M}])`,
    'iu',
  )

  return pattern.test(sentence) ? sentence.replace(pattern, '___') : null
}

/** Arab harakalari va tatweel — `normalize.ts` dagi ro'yxatning o'zi */
const ARABIC_MARKS_CLASS = '[\\u064B-\\u0652\\u0670\\u065F\\u0640]'
const ARABIC_MARKS = new RegExp(ARABIC_MARKS_CLASS, 'g')

/**
 * So'z harflarini aralashtiradi.
 *
 * Bir necha marta urinib, kirish tartibidan FARQLI natija berishga harakat
 * qiladi — aks holda harflar allaqachon to'g'ri tartibda turgan bo'lardi va
 * mashq ma'nosini yo'qotardi. Takror harfli qisqa so'zlarda farq chiqmasligi
 * mumkin, bu normal.
 */
function scrambleLetters(word: string, random: RandomSource): string[] {
  const letters = [...word]

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const shuffled = shuffle(letters, random)
    if (shuffled.join('') !== word) return shuffled
  }

  return shuffle(letters, random)
}

/**
 * So'z harfma-harf yig'ishga yaroqlimi.
 *
 * Arab tili chiqarib tashlanadi: harflar so'z ichida ulanadi va ajratilganda
 * boshqa shaklga kiradi — alohida harflardan yig'ish chalkash bo'lardi.
 * Uzun so'zda esa harflar soni ekranga sig'maydi va mashq mexanik ishga
 * aylanadi.
 */
function isSpellable(card: CardRecord): boolean {
  if (card.language === 'ar') return false

  const word = card.word.trim()
  if (word.length < 3 || word.length > 10) return false

  return !/\s/.test(word)
}

/** Juft topishdagi kartalar soni */
export const MATCHING_SIZE = 5

/**
 * Joriy karta + to'plamdan yana `MATCHING_SIZE - 1` ta kartani olib juftlar
 * tuzadi. Yetarli karta bo'lmasa null — generator bir pog'ona pastga tushadi.
 */
function buildMatching(
  card: CardRecord,
  pool: readonly CardRecord[],
  random: RandomSource,
): MatchingPair[] | null {
  const others = shuffle(
    pool.filter((candidate) => candidate.id !== card.id),
    random,
  ).slice(0, MATCHING_SIZE - 1)

  if (others.length < MATCHING_SIZE - 1) return null

  return shuffle([card, ...others], random).map((item) => ({
    cardId: item.id,
    word: item.word,
    translation: item.translation,
  }))
}

/** Variantlar ro'yxati va to'g'ri javob indeksi */
function buildChoices(
  card: CardRecord,
  pool: readonly CardRecord[],
  random: RandomSource,
): { options: string[]; correctIndex: number } | null {
  const distractors = collectDistractors(card, pool, random)
  // Kamida bitta muqobil bo'lmasa, tanlov ma'nosiz
  if (distractors.length === 0) return null

  const options = shuffle([card.translation, ...distractors], random)

  return { options, correctIndex: options.indexOf(card.translation) }
}

/** Jumla qurish uchun so'zlar (kamida ikkita bo'lishi kerak) */
function sentenceTokens(card: CardRecord): string[] | null {
  const sentence = card.sentence?.trim()
  if (!sentence) return null

  const tokens = sentence.split(/\s+/)
  return tokens.length >= 2 ? tokens : null
}

/** Berilgan tur shu karta uchun umuman yaratilishi mumkinmi */
function isTypeAvailable(type: ExerciseType, options: GenerateExerciseOptions): boolean {
  const { card, pool, allowAudio } = options

  switch (type) {
    case 'recognition':
      return pool.some((candidate) => candidate.id !== card.id)
    case 'listening':
      return allowAudio && pool.some((candidate) => candidate.id !== card.id)
    case 'recall':
      return true
    case 'construction':
      return sentenceTokens(card) !== null && Boolean(card.sentenceTranslation)
    case 'cloze': {
      const sentence = card.sentence?.trim()
      if (!sentence || clozeBlank(sentence, card.word) === null) return false

      return pool.some((candidate) => candidate.id !== card.id)
    }
    case 'spelling':
      return isSpellable(card)
    case 'matching':
      // O'zidan tashqari kamida MATCHING_SIZE-1 karta kerak
      return pool.filter((candidate) => candidate.id !== card.id).length >= MATCHING_SIZE - 1
  }
}

/**
 * Qiyinlik darajasiga mos, shu karta uchun MUMKIN bo'lgan mashq turini tanlash.
 * Hech qanday variantli tur yaratib bo'lmasa, oxirgi tayanch — "eslab yozish"
 * (u har doim mumkin).
 */
export function pickExerciseType(options: GenerateExerciseOptions): ExerciseType {
  const { card, random = Math.random } = options

  for (const step of DIFFICULTY_LADDER) {
    if (card.repetitions < step.minRepetitions) continue

    const available = step.types.filter((type) => isTypeAvailable(type, options))
    if (available.length === 0) continue

    return available[Math.floor(random() * available.length)]
  }

  return 'recall'
}

/**
 * Karta uchun mashq yaratish.
 *
 * Sof funksiya: `random` argument sifatida beriladi, shuning uchun natija
 * testlarda to'liq oldindan aytiladi.
 */
export function generateExercise(options: GenerateExerciseOptions): Exercise {
  const { card, pool, random = Math.random } = options
  const type = pickExerciseType({ ...options, random })
  const id = `${card.id}:${type}`

  switch (type) {
    case 'recognition': {
      const choices = buildChoices(card, pool, random)
      // Mavjudlik yuqorida tekshirilgan; bu shart faqat tip tizimi uchun
      if (!choices) return buildRecall(card)

      return { id, type, card, prompt: card.word, ...choices }
    }

    case 'listening': {
      const choices = buildChoices(card, pool, random)
      if (!choices) return buildRecall(card)

      return { id, type, card, spokenText: card.word, ...choices }
    }

    case 'construction': {
      const tokens = sentenceTokens(card)
      if (!tokens || !card.sentenceTranslation) return buildRecall(card)

      return {
        id,
        type,
        card,
        prompt: card.sentenceTranslation,
        // So'zlar aralashtiriladi; bir so'zli takrorlar bo'lishi mumkin
        tokens: shuffle(tokens, random),
        answer: tokens.join(' '),
      }
    }

    case 'cloze': {
      const sentence = card.sentence?.trim()
      const blanked = sentence ? clozeBlank(sentence, card.word) : null
      const distractors = blanked ? collectWordDistractors(card, pool, random) : []
      // Mavjudlik yuqorida tekshirilgan; bu shart faqat tip tizimi uchun
      if (!blanked || distractors.length === 0) return buildRecall(card)

      const options = shuffle([card.word, ...distractors], random)

      return {
        id,
        type,
        card,
        prompt: blanked,
        options,
        correctIndex: options.indexOf(card.word),
      }
    }

    case 'spelling': {
      // Mavjudlik yuqorida tekshirilgan; bu shart faqat tip tizimi uchun
      if (!isSpellable(card)) return buildRecall(card)

      return {
        id,
        type,
        card,
        prompt: card.translation,
        letters: scrambleLetters(card.word, random),
        answer: card.word,
      }
    }

    case 'matching': {
      const pairs = buildMatching(card, pool, random)
      // Mavjudlik yuqorida tekshirilgan; bu shart faqat tip tizimi uchun
      if (!pairs) return buildRecall(card)

      return { id, type, card, pairs }
    }

    case 'recall':
      return buildRecall(card)
  }
}

/** Oxirgi tayanch tur — har doim yaratiladi */
function buildRecall(card: CardRecord): Exercise {
  return {
    id: `${card.id}:recall`,
    type: 'recall',
    card,
    prompt: card.translation,
    answer: card.word,
  }
}

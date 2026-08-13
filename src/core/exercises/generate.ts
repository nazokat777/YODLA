import type { CardRecord } from '@/core/db'
import type { ExerciseType } from '@/core/types'
import { shuffle, type RandomSource } from '@/lib/random'
import { MAX_CHOICES, type Exercise } from './types'

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
  { minRepetitions: 4, types: ['recall', 'construction'] },
  { minRepetitions: 2, types: ['listening', 'recall', 'cloze'] },
  { minRepetitions: 1, types: ['recognition', 'listening'] },
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
  const seen = new Set([card.translation.toLowerCase()])
  const sameTopic: string[] = []
  const otherTopic: string[] = []

  for (const candidate of pool) {
    if (candidate.id === card.id) continue

    const key = candidate.translation.toLowerCase()
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
function collectWordDistractors(
  card: CardRecord,
  pool: readonly CardRecord[],
  random: RandomSource,
): string[] {
  const seen = new Set([card.word.toLowerCase()])
  const sameTopic: string[] = []
  const otherTopic: string[] = []

  for (const candidate of pool) {
    if (candidate.id === card.id) continue

    const key = candidate.word.toLowerCase()
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
 */
function clozeBlank(sentence: string, word: string): string | null {
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`\\b${escaped}\\b`, 'i')

  return pattern.test(sentence) ? sentence.replace(pattern, '___') : null
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
      return false
    case 'matching':
      return false
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

    case 'spelling':
    case 'matching':
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

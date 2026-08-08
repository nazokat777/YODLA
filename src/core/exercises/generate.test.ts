import { describe, expect, it } from 'vitest'
import type { CardRecord } from '@/core/db'
import { seededRandom } from '@/lib/random'
import { generateExercise, pickExerciseType } from './generate'
import { MAX_CHOICES } from './types'

function makeCard(overrides: Partial<CardRecord> = {}): CardRecord {
  return {
    id: 'en:hello',
    word: 'hello',
    translation: 'salom',
    language: 'en',
    topic: 'Salomlashish',
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    lastReviewedAt: null,
    totalReviews: 0,
    lapses: 0,
    ...overrides,
  }
}

/** Chalg'ituvchi variantlar uchun yetarlicha katta to'plam */
const POOL: CardRecord[] = [
  makeCard(),
  makeCard({ id: 'en:water', word: 'water', translation: 'suv', topic: 'Ovqat' }),
  makeCard({ id: 'en:bread', word: 'bread', translation: 'non', topic: 'Ovqat' }),
  makeCard({ id: 'en:book', word: 'book', translation: 'kitob', topic: 'Maktab' }),
  makeCard({ id: 'en:house', word: 'house', translation: 'uy', topic: 'Oila' }),
  makeCard({ id: 'en:bye', word: 'bye', translation: 'xayr', topic: 'Salomlashish' }),
]

const SENTENCE = {
  sentence: 'This is my house',
  sentenceTranslation: 'Bu mening uyim',
}

/** Bir necha urug' bilan sinash — natija bitta tasodifga bog'liq qolmasin */
const SEEDS = [1, 7, 42, 123, 999]

describe('pickExerciseType — adaptiv qiyinlik', () => {
  it('yangi so‘z (repetitions 0) eng oson turdan boshlanadi', () => {
    for (const seed of SEEDS) {
      const type = pickExerciseType({
        card: makeCard({ repetitions: 0 }),
        pool: POOL,
        allowAudio: true,
        random: seededRandom(seed),
      })

      expect(type).toBe('recognition')
    }
  })

  it('repetitions 1 da eshitib tushunish qo‘shiladi', () => {
    const types = SEEDS.map((seed) =>
      pickExerciseType({
        card: makeCard({ repetitions: 1 }),
        pool: POOL,
        allowAudio: true,
        random: seededRandom(seed),
      }),
    )

    expect(types.every((type) => type === 'recognition' || type === 'listening')).toBe(true)
  })

  it('repetitions 2–3 da aktiv yozish talab qilinadi', () => {
    const types = SEEDS.map((seed) =>
      pickExerciseType({
        card: makeCard({ repetitions: 3 }),
        pool: POOL,
        allowAudio: true,
        random: seededRandom(seed),
      }),
    )

    expect(types.every((type) => type === 'listening' || type === 'recall')).toBe(true)
    expect(types).not.toContain('recognition')
  })

  it('repetitions 4+ da eng qiyin turlar', () => {
    const types = SEEDS.map((seed) =>
      pickExerciseType({
        card: makeCard({ repetitions: 6, ...SENTENCE }),
        pool: POOL,
        allowAudio: true,
        random: seededRandom(seed),
      }),
    )

    expect(types.every((type) => type === 'recall' || type === 'construction')).toBe(true)
  })
})

describe('pickExerciseType — mavjud bo‘lmagan turlarni chetlab o‘tish', () => {
  it('audio yo‘q bo‘lsa, eshitib tushunish tanlanmaydi', () => {
    const types = SEEDS.map((seed) =>
      pickExerciseType({
        card: makeCard({ repetitions: 1 }),
        pool: POOL,
        allowAudio: false,
        random: seededRandom(seed),
      }),
    )

    expect(types).not.toContain('listening')
  })

  it('audio yo‘q va repetitions 3 bo‘lsa — yozishga tushadi', () => {
    const types = SEEDS.map((seed) =>
      pickExerciseType({
        card: makeCard({ repetitions: 3 }),
        pool: POOL,
        allowAudio: false,
        random: seededRandom(seed),
      }),
    )

    expect(types.every((type) => type === 'recall')).toBe(true)
  })

  it('jumla yo‘q bo‘lsa, jumla qurish tanlanmaydi', () => {
    const types = SEEDS.map((seed) =>
      pickExerciseType({
        card: makeCard({ repetitions: 8 }), // jumla maydonlari yo'q
        pool: POOL,
        allowAudio: true,
        random: seededRandom(seed),
      }),
    )

    expect(types.every((type) => type === 'recall')).toBe(true)
  })

  it('to‘plamda boshqa karta bo‘lmasa, variantli turlar tanlanmaydi', () => {
    const single = makeCard({ repetitions: 0 })

    const type = pickExerciseType({
      card: single,
      pool: [single],
      allowAudio: true,
      random: seededRandom(1),
    })

    expect(type).toBe('recall')
  })
})

describe('generateExercise — tanib olish', () => {
  it('to‘g‘ri javob variantlar orasida va indeks unga mos', () => {
    for (const seed of SEEDS) {
      const exercise = generateExercise({
        card: makeCard({ repetitions: 0 }),
        pool: POOL,
        allowAudio: true,
        random: seededRandom(seed),
      })

      if (exercise.type !== 'recognition') throw new Error('kutilmagan tur')

      expect(exercise.prompt).toBe('hello')
      expect(exercise.options[exercise.correctIndex]).toBe('salom')
      expect(exercise.options.length).toBeLessThanOrEqual(MAX_CHOICES)
      expect(exercise.options.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('variantlar takrorlanmaydi', () => {
    for (const seed of SEEDS) {
      const exercise = generateExercise({
        card: makeCard({ repetitions: 0 }),
        pool: POOL,
        allowAudio: true,
        random: seededRandom(seed),
      })

      if (exercise.type !== 'recognition') throw new Error('kutilmagan tur')

      expect(new Set(exercise.options).size).toBe(exercise.options.length)
    }
  })

  it('to‘g‘ri javob har doim bir xil o‘rinda turmaydi', () => {
    const indexes = new Set(
      Array.from({ length: 30 }, (_, seed) => {
        const exercise = generateExercise({
          card: makeCard({ repetitions: 0 }),
          pool: POOL,
          allowAudio: true,
          random: seededRandom(seed + 1),
        })
        return exercise.type === 'recognition' ? exercise.correctIndex : -1
      }),
    )

    // Aks holda foydalanuvchi mazmunni emas, o'rinni yodlab olardi
    expect(indexes.size).toBeGreaterThan(1)
  })

  it('bir xil mavzudagi chalg‘ituvchilar afzal ko‘riladi', () => {
    // "Salomlashish" mavzusida faqat bitta muqobil bor — "xayr".
    // U doim variantlar orasida bo'lishi kerak.
    for (const seed of SEEDS) {
      const exercise = generateExercise({
        card: makeCard({ repetitions: 0 }),
        pool: POOL,
        allowAudio: true,
        random: seededRandom(seed),
      })

      if (exercise.type !== 'recognition') throw new Error('kutilmagan tur')

      expect(exercise.options).toContain('xayr')
    }
  })
})

describe('generateExercise — jumla qurish', () => {
  it('so‘zlar aralashtiriladi, javob asl tartibda qoladi', () => {
    const exercise = generateExercise({
      card: makeCard({ repetitions: 6, ...SENTENCE }),
      pool: [],
      allowAudio: false,
      random: seededRandom(3),
    })

    if (exercise.type !== 'construction') throw new Error('kutilmagan tur')

    expect(exercise.answer).toBe('This is my house')
    expect(exercise.prompt).toBe('Bu mening uyim')
    expect([...exercise.tokens].sort()).toEqual(['This', 'house', 'is', 'my'].sort())
  })

  it('bir so‘zli jumla uchun bu tur yaratilmaydi', () => {
    const type = pickExerciseType({
      card: makeCard({ repetitions: 6, sentence: 'Hello', sentenceTranslation: 'Salom' }),
      pool: POOL,
      allowAudio: false,
      random: seededRandom(1),
    })

    expect(type).toBe('recall')
  })
})

describe('generateExercise — eslab yozish', () => {
  it('tarjimadan so‘zga yo‘naltiriladi', () => {
    const exercise = generateExercise({
      card: makeCard({ repetitions: 3 }),
      pool: POOL,
      allowAudio: false,
      random: seededRandom(1),
    })

    if (exercise.type !== 'recall') throw new Error('kutilmagan tur')

    expect(exercise.prompt).toBe('salom')
    expect(exercise.answer).toBe('hello')
  })
})

describe('generateExercise — barqarorlik', () => {
  it('bir xil urug‘ bilan bir xil natija (deterministik)', () => {
    const options = {
      card: makeCard({ repetitions: 1 }),
      pool: POOL,
      allowAudio: true,
    }

    const first = generateExercise({ ...options, random: seededRandom(77) })
    const second = generateExercise({ ...options, random: seededRandom(77) })

    expect(first).toEqual(second)
  })

  it('har qanday to‘plam va sozlamada mashq yarata oladi', () => {
    // Generator hech qachon "hech narsa" qaytarmasligi kerak —
    // aks holda seans o'rtasida to'xtab qolardi.
    for (const repetitions of [0, 1, 2, 3, 4, 10]) {
      for (const allowAudio of [true, false]) {
        for (const pool of [[], POOL]) {
          const exercise = generateExercise({
            card: makeCard({ repetitions }),
            pool,
            allowAudio,
            random: seededRandom(repetitions + 1),
          })

          expect(exercise.type).toBeDefined()
          expect(exercise.card.id).toBe('en:hello')
        }
      }
    }
  })
})

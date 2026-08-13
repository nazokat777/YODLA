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

    expect(
      types.every(
        (type) => type === 'recall' || type === 'construction' || type === 'spelling',
      ),
    ).toBe(true)
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

    // Jumlasiz kartada shu pog'onadan faqat yozish va harfma-harf qoladi
    expect(types.every((type) => type === 'recall' || type === 'spelling')).toBe(true)
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
    // Shu pog'onada bir necha tur bor — jumla qurish chiqqan urug'ni topamiz
    let exercise = null
    for (let seed = 1; seed < 60 && !exercise; seed += 1) {
      const candidate = generateExercise({
        card: makeCard({ repetitions: 6, ...SENTENCE }),
        pool: [],
        allowAudio: false,
        random: seededRandom(seed),
      })
      if (candidate.type === 'construction') exercise = candidate
    }

    if (!exercise || exercise.type !== 'construction') throw new Error('kutilmagan tur')

    expect(exercise.answer).toBe('This is my house')
    expect(exercise.prompt).toBe('Bu mening uyim')
    expect([...exercise.tokens].sort()).toEqual(['This', 'house', 'is', 'my'].sort())
  })

  it('bir so‘zli jumla uchun bu tur yaratilmaydi', () => {
    const types = SEEDS.map((seed) =>
      pickExerciseType({
        card: makeCard({ repetitions: 6, sentence: 'Hello', sentenceTranslation: 'Salom' }),
        pool: POOL,
        allowAudio: false,
        random: seededRandom(seed),
      }),
    )

    expect(types).not.toContain('construction')
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

describe('generateExercise — gap ichida (cloze)', () => {
  const water = makeCard({
    id: 'en:water',
    word: 'water',
    translation: 'suv',
    topic: 'Ovqat',
    repetitions: 2,
    sentence: 'I drink water every morning',
    sentenceTranslation: 'Men har tong suv ichaman',
  })

  /** Ladder tasodifiy tanlaydi — bir necha urug' bilan cloze qidiramiz */
  function findCloze(card: CardRecord, pool: CardRecord[]) {
    for (let seed = 1; seed < 60; seed += 1) {
      const exercise = generateExercise({ card, pool, allowAudio: false, random: seededRandom(seed) })
      if (exercise.type === 'cloze') return exercise
    }
    return null
  }

  it('jumlada ___ bo‘ladi, so‘zning o‘zi ko‘rinmaydi', () => {
    const cloze = findCloze(water, [water, ...POOL])

    expect(cloze).not.toBeNull()
    expect(cloze!.prompt).toContain('___')
    expect(cloze!.prompt.toLowerCase()).not.toContain('water')
  })

  it('variantlar O‘RGANILAYOTGAN tilda bo‘ladi va to‘g‘risi ichida', () => {
    const cloze = findCloze(water, [water, ...POOL])

    expect(cloze!.options).toContain('water')
    expect(cloze!.options[cloze!.correctIndex]).toBe('water')
    // Tarjima emas — o'zbekcha so'z variantlarda bo'lmasligi kerak
    expect(cloze!.options).not.toContain('suv')
  })

  it('jumlasiz kartada cloze yaratilmaydi', () => {
    const noSentence = makeCard({ id: 'en:water', word: 'water', repetitions: 2 })

    expect(findCloze(noSentence, [noSentence, ...POOL])).toBeNull()
  })

  it('so‘z jumlada topilmasa cloze yaratilmaydi', () => {
    // Turlangan shakl ("drinks" ≠ "drink") — bo'sh joy qoldirib bo'lmaydi
    const mismatch = makeCard({
      id: 'en:drink',
      word: 'drink',
      translation: 'ichmoq',
      repetitions: 2,
      sentence: 'She drinks tea',
      sentenceTranslation: 'U choy ichadi',
    })

    expect(findCloze(mismatch, [mismatch, ...POOL])).toBeNull()
  })
})

describe('generateExercise — harfma-harf (spelling)', () => {
  /** rep>=4 pog'onasida spelling qidiramiz */
  function findSpelling(card: CardRecord, pool: CardRecord[]) {
    for (let seed = 1; seed < 60; seed += 1) {
      const exercise = generateExercise({ card, pool, allowAudio: false, random: seededRandom(seed) })
      if (exercise.type === 'spelling') return exercise
    }
    return null
  }

  it('harflar — so‘z harflarining aralashmasi, javob so‘zning o‘zi', () => {
    const water = makeCard({ id: 'en:water', word: 'water', translation: 'suv', repetitions: 4 })
    const spelling = findSpelling(water, [water, ...POOL])

    expect(spelling).not.toBeNull()
    expect(spelling!.answer).toBe('water')
    expect(spelling!.prompt).toBe('suv')
    expect([...spelling!.letters].sort().join('')).toBe([...'water'].sort().join(''))
  })

  it('arab so‘zida spelling yaratilmaydi (harflar ajralganda shakli o‘zgaradi)', () => {
    const arabic = makeCard({
      id: 'ar:ma',
      word: 'ماء',
      translation: 'suv',
      language: 'ar',
      repetitions: 4,
    })

    expect(findSpelling(arabic, [arabic, ...POOL])).toBeNull()
  })

  it('juda uzun so‘zda spelling yaratilmaydi', () => {
    const long = makeCard({
      id: 'en:refrigerator',
      word: 'refrigerator',
      translation: 'muzlatgich',
      repetitions: 4,
    })

    expect(findSpelling(long, [long, ...POOL])).toBeNull()
  })

  it('ko‘p so‘zli iborada spelling yaratilmaydi', () => {
    const phrase = makeCard({
      id: 'en:goodmorning',
      word: 'good day',
      translation: 'xayrli kun',
      repetitions: 4,
    })

    expect(findSpelling(phrase, [phrase, ...POOL])).toBeNull()
  })
})

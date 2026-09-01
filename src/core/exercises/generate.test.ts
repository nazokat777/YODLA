import { describe, expect, it } from 'vitest'
import type { CardRecord } from '@/core/db'
import { seededRandom } from '@/lib/random'
import { MATCHING_SIZE, generateExercise, pickExerciseType } from './generate'
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

    expect(
      types.every(
        (type) => type === 'recognition' || type === 'listening' || type === 'matching',
      ),
    ).toBe(true)
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

  it('bosqich qiyinlikni KO‘TARADI — yangi so‘z ham xilma-xil chiqadi', () => {
    // Yangi so'zning `repetitions` i 0, ya'ni zinapoyada faqat
    // "tanib olish" ochiq. Shu sababli birinchi darsdagi HAMMA savol
    // bir xil bo'lardi. Bosqich shu cheklovni seans ichida ochadi.
    const card = makeCard({ repetitions: 0 })

    const types = SEEDS.map((seed) =>
      pickExerciseType({
        card,
        pool: POOL,
        allowAudio: true,
        stage: 2,
        random: seededRandom(seed),
      }),
    )

    expect(types.every((type) => type === 'recognition')).toBe(false)
  })

  it('bosqich berilmasa xatti-harakat O‘ZGARMAYDI', () => {
    const type = pickExerciseType({
      card: makeCard({ repetitions: 0 }),
      pool: POOL,
      allowAudio: true,
      random: seededRandom(1),
    })

    expect(type).toBe('recognition')
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

  it('DEFIS bilan farq qiladigan so‘z variantga TUSHMAYDI', () => {
    // Lug'atda haqiqatan shunday juftlar bor: `dining table` va
    // `dining-table`, `open air` va `open-air`. Ular variantlar ro'yxatida
    // birga chiqsa, savolga to'g'ri javob berib bo'lmaydi — ikkalasi ham
    // to'g'ri ko'rinadi, lekin bittasi xato deb belgilanadi.
    const table = makeCard({
      id: 'en:dining-table',
      word: 'dining table',
      translation: 'ovqat stoli',
      topic: 'Uy',
      repetitions: 2,
      sentence: 'We bought a dining table',
      sentenceTranslation: 'Biz ovqat stoli sotib oldik',
    })
    const twin = makeCard({
      id: 'en:dining-table-2',
      word: 'dining-table',
      translation: 'stol',
      topic: 'Uy',
    })

    const cloze = findCloze(table, [table, twin, ...POOL])

    expect(cloze).not.toBeNull()
    expect(cloze!.options).not.toContain('dining-table')
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

  it('arabcha harakatlar farq qilsa ham topiladi', () => {
    // Lug'atda so'z harakatli, jumlada esa harakatsiz yoziladi — bu arab
    // matnlarida odatiy hol va cloze mashqini to'sib qo'ymasligi kerak
    const salam = makeCard({
      id: 'ar:marhaban',
      word: 'مَرْحَبًا',
      translation: 'salom',
      language: 'ar',
      repetitions: 2,
      sentence: 'مرحبا يا صديقي',
      sentenceTranslation: 'Salom, do‘stim',
    })

    const arabicPool = POOL.map((card) => ({ ...card, language: 'ar' as const }))
    const cloze = findCloze(salam, [salam, ...arabicPool])

    expect(cloze).not.toBeNull()
    expect(cloze!.prompt).toContain('___')
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

describe('generateExercise — juft topish (matching)', () => {
  /** rep>=1 pog'onasida matching qidiramiz */
  function findMatching(card: CardRecord, pool: CardRecord[]) {
    for (let seed = 1; seed < 60; seed += 1) {
      const exercise = generateExercise({ card, pool, allowAudio: false, random: seededRandom(seed) })
      if (exercise.type === 'matching') return exercise
    }
    return null
  }

  it('5 noyob juft chiqadi va joriy karta ichida bo‘ladi', () => {
    const card = makeCard({ repetitions: 1 })
    const matching = findMatching(card, POOL)

    expect(matching).not.toBeNull()
    expect(matching!.pairs).toHaveLength(MATCHING_SIZE)

    const ids = matching!.pairs.map((pair) => pair.cardId)
    expect(new Set(ids).size).toBe(MATCHING_SIZE)
    expect(ids).toContain(card.id)
  })

  it('har juftda so‘z va tarjimasi bir kartadan olinadi', () => {
    const matching = findMatching(makeCard({ repetitions: 1 }), POOL)

    for (const pair of matching!.pairs) {
      const source = POOL.find((c) => c.id === pair.cardId)
      expect(pair.word).toBe(source!.word)
      expect(pair.translation).toBe(source!.translation)
    }
  })

  it('to‘plamda yetarli karta bo‘lmasa matching yaratilmaydi', () => {
    const small = POOL.slice(0, 4)

    expect(findMatching(small[0], small)).toBeNull()
  })
})

describe('generateExercise — cloze lotin bo‘lmagan yozuvlarda', () => {
  /** Ladder tasodifiy tanlaydi — cloze chiqqan urug'ni qidiramiz */
  function findCloze(card: CardRecord, pool: CardRecord[]) {
    for (let seed = 1; seed < 60; seed += 1) {
      const exercise = generateExercise({ card, pool, allowAudio: false, random: seededRandom(seed) })
      if (exercise.type === 'cloze') return exercise
    }
    return null
  }

  it('rus tilida bo‘sh joy qoldiriladi', () => {
    const water = makeCard({
      id: 'ru:voda',
      word: 'вода',
      translation: 'suv',
      language: 'ru',
      repetitions: 2,
      sentence: 'Это холодная вода',
      sentenceTranslation: 'Bu sovuq suv',
    })
    const pool = [
      water,
      makeCard({ id: 'ru:hleb', word: 'хлеб', translation: 'non', language: 'ru' }),
      makeCard({ id: 'ru:chai', word: 'чай', translation: 'choy', language: 'ru' }),
    ]

    const cloze = findCloze(water, pool)

    expect(cloze).not.toBeNull()
    expect(cloze!.prompt).toBe('Это холодная ___')
  })

  it('arab tilida bo‘sh joy qoldiriladi', () => {
    // `\b` faqat ASCII harflar bilan ishlaydi — arab yozuvida u hech qachon
    // mos kelmasdi va cloze umuman yaratilmasdi
    const book = makeCard({
      id: 'ar:kitab',
      word: 'كِتَابٌ',
      translation: 'kitob',
      language: 'ar',
      repetitions: 2,
      sentence: 'هَذَا كِتَابٌ',
      sentenceTranslation: 'Bu kitob',
    })
    const pool = [
      book,
      makeCard({ id: 'ar:qalam', word: 'قَلَمٌ', translation: 'qalam', language: 'ar' }),
      makeCard({ id: 'ar:bab', word: 'بَابٌ', translation: 'eshik', language: 'ar' }),
    ]

    const cloze = findCloze(book, pool)

    expect(cloze).not.toBeNull()
    expect(cloze!.prompt).toBe('هَذَا ___')
  })

  it('so‘zning BO‘LAGI bo‘sh joy bilan almashtirilmaydi', () => {
    // "чай" so'zi "чайник" ichida uchraydi — bu mos kelish emas
    const tea = makeCard({
      id: 'ru:chai',
      word: 'чай',
      translation: 'choy',
      language: 'ru',
      repetitions: 2,
      sentence: 'Там стоит чайник',
      sentenceTranslation: 'U yerda choynak turibdi',
    })
    const pool = [tea, makeCard({ id: 'ru:hleb', word: 'хлеб', translation: 'non', language: 'ru' })]

    expect(findCloze(tea, pool)).toBeNull()
  })
})

describe('mashq identifikatori', () => {
  it('bosqichni ham o‘z ichiga oladi', () => {
    // Bir karta seansda bir necha marta chiqadi. Id bir xil qolsa,
    // React eski mashqni qayta ishlatib, kiritilgan javob va fokus
    // yangi savolga o'tib ketardi.
    const card = makeCard({ repetitions: 0 })

    const first = generateExercise({
      card,
      pool: POOL,
      allowAudio: false,
      stage: 0,
      random: seededRandom(1),
    })
    const second = generateExercise({
      card,
      pool: POOL,
      allowAudio: false,
      stage: 1,
      random: seededRandom(1),
    })

    expect(first.id).not.toBe(second.id)
  })
})

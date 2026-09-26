import { describe, expect, it } from 'vitest'
import type { CardRecord } from '@/core/db'
import { bookIdOf, buildBooks, cardsOfBook, OTHER_BOOK_TITLE } from './books'
import { dailyTask, planPace, planProgress, type StudyPlan } from './plan'

function card(id: string, partial: Partial<CardRecord> = {}): CardRecord {
  return {
    id,
    word: id,
    translation: id,
    language: 'ar',
    level: 'A1',
    interval: 0,
    repetitions: 0,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    lastReviewedAt: null,
    totalReviews: 0,
    lapses: 0,
    ...partial,
  }
}

const CARDS: CardRecord[] = [
  card('a', { topic: 'Qiroat 1-kitob 1-dars', totalReviews: 2, sentence: 'x' }),
  card('b', { topic: 'Qiroat 1-kitob 1-dars', totalReviews: 1, interval: 30 }),
  card('c', { topic: 'Qiroat 1-kitob 2-dars' }),
  card('d', { topic: 'Qiroat 2-kitob 1-dars' }),
  card('e', { topic: 'Salomlashish', totalReviews: 3 }),
]

describe('buildBooks', () => {
  it('kitoblarni mavzu prefiksidan ajratadi va sanaydi', () => {
    const books = buildBooks(CARDS)

    expect(books.map((book) => book.title)).toEqual([
      'Qiroat 1-kitob',
      'Qiroat 2-kitob',
      OTHER_BOOK_TITLE,
    ])

    const first = books[0]!
    expect(first).toMatchObject({
      id: 'qiroat-1-kitob',
      words: 3,
      learned: 2,
      mature: 1,
      lessons: 2,
      sentences: 1,
    })
    // 1-dars tugallangan (ikkala so'z ham ko'rilgan), 2-dars yo'q
    expect(first.lessonsDone).toBe(1)
    // 3 so'z / 2 dars ≈ 2
    expect(first.wordsPerLesson).toBe(2)
  })

  it('kitobsiz mavzular alohida to‘plamda', () => {
    const other = buildBooks(CARDS).find((book) => book.title === OTHER_BOOK_TITLE)!
    expect(other.words).toBe(1)
    expect(other.learned).toBe(1)
  })

  it('bo‘sh ro‘yxatda kitob yo‘q', () => {
    expect(buildBooks([])).toEqual([])
  })
})

describe('bookIdOf / cardsOfBook', () => {
  it('tutuq va bo‘shliq havolaga yaroqli id beradi', () => {
    expect(bookIdOf("Qo'shimcha lug'at")).toBe('qoshimcha-lugat')
  })

  it('faqat shu kitob kartalarini qaytaradi', () => {
    expect(cardsOfBook(CARDS, 'qiroat-1-kitob').map((c) => c.id)).toEqual(['a', 'b', 'c'])
  })
})

describe('planPace', () => {
  const book = {
    id: 'b',
    title: 'B',
    words: 600,
    learned: 100,
    mature: 0,
    lessons: 50,
    lessonsDone: 0,
    sentences: 0,
    wordsPerLesson: 12,
  }

  it('qolgan so‘zlarni kunlarga bo‘ladi', () => {
    const pace = planPace(book, 50)
    // 500 qolgan / 50 kun = 10
    expect(pace).toMatchObject({ wordsPerDay: 10, remainingWords: 500, daysNeeded: 50 })
    // 10 so'z × 60 s = 10 daqiqa
    expect(pace.minutesPerDay).toBe(10)
    // darsda 12 so'z — kuniga ~1 dars
    expect(pace.lessonsPerDay).toBe(1)
  })

  it('kitob tugagan bo‘lsa kun kerak emas', () => {
    expect(planPace({ ...book, learned: 600 }, 30)).toMatchObject({
      remainingWords: 0,
      daysNeeded: 0,
    })
  })

  it('juda qisqa muddatda ham kamida 1 so‘z', () => {
    expect(planPace({ ...book, words: 101, learned: 100 }, 365).wordsPerDay).toBe(1)
  })
})

describe('planProgress / dailyTask', () => {
  const DAY = 24 * 60 * 60 * 1000
  const book = {
    id: 'b',
    title: 'B',
    words: 300,
    learned: 0,
    mature: 0,
    lessons: 30,
    lessonsDone: 0,
    sentences: 0,
    wordsPerLesson: 10,
  }
  const plan: StudyPlan = { bookId: 'b', days: 30, startedAt: 0, learnedAtStart: 0 }

  it('kun raqami va kutilayotgan so‘zlar', () => {
    const progress = planProgress({ ...book, learned: 15 }, plan, 2 * DAY)
    // 3-kun: oldingi IKKI kunda 20 bo'lishi kerak edi, bor 15 → 5 orqada.
    // Bugungi ulush kutilganga kirmaydi — kun boshida hech kim orqada emas
    expect(progress).toMatchObject({ dayNumber: 3, expectedWords: 20, behind: 5, ahead: 0 })
  })

  it('BIRINCHI kunda hech kim orqada emas', () => {
    const progress = planProgress({ ...book, learned: 0 }, plan, 0)
    expect(progress).toMatchObject({ dayNumber: 1, expectedWords: 0, behind: 0 })
    expect(dailyTask(planPace(book, 30), progress, 0).newWords).toBe(10)
  })

  it('oldinda ketgan bola jazolanmaydi', () => {
    const progress = planProgress({ ...book, learned: 60 }, plan, 0)
    expect(progress.ahead).toBe(60)
    expect(progress.behind).toBe(0)
  })

  it('reja boshlanishidagi so‘zlar hisobga olinmaydi', () => {
    const started: StudyPlan = { ...plan, learnedAtStart: 100 }
    const progress = planProgress({ ...book, learned: 100 }, started, 0)
    expect(progress.learnedWords).toBe(0)
    expect(progress.targetWords).toBe(200)
  })

  it('hammasi o‘rganilgach reja bajarilgan', () => {
    expect(planProgress({ ...book, learned: 300 }, plan, 10 * DAY).done).toBe(true)
  })

  it('orqada qolganda ulush oshadi, lekin ikki baravardan ko‘p emas', () => {
    const pace = planPace(book, 30)
    const behind = planProgress({ ...book, learned: 0 }, plan, 10 * DAY)
    const task = dailyTask(pace, behind, 0)

    expect(pace.wordsPerDay).toBe(10)
    expect(task.newWords).toBe(20)
  })

  it('bugun bajarilgan ish vazifadan ayiriladi', () => {
    const pace = planPace(book, 30)
    const progress = planProgress({ ...book, learned: 10 }, plan, 0)
    expect(dailyTask(pace, progress, 4)).toMatchObject({ doneWords: 4, leftWords: 6, done: false })
    expect(dailyTask(pace, progress, 10).done).toBe(true)
  })

  it('reja tugagach bugungi vazifa yo‘q', () => {
    const pace = planPace({ ...book, learned: 300 }, 30)
    const progress = planProgress({ ...book, learned: 300 }, plan, 0)
    expect(dailyTask(pace, progress, 0).newWords).toBe(0)
  })
})

describe('minimal planka', () => {
  const book = {
    id: 'b',
    title: 'B',
    words: 300,
    learned: 0,
    mature: 0,
    lessons: 30,
    lessonsDone: 0,
    sentences: 0,
    wordsPerLesson: 10,
  }
  const plan: StudyPlan = { bookId: 'b', days: 30, startedAt: 0, learnedAtStart: 0 }

  it('eng yomon kunda ham bajariladigan kichik planka bor', async () => {
    const { MIN_DAILY_WORDS } = await import('./plan')
    const pace = planPace(book, 30)
    const progress = planProgress(book, plan, 0)

    expect(dailyTask(pace, progress, 0)).toMatchObject({
      minWords: MIN_DAILY_WORDS,
      minDone: false,
    })
    // Plankani bajargan bola zanjirni saqlaydi, vazifa to'liq bo'lmasa ham
    expect(dailyTask(pace, progress, MIN_DAILY_WORDS)).toMatchObject({
      minDone: true,
      done: false,
    })
  })

  it('planka kunlik vazifadan katta bo‘lmaydi', () => {
    // 60 so'z / 30 kun = kuniga 2 — planka ham 2
    const small = { ...book, words: 60 }
    const pace = planPace(small, 30)
    const progress = planProgress(small, { ...plan, days: 30 }, 0)
    expect(dailyTask(pace, progress, 0).minWords).toBe(2)
  })
})

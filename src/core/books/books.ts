import type { CardRecord } from '@/core/db'
import { splitTopic, unitIdOf } from '@/core/path'

/**
 * KITOB — lug'at manbasi ("Qiroat 1-kitob", "Enterprise 1").
 *
 * Kitob alohida saqlanmaydi: u kartalardagi mavzu nomining takroriy
 * qismidan (`splitTopic().section`) hisoblanadi. Shuning uchun yangi
 * kitob import qilinsa, u o'zi paydo bo'ladi va migratsiya kerak emas.
 */
export interface BookStats {
  /** Barqaror identifikator — URL va rejada ishlatiladi */
  id: string
  /** Ko'rinadigan nom */
  title: string
  /** Jami so'zlar */
  words: number
  /** Kamida bir marta ko'rilgan so'zlar */
  learned: number
  /** Mustahkam yodlanganlar (interval ≥ 21 kun) */
  mature: number
  /** Darslar (bo'limlar) soni */
  lessons: number
  /** Tugallangan darslar */
  lessonsDone: number
  /** Jumlasi bor so'zlar — "gap tuzish" mashqlari shulardan chiqadi */
  sentences: number
  /** O'rtacha: bitta darsda nechta so'z */
  wordsPerLesson: number
}

/** Kitobsiz (qo'lda yozilgan mavzular) uchun to'plam nomi */
export const OTHER_BOOK_TITLE = 'Asosiy lug‘at'

/** Nomdan barqaror id */
export function bookIdOf(title: string): string {
  return title
    .toLowerCase()
    .replace(/['’‘ʻʼ`´]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** So'z uzoq muddatli xotiradami (SM-2 intervali ≥ 21 kun) */
const MATURE_DAYS = 21

interface BookAccumulator {
  title: string
  words: number
  learned: number
  mature: number
  sentences: number
  units: Map<string, { total: number; learned: number }>
}

/**
 * Kartalardan kitoblar ro'yxati.
 *
 * Tartib — so'zlar soni bo'yicha EMAS, kartalar tartibida: lug'at
 * qanday tuzilgan bo'lsa, kitoblar ham shunday ketma-ketlikda
 * ko'rinadi ("1-kitob", "2-kitob", "3-kitob").
 */
export function buildBooks(cards: readonly CardRecord[]): BookStats[] {
  const order: string[] = []
  const map = new Map<string, BookAccumulator>()

  for (const card of cards) {
    const { section } = splitTopic(card.topic ?? '')
    const title = section ?? OTHER_BOOK_TITLE
    let book = map.get(title)
    if (!book) {
      book = { title, words: 0, learned: 0, mature: 0, sentences: 0, units: new Map() }
      order.push(title)
      map.set(title, book)
    }

    book.words += 1
    if (card.totalReviews > 0) book.learned += 1
    if (card.interval >= MATURE_DAYS) book.mature += 1
    if (card.sentence) book.sentences += 1

    if (card.level && card.topic) {
      const unitId = unitIdOf(card.level, card.topic)
      const unit = book.units.get(unitId) ?? { total: 0, learned: 0 }
      unit.total += 1
      if (card.totalReviews > 0) unit.learned += 1
      book.units.set(unitId, unit)
    }
  }

  return order.map((title) => {
    const book = map.get(title)!
    const lessons = book.units.size

    return {
      id: bookIdOf(title),
      title,
      words: book.words,
      learned: book.learned,
      mature: book.mature,
      lessons,
      lessonsDone: [...book.units.values()].filter((unit) => unit.learned === unit.total).length,
      sentences: book.sentences,
      wordsPerLesson: lessons === 0 ? 0 : Math.round(book.words / lessons),
    }
  })
}

/** Kitobga tegishli kartalar (reja seansi shulardan tuziladi) */
export function cardsOfBook(cards: readonly CardRecord[], bookId: string): CardRecord[] {
  return cards.filter(
    (card) => bookIdOf(splitTopic(card.topic ?? '').section ?? OTHER_BOOK_TITLE) === bookId,
  )
}

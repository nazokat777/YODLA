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
 * Kitoblar tartibi: avval asosiy lug'at, keyin nom bo'yicha TABIIY
 * tartibda ("1-kitob" < "2-kitob" < "10-kitob").
 *
 * Kartalar tartibiga tayanib bo'lmaydi: bazadan ular id bo'yicha
 * (alifbo) keladi va o'lchandi — "Qiroat 3-kitob" "2-kitob" dan oldin
 * chiqib qolgandi.
 */
function compareBooks(a: string, b: string): number {
  if (a === OTHER_BOOK_TITLE) return -1
  if (b === OTHER_BOOK_TITLE) return 1
  return a.localeCompare(b, 'uz', { numeric: true, sensitivity: 'base' })
}

/** Kartalardan kitoblar ro'yxati */
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

  return [...order].sort(compareBooks).map((title) => {
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

/**
 * Kitobning KEYINGI darsi — reja tugmasi shu yerga olib boradi.
 *
 * Umumiy "joriy dars" yaramaydi: bola "Qiroat 1-kitob"ni rejalagan,
 * lekin yo'lda joriy bo'lim "Asosiy lug'at"da bo'lishi mumkin — tugma
 * boshqa kitobning darsini ochib qo'yardi.
 *
 * `units` — o'quv yo'li tartibida (`buildUnits`). Tugallanmagan
 * birinchi bo'lim; hammasi tugagan bo'lsa `null`.
 */
export function nextUnitOfBook(
  units: readonly { id: string; section: string | null; learned: number; total: number }[],
  bookId: string,
): string | null {
  const unit = units.find(
    (candidate) =>
      bookIdOf(candidate.section ?? OTHER_BOOK_TITLE) === bookId && candidate.learned < candidate.total,
  )
  return unit?.id ?? null
}

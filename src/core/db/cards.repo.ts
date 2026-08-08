import Dexie from 'dexie'
import type { Grade, LanguageCode } from '@/core/types'
import { createCard, makeCardId, PASSING_GRADE, reviewSrsState, type NewCardInput } from '@/core/srs'
import { db } from './db'
import { MATURE_INTERVAL_DAYS, type CardRecord } from './schema'

/** Kartani bazaga yozishga tayyorlash uchun qo'shimcha ma'lumot */
export interface NewCardRecordInput extends NewCardInput {
  topic?: string
  level?: CardRecord['level']
  sentence?: string
  sentenceTranslation?: string
}

/** `NewCardInput` → to'liq `CardRecord` */
function toRecord(input: NewCardRecordInput, now: number): CardRecord {
  return {
    ...createCard(input, now),
    createdAt: now,
    lastReviewedAt: null,
    totalReviews: 0,
    lapses: 0,
    topic: input.topic,
    level: input.level,
    sentence: input.sentence,
    sentenceTranslation: input.sentenceTranslation,
  }
}

/**
 * Bazada hali mavjud bo'lmagan kartalarni qo'shadi va qo'shilganlar sonini
 * qaytaradi.
 *
 * Nega "mavjudini tekshirib" qo'shamiz: agar oddiy `bulkPut` ishlatilsa,
 * kontent qayta yuklanganda foydalanuvchining takrorlash progressi
 * (interval, easeFactor) nolga qaytib ketardi. Bu funksiya idempotent —
 * necha marta chaqirilsa ham natija bir xil.
 */
export async function addMissingCards(
  inputs: NewCardRecordInput[],
  now: number = Date.now(),
): Promise<number> {
  if (inputs.length === 0) return 0

  return db.transaction('rw', db.cards, async () => {
    const ids = inputs.map((input) => input.id ?? makeCardId(input.language, input.word))
    const existing = await db.cards.bulkGet(ids)

    // Bazada yo'q VA shu chaqiruv ichida hali uchramagan kartalar.
    // Ikkinchi shart muhim: kontent faylida bir so'z ikki marta yozilgan
    // bo'lsa (`Book` va `book` bir xil id beradi), aks holda qaytariladigan
    // son haqiqiy qo'shilganidan ko'p chiqardi.
    const seenIds = new Set<string>()
    const missing: CardRecord[] = []

    inputs.forEach((input, index) => {
      const id = ids[index]
      if (existing[index] !== undefined || seenIds.has(id)) return

      seenIds.add(id)
      missing.push(toRecord({ ...input, id }, now))
    })

    if (missing.length > 0) {
      await db.cards.bulkPut(missing)
    }

    return missing.length
  })
}

/**
 * Takrorlash muddati yetgan kartalar — eng "kechikkani" birinchi bo'lib.
 *
 * `[language+dueDate]` qo'shma indeksi bo'yicha oraliq skan qilinadi,
 * shuning uchun natija dueDate bo'yicha o'sish tartibida keladi.
 */
export async function getDueCards(
  language: LanguageCode,
  now: number = Date.now(),
  limit?: number,
): Promise<CardRecord[]> {
  const collection = db.cards
    .where('[language+dueDate]')
    .between([language, Dexie.minKey], [language, now], true, true)

  return limit === undefined ? collection.toArray() : collection.limit(limit).toArray()
}

/** Takrorlash muddati yetgan kartalar soni */
export function countDueCards(
  language: LanguageCode,
  now: number = Date.now(),
): Promise<number> {
  return db.cards
    .where('[language+dueDate]')
    .between([language, Dexie.minKey], [language, now], true, true)
    .count()
}

/**
 * Keyingi takrorlash vaqti (hozirdan keyingi eng yaqin `dueDate`).
 * Takrorlanadigan karta qolmaganda "yana qachon kelish kerak" deb
 * ko'rsatish uchun. Kartalar tugagan bo'lsa `null`.
 */
export async function getNextDueDate(
  language: LanguageCode,
  now: number = Date.now(),
): Promise<number | null> {
  const next = await db.cards
    .where('[language+dueDate]')
    .between([language, now], [language, Dexie.maxKey], false, true)
    .first()

  return next?.dueDate ?? null
}

/** Shu tildagi barcha kartalar */
export function getAllCards(language: LanguageCode): Promise<CardRecord[]> {
  return db.cards.where('language').equals(language).toArray()
}

/** Bitta kartani id bo'yicha olish */
export function getCard(cardId: string): Promise<CardRecord | undefined> {
  return db.cards.get(cardId)
}

/**
 * Kartaga baho qo'yish: SM-2 hisobi + statistika yangilanishi.
 *
 * Butun amal bitta tranzaksiyada bajariladi — o'qish va yozish orasida
 * boshqa yozuv oralab kirib, natijani buzib qo'ymasligi uchun.
 */
export async function gradeCard(
  cardId: string,
  grade: Grade,
  now: number = Date.now(),
): Promise<CardRecord> {
  return db.transaction('rw', db.cards, async () => {
    const existing = await db.cards.get(cardId)
    if (!existing) {
      throw new Error(`Karta topilmadi: ${cardId}`)
    }

    const failed = grade < PASSING_GRADE
    const updated: CardRecord = {
      ...existing,
      ...reviewSrsState(existing, grade, now),
      lastReviewedAt: now,
      totalReviews: existing.totalReviews + 1,
      lapses: failed ? existing.lapses + 1 : existing.lapses,
    }

    await db.cards.put(updated)
    return updated
  })
}

/**
 * Kartaga mnemonik assotsiatsiya yozish (TZ 3.3, Keyword Method).
 *
 * Bo'sh satr berilsa mnemonika o'chiriladi. Mnemonika takrorlash paytida
 * — aynan xato qilingan lahzada — ko'rsatiladi, chunki assotsiatsiya
 * eng ko'p kerak bo'ladigan payt shu.
 */
export async function setMnemonic(cardId: string, mnemonic: string): Promise<void> {
  const trimmed = mnemonic.trim()

  const updated = await db.cards.update(cardId, {
    mnemonic: trimmed.length > 0 ? trimmed : undefined,
  })

  if (updated === 0) {
    throw new Error(`Karta topilmadi: ${cardId}`)
  }
}

/** Profil va bosh ekran uchun statistika */
export interface LanguageStats {
  /** Jami kartalar */
  total: number
  /** Hozir takrorlashga tayyor */
  due: number
  /** Hali bir marta ham ko'rilmagan */
  fresh: number
  /** O'rganilmoqda (kamida bir marta to'g'ri, lekin hali mustahkam emas) */
  learning: number
  /** Mustahkam yodlangan (interval ≥ 21 kun) */
  mature: number
}

/**
 * Statistika bitta o'qishda hisoblanadi.
 * Kartalar soni MVP miqyosida (yuzlab) — xotirada sanash indeks bo'yicha
 * bir necha marta so'rov yuborishdan arzonroq.
 */
export async function getLanguageStats(
  language: LanguageCode,
  now: number = Date.now(),
): Promise<LanguageStats> {
  const cards = await getAllCards(language)

  const stats: LanguageStats = { total: cards.length, due: 0, fresh: 0, learning: 0, mature: 0 }

  for (const card of cards) {
    if (card.dueDate <= now) stats.due += 1

    // "fresh" — hech qachon ko'rilmagan. `repetitions === 0` emas, chunki
    // xato javobdan keyin repetitions nolga qaytadi, lekin karta yangi emas.
    if (card.totalReviews === 0) stats.fresh += 1
    else if (card.interval >= MATURE_INTERVAL_DAYS) stats.mature += 1
    else stats.learning += 1
  }

  return stats
}

/**
 * Barcha tillar bo'yicha yig'ma ko'rsatkichlar — nishonlar uchun.
 *
 * Nishonlar tilga bog'liq emas: "100 so'z yodlandi" yutug'i uch tilda
 * 40+30+30 so'z o'rgangan foydalanuvchiga ham berilishi kerak.
 */
export async function getGlobalCardStats(): Promise<{
  total: number
  /** Kamida bir marta mashq qilingan so'zlar */
  learned: number
  /** Mustahkam yodlangan so'zlar (interval ≥ 21 kun) */
  mature: number
}> {
  const cards = await db.cards.toArray()

  let learned = 0
  let mature = 0

  for (const card of cards) {
    if (card.totalReviews > 0) learned += 1
    if (card.interval >= MATURE_INTERVAL_DAYS) mature += 1
  }

  return { total: cards.length, learned, mature }
}

/** Barcha kartalarni o'chirish (testlar va "progressni tozalash" uchun) */
export async function clearAllCards(): Promise<void> {
  await db.cards.clear()
}

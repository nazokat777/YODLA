import { levelRank } from '@/core/config/levels'
import type { CardRecord } from '@/core/db'
import type { LevelCode } from '@/core/types'

/**
 * Tartiblash guruhlari (kichigi oldin).
 *
 * `LOW_LEVEL_NEW` — foydalanuvchi daraja testida "bilaman" deb ko'rsatgan
 * darajadagi yangi so'zlar. Ular O'CHIRILMAYDI, faqat zaxiraga suriladi:
 * A2 dan boshlagan foydalanuvchining A2/B1 so'zlari tugasa, dars bo'sh
 * qaytmasligi kerak.
 */
const GROUP = { NEW: 0, SEEN: 1, LOW_LEVEL_NEW: 2 } as const

function groupOf(card: CardRecord, minRank: number): number {
  if (card.totalReviews > 0) return GROUP.SEEN

  return levelRank(card.level) < minRank ? GROUP.LOW_LEVEL_NEW : GROUP.NEW
}

/**
 * Darsga chiqadigan kartalarni tanlaydi.
 *
 * Tartib mezonlari (ketma-ket):
 *   1. guruh — yangi → mustahkamlash → past darajadagi yangi
 *   2. daraja — A1 → A2 → B1
 *   3. kam ko'rilgani oldin (`totalReviews`)
 *   4. eng kam mustahkamlangani oldin (`interval`)
 *
 * NEGA daraja BIRINCHI mezon emas: A1 kartalari o'rganib bo'lingandan
 * keyin ham ro'yxatda qoladi. Daraja birinchi bo'lsa, ular har doim A2
 * dan oldin turardi va dars A1 da abadiy qolib ketardi. "Ko'rilmagan"
 * mezonini oldinga qo'yish "eng past TUGALLANMAGAN darajadan" degan
 * qoidani beradi: A1 yangi so'zlari tugagach A2 o'zi ochiladi.
 *
 * Bu domen qoidasi (qaysi so'z keyingi o'rgatiladi), UI emas — shuning
 * uchun ekrandan ajratilgan va React'siz test qilinadi.
 *
 * @param minLevel daraja testi natijasi; berilmasa hamma daraja teng
 */
export function pickLessonCards(
  cards: CardRecord[],
  size: number,
  minLevel?: LevelCode,
): CardRecord[] {
  const minRank = minLevel === undefined ? 0 : levelRank(minLevel)

  // Nusxa olinadi: chaqiruvchi bergan massiv o'zgarmasligi kerak
  return [...cards]
    .sort((a, b) => {
      const byGroup = groupOf(a, minRank) - groupOf(b, minRank)
      if (byGroup !== 0) return byGroup

      const byLevel = levelRank(a.level) - levelRank(b.level)
      if (byLevel !== 0) return byLevel

      if (a.totalReviews !== b.totalReviews) return a.totalReviews - b.totalReviews

      return a.interval - b.interval
    })
    .slice(0, size)
}

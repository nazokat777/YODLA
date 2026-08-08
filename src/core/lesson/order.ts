import { levelRank } from '@/core/config/levels'
import type { CardRecord } from '@/core/db'

/**
 * Darsga chiqadigan kartalarni tanlaydi.
 *
 * Tartib mezonlari (ketma-ket):
 *   1. hali ko'rilmagan kartalar oldin — dars YANGI so'z o'rgatadi
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
 * Yangi so'z qolmaganda ro'yxat mustahkamlashga o'tadi (eng zaif karta
 * oldin) — shuning uchun dars hech qachon bo'sh qaytmaydi.
 *
 * Bu domen qoidasi (qaysi so'z keyingi o'rgatiladi), UI emas — shuning
 * uchun ekrandan ajratilgan va React'siz test qilinadi.
 */
export function pickLessonCards(cards: CardRecord[], size: number): CardRecord[] {
  // Nusxa olinadi: chaqiruvchi bergan massiv o'zgarmasligi kerak
  return [...cards]
    .sort((a, b) => {
      const aSeen = a.totalReviews > 0 ? 1 : 0
      const bSeen = b.totalReviews > 0 ? 1 : 0
      if (aSeen !== bSeen) return aSeen - bSeen

      const byLevel = levelRank(a.level) - levelRank(b.level)
      if (byLevel !== 0) return byLevel

      if (a.totalReviews !== b.totalReviews) return a.totalReviews - b.totalReviews

      return a.interval - b.interval
    })
    .slice(0, size)
}

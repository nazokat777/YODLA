import type { NewCardRecordInput } from '@/core/db'

/**
 * Lug'at KONTENTINING barmoq izi.
 *
 * Nima uchun: ilova har ochilganda `syncCardContent` va `pruneRemovedCards`
 * butun lug'at bo'ylab yugurardi — 3600 kartada ~170 ms, va deyarli har safar
 * HECH NARSA o'zgarmaydi (lug'at build artefakti, u faqat yangi versiya
 * chiqqanda o'zgaradi). Barmoq izi shu ishni o'tkazib yuborish uchun: uni
 * hisoblash ~9 ms, ya'ni 19 baravar arzon.
 *
 * Faqat KONTENT maydonlari kiradi — SM-2 holati (interval, easeFactor)
 * foydalanuvchiniki va lug'at bilan bog'liq emas.
 *
 * FNV-1a: sodda, tez va bog'liqliksiz. Bu yerda kriptografik kuch kerak
 * emas — vazifa "o'zgardimi yoki yo'q" degan savolga javob berish.
 */
export function deckFingerprint(deck: readonly NewCardRecordInput[]): string {
  let hash = 2166136261

  for (const card of deck) {
    const parts = `${card.word}|${card.translation}|${card.topic ?? ''}|${card.level ?? ''}|${card.sentence ?? ''}|${card.sentenceTranslation ?? ''}`

    for (let i = 0; i < parts.length; i += 1) {
      hash ^= parts.charCodeAt(i)
      hash = Math.imul(hash, 16777619)
    }
  }

  // Kartalar soni ham qo'shiladi: nazariy to'qnashuvda ham hajm farqi
  // sezilib qolsin
  return `${deck.length}-${(hash >>> 0).toString(36)}`
}

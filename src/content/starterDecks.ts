import { LEVEL_ORDER } from '@/core/config/levels'
import type { NewCardRecordInput } from '@/core/db'
import type { LanguageCode, LevelCode } from '@/core/types'
import { AR_DECK } from './decks/ar'
import { EN_DECK } from './decks/en'
import { RU_DECK } from './decks/ru'

/** Til → daraja → so'zlar. Daraja bo'yicha so'rovlar uchun ochiq qoldirilgan */
export const DECKS: Record<LanguageCode, Record<LevelCode, NewCardRecordInput[]>> = {
  en: EN_DECK,
  ru: RU_DECK,
  ar: AR_DECK,
}

/** Bitta tilning barcha so'zlari — daraja tartibida (A1 → A2 → B1) */
function flatten(deck: Record<LevelCode, NewCardRecordInput[]>): NewCardRecordInput[] {
  return LEVEL_ORDER.flatMap((level) => deck[level])
}

/**
 * Bazaga yoziladigan boshlang'ich to'plamlar.
 *
 * Tartib dars uchun muhim emas (uni `pickLessonCards` aniqlaydi), lekin
 * daraja bo'yicha yig'ish faylni o'qishni osonlashtiradi.
 */
export const STARTER_DECKS: Record<LanguageCode, NewCardRecordInput[]> = {
  en: flatten(EN_DECK),
  ru: flatten(RU_DECK),
  ar: flatten(AR_DECK),
}

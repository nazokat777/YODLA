import { LEVEL_ORDER } from '@/core/config/levels'
import type { NewCardRecordInput } from '@/core/db'
import type { LanguageCode, LevelCode } from '@/core/types'
import { AR_DECK } from './decks/ar'
import { EN_DECK } from './decks/en'
import { RU_DECK } from './decks/ru'
import { RU_EXTRA } from './decks/ru-extra'
import { RU_DICT } from './decks/imported-ru'
import { AR_IMPORTED } from './decks/imported-ar'
import { EN_IMPORTED } from './decks/imported-en'

type Deck = Record<LevelCode, NewCardRecordInput[]>

/**
 * Qo'lda yozilgan to'plamga import qilingan lug'atni qo'shadi.
 *
 * Qo'lda yozilganlari OLDIN keladi (jumlasi bor — "jumla qurish" mashqi
 * shulardan boshlanadi). Import qilinganlarida jumla yo'q.
 */
function withImported(base: Deck, imported: Deck): Deck {
  return LEVEL_ORDER.reduce(
    (acc, level) => ({ ...acc, [level]: [...base[level], ...imported[level]] }),
    {} as Deck,
  )
}

/** Til → daraja → so'zlar. Daraja bo'yicha so'rovlar uchun ochiq qoldirilgan */
export const DECKS: Record<LanguageCode, Deck> = {
  en: withImported(EN_DECK, EN_IMPORTED),
  ru: withImported(withImported(RU_DECK, RU_EXTRA), RU_DICT),
  ar: withImported(AR_DECK, AR_IMPORTED),
}

/** Bitta tilning barcha so'zlari — daraja tartibida (A1 → A2 → B1) */
function flatten(deck: Deck): NewCardRecordInput[] {
  return LEVEL_ORDER.flatMap((level) => deck[level])
}

/**
 * Bazaga yoziladigan boshlang'ich to'plamlar.
 *
 * Tartib dars uchun muhim emas (uni `pickLessonCards` aniqlaydi), lekin
 * daraja bo'yicha yig'ish faylni o'qishni osonlashtiradi.
 */
export const STARTER_DECKS: Record<LanguageCode, NewCardRecordInput[]> = {
  en: flatten(DECKS.en),
  ru: flatten(DECKS.ru),
  ar: flatten(DECKS.ar),
}

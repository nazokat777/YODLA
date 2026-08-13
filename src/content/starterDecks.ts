import { LEVEL_ORDER } from '@/core/config/levels'
import type { NewCardRecordInput } from '@/core/db'
import type { LanguageCode, LevelCode } from '@/core/types'

export type Deck = Record<LevelCode, NewCardRecordInput[]>

/** Bir nechta to'plamni daraja bo'yicha birlashtiradi */
function merge(...decks: Deck[]): Deck {
  return LEVEL_ORDER.reduce(
    (acc, level) => ({ ...acc, [level]: decks.flatMap((deck) => deck[level]) }),
    {} as Deck,
  )
}

/**
 * Til lug'atini DANGASA yuklaydi.
 *
 * Har til alohida bo'lakka (`import(...)`) chiqadi, shuning uchun asosiy
 * JS fayliga ~7500 so'z pishirilmaydi: faqat foydalanuvchi TANLAGAN
 * tilning lug'ati yuklanadi. Qo'lda yozilganlari OLDIN keladi (jumlasi
 * bor — "jumla qurish" mashqi shulardan boshlanadi).
 */
export async function loadLanguageDeck(lang: LanguageCode): Promise<Deck> {
  switch (lang) {
    case 'en': {
      const [{ EN_DECK }, { EN_IMPORTED }] = await Promise.all([
        import('./decks/en'),
        import('./decks/imported-en'),
      ])
      return merge(EN_DECK, EN_IMPORTED)
    }
    case 'ru': {
      const [{ RU_DECK }, { RU_EXTRA }, { RU_DICT }] = await Promise.all([
        import('./decks/ru'),
        import('./decks/ru-extra'),
        import('./decks/imported-ru'),
      ])
      return merge(RU_DECK, RU_EXTRA, RU_DICT)
    }
    case 'ar': {
      const [{ AR_DECK }, { AR_IMPORTED }] = await Promise.all([
        import('./decks/ar'),
        import('./decks/imported-ar'),
      ])
      return merge(AR_DECK, AR_IMPORTED)
    }
  }
}

/** Bitta tilning barcha so'zlari — daraja tartibida (A1 → A2 → B1) */
export function flatten(deck: Deck): NewCardRecordInput[] {
  return LEVEL_ORDER.flatMap((level) => deck[level])
}

/** Bazaga yoziladigan boshlang'ich to'plam (dangasa yuklanadi) */
export async function loadStarterDeck(lang: LanguageCode): Promise<NewCardRecordInput[]> {
  return flatten(await loadLanguageDeck(lang))
}

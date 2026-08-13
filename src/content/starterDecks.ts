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
 * Jumlasiz kartalarga tashqi jumla biriktiradi ("gap ichida" mashqi uchun).
 *
 * Jumlalar lug'atning O'ZIDA saqlanmaydi: ular boshqa manbadan (Tatoeba)
 * keladi va alohida generator bilan yangilanadi. Ularni har bir karta
 * yozuviga qo'shib qo'yish ikkala faylni ham qo'lda sinxron ushlashni
 * talab qilardi.
 *
 * Mavjud jumla USTIGA YOZILMAYDI: qo'lda yozilganlarida tarjimasi ham bor
 * va ular "jumla qurish" mashqiga xizmat qiladi.
 */
function withSentences(deck: Deck, sentences: Record<string, string>): Deck {
  return LEVEL_ORDER.reduce(
    (acc, level) => ({
      ...acc,
      [level]: deck[level].map((card) =>
        card.sentence ? card : { ...card, sentence: sentences[card.word.toLowerCase()] },
      ),
    }),
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
      const [{ EN_DECK }, { EN_APP }, { EN_IMPORTED }, { EN_SENTENCES }] = await Promise.all([
        import('./decks/en'),
        import('./decks/imported-en-app'),
        import('./decks/imported-en'),
        import('./decks/sentences-en'),
      ])
      return withSentences(merge(EN_DECK, EN_APP, EN_IMPORTED), EN_SENTENCES)
    }
    case 'ru': {
      const [{ RU_DECK }, { RU_EXTRA }, { RU_DICT }, { RU_SENTENCES }] = await Promise.all([
        import('./decks/ru'),
        import('./decks/ru-extra'),
        import('./decks/imported-ru'),
        import('./decks/sentences-ru'),
      ])
      return withSentences(merge(RU_DECK, RU_EXTRA, RU_DICT), RU_SENTENCES)
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

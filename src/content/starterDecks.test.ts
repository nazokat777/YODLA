import { describe, expect, it } from 'vitest'
import { LEVEL_ORDER } from '@/core/config/levels'
import type { LanguageCode } from '@/core/types'
import { flatten, loadLanguageDeck, loadStarterDeck } from './starterDecks'

const LANGUAGES: LanguageCode[] = ['en', 'ru', 'ar']

describe('flatten', () => {
  it('darajalar TARTIBIDA yassilaydi', () => {
    const deck = {
      A1: [{ word: 'a', translation: 'a', language: 'en' as const }],
      A2: [{ word: 'b', translation: 'b', language: 'en' as const }],
      B1: [{ word: 'c', translation: 'c', language: 'en' as const }],
    }

    // Dars kartalarni shu tartibda oladi: A1 tugamaguncha A2 ochilmaydi
    expect(flatten(deck).map((card) => card.word)).toEqual(['a', 'b', 'c'])
  })

  it('bo‘sh darajalar tushib qoladi', () => {
    const deck = {
      A1: [],
      A2: [{ word: 'b', translation: 'b', language: 'en' as const }],
      B1: [],
    }

    expect(flatten(deck)).toHaveLength(1)
  })
})

describe.each(LANGUAGES)('loadLanguageDeck — %s', (language) => {
  it('uchala daraja ham mavjud', async () => {
    const deck = await loadLanguageDeck(language)

    for (const level of LEVEL_ORDER) {
      expect(Array.isArray(deck[level])).toBe(true)
    }
  })

  it('QO‘LDA yozilgan jumla tarjimasi USTIGA yozilmaydi', async () => {
    const cards = flatten(await loadLanguageDeck(language))

    /*
     * Tashqi jumlalar (Tatoeba) tarjimasiz keladi va faqat "gap ichida"
     * mashqiga yaraydi. Qo'lda yozilganlarida tarjima ham bor — ular
     * "jumla qurish" mashqini ochadi.
     *
     * Agar tashqi jumla mavjudining USTIGA yozilsa, o'sha mashq
     * jimgina yo'qolardi.
     */
    const withTranslation = cards.filter((card) => card.sentenceTranslation)

    expect(withTranslation.length).toBeGreaterThan(0)
    for (const card of withTranslation) {
      expect(card.sentence, `${card.word}: tarjima bor, jumla yo'q`).toBeTruthy()
    }
  })

  it('har kartada so‘z va tarjima bor', async () => {
    const cards = flatten(await loadLanguageDeck(language))

    const broken = cards.filter((card) => !card.word?.trim() || !card.translation?.trim())

    expect(broken).toEqual([])
  })

  it('loadStarterDeck yassilangan ro‘yxat qaytaradi', async () => {
    const [deck, flat] = await Promise.all([
      loadLanguageDeck(language),
      loadStarterDeck(language),
    ])

    expect(flat).toHaveLength(flatten(deck).length)
  })
})

describe('tashqi jumlalar ustuvorligi', () => {
  it("qo'lda yozilgan jumla o'z joyida qoladi", async () => {
    /*
     * `hello` ikkala manbada ham bor: qo'lda yozilganida "Hello my
     * friend" va tarjimasi, Tatoeba'da esa "Hello to you." (tarjimasiz).
     *
     * Tashqi jumla ustiga yozilsa, "jumla qurish" mashqi shu kartada
     * jimgina yo'qolardi — tarjima bo'lmagani uchun.
     *
     * 132 ta qo'lda yozilgan jumladan 130 tasi tashqi ro'yxatda ham
     * bor, ya'ni bu qoida har yuklashda ishlaydi.
     */
    const cards = flatten(await loadLanguageDeck('en'))
    const hello = cards.find((card) => card.word.toLowerCase() === 'hello')

    expect(hello?.sentence).toBe('Hello my friend')
    expect(hello?.sentenceTranslation).toBe("Salom, do'stim")
  })
})

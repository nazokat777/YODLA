import { describe, expect, it } from 'vitest'
import { LANGUAGES } from '@/core/config/languages'
import { LEVEL_ORDER } from '@/core/config/levels'
import { transliterate } from '@/core/text/transliterate'
import { normalizeAnswer } from '@/core/exercises/normalize'
import { makeCardId } from '@/core/srs'
import type { LanguageCode } from '@/core/types'
import { flatten, loadLanguageDeck } from './starterDecks'

const LANGUAGE_CODES: LanguageCode[] = ['en', 'ru', 'ar']

// Lug'at endi dangasa yuklanadi — testda barchasini oldindan olamiz
const DECKS = {
  en: await loadLanguageDeck('en'),
  ru: await loadLanguageDeck('ru'),
  ar: await loadLanguageDeck('ar'),
}
const STARTER_DECKS = {
  en: flatten(DECKS.en),
  ru: flatten(DECKS.ru),
  ar: flatten(DECKS.ar),
}

describe.each(LANGUAGE_CODES)('%s to‘plami', (language) => {
  const deck = DECKS[language]
  const all = LEVEL_ORDER.flatMap((level) => deck[level])

  it('har darajada kamida bitta so‘z bor', () => {
    LEVEL_ORDER.forEach((level) => {
      expect(deck[level].length).toBeGreaterThan(0)
    })
  })

  it('takrorlanuvchi so‘z yo‘q', () => {
    const ids = all.map((card) => makeCardId(card.language, card.word))

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('ikki so‘zning tarjimasi bir xil emas', () => {
    // Mashq generatori chalg'ituvchi variantlarni shu tildagi boshqa
    // so'zlardan oladi. Ikki so'z bir xil tarjimaga ega bo'lsa, savolda
    // ikkita "to'g'ri" variant paydo bo'lardi.
    const translations = all.map((card) => card.translation)
    const duplicates = translations.filter(
      (value, index) => translations.indexOf(value) !== index,
    )

    expect(duplicates).toEqual([])
  })

  it('so‘zlar normallashtirilgandan keyin ham farqlanadi', () => {
    // Javob tekshirishda arab harakalari tushiriladi, rus `ё` → `е` bo'ladi.
    // Ikki so'z shundan keyin bir xil bo'lib qolsa, foydalanuvchi to'g'ri
    // yozsa ham "xato" olishi mumkin edi (masalan مَطَار va مَطَر).
    const normalized = all.map((card) => normalizeAnswer(card.word, language))
    const duplicates = normalized.filter((value, index) => normalized.indexOf(value) !== index)

    expect(duplicates).toEqual([])
  })

  it('lotin bo‘lmagan yozuvdagi har so‘z o‘qilishini beradi', () => {
    // Transliteratsiya hisoblab chiqariladi. Agar biror belgi jadvalga
    // kiritilmagan bo'lsa, natijada o'sha belgi o'zgarmasdan qolib ketardi —
    // foydalanuvchi "o'qishga yordam" o'rniga yana o'sha yozuvni ko'rardi.
    const { script } = LANGUAGES[language]
    if (script === 'latin') return

    all.forEach((card) => {
      const reading = transliterate(card.word, script)

      expect(reading).toBeTruthy()
      expect(reading).toMatch(/^[a-z' -]+$/i)
    })
  })

  it('majburiy maydonlar to‘ldirilgan', () => {
    all.forEach((card) => {
      expect(card.word.trim()).not.toBe('')
      expect(card.translation.trim()).not.toBe('')
      expect(card.topic?.trim()).toBeTruthy()
    })
  })

  it('jumla bo‘lsa, tarjimasi ham bo‘ladi', () => {
    // Jumla IXTIYORIY (import qilingan lug'atlarda yo'q — o'shanda "jumla
    // qurish" mashqi berilmaydi). Lekin jumla bor bo'lsa, tarjimasisiz
    // qolmasligi kerak: FeedbackBar uni kontekst sifatida ko'rsatadi.
    all.forEach((card) => {
      if (card.sentence?.trim()) {
        expect(card.sentenceTranslation?.trim()).toBeTruthy()
      }
    })
  })

  it('har kartaning tili va darajasi o‘z guruhiga mos', () => {
    LEVEL_ORDER.forEach((level) => {
      deck[level].forEach((card) => {
        expect(card.language).toBe(language)
        expect(card.level).toBe(level)
      })
    })
  })

  it('STARTER_DECKS daraja tartibida yig‘ilgan', () => {
    const ranks = STARTER_DECKS[language].map((card) => LEVEL_ORDER.indexOf(card.level!))
    const sorted = [...ranks].sort((a, b) => a - b)

    expect(ranks).toEqual(sorted)
    expect(STARTER_DECKS[language]).toHaveLength(all.length)
  })
})

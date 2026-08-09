import { describe, expect, it } from 'vitest'
import { LEVEL_ORDER } from '@/core/config/levels'
import { normalizeAnswer } from '@/core/exercises/normalize'
import { makeCardId } from '@/core/srs'
import type { LanguageCode } from '@/core/types'
import { DECKS, STARTER_DECKS } from './starterDecks'

const LANGUAGES: LanguageCode[] = ['en', 'ru', 'ar']

describe.each(LANGUAGES)('%s to‘plami', (language) => {
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

  it('majburiy maydonlar to‘ldirilgan', () => {
    all.forEach((card) => {
      expect(card.word.trim()).not.toBe('')
      expect(card.translation.trim()).not.toBe('')
      expect(card.topic?.trim()).toBeTruthy()
      expect(card.sentence?.trim()).toBeTruthy()
      expect(card.sentenceTranslation?.trim()).toBeTruthy()
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

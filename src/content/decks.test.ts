import { describe, expect, it } from 'vitest'
import { LEVEL_ORDER } from '@/core/config/levels'
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

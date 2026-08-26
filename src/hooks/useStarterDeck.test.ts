import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useStarterDeck } from './useStarterDeck'
import { useSettingsStore } from '@/stores/useSettingsStore'
import * as starterDecks from '@/content/starterDecks'
import { countCards, getAllCards } from '@/core/db'

const DECK = {
  A1: [
    {
      word: 'water',
      translation: 'suv',
      language: 'en' as const,
      topic: 'Ovqat',
      level: 'A1' as const,
    },
  ],
  A2: [],
  B1: [],
}

beforeEach(() => {
  useSettingsStore.setState({ learningLanguage: 'en' })
  vi.spyOn(starterDecks, 'loadLanguageDeck').mockResolvedValue(DECK)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useStarterDeck', () => {
  it('bo‘sh bazaga lug‘atni yozadi', async () => {
    renderHook(() => useStarterDeck())

    await waitFor(async () => {
      expect(await countCards('en')).toBe(1)
    })
  })

  it('ikkinchi ochilishda lug‘atni UMUMAN yuklamaydi', async () => {
    // Birinchi ochilish — baza to'ladi va belgi qo'yiladi
    const first = renderHook(() => useStarterDeck())
    await waitFor(async () => {
      expect(await countCards('en')).toBe(1)
    })
    first.unmount()

    const load = vi.spyOn(starterDecks, 'loadLanguageDeck')
    load.mockClear()

    renderHook(() => useStarterDeck())

    // Kutamiz: agar yuklasa, shu vaqt ichida chaqiriladi
    await new Promise((resolve) => setTimeout(resolve, 50))

    expect(load).not.toHaveBeenCalled()
  })

  it('baza tozalangan bo‘lsa belgiga qaramay qayta yozadi', async () => {
    const first = renderHook(() => useStarterDeck())
    await waitFor(async () => {
      expect(await countCards('en')).toBe(1)
    })
    first.unmount()

    // Brauzer IndexedDB'ni tozaladi, localStorage esa qoldi
    const cards = await getAllCards('en')
    expect(cards).toHaveLength(1)
    const { db } = await import('@/core/db/db')
    await db.cards.clear()

    renderHook(() => useStarterDeck())

    await waitFor(async () => {
      expect(await countCards('en')).toBe(1)
    })
  })
})

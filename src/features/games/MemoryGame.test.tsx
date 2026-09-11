import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { addMissingCards, db } from '@/core/db'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { MemoryGame } from './MemoryGame'

const WORDS = [
  { word: 'apple', translation: 'olma', language: 'en' as const },
  { word: 'bread', translation: 'non', language: 'en' as const },
  { word: 'water', translation: 'suv', language: 'en' as const },
  { word: 'milk', translation: 'sut', language: 'en' as const },
  { word: 'tea', translation: 'choy', language: 'en' as const },
  { word: 'salt', translation: 'tuz', language: 'en' as const },
]

/** Barcha seed kartalarini "ko'rilgan" holatga o'tkazadi */
async function markSeen() {
  await db.cards.toCollection().modify({ totalReviews: 1 })
}

function renderGame() {
  useSettingsStore.getState().reset()
  useSettingsStore.getState().setLearningLanguage('en')

  return render(
    <MemoryRouter>
      <MemoryGame />
    </MemoryRouter>,
  )
}

const closedTiles = () => screen.getAllByRole('button', { name: /yopiq katak/i })

describe('MemoryGame', () => {
  beforeEach(async () => {
    await db.cards.clear()
    await db.profile.clear()
    await addMissingCards(WORDS)
    // O'yinlar FAQAT ko'rilgan so'zlarni oladi — seeddagilar "ko'rilgan" qilinadi
    await markSeen()
  })

  it('so‘z kam bo‘lsa o‘yin boshlanmaydi', async () => {
    await db.cards.clear()
    await addMissingCards(WORDS.slice(0, 2))

    renderGame()

    expect(await screen.findByText(/kamida 6 ta so.z kerak/i)).toBeInTheDocument()
  })

  it('hamma katak YOPIQ boshlanadi', async () => {
    renderGame()

    await waitFor(() => {
      expect(closedTiles()).toHaveLength(12)
    })
    // Matn umuman chizilmaydi — ekran o'quvchi ham o'qiy olmaydi
    expect(screen.queryByText('apple')).not.toBeInTheDocument()
  })

  it('katak bosilganda ochiladi', async () => {
    renderGame()

    await waitFor(() => {
      expect(closedTiles().length).toBeGreaterThan(0)
    })
    fireEvent.click(closedTiles()[0])

    await waitFor(() => {
      expect(closedTiles()).toHaveLength(11)
    })
  })

  it('UCHINCHI katak ochilmaydi', async () => {
    /*
     * Ikkitasi ochiqligida uchinchisiga ruxsat berilsa, bola tez-tez
     * bosib butun taxtani ko'rib olardi.
     */
    renderGame()

    await waitFor(() => {
      expect(closedTiles().length).toBeGreaterThan(2)
    })
    const tiles = closedTiles()
    fireEvent.click(tiles[0])
    fireEvent.click(tiles[1])
    fireEvent.click(tiles[2])

    expect(closedTiles()).toHaveLength(10)
  })
})

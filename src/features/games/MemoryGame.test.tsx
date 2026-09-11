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

  it('mos kelmagan ochish so‘zni SM-2 da JAZOLAMAYDI', async () => {
    /*
     * 12 katakli taxtada birinchi urinishlarning deyarli hammasi "xato"
     * — bu o'yin mexanikasi, unutish emas. Ilgari har biri 2 baho olar,
     * so'z jadvalda noldan boshlanar va "qiyin so'zlar" ro'yxatiga
     * tushardi.
     */
    renderGame()

    await waitFor(() => {
      expect(closedTiles()).toHaveLength(12)
    })

    // Bir xil kartaning ikki tomonini emas, ikki XIL kartani ochamiz:
    // aria-label ochilgach matnni beradi
    const tiles = closedTiles()
    fireEvent.click(tiles[0])
    fireEvent.click(tiles[1])

    await waitFor(() => {
      expect(closedTiles()).toHaveLength(10)
    })
    const opened = screen
      .getAllByRole('button')
      .filter((node) => !/yopiq katak/i.test(node.getAttribute('aria-label') ?? ''))
      .map((node) => node.getAttribute('aria-label'))
    const pairMatched = WORDS.some(
      (entry) => opened.includes(entry.word) && opened.includes(entry.translation),
    )
    if (pairMatched) return // tasodifan juft chiqdi — bu holat boshqa test mavzusi

    // Yozuvlar tugashini kutamiz, keyin hech bir karta yiqilmaganini ko'ramiz
    await new Promise((resolve) => setTimeout(resolve, 200))
    const cards = await db.cards.toArray()
    expect(cards.every((card) => card.lapses === 0)).toBe(true)
    expect(cards.every((card) => card.interval >= 0)).toBe(true)
  })
})

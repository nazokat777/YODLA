import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { addMissingCards, db } from '@/core/db'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { TrueFalseGame } from './TrueFalseGame'

const WORDS = [
  { word: 'apple', translation: 'olma', language: 'en' as const },
  { word: 'bread', translation: 'non', language: 'en' as const },
  { word: 'water', translation: 'suv', language: 'en' as const },
]

function renderGame() {
  useSettingsStore.getState().reset()
  useSettingsStore.getState().setLearningLanguage('en')

  return render(
    <MemoryRouter>
      <TrueFalseGame />
    </MemoryRouter>,
  )
}

describe('TrueFalseGame', () => {
  beforeEach(async () => {
    await db.cards.clear()
    await db.profile.clear()
    await addMissingCards(WORDS)
  })

  it('so‘z va taklif qilingan tarjima ko‘rsatiladi', async () => {
    renderGame()

    const word = await screen.findByTestId('tf-word')
    const shown = screen.getByTestId('tf-shown')

    expect(WORDS.some((entry) => entry.word === word.textContent?.trim())).toBe(true)
    expect(WORDS.some((entry) => entry.translation === shown.textContent?.trim())).toBe(true)
  })

  it('javobdan keyin keyingi savolga o‘tadi', async () => {
    renderGame()

    await screen.findByTestId('tf-word')
    expect(screen.getByTestId('tf-progress')).toHaveTextContent('0/15')

    fireEvent.click(screen.getByRole('button', { name: /ha/i }))

    await waitFor(() => {
      expect(screen.getByTestId('tf-progress')).toHaveTextContent('1/15')
    })
  })

  it('so‘z kam bo‘lsa o‘yin boshlanmaydi', async () => {
    await db.cards.clear()
    await addMissingCards([WORDS[0]])

    renderGame()

    expect(await screen.findByText(/kamida 2 ta so.z kerak/i)).toBeInTheDocument()
  })
})

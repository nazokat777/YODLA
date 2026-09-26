import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { addMissingCards, db, type NewCardRecordInput } from '@/core/db'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { BooksScreen } from './BooksScreen'

/** Ikki kitob: 4 + 2 so'z */
const WORDS: NewCardRecordInput[] = [
  { word: 'a', translation: 'aa', language: 'en', topic: 'Kitob 1 · 1-dars', level: 'A1' },
  { word: 'b', translation: 'bb', language: 'en', topic: 'Kitob 1 · 1-dars', level: 'A1' },
  { word: 'c', translation: 'cc', language: 'en', topic: 'Kitob 1 · 2-dars', level: 'A1' },
  { word: 'd', translation: 'dd', language: 'en', topic: 'Kitob 1 · 2-dars', level: 'A1' },
  { word: 'e', translation: 'ee', language: 'en', topic: 'Kitob 2 · 1-dars', level: 'A1' },
  { word: 'f', translation: 'ff', language: 'en', topic: 'Kitob 2 · 1-dars', level: 'A1' },
]

function renderBooks() {
  useSettingsStore.getState().reset()
  useSettingsStore.getState().setLearningLanguage('en')

  return render(
    <MemoryRouter>
      <BooksScreen />
    </MemoryRouter>,
  )
}

describe('BooksScreen — kitob xaritasi', () => {
  beforeEach(async () => {
    await db.cards.clear()
    await db.profile.clear()
    await db.dailyStats.clear()
    await addMissingCards(WORDS)
  })

  it('kitoblarni va umumiy raqamlarni ko‘rsatadi', async () => {
    renderBooks()

    const totals = await screen.findByTestId('books-totals')
    // 2 kitob, 6 so'z, 3 dars
    expect(totals).toHaveTextContent('2')
    expect(totals).toHaveTextContent('6')

    expect(screen.getByTestId('book-kitob-1')).toHaveTextContent('0/4 so‘z')
    expect(screen.getByTestId('book-kitob-1')).toHaveTextContent('2 dars')
    expect(screen.getByTestId('book-kitob-2')).toHaveTextContent('0/2 so‘z')
  })

  it('muddat tanlanganda kunlik ulush hisoblanadi va saqlanadi', async () => {
    renderBooks()

    fireEvent.click(await screen.findByTestId('plan-open-kitob-1'))
    // 4 so'z / 30 kun → kuniga 1 so'z
    expect(screen.getByTestId('preset-kitob-1-30')).toHaveTextContent('kuniga 1 so‘z')

    fireEvent.click(screen.getByTestId('preset-kitob-1-30'))

    const plan = await screen.findByTestId('plan-kitob-1')
    expect(plan).toHaveTextContent('1-kun')
    expect(plan).toHaveTextContent('30 kunlik reja')
    expect(plan).toHaveTextContent('Bugun: 1 ta yangi so‘z')

    await waitFor(async () => {
      expect((await db.profile.get('me'))?.studyPlans?.['en:kitob-1']).toMatchObject({
        bookId: 'kitob-1',
        days: 30,
      })
    })
  })

  it('reja bekor qilinadi', async () => {
    renderBooks()
    fireEvent.click(await screen.findByTestId('plan-open-kitob-1'))
    fireEvent.click(screen.getByTestId('preset-kitob-1-30'))
    await screen.findByTestId('plan-kitob-1')

    fireEvent.click(screen.getByRole('button', { name: /bekor qilish/i }))

    await waitFor(() => {
      expect(screen.queryByTestId('plan-kitob-1')).not.toBeInTheDocument()
    })
  })
})

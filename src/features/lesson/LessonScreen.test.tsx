import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { addMissingCards, db, type NewCardRecordInput } from '@/core/db'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { LessonScreen } from './LessonScreen'

const WORDS: NewCardRecordInput[] = [
  { word: 'hello', translation: 'salom', language: 'en', topic: 'Salomlashish', level: 'A1' },
  { word: 'mother', translation: 'ona', language: 'en', topic: 'Oila', level: 'A1' },
  { word: 'father', translation: 'ota', language: 'en', topic: 'Oila', level: 'A1' },
]

function renderLesson(path: string) {
  useSettingsStore.getState().reset()
  useSettingsStore.getState().setLearningLanguage('en')

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/lesson/:lessonId?" element={<LessonScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LessonScreen — bo‘lim bo‘yicha dars', () => {
  beforeEach(async () => {
    await db.cards.clear()
    await addMissingCards(WORDS)
  })

  it('faqat o‘sha bo‘lim so‘zlarini beradi', async () => {
    renderLesson('/lesson/a1-oila')

    // "Oila" bo'limida ikkita so'z bor
    expect(await screen.findByTestId('session-progress')).toHaveTextContent('0/2')
  })

  it('bo‘limsiz ochilganda butun to‘plamdan tanlaydi', async () => {
    renderLesson('/lesson')

    expect(await screen.findByTestId('session-progress')).toHaveTextContent('0/3')
  })

  it('noto‘g‘ri bo‘lim id sida bo‘sh holat', async () => {
    renderLesson('/lesson/yoq-bunday-bolim')

    expect(await screen.findByText(/hali so.z yo.q/i)).toBeInTheDocument()
  })
})

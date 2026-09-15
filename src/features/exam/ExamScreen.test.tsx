import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { addMissingCards, db, type NewCardRecordInput } from '@/core/db'
import { saveTopicOrder } from '@/content/topicOrderCache'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { ExamScreen } from './ExamScreen'

const WORDS: NewCardRecordInput[] = [
  { word: 'hello', translation: 'salom', language: 'en', topic: 'Salomlashish', level: 'A1' },
  { word: 'bye', translation: 'xayr', language: 'en', topic: 'Salomlashish', level: 'A1' },
  { word: 'mother', translation: 'ona', language: 'en', topic: 'Oila', level: 'A1' },
  { word: 'father', translation: 'ota', language: 'en', topic: 'Oila', level: 'A1' },
  { word: 'bread', translation: 'non', language: 'en', topic: 'Ovqat', level: 'A1' },
]

function renderExam(unitId: string) {
  useSettingsStore.getState().reset()
  useSettingsStore.getState().setLearningLanguage('en')
  saveTopicOrder('en', ['Salomlashish', 'Oila', 'Ovqat'])

  return render(
    <MemoryRouter initialEntries={[`/exam/${unitId}`]}>
      <Routes>
        <Route path="/exam/:unitId" element={<ExamScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ExamScreen — yig‘ma imtihon', () => {
  beforeEach(async () => {
    await db.cards.clear()
    await db.profile.clear()
    await addMissingCards(WORDS)
    // 1–2-bo'limlar o'tilgan, 3-chisi hali yo'q
    await db.cards.toCollection().modify((card) => {
      if (card.topic !== 'Ovqat') card.totalReviews = 1
    })
  })

  it('kirish: qamrab olgan darslar va savollar soni', async () => {
    renderExam('a1-oila')

    expect(await screen.findByText('Yig‘ma imtihon')).toBeInTheDocument()
    const units = screen.getByTestId('exam-units')
    expect(units).toHaveTextContent('Salomlashish')
    expect(units).toHaveTextContent('Oila')
    // Ovqat bo'limi 2-bo'limdan KEYIN — imtihonga kirmaydi
    expect(units).not.toHaveTextContent('Ovqat')
    expect(screen.getByText(/2 ta dars · 4 savol/)).toBeInTheDocument()
  })

  it('"Boshlash" seansni ochadi — har so‘z bir marta (4 qadam)', async () => {
    renderExam('a1-oila')
    fireEvent.click(await screen.findByTestId('exam-start'))

    expect(await screen.findByTestId('session-progress')).toHaveTextContent('0/4')
  })

  it('imtihon ketayotganda ✕ tasdiq so‘raydi', async () => {
    renderExam('a1-oila')
    fireEvent.click(await screen.findByTestId('exam-start'))
    await screen.findByTestId('session-progress')

    fireEvent.click(screen.getByRole('button', { name: /imtihondan chiqish/i }))
    expect(await screen.findByRole('dialog')).toHaveTextContent(/tugatmasdan/i)
  })

  it('noma’lum bo‘lim — halol xabar', async () => {
    renderExam('a1-yoq')
    expect(await screen.findByText(/so‘z topilmadi/)).toBeInTheDocument()
  })
})

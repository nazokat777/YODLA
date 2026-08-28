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

  it('yo‘q bo‘lim id sida "so‘z yo‘q" DEMAYDI', async () => {
    renderLesson('/lesson/yoq-bunday-bolim')

    // Lug'atda 3 ta so'z bor. Eski xabar ("Bu tilda hali so'z yo'q")
    // yolg'on edi va foydalanuvchida "ilova hamma so'zimni yo'qotdi"
    // degan taassurot qoldirardi. Bunday havola eskirgan xatcho'p yoki
    // yangilanishdan keyin nomi o'zgargan bo'lim bo'lishi mumkin.
    expect(await screen.findByText(/bo.lim topilmadi/i)).toBeInTheDocument()
    expect(screen.queryByText(/hali so.z yo.q/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /bosh sahifa/i })).toBeInTheDocument()
  })

  it('lug‘at butunlay bo‘sh bo‘lsa boshqa xabar', async () => {
    await db.cards.clear()
    renderLesson('/lesson')

    expect(await screen.findByText(/hali so.z yo.q/i)).toBeInTheDocument()
  })
})

import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { addMissingCards, db, type NewCardRecordInput } from '@/core/db'
import { saveTopicOrder } from '@/content/topicOrderCache'
import { useSettingsStore } from '@/stores/useSettingsStore'
import type { SessionSummary } from '@/features/session/SessionRunner'
import { LessonScreen } from './LessonScreen'

/*
 * Seans MOCK qilinadi: bu test o'zlashtirish halqasini emas, dars
 * YAKUNIDAGI taklifni tekshiradi. Runner darhol "tugadi" deydi.
 */
vi.mock('@/features/session/SessionRunner', () => ({
  SessionRunner: ({ onFinish }: { onFinish: (s: SessionSummary) => void }) => {
    setTimeout(
      () =>
        onFinish({
          answered: 2,
          correct: 2,
          almost: 0,
          wrong: 0,
          xpEarned: 10,
          perfectBonusXp: 0,
          newBadges: [],
          masteredWords: 1,
          pendingWords: 0,
        }),
      0,
    )
    return <div data-testid="session-progress">mock</div>
  },
}))

const WORDS: NewCardRecordInput[] = [
  { word: 'hello', translation: 'salom', language: 'en', topic: 'Salomlashish', level: 'A1' },
  { word: 'mother', translation: 'ona', language: 'en', topic: 'Oila', level: 'A1' },
]

describe('LessonScreen — dars yakunida imtihon taklifi', () => {
  it('bo‘lim tugallanib imtihon kutilsa, yakunda "Imtihon" tugmasi birinchi chiqadi', async () => {
    await db.cards.clear()
    await db.profile.clear()
    await addMissingCards(WORDS)
    saveTopicOrder('en', ['Salomlashish', 'Oila'])
    // Ikkala bo'lim ham "ko'rilgan" — yakunda 1–2 imtihoni kutiladi
    await db.cards.update('en:hello', { totalReviews: 2 })
    await db.cards.update('en:mother', { totalReviews: 2 })

    useSettingsStore.getState().reset()
    useSettingsStore.getState().setLearningLanguage('en')
    render(
      <MemoryRouter initialEntries={['/lesson/a1-oila']}>
        <Routes>
          <Route path="/lesson/:lessonId?" element={<LessonScreen />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByTestId('exam-offer')).toHaveAttribute('href', '/exam/a1-oila')
  })

  it('imtihon topshirilgan bo‘lsa taklif chiqmaydi', async () => {
    await db.cards.clear()
    await db.profile.clear()
    await addMissingCards(WORDS)
    saveTopicOrder('en', ['Salomlashish', 'Oila'])
    await db.cards.update('en:hello', { totalReviews: 2 })
    await db.cards.update('en:mother', { totalReviews: 2 })
    const { createProfile } = await import('@/core/db')
    await db.profile.put({
      ...createProfile(),
      examResults: { 'a1-oila': { at: 1, correct: 2, total: 2 } },
    })

    useSettingsStore.getState().reset()
    useSettingsStore.getState().setLearningLanguage('en')
    render(
      <MemoryRouter initialEntries={['/lesson/a1-oila']}>
        <Routes>
          <Route path="/lesson/:lessonId?" element={<LessonScreen />} />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByRole('button', { name: 'Yana bir dars' })).toBeInTheDocument()
    expect(screen.queryByTestId('exam-offer')).not.toBeInTheDocument()
  })
})

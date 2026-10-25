import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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

    // Avval so'zlar ro'yxati — keyin yodlash
    fireEvent.click(await screen.findByTestId('preview-start'))
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

    fireEvent.click(await screen.findByTestId('preview-start'))
    expect(await screen.findByRole('button', { name: 'Yana bir dars' })).toBeInTheDocument()
    expect(screen.queryByTestId('exam-offer')).not.toBeInTheDocument()
  })
})

describe('LessonScreen — "Yana bir dars"', () => {
  it('ikkinchi dars ham yangi so‘zlar ro‘yxatidan boshlanadi (aralash takrordan emas)', async () => {
    await db.cards.clear()
    await db.profile.clear()
    await addMissingCards([
      ...WORDS,
      { word: 'father', translation: 'ota', language: 'en', topic: 'Oila', level: 'A1' },
      { word: 'sister', translation: 'opa', language: 'en', topic: 'Oila', level: 'A1' },
    ])
    saveTopicOrder('en', ['Salomlashish', 'Oila'])
    // Aralash takror bosqichi bo'lishi uchun ko'rilgan so'z kerak
    await db.cards.update('en:hello', { totalReviews: 2 })

    useSettingsStore.getState().reset()
    useSettingsStore.getState().setLearningLanguage('en')
    render(
      <MemoryRouter initialEntries={['/lesson/a1-oila']}>
        <Routes>
          <Route path="/lesson/:lessonId?" element={<LessonScreen />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByTestId('preview-start'))
    // Mock runner: 1-bosqich → aralash takror → yakun
    fireEvent.click(await screen.findByRole('button', { name: 'Yana bir dars' }))

    // Yangi dars yana RO'YXAT bilan boshlanadi
    expect(await screen.findByTestId('word-preview')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Aralash takror' })).not.toBeInTheDocument()
  })
})

describe('LessonScreen — tugagan darsdan keyin keyingisi', () => {
  it('bo‘lim tugagach "Keyingi dars · Oila" — o‘sha kitobning keyingi darsi', async () => {
    await db.cards.clear()
    await db.profile.clear()
    await addMissingCards(WORDS)
    saveTopicOrder('en', ['Salomlashish', 'Oila'])
    // Salomlashish (1 so'z) tugagan, Oila hali yo'q
    await db.cards.update('en:hello', { totalReviews: 2 })

    useSettingsStore.getState().reset()
    useSettingsStore.getState().setLearningLanguage('en')
    render(
      <MemoryRouter initialEntries={['/lesson/a1-salomlashish']}>
        <Routes>
          <Route path="/lesson/:lessonId?" element={<LessonScreen />} />
        </Routes>
      </MemoryRouter>,
    )

    fireEvent.click(await screen.findByTestId('preview-start'))
    const next = await screen.findByTestId('next-unit')
    expect(next).toHaveAttribute('href', '/lesson/a1-oila')
    expect(next).toHaveTextContent('Keyingi dars · Oila')
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { addMissingCards, db, ensureProfile, gradeCard, recordAnswer } from '@/core/db'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { TomorrowCard } from './TomorrowCard'

const DAY = 24 * 60 * 60 * 1000

describe('TomorrowCard', () => {
  beforeEach(async () => {
    await db.cards.clear()
    await db.dailyStats.clear()
    await db.profile.clear()
    useSettingsStore.getState().reset()
    useSettingsStore.getState().setLearningLanguage('en')
  })

  it('ertaga takrorga chiqadigan so‘zlar va streak ko‘rsatiladi', async () => {
    await addMissingCards([
      { word: 'apple', translation: 'olma', language: 'en' },
      { word: 'bread', translation: 'non', language: 'en' },
    ])
    await db.cards.update('en:apple', { totalReviews: 1, dueDate: Date.now() + DAY })
    // Bugun to'g'ri javob → interval 1 kun → ertaga qaytadi
    await gradeCard('en:bread', 4)
    await recordAnswer({ cardId: 'en:bread', verdict: 'correct', dailyGoalWords: 99 })

    render(
      <MemoryRouter>
        <TomorrowCard />
      </MemoryRouter>,
    )

    const card = await screen.findByTestId('tomorrow-card')
    expect(card).toHaveTextContent(/2 ta so‘z takrorga chiqadi/)
    // Bugun faol → ertaga streak 2
    expect(card).toHaveTextContent(/streak 2 bo‘ladi/)
  })

  it('bugun rekord bo‘lsa e’lon qilinadi, birinchi kun esa emas', async () => {
    await addMissingCards([{ word: 'apple', translation: 'olma', language: 'en' }])
    await recordAnswer({ cardId: 'en:apple', verdict: 'correct', dailyGoalWords: 99 })

    const { unmount } = render(
      <MemoryRouter>
        <TomorrowCard />
      </MemoryRouter>,
    )
    await screen.findByTestId('tomorrow-card')
    expect(screen.queryByTestId('record-day')).not.toBeInTheDocument()
    unmount()

    // Kechagi kun 5 XP — bugungi undan ko'p
    await db.dailyStats.put({
      day: Date.now() - DAY - ((Date.now() - DAY) % DAY),
      xp: 5,
      answered: 1,
      correct: 1,
      cardIds: [],
      goalBonusAwarded: false,
    })
    render(
      <MemoryRouter>
        <TomorrowCard />
      </MemoryRouter>,
    )

    expect(await screen.findByTestId('record-day')).toHaveTextContent(/yangi kunlik rekord/i)
  })

  it('daraja 30 XP dan yaqin va takrorlanadigan so‘z bo‘lsa — "hozir" taklifi', async () => {
    await addMissingCards([{ word: 'apple', translation: 'olma', language: 'en' }])
    await gradeCard('en:apple', 4)
    await db.cards.update('en:apple', { dueDate: 0 })
    // 2-daraja 100 XP da: 80 XP → 20 qoldi
    await ensureProfile()
    await db.profile.update('me', { totalXp: 80 })

    render(
      <MemoryRouter>
        <TomorrowCard />
      </MemoryRouter>,
    )

    expect(await screen.findByTestId('almost-level')).toHaveTextContent('2-darajagacha atigi 20 XP')
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { addMissingCards, db, gradeCard, recordAnswer } from '@/core/db'
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

    render(<TomorrowCard />)

    const card = await screen.findByTestId('tomorrow-card')
    expect(card).toHaveTextContent(/2 ta so‘z takrorga chiqadi/)
    // Bugun faol → ertaga streak 2
    expect(card).toHaveTextContent(/streak 2 bo‘ladi/)
  })

  it('bugun rekord bo‘lsa e’lon qilinadi, birinchi kun esa emas', async () => {
    await addMissingCards([{ word: 'apple', translation: 'olma', language: 'en' }])
    await recordAnswer({ cardId: 'en:apple', verdict: 'correct', dailyGoalWords: 99 })

    const { unmount } = render(<TomorrowCard />)
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
    render(<TomorrowCard />)

    expect(await screen.findByTestId('record-day')).toHaveTextContent(/yangi kunlik rekord/i)
  })
})

import { describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { addMissingCards, recordAnswer, syncBadges, type NewCardRecordInput } from '@/core/db'
import { addDays, startOfDay } from '@/lib/date'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { HomeScreen } from './HomeScreen'

const WORDS: NewCardRecordInput[] = [
  { word: 'hello', translation: 'salom', language: 'en' },
  { word: 'water', translation: 'suv', language: 'en' },
]

function renderScreen(dailyGoalWords = 20) {
  useSettingsStore.getState().reset()
  useSettingsStore.getState().setLearningLanguage('en')
  useSettingsStore.getState().setDailyGoalWords(dailyGoalWords)

  return render(
    <MemoryRouter>
      <HomeScreen />
    </MemoryRouter>,
  )
}

/** `daysAgo` kun oldin, tushda */
const dayAgo = (daysAgo: number) => addDays(startOfDay(Date.now()), -daysAgo) + 43_200_000

describe('HomeScreen — geymifikatsiya', () => {
  it('boshlang‘ich holatda streak nol', async () => {
    renderScreen()

    await waitFor(() => {
      expect(screen.getByTestId('streak-badge')).toHaveTextContent('0')
    })
  })

  it('ketma-ket kunlardagi faoliyatdan streakni ko‘rsatadi', async () => {
    await recordAnswer({ cardId: 'a', verdict: 'correct', dailyGoalWords: 20, now: dayAgo(0) })
    await recordAnswer({ cardId: 'b', verdict: 'correct', dailyGoalWords: 20, now: dayAgo(1) })
    await recordAnswer({ cardId: 'c', verdict: 'correct', dailyGoalWords: 20, now: dayAgo(2) })

    renderScreen()

    await waitFor(() => {
      expect(screen.getByTestId('streak-badge')).toHaveTextContent('3')
    })
  })

  it('XP va darajani ko‘rsatadi', async () => {
    // 10 ta to'g'ri javob = 100 XP = 2-daraja
    for (let i = 0; i < 10; i += 1) {
      await recordAnswer({ cardId: `c${i}`, verdict: 'correct', dailyGoalWords: 20 })
    }

    renderScreen()

    await waitFor(() => {
      expect(screen.getByTestId('total-xp')).toHaveTextContent('100 XP')
    })
    expect(screen.getByText(/2-daraja/)).toBeInTheDocument()
  })

  it('kunlik maqsad progressini NOYOB so‘zlar bo‘yicha hisoblaydi', async () => {
    // Bitta so'zni uch marta takrorlash — progress baribir 1
    for (let i = 0; i < 3; i += 1) {
      await recordAnswer({ cardId: 'en:hello', verdict: 'correct', dailyGoalWords: 20 })
    }
    await recordAnswer({ cardId: 'en:water', verdict: 'correct', dailyGoalWords: 20 })

    renderScreen()

    await waitFor(() => {
      expect(screen.getByTestId('daily-goal')).toHaveTextContent('2 / 20')
    })
  })

  it('maqsad bajarilganda tabriklaydi', async () => {
    await recordAnswer({ cardId: 'a', verdict: 'correct', dailyGoalWords: 2 })
    await recordAnswer({ cardId: 'b', verdict: 'correct', dailyGoalWords: 2 })

    renderScreen(2)

    expect(await screen.findByText(/maqsad bajarildi/i)).toBeInTheDocument()
  })

  it('takrorlanadigan kartalar sonini ko‘rsatadi', async () => {
    await addMissingCards(WORDS, Date.now() - 60_000)
    // Takrorlash navbatiga faqat KO'RILGAN kartalar tushadi
    const { db } = await import('@/core/db/db')
    await db.cards.toCollection().modify({ totalReviews: 1 })

    renderScreen()

    expect(await screen.findByText(/2 ta so.z unutish arafasida/i)).toBeInTheDocument()
  })

  it('YANGI so‘zlar takrorlash sifatida ko‘rsatilmaydi', async () => {
    // Hech qachon ko'rilmagan so'zni "unutish arafasida" deb ko'rsatish
    // yangi foydalanuvchini bekorga qo'rqitardi (4440 ta so'z)
    await addMissingCards(WORDS, Date.now() - 60_000)

    renderScreen()

    expect(await screen.findByText(/takrorlanadigan so.z yo.q/i)).toBeInTheDocument()
  })
})

describe('nishonlar', () => {
  it('shart bajarilganda nishon ochiladi', async () => {
    const result = await syncBadges({
      learnedWords: 10,
      matureWords: 0,
      currentStreak: 1,
      longestStreak: 1,
      totalAnswers: 10,
    })

    expect(result.newlyUnlocked).toContain('first-10-words')
    expect(result.newlyUnlocked).toContain('first-steps')
  })
})

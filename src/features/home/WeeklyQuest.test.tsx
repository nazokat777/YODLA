import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { db, ensureProfile } from '@/core/db'
import { startOfWeek } from '@/core/gamification'
import { addDays } from '@/lib/date'
import { WeeklyQuest } from './WeeklyQuest'

vi.mock('@/lib/sound', () => ({ playChestSound: vi.fn() }))

async function activeDays(count: number) {
  const monday = startOfWeek(Date.now())
  // Bugungacha bo'lgan kunlar — kelajak kunlar faol bo'lolmaydi
  const todayIndex = (new Date().getDay() + 6) % 7
  const days = Array.from({ length: count }, (_, i) => addDays(monday, Math.max(0, todayIndex - i)))
  for (const day of new Set(days)) {
    await db.dailyStats.put({ day, xp: 10, answered: 1, correct: 1, cardIds: [], goalBonusAwarded: false })
  }
}

describe('WeeklyQuest', () => {
  beforeEach(async () => {
    await db.dailyStats.clear()
    await db.profile.clear()
  })

  it('faol kunlar belgilanadi va sandiq yetilmaguncha ochilmaydi', async () => {
    await activeDays(1)
    render(<WeeklyQuest />)

    expect(await screen.findByTestId('weekly-active')).toHaveTextContent('1/7 kun')
    expect(screen.queryByTestId('weekly-claim')).not.toBeInTheDocument()
  })

  it('3 kun faol bo‘lsa sandiq BOSILGANDA ochiladi va XP yoziladi — bir marta', async () => {
    const todayIndex = (new Date().getDay() + 6) % 7
    if (todayIndex < 2) return // dushanba/seshanba — bu hafta hali 3 kun bo'lolmaydi

    await activeDays(3)
    render(<WeeklyQuest />)

    const button = await screen.findByTestId('weekly-claim')
    expect(button).toHaveTextContent('+30 XP')
    // Bosilmaguncha hech nima yozilmaydi
    expect((await ensureProfile()).totalXp).toBe(0)

    fireEvent.click(button)

    await waitFor(async () => {
      expect((await ensureProfile()).totalXp).toBe(30)
    })
    await waitFor(() => {
      expect(screen.queryByTestId('weekly-claim')).not.toBeInTheDocument()
    })
    expect((await ensureProfile()).weeklyQuestClaims).toBeDefined()
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { db, recordAnswer } from '@/core/db'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { StatsScreen } from './StatsScreen'

beforeEach(async () => {
  await db.dailyStats.clear()
  await db.profile.clear()
  useSettingsStore.getState().reset()
  useSettingsStore.getState().setLearningLanguage('en')
})

function renderStats() {
  return render(
    <MemoryRouter>
      <StatsScreen />
    </MemoryRouter>,
  )
}

describe('StatsScreen', () => {
  it('sarlavha va uchta ko‘rsatkich', async () => {
    renderStats()

    expect(await screen.findByRole('heading', { name: 'Statistika' })).toBeInTheDocument()
    expect(await screen.findByText('Streak')).toBeInTheDocument()
    expect(screen.getByText('Haftalik XP')).toBeInTheDocument()
    expect(screen.getByText('Jami XP')).toBeInTheDocument()
  })

  it('diagramma ekran O‘QUVCHISI uchun tushunarli', async () => {
    /*
     * Ustunlar balandligi ekran o'quvchi uchun ma'nosiz, shuning uchun
     * har kun `aria-label` da to'liq gap bo'lib turadi. Usiz nolli
     * kunda FAQAT "Ju" o'qilardi — bu hech nima anglatmasdi.
     */
    renderStats()

    const chart = await screen.findByRole('list', { name: /so.nggi 7 kun/i })
    const days = within(chart).getAllByRole('listitem')

    expect(days).toHaveLength(7)
    for (const day of days) {
      expect(day.getAttribute('aria-label')).toMatch(
        /^(Yakshanba|Dushanba|Seshanba|Chorshanba|Payshanba|Juma|Shanba): \d+ XP$/,
      )
    }
  })

  it('javob berilgach XP diagrammada ko‘rinadi', async () => {
    await recordAnswer({ cardId: 'en:hello', verdict: 'correct', dailyGoalWords: 20 })

    renderStats()

    // `useLiveQuery` bazani asinxron o'qiydi — birinchi renderda hali nol
    await waitFor(() => {
      const chart = screen.getByRole('list', { name: /so.nggi 7 kun/i })
      const labels = within(chart)
        .getAllByRole('listitem')
        .map((day) => day.getAttribute('aria-label'))

      expect(labels.some((label) => label !== null && !label.endsWith(': 0 XP'))).toBe(true)
    })
  })
})

import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { db } from '@/core/db'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { ProfileScreen } from './ProfileScreen'

function renderScreen() {
  useSettingsStore.getState().reset()
  useSettingsStore.getState().setLearningLanguage('en')

  return render(
    <MemoryRouter>
      <ProfileScreen />
    </MemoryRouter>,
  )
}

beforeEach(async () => {
  await Promise.all([db.cards.clear(), db.profile.clear(), db.dailyStats.clear()])
})

describe('ProfileScreen — assotsiatsiyalar', () => {
  it('Assotsiatsiyalarim ekraniga havola bor', async () => {
    renderScreen()

    const link = await screen.findByRole('link', { name: /assotsiatsiyalarim/i })
    expect(link).toHaveAttribute('href', '/mnemonics')
  })
})

describe('ProfileScreen — imtihonlar paneli', () => {
  it('imtihon topshirilgan bo‘lsa soni va o‘rtacha foiz ko‘rinadi', async () => {
    const { createProfile } = await import('@/core/db')
    await db.profile.put({
      ...createProfile(),
      examResults: {
        'a1-oila': { at: 1, correct: 3, total: 4 },
        'a1-ovqat': { at: 2, correct: 4, total: 4 },
      },
    })
    renderScreen()

    const panel = await screen.findByTestId('exams-panel')
    expect(panel).toHaveTextContent('Topshirilgan')
    // (3+4)/(4+4) = 87.5 → 88
    expect(panel).toHaveTextContent('88')
    expect(panel).toHaveTextContent('4/4 · qayta topshirish')
  })
})

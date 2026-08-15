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

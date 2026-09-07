import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { db, saveGameBest } from '@/core/db'
import { GamesScreen } from './GamesScreen'

function renderScreen() {
  return render(
    <MemoryRouter>
      <GamesScreen />
    </MemoryRouter>,
  )
}

describe('GamesScreen', () => {
  beforeEach(async () => {
    await db.profile.clear()
  })

  it('o‘yin havolasi ko‘rinadi', async () => {
    renderScreen()

    const link = await screen.findByRole('link', { name: /vaqtga qarshi/i })

    expect(link).toHaveAttribute('href', '/games/speed')
  })

  it('rekord YO‘Q bo‘lsa ko‘rsatilmaydi', async () => {
    /*
     * "0 ochko" hech kimni ilhomlantirmaydi va bo'sh joyni egallaydi.
     */
    renderScreen()

    const link = await screen.findByRole('link', { name: /vaqtga qarshi/i })

    expect(link.textContent).not.toMatch(/ochko/)
  })

  it('rekord bor bo‘lsa ko‘rsatiladi', async () => {
    await saveGameBest('speed', 17)

    renderScreen()

    // Matn bir nechta tugunga bo'linadi, shuning uchun `textContent`
    await waitFor(() => {
      const link = screen.getByRole('link', { name: /vaqtga qarshi/i })
      expect(link.textContent).toMatch(/17 ochko/)
    })
  })
})

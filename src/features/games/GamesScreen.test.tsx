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

describe('kunlik chaqiriq', () => {
  it('chaqiriq va uning progressi ko‘rsatiladi', async () => {
    renderScreen()

    const panel = await screen.findByTestId('daily-challenge')

    expect(panel.textContent).toMatch(/bugungi chaqiriq/i)
    // Progress ko'rinadi: "0/10" kabi
    expect(panel.textContent).toMatch(/\d+\/\d+/)
  })

  it('chaqiriq KUN DAVOMIDA o‘zgarmaydi', async () => {
    /*
     * Tasodifiy tanlansa, sahifani yangilaganda vazifa o'zgarib
     * turardi va uni bajarish mumkin bo'lmasdi.
     */
    const { unmount } = renderScreen()
    const first = (await screen.findByTestId('daily-challenge')).textContent
    unmount()

    renderScreen()
    const second = (await screen.findByTestId('daily-challenge')).textContent

    expect(second).toBe(first)
  })
})

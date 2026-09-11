import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import {
  addMissingCards,
  db,
  ensureProfile,
  recordAnswer,
  recordLessonCompleted,
  saveGameBest,
} from '@/core/db'
import { CHALLENGE_BONUS_XP, dailyChallenge } from '@/core/games'
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

describe('kunlik chaqiriq bonusi', () => {
  it('KECHAGI tezlik rekordi bugungi chaqiriqni bajarmaydi', async () => {
    /*
     * Chaqiriq umrbod rekordni o'lchasa, bir marta 12 olgan bola har
     * uchinchi kuni o'ynamasdan +50 XP olaverardi.
     *
     * FAQAT `Date` soxtalanadi: taymerlar soxtalansa Dexie qotib
     * qoladi. Tezlik chaqirig'i chiqadigan kun qidirib topiladi.
     */
    const DAY = 24 * 60 * 60 * 1000
    let now = Date.now()
    while (dailyChallenge(now).kind !== 'speedScore') now += DAY
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(now)

    try {
      await db.profile.clear()
      await db.dailyStats.clear()
      await saveGameBest('speed', 99, now - DAY)
      const before = (await ensureProfile()).totalXp

      renderScreen()
      expect(await screen.findByTestId('daily-challenge')).toHaveTextContent('0/12')

      // Bonus yozilmasligi kerak — haqiqiy taymer bilan kutiladi
      await new Promise((resolve) => setTimeout(resolve, 150))
      expect((await ensureProfile()).totalXp).toBe(before)
    } finally {
      vi.useRealTimers()
    }
  })

  it('chaqiriq bajarilganda bonus HAQIQATAN yoziladi', async () => {
    /*
     * Ilgari ekranda "+50 XP" deb turardi, lekin hech qayerga
     * yozilmasdi — va'da qilingan mukofot yolg'on edi.
     */
    await db.profile.clear()
    await db.dailyStats.clear()

    // Bugungi chaqiriq qaysi bo'lsa ham, uning maqsadiga yetkazamiz
    const challenge = dailyChallenge()
    if (challenge.kind === 'speedScore') await saveGameBest('speed', challenge.target)
    else if (challenge.kind === 'finishLesson') {
      for (let i = 0; i < challenge.target; i += 1) await recordLessonCompleted()
    } else {
      await addMissingCards([{ word: 'apple', translation: 'olma', language: 'en' }])
      for (let i = 0; i < challenge.target; i += 1) {
        await recordAnswer({ cardId: 'en:apple', verdict: 'correct', dailyGoalWords: 100 })
      }
    }
    const before = (await ensureProfile()).totalXp

    renderScreen()

    await waitFor(async () => {
      expect((await ensureProfile()).totalXp).toBe(before + CHALLENGE_BONUS_XP)
    })
  })
})

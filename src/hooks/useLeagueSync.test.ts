import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { db, recordAnswer } from '@/core/db'
import { useSettingsStore } from '@/stores/useSettingsStore'

const pushToday = vi.fn()

vi.mock('@/lib/supabase', () => ({
  pushToday: (...args: unknown[]) => pushToday(...args),
}))

const { useLeagueSync } = await import('./useLeagueSync')

/**
 * Ligaga YOZISH yo'li.
 *
 * Bu yerda maxfiylik va'dasi tekshiriladi: rozilik bo'lmasa hech narsa
 * yuborilmaydi, yuborilganda esa faqat ism, XP va so'zlar soni ketadi —
 * so'zlarning o'zi yoki xatolar emas.
 */
beforeEach(async () => {
  vi.clearAllMocks()
  pushToday.mockResolvedValue(true)
  useSettingsStore.getState().reset()
  await Promise.all([db.cards.clear(), db.dailyStats.clear(), db.profile.clear()])
})

describe('useLeagueSync', () => {
  it('ROZILIK bo‘lmasa hech narsa yubormaydi', async () => {
    await recordAnswer({ cardId: 'en:hello', verdict: 'correct', dailyGoalWords: 20 })

    renderHook(() => useLeagueSync('finished'))

    await new Promise((resolve) => setTimeout(resolve, 120))
    expect(pushToday).not.toHaveBeenCalled()
  })

  it('rozilik berilgan bo‘lsa bugungi natijani yuboradi', async () => {
    useSettingsStore.setState({ leagueCode: 'AB2CD3', leagueName: 'Ali' })
    await recordAnswer({ cardId: 'en:hello', verdict: 'correct', dailyGoalWords: 20 })

    renderHook(() => useLeagueSync('finished'))

    await waitFor(() => {
      expect(pushToday).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'AB2CD3', name: 'Ali' }),
      )
    })
  })

  it('faqat ism, XP va so‘zlar soni ketadi', async () => {
    useSettingsStore.setState({ leagueCode: 'AB2CD3', leagueName: 'Ali' })
    await recordAnswer({ cardId: 'en:hello', verdict: 'correct', dailyGoalWords: 20 })

    renderHook(() => useLeagueSync('finished'))

    await waitFor(() => expect(pushToday).toHaveBeenCalled())

    // So'zlarning O'ZI hech qachon serverga ketmasligi kerak
    expect(Object.keys(pushToday.mock.calls[0][0]).sort()).toEqual(['code', 'name', 'words', 'xp'])
  })

  it('bugun hech narsa qilinmagan bo‘lsa yubormaydi', async () => {
    useSettingsStore.setState({ leagueCode: 'AB2CD3', leagueName: 'Ali' })

    renderHook(() => useLeagueSync('finished'))

    await new Promise((resolve) => setTimeout(resolve, 120))
    expect(pushToday).not.toHaveBeenCalled()
  })

  it('server xatosi ilovani yiqitmaydi', async () => {
    // Reyting qo'shimcha imkoniyat — o'rganishga xalaqit bermasligi kerak
    pushToday.mockRejectedValue(new Error('tarmoq yo‘q'))
    useSettingsStore.setState({ leagueCode: 'AB2CD3', leagueName: 'Ali' })
    await recordAnswer({ cardId: 'en:hello', verdict: 'correct', dailyGoalWords: 20 })

    const { result } = renderHook(() => useLeagueSync('finished'))

    await waitFor(() => expect(pushToday).toHaveBeenCalled())
    expect(result.current).toBeUndefined()
  })
})

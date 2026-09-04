import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useNowTick } from './useNowTick'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useNowTick', () => {
  it('boshlang‘ich qiymat — hozirgi vaqt', () => {
    vi.setSystemTime(1_700_000_000_000)

    const { result } = renderHook(() => useNowTick())

    expect(result.current).toBe(1_700_000_000_000)
  })

  it('vaqt o‘tishi bilan YANGILANADI', () => {
    vi.setSystemTime(1_700_000_000_000)
    const { result } = renderHook(() => useNowTick(60_000))

    // `advanceTimersByTime` soxta soatni ham suradi — vaqtni alohida
    // o'rnatish kerak emas
    act(() => {
      vi.advanceTimersByTime(60_000)
    })

    /*
     * `useLiveQuery` faqat BAZAGA yozuv bo'lganda qayta ishga tushadi.
     * Ichida `Date.now()` ishlatilgan so'rov ("muddati yetgan kartalar")
     * qotib qolardi: foydalanuvchi ilovani ochiq qoldirib yarim tundan
     * o'tsa, "bugun takrorlash" soni eskirib turardi.
     */
    expect(result.current).toBe(1_700_000_060_000)
  })

  it('ilova FONGA o‘tib qaytganda darhol yangilanadi', () => {
    vi.setSystemTime(1_700_000_000_000)
    const { result } = renderHook(() => useNowTick(60_000))

    // Telefon qulflanganda taymerlar bo'g'iladi — qaytishda kutib
    // turmasdan yangilanishi kerak
    act(() => {
      vi.setSystemTime(1_700_003_600_000)
      document.dispatchEvent(new Event('visibilitychange'))
    })

    expect(result.current).toBe(1_700_003_600_000)
  })

  it('oyna FOKUS olganda ham yangilanadi', () => {
    vi.setSystemTime(1_700_000_000_000)
    const { result } = renderHook(() => useNowTick(60_000))

    act(() => {
      vi.setSystemTime(1_700_007_200_000)
      window.dispatchEvent(new Event('focus'))
    })

    expect(result.current).toBe(1_700_007_200_000)
  })

  it('komponent yo‘q qilinganda tinglovchilar OLIB TASHLANADI', () => {
    const removeWindow = vi.spyOn(window, 'removeEventListener')
    const removeDocument = vi.spyOn(document, 'removeEventListener')

    const { unmount } = renderHook(() => useNowTick(60_000))
    unmount()

    // Aks holda har ekran almashganda yangi tinglovchi qo'shilib,
    // eskilari qolib ketardi
    expect(removeWindow).toHaveBeenCalledWith('focus', expect.any(Function))
    expect(removeDocument).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
  })
})

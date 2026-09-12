import { afterEach, describe, expect, it, vi } from 'vitest'
import { haptic } from './haptics'
import { useSettingsStore } from '@/stores/useSettingsStore'

describe('haptic', () => {
  // Birinchi teginish — brauzer shundan keyingina tebranishga ruxsat beradi
  window.dispatchEvent(new Event('pointerdown'))

  afterEach(() => vi.unstubAllGlobals())

  it('naqshni navigator.vibrate ga beradi', () => {
    const vibrate = vi.fn()
    vi.stubGlobal('navigator', { vibrate })
    vi.stubGlobal('matchMedia', () => ({ matches: false }))

    haptic('milestone')

    expect(vibrate).toHaveBeenCalledWith([18, 60, 28])
  })

  it('reduced-motion da jim', () => {
    const vibrate = vi.fn()
    vi.stubGlobal('navigator', { vibrate })
    vi.stubGlobal('matchMedia', () => ({ matches: true }))

    haptic('success')

    expect(vibrate).not.toHaveBeenCalled()
  })

  it('sozlamada o‘chirilgan bo‘lsa tebranmaydi', () => {
    const vibrate = vi.fn()
    vi.stubGlobal('navigator', { vibrate })
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    useSettingsStore.getState().setHapticsEnabled(false)

    haptic('success')

    expect(vibrate).not.toHaveBeenCalled()
    useSettingsStore.getState().setHapticsEnabled(true)
  })

  it('vibrate bo‘lmasa (iOS) xato bermaydi', () => {
    vi.stubGlobal('navigator', {})

    expect(() => haptic('tap')).not.toThrow()
  })
})

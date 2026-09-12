import { afterEach, describe, expect, it, vi } from 'vitest'
import { haptic } from './haptics'

describe('haptic', () => {
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

  it('vibrate bo‘lmasa (iOS) xato bermaydi', () => {
    vi.stubGlobal('navigator', {})

    expect(() => haptic('tap')).not.toThrow()
  })
})

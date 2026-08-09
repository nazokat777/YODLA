import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadGsap, prefersReducedMotion } from './motion'

afterEach(() => {
  vi.unstubAllGlobals()
})

/** `matchMedia` ni berilgan javob bilan almashtiradi */
function stubMatchMedia(matches: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches, media: query }))
}

describe('prefersReducedMotion', () => {
  it('tizim harakatni kamaytirishni so‘rasa — true', () => {
    stubMatchMedia(true)

    expect(prefersReducedMotion()).toBe(true)
  })

  it('odatiy holatda — false', () => {
    stubMatchMedia(false)

    expect(prefersReducedMotion()).toBe(false)
  })

  it('matchMedia yo‘q brauzerda xato bermaydi', () => {
    vi.stubGlobal('matchMedia', undefined)

    expect(prefersReducedMotion()).toBe(false)
  })
})

describe('loadGsap', () => {
  it('harakat kamaytirilganda null qaytaradi', async () => {
    // Animatsiya kodi umuman yuklanmasligi kerak
    stubMatchMedia(true)

    await expect(loadGsap()).resolves.toBeNull()
  })

  it('odatiy holatda gsap qaytaradi', async () => {
    stubMatchMedia(false)

    const gsap = await loadGsap()

    expect(typeof gsap?.to).toBe('function')
  })
})

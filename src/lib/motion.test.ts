import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  countUp,
  enterStagger,
  flipIn,
  loadGsap,
  prefersReducedMotion,
  shake,
  withMotion,
} from './motion'

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

describe('withMotion', () => {
  it('harakat kamaytirilganda hech nima qilmaydi va bo‘sh revert qaytaradi', async () => {
    stubMatchMedia(true)
    const fn = vi.fn()

    const revert = await withMotion(document.createElement('div'), fn)

    expect(fn).not.toHaveBeenCalled()
    expect(() => revert()).not.toThrow()
  })

  it('odatiy holatda fn gsap bilan chaqiriladi va revert ishlaydi', async () => {
    stubMatchMedia(false)
    const scope = document.createElement('div')
    const fn = vi.fn()

    const revert = await withMotion(scope, fn)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(typeof fn.mock.calls[0]?.[0]?.to).toBe('function')
    expect(() => revert()).not.toThrow()
  })

  it('scope yo‘q (null) bo‘lsa fn chaqirilmaydi', async () => {
    stubMatchMedia(false)
    const fn = vi.fn()

    await withMotion(null, fn)

    expect(fn).not.toHaveBeenCalled()
  })
})

describe('presetlar', () => {
  it('countUp yakunda aynan berilgan sonni yozadi', async () => {
    stubMatchMedia(false)
    const gsap = (await loadGsap())!
    const node = document.createElement('span')
    node.textContent = '57'

    const tween = countUp(gsap, node, 57)
    tween.progress(1)

    expect(node.textContent).toBe('57')
  })

  it('enterStagger opacity ga TEGMAYDI — kontent doim ko‘rinadi', async () => {
    stubMatchMedia(false)
    const gsap = (await loadGsap())!
    const items = [document.createElement('li'), document.createElement('li')]

    const tween = enterStagger(gsap, items)
    tween.progress(0)

    expect(items[0]?.style.opacity).toBe('')
  })

  it('flipIn RTL da teskari tomondan aylanadi', async () => {
    stubMatchMedia(false)
    const gsap = (await loadGsap())!
    const node = document.createElement('div')

    const ltr = flipIn(gsap, node, 'ltr')
    const rtl = flipIn(gsap, node, 'rtl')

    expect(Math.sign(ltr.vars.startAt?.rotationY as number)).toBe(1)
    expect(Math.sign(rtl.vars.startAt?.rotationY as number)).toBe(-1)
  })

  it('shake seans qoidasiga sig‘adi — 200 ms dan oshmaydi', async () => {
    stubMatchMedia(false)
    const gsap = (await loadGsap())!

    const tween = shake(gsap, document.createElement('div'))

    expect(tween.totalDuration()).toBeLessThanOrEqual(0.2)
  })
})

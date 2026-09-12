import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  countUp,
  enterStagger,
  slideIn,
  loadGsap,
  prefersReducedMotion,
  shake,
  withMotion,
} from './motion'
import { scriptOf } from './motion'

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
    // Element DOMga ULANGAN bo'lishi kerak: ajratilganini
    // animatsiyalash ma'nosiz va `withMotion` uni o'tkazib yuboradi
    const scope = document.createElement('div')
    document.body.append(scope)
    const fn = vi.fn()

    const revert = await withMotion(scope, fn)

    expect(fn).toHaveBeenCalledTimes(1)
    expect(typeof fn.mock.calls[0]?.[0]?.to).toBe('function')
    expect(() => revert()).not.toThrow()
    scope.remove()
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
    tween?.progress(0)

    expect(items[0]?.style.opacity).toBe('')
  })

  it('BO‘SH tanlovda hech nima qaytarmaydi', async () => {
    /*
     * Bo'sh tanlovda GSAP "target not found" deb ogohlantiradi va
     * konsol shu xabarlar bilan to'lib ketardi — haqiqiy xatolar
     * orasida ko'rinmay qolardi.
     */
    stubMatchMedia(false)
    const gsap = (await loadGsap())!

    expect(enterStagger(gsap, '[data-yoq-narsa]')).toBeNull()
  })

  it('slideIn RTL da teskari tomondan kiradi', async () => {
    stubMatchMedia(false)
    const gsap = (await loadGsap())!
    const node = document.createElement('div')

    const ltr = slideIn(gsap, node, 'ltr')
    const rtl = slideIn(gsap, node, 'rtl')

    expect(Math.sign(ltr.vars.startAt?.x as number)).toBe(1)
    expect(Math.sign(rtl.vars.startAt?.x as number)).toBe(-1)
  })

  it('slideIn matnni AYLANTIRMAYDI — o‘qish buzilmasin', async () => {
    stubMatchMedia(false)
    const gsap = (await loadGsap())!

    const tween = slideIn(gsap, document.createElement('div'))

    expect(tween.vars.startAt?.rotationY).toBeUndefined()
  })

  it('shake seans qoidasiga sig‘adi — 200 ms dan oshmaydi', async () => {
    stubMatchMedia(false)
    const gsap = (await loadGsap())!

    const tween = shake(gsap, document.createElement('div'))

    expect(tween.totalDuration()).toBeLessThanOrEqual(0.2)
  })
})

describe('plaginli presetlar', () => {
  it('harakat kamaytirilganda plagin ham YUKLANMAYDI', async () => {
    /*
     * Plaginlar dangasa bo'lakda: harakat kerak bo'lmagan
     * foydalanuvchi ularni umuman yuklab olmasligi kerak.
     */
    stubMatchMedia(true)
    const fn = vi.fn()

    await withMotion(document.createElement('div'), fn, ['scrollTrigger', 'drawSVG'])

    expect(fn).not.toHaveBeenCalled()
  })

  it('scope DOMdan chiqib ketgan bo‘lsa animatsiya boshlanmaydi', async () => {
    /*
     * Plagin yuklanguncha komponent yo'q qilingan bo'lishi mumkin.
     * O'sha elementga tegish "null" xatolariga olib kelardi.
     */
    stubMatchMedia(false)
    const detached = document.createElement('div')
    const fn = vi.fn()

    await withMotion(detached, fn, ['scrollTrigger'])

    expect(fn).not.toHaveBeenCalled()
  })

  it('ulangan elementda plagin bilan ishlaydi', async () => {
    stubMatchMedia(false)
    const attached = document.createElement('div')
    document.body.append(attached)
    const fn = vi.fn()

    await withMotion(attached, fn, ['scrollTrigger'])

    expect(fn).toHaveBeenCalledTimes(1)
    attached.remove()
  })
})

describe('scriptOf', () => {
  it('arab, kirill va lotin yozuvini ajratadi — shovqin o‘sha alifbodan', () => {
    expect(scriptOf('كِتَاب')).toBe('arabic')
    expect(scriptOf('вода')).toBe('cyrillic')
    expect(scriptOf('water')).toBe('latin')
  })
})

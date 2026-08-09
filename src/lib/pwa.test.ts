import { afterEach, describe, expect, it, vi } from 'vitest'
import { registerServiceWorker, shouldRegisterServiceWorker } from './pwa'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('shouldRegisterServiceWorker', () => {
  it('production va qo‘llab-quvvatlansa — ha', () => {
    expect(shouldRegisterServiceWorker(true, true)).toBe(true)
  })

  it('dev rejimida ro‘yxatdan o‘tmaydi', () => {
    // SW keshi tuzatishga xalaqit beradi: o'zgartirish kiritilgach
    // eski nusxa ko'rinib qolardi
    expect(shouldRegisterServiceWorker(false, true)).toBe(false)
  })

  it('brauzer qo‘llab-quvvatlamasa — yo‘q', () => {
    expect(shouldRegisterServiceWorker(true, false)).toBe(false)
  })
})

describe('registerServiceWorker', () => {
  it('qo‘llab-quvvatlanmagan brauzerda xato tashlamaydi', () => {
    // PWA — qo'shimcha qulaylik; ilovaning ishlashi unga bog'liq emas
    vi.stubGlobal('navigator', {})

    expect(() => registerServiceWorker()).not.toThrow()
  })
})

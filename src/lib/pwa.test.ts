import { readFileSync } from 'node:fs'
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

/// <reference types="node" />
describe('sw.js — offline tayanchi', () => {
  const source = readFileSync('public/sw.js', 'utf8')

  it('o‘rnatishda ilova qobig‘ini keshlaydi', () => {
    // Aks holda offline'da FAQAT oldin ochilgan manzillar ishlardi:
    // navigatsiya javoblari o'z manzili bilan saqlanadi ("/", "/review"),
    // ya'ni "/stats" ga hech qachon kirmagan odam offline'da 503 olardi.
    expect(source).toMatch(/addEventListener\('install'/)
    expect(source).toMatch(/APP_SHELL/)
  })

  it('navigatsiya tayanchi HAQIQATAN keshlanadigan manzil bo‘ladi', () => {
    // `/index.html` hech qachon keshga tushmaydi: SPA barcha manzillarda
    // bir xil hujjatni beradi va u so'ralgan manzil bilan saqlanadi
    expect(source).not.toMatch(/caches\.match\('\/index\.html'\)/)
    expect(source).toMatch(/caches\.match\(APP_SHELL\)/)
  })
})

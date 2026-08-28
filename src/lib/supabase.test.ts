import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isCloudEnabled } from './supabase'

describe('isCloudEnabled', () => {
  it('kalitlar bo‘lmasa false — ilova lokal rejimda ishlaydi', () => {
    // Testlarda env bo'sh; bulut yo'qligi XATO EMAS, kutilgan holat
    expect(isCloudEnabled()).toBe(false)
  })
})

/** `createClient` chaqiruvlarini sanaydigan soxta kutubxona */
let createClient: (...args: unknown[]) => unknown

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => createClient(...args),
}))

describe('mijozni yuklash', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.resetModules()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('birinchi urinish muvaffaqiyatsiz bo‘lsa KEYINGISI qayta uriniladi', async () => {
    const rows = [{ code: 'ABC123', name: 'Ali', xp: 10 }]
    const factory = vi
      .fn()
      // Eski chunk yoki tarmoq uzilishi — bir martalik nosozlik
      .mockImplementationOnce(() => {
        throw new Error('yuklanmadi')
      })
      .mockImplementation(() => ({
        from: () => ({ select: () => Promise.resolve({ data: rows, error: null }) }),
      }))
    createClient = factory

    const { fetchWeeklyLeague } = await import('./supabase')

    expect(await fetchWeeklyLeague()).toBeNull()

    // Rad etilgan va'da KESHDA qolib ketsa, liga seans oxirigacha
    // o'lik bo'lardi — tarmoq tiklansa ham
    expect(await fetchWeeklyLeague()).toEqual(rows)
    expect(factory).toHaveBeenCalledTimes(2)
  })
})

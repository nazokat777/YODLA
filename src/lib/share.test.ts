import { afterEach, describe, expect, it, vi } from 'vitest'
import { shareText, weeklyReportText } from './share'

describe('shareText', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('Web Share bo‘lsa — ulashadi', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { share })

    expect(await shareText('t', 'x')).toBe('shared')
    expect(share).toHaveBeenCalledWith({ title: 't', text: 'x' })
  })

  it('bo‘lmasa — buferga nusxa', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })

    expect(await shareText('t', 'x')).toBe('copied')
  })

  it('foydalanuvchi oynani yopsa — xato emas, "failed"', async () => {
    vi.stubGlobal('navigator', { share: vi.fn().mockRejectedValue({ name: 'AbortError' }) })

    expect(await shareText('t', 'x')).toBe('failed')
  })

  it('hisobot matni', () => {
    expect(weeklyReportText({ activeDays: 5, words: 120, xp: 480, streak: 7 })).toContain('5 kun')
  })
})

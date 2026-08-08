import { describe, expect, it } from 'vitest'
import { addDays } from './date'
import { formatInterval, formatTimeUntil } from './format'

const NOW = new Date(2026, 0, 15, 10, 0, 0).getTime()

describe('formatInterval', () => {
  it.each([
    [0, 'bugun'],
    [0.5, 'bugun'],
    [1, '1 kun'],
    [6, '6 kun'],
    [29, '29 kun'],
  ])('%s kun → "%s"', (days, expected) => {
    expect(formatInterval(days)).toBe(expected)
  })

  it('30 kundan boshlab oylarga o‘tadi', () => {
    expect(formatInterval(30)).toBe('1 oy')
    expect(formatInterval(45)).toBe('2 oy') // 1.5 → yaxlitlanadi
    expect(formatInterval(180)).toBe('6 oy')
  })

  it('bir yildan uzun intervallar yillarda ko‘rsatiladi', () => {
    expect(formatInterval(365)).toBe('1 yil')
    expect(formatInterval(730)).toBe('2 yil')
    expect(formatInterval(550)).toBe('1.5 yil')
  })

  it('kun/oy va oy/yil chegaralari to‘g‘ri joyda', () => {
    expect(formatInterval(29)).toBe('29 kun')
    expect(formatInterval(30)).toBe('1 oy')
    expect(formatInterval(364)).toBe('12 oy')
    expect(formatInterval(365)).toBe('1 yil')
  })
})

describe('formatTimeUntil', () => {
  it('o‘tgan yoki hozirgi vaqt uchun "hozir"', () => {
    expect(formatTimeUntil(NOW, NOW)).toBe('hozir')
    expect(formatTimeUntil(NOW - 1000, NOW)).toBe('hozir')
  })

  it('ertangi kun uchun "ertaga"', () => {
    expect(formatTimeUntil(addDays(NOW, 1), NOW)).toBe('ertaga')
  })

  it('bir necha kun uchun sonli shakl', () => {
    expect(formatTimeUntil(addDays(NOW, 5), NOW)).toBe('5 kundan keyin')
  })

  it('soat emas, kalendar kuni hisoblanadi', () => {
    const lateEvening = new Date(2026, 0, 15, 23, 30).getTime()
    const soonAfterMidnight = new Date(2026, 0, 16, 0, 30).getTime()

    // Orasi 1 soat bo‘lsa ham, kalendar kuni bo‘yicha — ertaga
    expect(formatTimeUntil(soonAfterMidnight, lateEvening)).toBe('ertaga')
  })
})

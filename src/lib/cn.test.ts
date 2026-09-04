import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('sinflarni birlashtiradi', () => {
    expect(cn('p-4', 'text-center')).toBe('p-4 text-center')
  })

  it('shartli qiymatlarni tushiradi', () => {
    expect(cn('a', false, null, undefined, 'b')).toBe('a b')
  })

  it('bo‘sh chaqiruv — bo‘sh satr', () => {
    expect(cn()).toBe('')
  })

  it('Tailwind ZIDDIYATLARINI YECHMAYDI — bu ataylab shunday', () => {
    /*
     * `cn` — bir necha qatorlik yordamchi, `tailwind-merge` emas
     * (bog'liqliklarni kam saqlash uchun). Ya'ni `p-4` va `p-3` IKKALASI
     * ham elementda qoladi va qaysi biri ishlashini CSS faylidagi
     * qoidalar tartibi hal qiladi — chaqiruvchining niyati emas.
     *
     * Amalda bu 2026-08-29 da `Panel` da yuz bergan: `className="p-3"`
     * uzatilgan, hisoblangan bo'shliq esa 16 px (`p-4`) bo'lib qolgan va
     * yorliq matni kesilgan.
     *
     * XULOSA: umumiy komponentning asosiy sinfini o'zgartirish kerak
     * bo'lsa, `className` bilan emas, PROP bilan qiling
     * (`Panel padding="sm"` kabi).
     */
    expect(cn('p-4', 'p-3')).toBe('p-4 p-3')
  })
})

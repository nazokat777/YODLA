import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { WordStrengthMeter } from './WordStrengthMeter'

describe('WordStrengthMeter', () => {
  it('yangi so‘z uchun "Yangi" deb yoziladi', () => {
    render(<WordStrengthMeter card={{ interval: 0, repetitions: 0 }} />)

    expect(screen.getByTestId('word-strength')).toHaveTextContent('Yangi')
  })

  it('uzoq intervalli so‘z "Yodlangan"', () => {
    render(<WordStrengthMeter card={{ interval: 30, repetitions: 5 }} />)

    expect(screen.getByTestId('word-strength')).toHaveTextContent('Yodlangan')
  })

  it('bosqich NOMI ham yoziladi — rang yetarli emas', () => {
    /*
     * Rang bilan ma'no berish WCAG 1.4.1 ga zid: daltonizmi bor
     * foydalanuvchi bo'laklarni farqlay olmaydi.
     */
    render(<WordStrengthMeter card={{ interval: 10, repetitions: 3 }} />)

    expect(screen.getByTestId('word-strength').textContent?.trim().length).toBeGreaterThan(3)
  })
})

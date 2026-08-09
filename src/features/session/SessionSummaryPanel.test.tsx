import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionSummaryPanel } from './SessionSummaryPanel'
import type { SessionSummary } from './SessionRunner'

const SUMMARY: SessionSummary = {
  answered: 10,
  correct: 7,
  almost: 2,
  wrong: 1,
  xpEarned: 84,
  newBadges: [],
}

describe('SessionSummaryPanel', () => {
  it('XP animatsiyasiz ham YAKUNIY qiymatni ko‘rsatadi', () => {
    // Raqam JSX'da yakuniy qiymati bilan chiziladi; GSAP uni 0 dan
    // sanaydi. Animatsiya ishlamasa foydalanuvchi 0 ni emas, to'g'ri
    // sonni ko'rishi kerak.
    render(<SessionSummaryPanel summary={SUMMARY} />)

    expect(screen.getByTestId('session-xp')).toHaveTextContent('84')
  })

  it('statistika kartalari to‘g‘ri chiqadi', () => {
    render(<SessionSummaryPanel summary={SUMMARY} />)

    expect(screen.getByText(/10 ta javob/)).toBeInTheDocument()
    // (7 + 2) / 10 = 90%
    expect(screen.getByText(/90% aniqlik/)).toBeInTheDocument()
  })

  it('konfetti ekran o‘quvchidan yashiriladi', () => {
    const { container } = render(<SessionSummaryPanel summary={SUMMARY} />)

    const particles = container.querySelectorAll('[data-particle]')

    expect(particles.length).toBeGreaterThan(0)
    expect(particles[0].closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('seans boshlanmagan bo‘lsa tinch holat ko‘rsatiladi', () => {
    render(<SessionSummaryPanel summary={null} />)

    expect(screen.getByText(/takrorlash uchun so.z yo.q/i)).toBeInTheDocument()
  })
})

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionSummaryPanel } from './SessionSummaryPanel'
import type { SessionSummary } from './SessionRunner'

const SUMMARY: SessionSummary = {
  answered: 10,
  correct: 7,
  almost: 2,
  wrong: 1,
  perfectBonusXp: 0,
  xpEarned: 84,
  newBadges: [],
  masteredWords: 0,
  pendingWords: 0,
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

describe('SessionSummaryPanel — o‘zlashtirish hisoboti', () => {
  it('qolgan so‘zlar HALOL aytiladi', () => {
    /*
     * 60 qadamlik chegara ishlaganda so'zlar o'zlashtirilmagan holda
     * qolishi mumkin. Buni yashirish bolaga yolg'on ishonch berardi.
     */
    render(
      <SessionSummaryPanel
        summary={{ ...SUMMARY, answered: 60, masteredWords: 5, pendingWords: 2 }}
      />,
    )

    expect(screen.getByTestId('pending-words')).toHaveTextContent(
      /5 ta so.z o.zlashtirildi · 2 tasi keyingi darsga qoldi/,
    )
  })

  it('hammasi o‘zlashtirilganda bu qator CHIQMAYDI', () => {
    render(
      <SessionSummaryPanel
        summary={{ ...SUMMARY, answered: 14, masteredWords: 4, pendingWords: 0 }}
      />,
    )

    expect(screen.queryByTestId('pending-words')).not.toBeInTheDocument()
  })

  it('daraja oshgan bo‘lsa katta banner ENG TEPADA chiqadi', () => {
    render(
      <SessionSummaryPanel
        summary={{ ...SUMMARY, levelUp: { from: 1, to: 2, title: 'Yangi boshlovchi' } }}
      />,
    )

    const banner = screen.getByTestId('level-up')
    expect(banner).toHaveTextContent('2')
    expect(banner).toHaveTextContent(/yangi boshlovchi/i)
    // Yakun panelidan OLDIN — eng katta yangilik birinchi
    expect(banner.compareDocumentPosition(screen.getByTestId('session-xp'))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )
  })

  it('daraja oshmagan bo‘lsa banner yo‘q', () => {
    render(<SessionSummaryPanel summary={SUMMARY} />)

    expect(screen.queryByTestId('level-up')).not.toBeInTheDocument()
  })

  it('bilingan so‘zlar "bugungi o‘lja" lentasida chiqadi', () => {
    render(
      <SessionSummaryPanel
        summary={{
          ...SUMMARY,
          learnedWords: [
            { id: 'en:apple', word: 'apple', translation: 'olma' },
            { id: 'en:bread', word: 'bread', translation: 'non' },
          ],
        }}
      />,
    )

    const strip = screen.getByTestId('loot-strip')
    expect(strip).toHaveTextContent('2 so‘z')
    expect(strip).toHaveTextContent('apple')
    expect(strip).toHaveTextContent('non')
  })

  it('bilingan so‘z bo‘lmasa lenta yo‘q', () => {
    render(<SessionSummaryPanel summary={{ ...SUMMARY, learnedWords: [] }} />)

    expect(screen.queryByTestId('loot-strip')).not.toBeInTheDocument()
  })

  it('harakat tugmalari sandiqdan KEYIN, o‘lja va ertangi kundan OLDIN', () => {
    /*
     * NN/g #8: ilgari tugmalar 7 blokdan keyin, 3–4 skroll pastda edi.
     * "Keyin nima?" darhol ko'rinishi kerak.
     */
    render(
      <SessionSummaryPanel
        summary={{ ...SUMMARY, learnedWords: [{ id: 'en:a', word: 'a', translation: 'b' }] }}
        actions={<button type="button">Yana bir dars</button>}
      />,
    )

    const action = screen.getByRole('button', { name: 'Yana bir dars' })
    const chest = screen.getByTestId('chest-closed')
    const loot = screen.getByTestId('loot-strip')
    expect(chest.compareDocumentPosition(action) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(action.compareDocumentPosition(loot) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})

import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { HowItWorks } from './HowItWorks'

describe('HowItWorks', () => {
  it('atamalar yopiq turadi, bosilganda tushuntirish ochiladi', () => {
    render(<HowItWorks />)

    expect(screen.queryByTestId('how-text')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /muzlatish/i }))

    expect(screen.getByTestId('how-text')).toHaveTextContent(/streakni saqlab qoladi/i)
    expect(screen.getByRole('button', { name: /muzlatish/i })).toHaveAttribute('aria-expanded', 'true')
  })
})

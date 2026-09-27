import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ROUND_A, ROUND_B } from '@/core/mnemonics/pegs'
import { PegChallenge } from './PegChallenge'

/** Eslash bosqichida so'zlarni berilgan tartibda bosadi */
function answer(words: readonly string[]) {
  for (const word of words) fireEvent.click(screen.getByRole('button', { name: word }))
  fireEvent.click(screen.getByTestId('peg-check'))
}

describe('PegChallenge — usulsiz → usul → usul bilan', () => {
  beforeEach(() => localStorage.clear())

  it('ikki sinov natijasini va o‘sishni ko‘rsatadi', () => {
    render(<PegChallenge />)

    fireEvent.click(screen.getByTestId('peg-start'))
    expect(screen.getByTestId('peg-words')).toHaveTextContent('olma')
    fireEvent.click(screen.getByRole('button', { name: 'Tayyorman' }))

    // Birinchi sinov: faqat 2 tasi o'z o'rnida (qolgani teskari)
    answer([ROUND_A[0]!, ROUND_A[1]!, ...ROUND_A.slice(2).reverse()])

    expect(screen.getByTestId('peg-list')).toHaveTextContent('svetofor')
    fireEvent.click(screen.getByTestId('peg-second'))

    // Ikkinchi sinovda qarmoq maslahati ko'rinadi
    expect(screen.getByTestId('peg-words')).toHaveTextContent('quyosh')
    fireEvent.click(screen.getByRole('button', { name: 'Tayyorman' }))
    answer(ROUND_B)

    const result = screen.getByTestId('peg-result')
    expect(result).toHaveTextContent('2/10')
    expect(result).toHaveTextContent('10/10')
    expect(result).toHaveTextContent('5 barobar')
  })

  it('eng yaxshi natija eslab qolinadi', () => {
    localStorage.setItem('yodla:peg-best', '7')
    render(<PegChallenge />)
    expect(screen.getByText(/eng yaxshi natijangiz: 7\/10/i)).toBeInTheDocument()
  })
})

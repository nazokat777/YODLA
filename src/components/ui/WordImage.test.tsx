import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { WordImage } from './WordImage'

describe('WordImage', () => {
  it('rasmi bor so‘z uchun rasm chiziladi', () => {
    render(<WordImage translation="olma" />)

    expect(screen.getByTestId('word-image')).toHaveAttribute('src', '/word-images/1F34E.svg')
  })

  it('rasmi YO‘Q so‘z uchun hech nima chizilmaydi', () => {
    const { container } = render(<WordImage translation="mohiyat" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('bezak — ekran o‘quvchidan yashiriladi', () => {
    render(<WordImage translation="olma" />)

    expect(screen.getByTestId('word-image')).toHaveAttribute('aria-hidden', 'true')
  })

  it('yuklanmagan rasm YASHIRILADI — buzuq rasm belgisi qolmasin', () => {
    /*
     * Rasmlar faqat ko'rilganda keshga tushadi, ya'ni oflayn ochilganda
     * hali uchramagan so'zning rasmi kelmaydi.
     */
    render(<WordImage translation="olma" />)

    fireEvent.error(screen.getByTestId('word-image'))

    expect(screen.queryByTestId('word-image')).not.toBeInTheDocument()
  })
})

it('bir rasm yiqilsa, BOSHQA so‘zning rasmi ko‘rinaveradi', () => {
  // Komponent bir nusxada qolib, so'z almashishi mumkin
  const { rerender } = render(<WordImage translation="olma" />)

  fireEvent.error(screen.getByTestId('word-image'))
  rerender(<WordImage translation="suv" />)

  expect(screen.getByTestId('word-image')).toHaveAttribute('src', '/word-images/1F4A7.svg')
})

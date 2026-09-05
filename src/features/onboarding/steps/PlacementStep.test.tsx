import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import * as starterDecks from '@/content/starterDecks'
import { PlacementStep } from './PlacementStep'

const DECK = {
  A1: [
    { word: 'one', translation: 'bir', language: 'en' as const, level: 'A1' as const },
    { word: 'two', translation: 'ikki', language: 'en' as const, level: 'A1' as const },
    { word: 'three', translation: 'uch', language: 'en' as const, level: 'A1' as const },
  ],
  A2: [
    { word: 'four', translation: "to'rt", language: 'en' as const, level: 'A2' as const },
    { word: 'five', translation: 'besh', language: 'en' as const, level: 'A2' as const },
    { word: 'six', translation: 'olti', language: 'en' as const, level: 'A2' as const },
  ],
  B1: [
    { word: 'seven', translation: 'yetti', language: 'en' as const, level: 'B1' as const },
    { word: 'eight', translation: 'sakkiz', language: 'en' as const, level: 'B1' as const },
    { word: 'nine', translation: "to'qqiz", language: 'en' as const, level: 'B1' as const },
  ],
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PlacementStep', () => {
  it('lug‘atdan savollar yasaydi', async () => {
    vi.spyOn(starterDecks, 'loadLanguageDeck').mockResolvedValue(DECK)

    render(<PlacementStep language="en" onDone={vi.fn()} />)

    expect(await screen.findByRole('progressbar')).toBeInTheDocument()
  })

  it('testni O‘TKAZIB YUBORISH boshlang‘ich daraja beradi', async () => {
    vi.spyOn(starterDecks, 'loadLanguageDeck').mockResolvedValue(DECK)
    const onDone = vi.fn()

    render(<PlacementStep language="en" onDone={onDone} />)

    fireEvent.click(await screen.findByRole('button', { name: /o.tkazib yuborish/i }))

    expect(onDone).toHaveBeenCalledWith('A1')
  })

  it('lug‘at YUKLANMASA foydalanuvchi tuzoqda qolmaydi', async () => {
    /*
     * Tarmoq uzilsa yoki yangi versiya chiqib bo'lak nomi o'zgarsa,
     * lug'at yuklanmaydi. `.catch` bo'lmasa ekran abadiy "Yuklanmoqda…"
     * da qolardi — yangi foydalanuvchi onboardingdan UMUMAN o'ta
     * olmasdi va ilova ishga tushmasdi.
     */
    vi.spyOn(starterDecks, 'loadLanguageDeck').mockRejectedValue(new Error('tarmoq'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onDone = vi.fn()

    render(<PlacementStep language="en" onDone={onDone} />)

    const button = await screen.findByRole('button', { name: /davom/i })
    fireEvent.click(button)

    expect(onDone).toHaveBeenCalledWith('A1')
  })

  it('progress savol bilan siljiydi', async () => {
    vi.spyOn(starterDecks, 'loadLanguageDeck').mockResolvedValue(DECK)

    render(<PlacementStep language="en" onDone={vi.fn()} />)

    const bar = await screen.findByRole('progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '0')

    // Variantni bosish javob berish hisoblanadi
    const options = await screen.findAllByRole('button')
    const choice = options.find((button) => button.getAttribute('aria-label') === null)
    if (choice) fireEvent.click(choice)

    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
    })
  })

  it('hamma savolga javob berilgach daraja qaytariladi', async () => {
    vi.spyOn(starterDecks, 'loadLanguageDeck').mockResolvedValue(DECK)
    const onDone = vi.fn()

    render(<PlacementStep language="en" onDone={onDone} />)
    await screen.findByRole('progressbar')

    // Har savolda birinchi variantni bosaveramiz
    for (let step = 0; step < 30 && onDone.mock.calls.length === 0; step += 1) {
      const buttons = screen.queryAllByRole('button')
      const choice = buttons.find(
        (button) => !/o.tkazib yuborish/i.test(button.textContent ?? ''),
      )
      if (!choice) break
      fireEvent.click(choice)
      await waitFor(() => {})
    }

    // Natija — uchta darajadan biri; qaysi biri javoblarga bog'liq
    expect(onDone).toHaveBeenCalledTimes(1)
    expect(['A1', 'A2', 'B1']).toContain(onDone.mock.calls[0][0])
  })
})

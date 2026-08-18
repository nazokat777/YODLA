import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { PronounceButton } from './PronounceButton'
import * as recognition from '@/lib/recognition'

function renderButton() {
  return render(<PronounceButton text="water" locale="en-US" language="en" />)
}

function micButton() {
  return screen.getByRole('button', { name: /talaffuzni tekshirish/i })
}

beforeEach(() => {
  recognition.resetMicBlock()
  vi.spyOn(recognition, 'isRecognitionSupported').mockReturnValue(true)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('PronounceButton', () => {
  it('brauzer qo‘llab-quvvatlamasa umuman chizilmaydi', () => {
    vi.spyOn(recognition, 'isRecognitionSupported').mockReturnValue(false)
    const { container } = renderButton()

    expect(container).toBeEmptyDOMElement()
  })

  it('to‘g‘ri aytilganda tasdiq ko‘rsatiladi', async () => {
    vi.spyOn(recognition, 'listenOnce').mockResolvedValue({
      status: 'heard',
      alternatives: ['water'],
    })

    renderButton()
    fireEvent.click(micButton())

    expect(await screen.findByText(/to‘g‘ri talaffuz/i)).toBeInTheDocument()
  })

  it('noto‘g‘ri aytilganda eshitilgan so‘z ko‘rsatiladi', async () => {
    vi.spyOn(recognition, 'listenOnce').mockResolvedValue({
      status: 'heard',
      alternatives: ['waiter'],
    })

    renderButton()
    fireEvent.click(micButton())

    expect(await screen.findByText(/waiter/)).toBeInTheDocument()
  })

  it('ruxsat rad etilsa tushuntirish chiqadi va tugma o‘chadi', async () => {
    vi.spyOn(recognition, 'listenOnce').mockResolvedValue({ status: 'denied' })

    renderButton()
    fireEvent.click(micButton())

    expect(await screen.findByText(/ruxsat/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(micButton()).toBeDisabled()
    })
  })

  it('ovoz eshitilmasa qayta urinishga chaqiradi', async () => {
    vi.spyOn(recognition, 'listenOnce').mockResolvedValue({ status: 'no-speech' })

    renderButton()
    fireEvent.click(micButton())

    expect(await screen.findByText(/eshitilmadi/i)).toBeInTheDocument()
  })

  it('xatolikda internet haqida ogohlantiradi', async () => {
    vi.spyOn(recognition, 'listenOnce').mockResolvedValue({ status: 'failed' })

    renderButton()
    fireEvent.click(micButton())

    expect(await screen.findByText(/internet/i)).toBeInTheDocument()
  })
})

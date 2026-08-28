import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ReminderSettings } from './ReminderSettings'
import { useSettingsStore } from '@/stores/useSettingsStore'
import * as push from '@/lib/push'
import * as supabase from '@/lib/supabase'

beforeEach(() => {
  vi.spyOn(push, 'isPushSupported').mockReturnValue(true)
  vi.spyOn(push, 'isPushConfigured').mockReturnValue(true)
  vi.spyOn(push, 'isBrowserPushCapable').mockReturnValue(true)
  vi.spyOn(push, 'getActiveEndpoint').mockResolvedValue(null)
  // Bulut kalitlari testda bo'sh — sozlama ko'rinishi uchun yoqib qo'yamiz
  vi.spyOn(supabase, 'isCloudEnabled').mockReturnValue(true)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ReminderSettings', () => {
  it('BRAUZER qo‘llab-quvvatlamasa tushuntirish ko‘rsatadi', () => {
    vi.spyOn(push, 'isBrowserPushCapable').mockReturnValue(false)

    render(<ReminderSettings />)

    expect(screen.getByText(/qo‘llab-quvvatlamaydi/i)).toBeInTheDocument()
  })

  it('kalit sozlanmagan bo‘lsa HECH NIMA ko‘rsatmaydi', () => {
    // Brauzer o'zi qobiliyatli, lekin ilovada VAPID kaliti yo'q.
    // Ilgari bunda "bu brauzer qo'llab-quvvatlamaydi" deb YOLG'ON
    // aytilardi va iPhone maslahati berilardi — Android Chrome'da ham.
    vi.spyOn(push, 'isPushConfigured').mockReturnValue(false)

    const { container } = render(<ReminderSettings />)

    expect(container).toBeEmptyDOMElement()
  })

  it('bulut o‘chiq bo‘lsa ham HECH NIMA ko‘rsatmaydi', () => {
    vi.spyOn(supabase, 'isCloudEnabled').mockReturnValue(false)

    const { container } = render(<ReminderSettings />)

    expect(container).toBeEmptyDOMElement()
  })

  it('yoqilganda obuna saqlanadi va manzil eslab qolinadi', async () => {
    vi.spyOn(push, 'enablePush').mockResolvedValue({
      status: 'enabled',
      endpoint: 'https://push.example/abc',
    })

    render(<ReminderSettings />)
    fireEvent.click(screen.getByRole('switch', { name: /eslatma/i }))

    await waitFor(() => {
      expect(useSettingsStore.getState().pushEndpoint).toBe('https://push.example/abc')
    })
  })

  it('ruxsat rad etilsa sabab ko‘rsatiladi', async () => {
    vi.spyOn(push, 'enablePush').mockResolvedValue({ status: 'denied' })

    render(<ReminderSettings />)
    fireEvent.click(screen.getByRole('switch', { name: /eslatma/i }))

    expect(await screen.findByText(/ruxsat/i)).toBeInTheDocument()
    expect(useSettingsStore.getState().pushEndpoint).toBeNull()
  })

  it('soat tanlash saqlanadi', () => {
    render(<ReminderSettings />)

    fireEvent.change(screen.getByLabelText(/eslatma vaqti/i), { target: { value: '8' } })

    expect(useSettingsStore.getState().reminderHour).toBe(8)
  })

  it('brauzerda obuna qolmagan bo‘lsa kalit o‘zi o‘chadi', async () => {
    useSettingsStore.setState({ pushEndpoint: 'https://push.example/eski' })
    vi.spyOn(push, 'getActiveEndpoint').mockResolvedValue(null)

    render(<ReminderSettings />)

    await waitFor(() => {
      expect(useSettingsStore.getState().pushEndpoint).toBeNull()
    })
  })

  it('brauzer boshqa manzil bergan bo‘lsa saqlangani yangilanadi', async () => {
    useSettingsStore.setState({ pushEndpoint: 'https://push.example/eski' })
    vi.spyOn(push, 'getActiveEndpoint').mockResolvedValue('https://push.example/yangi')

    render(<ReminderSettings />)

    await waitFor(() => {
      expect(useSettingsStore.getState().pushEndpoint).toBe('https://push.example/yangi')
    })
  })
})

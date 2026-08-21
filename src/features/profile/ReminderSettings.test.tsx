import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ReminderSettings } from './ReminderSettings'
import { useSettingsStore } from '@/stores/useSettingsStore'
import * as push from '@/lib/push'
import * as supabase from '@/lib/supabase'

beforeEach(() => {
  vi.spyOn(push, 'isPushSupported').mockReturnValue(true)
  // Bulut kalitlari testda bo'sh — sozlama ko'rinishi uchun yoqib qo'yamiz
  vi.spyOn(supabase, 'isCloudEnabled').mockReturnValue(true)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('ReminderSettings', () => {
  it('qo‘llab-quvvatlanmasa tushuntirish ko‘rsatadi', () => {
    vi.spyOn(push, 'isPushSupported').mockReturnValue(false)

    render(<ReminderSettings />)

    expect(screen.getByText(/qo‘llab-quvvatlamaydi/i)).toBeInTheDocument()
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
})

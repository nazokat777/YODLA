import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePushActivity } from './usePushActivity'
import { useSettingsStore } from '@/stores/useSettingsStore'
import * as supabase from '@/lib/supabase'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('usePushActivity', () => {
  it('obuna bo‘lmasa hech nima yubormaydi', () => {
    const touch = vi.spyOn(supabase, 'touchPushActivity').mockResolvedValue(true)

    renderHook(() => usePushActivity(true))

    expect(touch).not.toHaveBeenCalled()
  })

  it('seans hali tugamagan bo‘lsa yubormaydi', () => {
    useSettingsStore.setState({ pushEndpoint: 'https://push.example/abc' })
    const touch = vi.spyOn(supabase, 'touchPushActivity').mockResolvedValue(true)

    renderHook(() => usePushActivity(false))

    expect(touch).not.toHaveBeenCalled()
  })

  it('seans tugaganda bugungi sanani yuboradi', async () => {
    useSettingsStore.setState({ pushEndpoint: 'https://push.example/abc' })
    const touch = vi.spyOn(supabase, 'touchPushActivity').mockResolvedValue(true)

    renderHook(() => usePushActivity(true))

    await waitFor(() => {
      expect(touch).toHaveBeenCalledWith(
        'https://push.example/abc',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      )
    })
  })
})

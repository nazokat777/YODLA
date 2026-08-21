import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { enablePush, isPushSupported } from './push'
import * as supabase from './supabase'

const subscribe = vi.fn()

/** Brauzer muhitini soxtalashtirish */
function installBrowser(permission: NotificationPermission = 'granted') {
  vi.stubGlobal('Notification', {
    permission,
    requestPermission: vi.fn().mockResolvedValue(permission),
  })

  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      ready: Promise.resolve({ pushManager: { subscribe, getSubscription: vi.fn() } }),
    },
  })

  vi.stubGlobal('PushManager', function PushManager() {})
}

beforeEach(() => {
  subscribe.mockReset()
  subscribe.mockResolvedValue({
    endpoint: 'https://push.example/abc',
    toJSON: () => ({
      endpoint: 'https://push.example/abc',
      keys: { p256dh: 'KEY', auth: 'AUTH' },
    }),
    unsubscribe: vi.fn().mockResolvedValue(true),
  })
  vi.spyOn(supabase, 'savePushSubscription').mockResolvedValue(true)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('isPushSupported', () => {
  it('kerakli API‘lar bo‘lmasa false', () => {
    expect(isPushSupported()).toBe(false)
  })

  it('hammasi bor bo‘lsa true', () => {
    installBrowser()
    expect(isPushSupported()).toBe(true)
  })
})

describe('enablePush', () => {
  it('ruxsat berilganda obunani saqlaydi', async () => {
    installBrowser('granted')

    await expect(enablePush(19)).resolves.toEqual({
      status: 'enabled',
      endpoint: 'https://push.example/abc',
    })

    expect(supabase.savePushSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ endpoint: 'https://push.example/abc', hour: 19 }),
    )
  })

  it('ruxsat rad etilsa denied qaytaradi', async () => {
    installBrowser('denied')

    await expect(enablePush(19)).resolves.toEqual({ status: 'denied' })
    expect(supabase.savePushSubscription).not.toHaveBeenCalled()
  })

  it('brauzer qo‘llab-quvvatlamasa unsupported qaytaradi', async () => {
    await expect(enablePush(19)).resolves.toEqual({ status: 'unsupported' })
  })

  it('server saqlay olmasa failed qaytaradi', async () => {
    installBrowser('granted')
    vi.spyOn(supabase, 'savePushSubscription').mockResolvedValue(false)

    await expect(enablePush(19)).resolves.toEqual({ status: 'failed' })
  })
})

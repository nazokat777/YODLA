import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestPersistentStorage } from './storage'

/** `navigator.storage` ni soxtalashtirish */
function installStorage(persisted: boolean, persistResult = true) {
  const persist = vi.fn().mockResolvedValue(persistResult)

  Object.defineProperty(navigator, 'storage', {
    configurable: true,
    value: {
      persisted: vi.fn().mockResolvedValue(persisted),
      persist,
    },
  })

  return persist
}

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('requestPersistentStorage', () => {
  it('brauzer qo‘llab-quvvatlamasa false', async () => {
    Object.defineProperty(navigator, 'storage', { configurable: true, value: undefined })

    await expect(requestPersistentStorage()).resolves.toBe(false)
  })

  it('allaqachon himoyalangan bo‘lsa so‘ramaydi', async () => {
    const persist = installStorage(true)

    await expect(requestPersistentStorage()).resolves.toBe(true)
    expect(persist).not.toHaveBeenCalled()
  })

  it('himoyalanmagan bo‘lsa so‘raydi', async () => {
    const persist = installStorage(false, true)

    await expect(requestPersistentStorage()).resolves.toBe(true)
    expect(persist).toHaveBeenCalledOnce()
  })

  it('IKKINCHI marta so‘ramaydi', async () => {
    const persist = installStorage(false, false)

    await requestPersistentStorage()
    await requestPersistentStorage()

    // Rad javobidan keyin qayta-qayta so'rash bezor qiladi
    expect(persist).toHaveBeenCalledOnce()
  })

  it('xatolik yuz bersa ilova yiqilmaydi', async () => {
    Object.defineProperty(navigator, 'storage', {
      configurable: true,
      value: {
        persisted: vi.fn().mockRejectedValue(new Error('yo‘q')),
        persist: vi.fn(),
      },
    })
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(requestPersistentStorage()).resolves.toBe(false)
  })
})

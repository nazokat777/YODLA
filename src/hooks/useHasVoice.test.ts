import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { useHasVoice } from './useHasVoice'

function makeVoice(lang: string): SpeechSynthesisVoice {
  return { name: lang, lang, default: false, localService: true, voiceURI: lang } as SpeechSynthesisVoice
}

/** Ovozlari kechikib yuklanadigan soxta `speechSynthesis` */
function stubSpeech(voicesAfterLoad: SpeechSynthesisVoice[], loadAfterCalls = 2) {
  let calls = 0

  vi.stubGlobal('speechSynthesis', {
    getVoices: () => {
      calls += 1
      return calls > loadAfterCalls ? voicesAfterLoad : []
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    cancel: () => {},
    speak: () => {},
  })
  vi.stubGlobal('SpeechSynthesisUtterance', class {})
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('useHasVoice', () => {
  it('ovozlar kechikib yuklansa ham natijani TO‘G‘RILAYDI', async () => {
    // Foydalanuvchining tizimida faqat ruscha ovoz bor — inglizcha yo'q.
    // Hodisa o'tkazib yuborilsa ham qayta tekshiruv buni topishi kerak.
    stubSpeech([makeVoice('ru-RU')])

    const { result } = renderHook(() => useHasVoice('en-US'))

    // Boshida "bor" deb hisoblanadi (tugma miltillamasin)
    expect(result.current).toBe(true)

    await waitFor(() => expect(result.current).toBe(false), { timeout: 3000 })
  })

  it('mos ovoz bor bo‘lsa true qoladi', async () => {
    stubSpeech([makeVoice('en-US')])

    const { result } = renderHook(() => useHasVoice('en-US'))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 600))
    })

    expect(result.current).toBe(true)
  })
})

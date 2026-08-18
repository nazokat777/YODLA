import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  isMicBlocked,
  isRecognitionSupported,
  listenOnce,
  resetMicBlock,
} from './recognition'

/** Soxta SpeechRecognition — testlar uni qo'lda boshqaradi */
class FakeRecognition {
  static last: FakeRecognition | null = null

  lang = ''
  maxAlternatives = 1
  interimResults = false
  continuous = false
  onresult: ((event: unknown) => void) | null = null
  onerror: ((event: unknown) => void) | null = null
  onend: (() => void) | null = null

  constructor() {
    FakeRecognition.last = this
  }

  start() {}

  abort() {
    this.onend?.()
  }

  /** Brauzer natija qaytargandek qilish */
  emitResult(transcripts: string[]) {
    const alternatives = transcripts.map((transcript) => ({ transcript }))
    this.onresult?.({
      results: [Object.assign(alternatives, { length: alternatives.length })],
    })
    this.onend?.()
  }

  emitError(error: string) {
    this.onerror?.({ error })
    this.onend?.()
  }
}

declare global {
  interface Window {
    SpeechRecognition?: unknown
  }
}

beforeEach(() => {
  resetMicBlock()
  FakeRecognition.last = null
  window.SpeechRecognition = FakeRecognition
})

afterEach(() => {
  delete window.SpeechRecognition
})

describe('isRecognitionSupported', () => {
  it('konstruktor bor bo‘lsa true', () => {
    expect(isRecognitionSupported()).toBe(true)
  })

  it('konstruktor yo‘q bo‘lsa false', () => {
    delete window.SpeechRecognition
    expect(isRecognitionSupported()).toBe(false)
  })
})

describe('listenOnce', () => {
  it('eshitilgan variantlarni qaytaradi', async () => {
    const promise = listenOnce('en-US')
    FakeRecognition.last?.emitResult(['water', 'waiter'])

    await expect(promise).resolves.toEqual({
      status: 'heard',
      alternatives: ['water', 'waiter'],
    })
  })

  it('berilgan lokalni o‘rnatadi va bir nechta variant so‘raydi', async () => {
    const promise = listenOnce('ar-SA')

    expect(FakeRecognition.last?.lang).toBe('ar-SA')
    expect(FakeRecognition.last?.maxAlternatives).toBeGreaterThan(1)

    FakeRecognition.last?.emitResult(['ماء'])
    await promise
  })

  it('ruxsat berilmasa denied qaytaradi va bayroqni yoqadi', async () => {
    const promise = listenOnce('en-US')
    FakeRecognition.last?.emitError('not-allowed')

    await expect(promise).resolves.toEqual({ status: 'denied' })
    expect(isMicBlocked()).toBe(true)
  })

  it('ovoz eshitilmasa no-speech qaytaradi', async () => {
    const promise = listenOnce('en-US')
    FakeRecognition.last?.emitError('no-speech')

    await expect(promise).resolves.toEqual({ status: 'no-speech' })
    expect(isMicBlocked()).toBe(false)
  })

  it('tarmoq xatosida failed qaytaradi', async () => {
    const promise = listenOnce('en-US')
    FakeRecognition.last?.emitError('network')

    await expect(promise).resolves.toEqual({ status: 'failed' })
  })

  it('natijasiz tugasa no-speech qaytaradi', async () => {
    const promise = listenOnce('en-US')
    FakeRecognition.last?.onend?.()

    await expect(promise).resolves.toEqual({ status: 'no-speech' })
  })

  it('qo‘llab-quvvatlanmasa failed qaytaradi', async () => {
    delete window.SpeechRecognition
    await expect(listenOnce('en-US')).resolves.toEqual({ status: 'failed' })
  })
})

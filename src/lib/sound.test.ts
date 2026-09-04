import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Yaratilgan ossilyatorlarni kuzatish uchun soxta Web Audio */
function installAudio(state: AudioContextState = 'running') {
  const oscillators: { frequency: { value: number }; start: unknown; stop: unknown }[] = []
  const resume = vi.fn()

  const gainNode = {
    gain: {
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  }

  class FakeContext {
    state = state
    currentTime = 0
    destination = {}
    resume = resume

    createOscillator() {
      const osc = {
        type: '',
        frequency: { value: 0 },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }
      oscillators.push(osc)
      return osc
    }

    createGain() {
      return gainNode
    }
  }

  Object.defineProperty(window, 'AudioContext', {
    configurable: true,
    writable: true,
    value: FakeContext,
  })

  return { oscillators, resume, gainNode }
}

/** Modul ichida kontekst keshlanadi — har test uchun toza nusxa kerak */
async function freshSound() {
  vi.resetModules()
  return import('./sound')
}

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  Reflect.deleteProperty(window, 'AudioContext')
})

describe('playCorrectSound', () => {
  it('IKKI ohang — ko‘tariluvchi', async () => {
    const { oscillators } = installAudio()
    const { playCorrectSound } = await freshSound()

    playCorrectSound()

    // Quvnoq tuyg'u pastdan yuqoriga ko'tarilishdan keladi
    expect(oscillators.map((osc) => osc.frequency.value)).toEqual([660, 880])
  })
})

describe('playWrongSound', () => {
  it('BITTA past ohang — jazolovchi emas', async () => {
    const { oscillators } = installAudio()
    const { playWrongSound } = await freshSound()

    playWrongSound()

    // Uzoq yoki keskin signal xatoni jazoga aylantirardi
    expect(oscillators.map((osc) => osc.frequency.value)).toEqual([220])
  })
})

describe('audio konteksti', () => {
  it('TO‘XTATILGAN kontekst tiklanadi', async () => {
    /*
     * Brauzer avtomatik ijroni bloklaydi: foydalanuvchi hech nima
     * bosmaguncha kontekst `suspended` bo'ladi. Tiklanmasa, birinchi
     * javobdan keyin ham tovush umuman eshitilmasdi.
     */
    const { resume } = installAudio('suspended')
    const { playCorrectSound } = await freshSound()

    playCorrectSound()

    expect(resume).toHaveBeenCalled()
  })

  it('kontekst QAYTA ishlatiladi', async () => {
    const constructed = vi.fn()
    installAudio()
    const Original = window.AudioContext
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      writable: true,
      value: class extends Original {
        constructor() {
          super()
          constructed()
        }
      },
    })

    const { playCorrectSound, playWrongSound } = await freshSound()
    playCorrectSound()
    playWrongSound()

    // Har tovush uchun yangi kontekst ochilsa, brauzer ularni cheklaydi
    // va bir necha javobdan keyin tovush yo'qolardi
    expect(constructed).toHaveBeenCalledTimes(1)
  })

  it('Web Audio BO‘LMASA ilova yiqilmaydi', async () => {
    Reflect.deleteProperty(window, 'AudioContext')
    const { playCorrectSound } = await freshSound()

    // Tovush — bezak. Yo'q bo'lsa mashq davom etaveradi.
    expect(() => playCorrectSound()).not.toThrow()
  })

  it('kontekst yaratishda XATO bo‘lsa ham yiqilmaydi', async () => {
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      writable: true,
      value: class {
        constructor() {
          throw new Error('bloklangan')
        }
      },
    })

    const { playWrongSound } = await freshSound()

    expect(() => playWrongSound()).not.toThrow()
  })
})

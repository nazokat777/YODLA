import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getVoiceForLocale, hasVoiceForLocale, speak } from './speech'

/** Test uchun soxta ovoz */
function makeVoice(name: string, lang: string): SpeechSynthesisVoice {
  return { name, lang, default: false, localService: true, voiceURI: name } as SpeechSynthesisVoice
}

const spoken: SpeechSynthesisUtterance[] = []

/** `window.speechSynthesis` ni berilgan ovozlar bilan almashtirish */
function stubSpeech(voices: SpeechSynthesisVoice[]) {
  spoken.length = 0

  vi.stubGlobal('speechSynthesis', {
    getVoices: () => voices,
    cancel: () => {},
    speak: (utterance: SpeechSynthesisUtterance) => spoken.push(utterance),
  })

  // jsdom'da bu konstruktor yo'q — o'qiladigan maydonlarni saqlaydigan soxtasi
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      lang = ''
      rate = 1
      voice: SpeechSynthesisVoice | null = null
      text: string

      constructor(text: string) {
        this.text = text
      }
    },
  )
}

beforeEach(() => {
  spoken.length = 0
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getVoiceForLocale', () => {
  it('aynan mos lokalni afzal ko‘radi', () => {
    stubSpeech([makeVoice('UK', 'en-GB'), makeVoice('US', 'en-US')])

    expect(getVoiceForLocale('en-US')?.name).toBe('US')
  })

  it('aynan mosi bo‘lmasa, o‘sha TILdagi ovozni oladi', () => {
    stubSpeech([makeVoice('UK', 'en-GB')])

    expect(getVoiceForLocale('en-US')?.name).toBe('UK')
  })

  it('o‘sha tilda ovoz bo‘lmasa null qaytaradi', () => {
    // Foydalanuvchining Windows tizimida aynan shunday holat: faqat
    // ruscha va arabcha ovozlar o'rnatilgan
    stubSpeech([makeVoice('Irina', 'ru-RU'), makeVoice('Naayf', 'ar-SA')])

    expect(getVoiceForLocale('en-US')).toBeNull()
  })
})

describe('speak', () => {
  it('mos ovozni ANIQ tanlaydi', () => {
    const us = makeVoice('US', 'en-US')
    stubSpeech([makeVoice('Irina', 'ru-RU'), us])

    expect(speak('water', 'en-US')).toBe(true)
    expect(spoken).toHaveLength(1)
    expect(spoken[0].voice).toBe(us)
    expect(spoken[0].lang).toBe('en-US')
  })

  it('mos ovoz yo‘q bo‘lsa UMUMAN o‘qimaydi', () => {
    // Aks holda ruscha ovoz inglizcha so'zni ruscha talaffuzda o'qib,
    // foydalanuvchini NOTO'G'RI talaffuzga o'rgatardi — jim turgani afzal
    stubSpeech([makeVoice('Irina', 'ru-RU')])

    expect(speak('water', 'en-US')).toBe(false)
    expect(spoken).toHaveLength(0)
  })

  it('ovozlar hali yuklanmagan bo‘lsa urinib ko‘radi', () => {
    // `getVoices()` birinchi chaqiruvda ko'pincha bo'sh bo'ladi
    stubSpeech([])

    expect(speak('water', 'en-US')).toBe(true)
    expect(spoken).toHaveLength(1)
    expect(spoken[0].lang).toBe('en-US')
  })
})

describe('hasVoiceForLocale', () => {
  it('o‘sha tilda ovoz bo‘lsa true', () => {
    stubSpeech([makeVoice('US', 'en-US')])

    expect(hasVoiceForLocale('en-US')).toBe(true)
  })

  it('o‘sha tilda ovoz bo‘lmasa false', () => {
    stubSpeech([makeVoice('Irina', 'ru-RU')])

    expect(hasVoiceForLocale('en-US')).toBe(false)
  })
})

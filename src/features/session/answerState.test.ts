import { describe, expect, it } from 'vitest'
import { EMPTY_ANSWER } from './answerState'

describe('EMPTY_ANSWER', () => {
  it('bo‘sh javob shakli', () => {
    expect(EMPTY_ANSWER).toEqual({ choiceIndex: null, text: '', tokenOrder: [] })
  })

  it('O‘ZGARTIRIB BO‘LMAYDI', () => {
    // Bu obyekt barcha mashqlar orasida bo'lishiladi. Joyida
    // o'zgartirilsa, keyingi mashq oldingi javob bilan boshlanardi.
    expect(() => {
      ;(EMPTY_ANSWER.tokenOrder as number[]).push(1)
    }).toThrow()

    expect(() => {
      ;(EMPTY_ANSWER as { text: string }).text = 'x'
    }).toThrow()

    expect(EMPTY_ANSWER.tokenOrder).toEqual([])
  })
})

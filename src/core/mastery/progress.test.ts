import { describe, expect, it } from 'vitest'
import { applyAnswer, emptyProgress } from './progress'

/** Ketma-ket javoblarni qo'llaydi — testlarni qisqartirish uchun */
function answers(...steps: Array<['correct' | 'almost' | 'wrong', string]>) {
  let progress = emptyProgress('en:water')

  for (const [verdict, type] of steps) {
    progress = applyAnswer(progress, verdict, type as never)
  }

  return progress
}

describe('applyAnswer', () => {
  it('yangi so‘z o‘zlashtirilmagan holatda boshlanadi', () => {
    expect(emptyProgress('en:water')).toEqual({
      cardId: 'en:water',
      streak: 0,
      lastCorrectType: null,
      mastered: false,
      asked: 0,
    })
  })

  it('BIR marta to‘g‘ri javob yetarli EMAS', () => {
    // To'rt variantdan bittasini ko'r-ko'rona bosish 25% ehtimol bilan
    // to'g'ri chiqadi — bu bilimning dalili emas
    expect(answers(['correct', 'recognition']).mastered).toBe(false)
  })

  it('BIR XIL turda ikki marta to‘g‘ri javob ham yetarli emas', () => {
    /*
     * Ikkala javob ham bir xil mashqda berilgan bo'lsa, bola so'zni
     * emas, ekrandagi naqshni eslab qolgan bo'lishi mumkin.
     */
    const progress = answers(['correct', 'recognition'], ['correct', 'recognition'])

    expect(progress.streak).toBe(2)
    expect(progress.mastered).toBe(false)
  })

  it('HAR XIL turda ikki marta to‘g‘ri javob — o‘zlashtirildi', () => {
    const progress = answers(['correct', 'recognition'], ['correct', 'recall'])

    expect(progress.mastered).toBe(true)
  })

  it('"deyarli" javob to‘g‘ri hisoblanadi — imlo xatosi bilishni bekor qilmaydi', () => {
    const progress = answers(['correct', 'recognition'], ['almost', 'recall'])

    expect(progress.mastered).toBe(true)
  })

  it('xato javob hisobni NOLGA qaytaradi', () => {
    const progress = answers(['correct', 'recognition'], ['wrong', 'recall'])

    expect(progress.streak).toBe(0)
    expect(progress.lastCorrectType).toBeNull()
    expect(progress.mastered).toBe(false)
  })

  it('xatodan keyin qayta ikki xil turda to‘g‘ri javob — o‘zlashtiriladi', () => {
    const progress = answers(
      ['wrong', 'recognition'],
      ['correct', 'recognition'],
      ['correct', 'spelling'],
    )

    expect(progress.mastered).toBe(true)
  })

  it('o‘zlashtirilgan so‘z keyingi XATO javobda ham o‘zlashtirilgan qoladi', () => {
    /*
     * `mastered` QAYTMAS: ko'rsatkich orqaga ketsa, bola qilgan ishi
     * bekor bo'lganday his qiladi. Seans ichidagi keyingi xato SM-2
     * jadvaliga ta'sir qiladi, ko'rsatkichga emas.
     */
    const progress = answers(
      ['correct', 'recognition'],
      ['correct', 'recall'],
      ['wrong', 'listening'],
    )

    expect(progress.mastered).toBe(true)
  })

  it('har javobda berilgan savollar soni ortadi', () => {
    const progress = answers(['wrong', 'recognition'], ['correct', 'recall'])

    expect(progress.asked).toBe(2)
  })

  it('holat O‘ZGARTIRILMAYDI — yangi obyekt qaytadi', () => {
    const before = emptyProgress('en:water')

    applyAnswer(before, 'correct', 'recognition')

    expect(before.streak).toBe(0)
  })
})

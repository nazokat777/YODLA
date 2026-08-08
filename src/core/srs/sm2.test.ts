import { describe, expect, it } from 'vitest'
import type { Grade } from '@/core/types'
import { addDays, startOfDay } from '@/lib/date'
import {
  initialSrsState,
  isDue,
  nextEaseFactor,
  nextInterval,
  reviewSrsState,
  type SrsState,
} from './sm2'
import { DEFAULT_EASE_FACTOR, MAX_EASE_FACTOR, MIN_EASE_FACTOR } from './constants'

/** Testlarda ishlatiladigan qat'iy vaqt: 15-yanvar 2026, soat 10:00 (lokal) */
const NOW = new Date(2026, 0, 15, 10, 0, 0).getTime()

/** Qisqa yordamchi: holat yaratish */
function state(partial: Partial<SrsState> = {}): SrsState {
  return { interval: 0, repetitions: 0, easeFactor: DEFAULT_EASE_FACTOR, dueDate: NOW, ...partial }
}

describe('initialSrsState', () => {
  it('yangi karta darhol takrorlashga tayyor bo‘ladi', () => {
    const fresh = initialSrsState(NOW)

    expect(fresh).toEqual({
      interval: 0,
      repetitions: 0,
      easeFactor: DEFAULT_EASE_FACTOR,
      dueDate: NOW,
    })
    expect(isDue(fresh, NOW)).toBe(true)
  })
})

describe('nextEaseFactor', () => {
  // SuperMemo-2 formulasining kutilgan qiymatlari
  const CASES: Array<[Grade, number]> = [
    [5, 2.5], // +0.10 → 2.6, lekin yuqori chegara 2.5
    [4, 2.5], //  0.00 → o‘zgarmaydi
    [3, 2.36], // −0.14
    [2, 2.18], // −0.32
    [1, 1.96], // −0.54
    [0, 1.7], // −0.80
  ]

  it.each(CASES)('baho %i → easeFactor %f', (grade, expected) => {
    expect(nextEaseFactor(DEFAULT_EASE_FACTOR, grade)).toBe(expected)
  })

  it('yuqori chegaradan (2.5) oshmaydi', () => {
    expect(nextEaseFactor(2.5, 5)).toBe(MAX_EASE_FACTOR)
  })

  it('quyi chegaradan (1.3) pasaymaydi', () => {
    // Ketma-ket ikki marta eng past baho: 2.5 → 1.7 → 0.9, lekin pol 1.3
    const afterOne = nextEaseFactor(DEFAULT_EASE_FACTOR, 0)
    expect(afterOne).toBe(1.7)
    expect(nextEaseFactor(afterOne, 0)).toBe(MIN_EASE_FACTOR)
  })

  it('suzuvchi nuqta xatosini yig‘maydi (2 xonagacha yaxlitlanadi)', () => {
    // 2.36 − 0.14 = 2.2199999... bo‘lib qolmasligi kerak
    expect(nextEaseFactor(2.36, 3)).toBe(2.22)
  })
})

describe('nextInterval', () => {
  it('birinchi muvaffaqiyat → 1 kun', () => {
    expect(nextInterval(0, 0, 2.5, 4)).toBe(1)
  })

  it('ikkinchi muvaffaqiyat → 6 kun', () => {
    expect(nextInterval(1, 1, 2.5, 4)).toBe(6)
  })

  it('uchinchidan boshlab → interval × easeFactor (yaxlitlangan)', () => {
    expect(nextInterval(2, 6, 2.5, 4)).toBe(15) // 6 × 2.5
    expect(nextInterval(3, 15, 2.5, 4)).toBe(38) // 37.5 → 38
    expect(nextInterval(3, 15, 1.3, 4)).toBe(20) // 19.5 → 20
  })

  it('xato javobda interval 1 kunga qaytadi — qanchalik uzun bo‘lmasin', () => {
    expect(nextInterval(9, 365, 2.5, 2)).toBe(1)
    expect(nextInterval(9, 365, 0, 0)).toBe(1)
  })

  it('interval hech qachon 1 kundan kichik bo‘lmaydi', () => {
    // Math.max chegarasi HAQIQATAN ishlashini tekshiramiz: ko'paytma 0 chiqadi,
    // ya'ni himoyasiz kod 0 kun qaytarib, kartani cheksiz qayta chiqarardi.
    expect(nextInterval(5, 0, 1.3, 4)).toBe(1)
    expect(nextInterval(5, 0.2, 1.3, 4)).toBe(1) // round(0.26) = 0
    // 1 × 1.3 = 1.3 → yaxlitlanganda ham 1
    expect(nextInterval(5, 1, 1.3, 4)).toBe(1)
  })
})

describe('reviewSrsState — muvaffaqiyatli takrorlashlar ketma-ketligi', () => {
  it('1 → 6 → 15 → 38 kun bo‘yicha o‘sadi', () => {
    let current = initialSrsState(NOW)

    current = reviewSrsState(current, 4, NOW)
    expect(current.interval).toBe(1)
    expect(current.repetitions).toBe(1)

    current = reviewSrsState(current, 4, NOW)
    expect(current.interval).toBe(6)
    expect(current.repetitions).toBe(2)

    current = reviewSrsState(current, 4, NOW)
    expect(current.interval).toBe(15)
    expect(current.repetitions).toBe(3)

    current = reviewSrsState(current, 4, NOW)
    expect(current.interval).toBe(38)
    expect(current.repetitions).toBe(4)

    // Baho 4 da easeFactor o‘zgarmaydi
    expect(current.easeFactor).toBe(DEFAULT_EASE_FACTOR)
  })

  it('past baholar intervalni sekinroq o‘stiradi', () => {
    // Har safar "zo‘rg‘a esladim" (3) — easeFactor pasayib boradi
    let current = initialSrsState(NOW)
    current = reviewSrsState(current, 3, NOW) // EF 2.36, interval 1
    current = reviewSrsState(current, 3, NOW) // EF 2.22, interval 6
    current = reviewSrsState(current, 3, NOW) // EF 2.08, interval round(6×2.08)=12

    expect(current.easeFactor).toBe(2.08)
    expect(current.interval).toBe(12)
    // Taqqoslash uchun: baho 4 bilan bu bosqichda interval 15 bo‘lardi
    expect(current.interval).toBeLessThan(15)
  })
})

describe('reviewSrsState — xato javob', () => {
  it('takrorlashlarni nolga qaytaradi va intervalni 1 kun qiladi', () => {
    const advanced = state({ interval: 90, repetitions: 6, easeFactor: 2.5 })

    const result = reviewSrsState(advanced, 1, NOW)

    expect(result.repetitions).toBe(0)
    expect(result.interval).toBe(1)
    expect(result.easeFactor).toBe(1.96) // 2.5 − 0.54
  })

  it('baho 3 — chegara qiymati — hali ham "to‘g‘ri" hisoblanadi', () => {
    const result = reviewSrsState(state({ repetitions: 4, interval: 30 }), 3, NOW)
    expect(result.repetitions).toBe(5)
    expect(result.interval).toBeGreaterThan(1)
  })

  it('baho 2 — "xato" tomonda', () => {
    const result = reviewSrsState(state({ repetitions: 4, interval: 30 }), 2, NOW)
    expect(result.repetitions).toBe(0)
    expect(result.interval).toBe(1)
  })
})

describe('reviewSrsState — dueDate hisoblash', () => {
  it('kun chegarasiga tekislanadi: kechqurun o‘rganilgan so‘z ertalab chiqadi', () => {
    const lateEvening = new Date(2026, 0, 15, 22, 45).getTime()

    const result = reviewSrsState(initialSrsState(lateEvening), 4, lateEvening)

    // Interval 1 kun → ertasi kunning boshi (00:00), 22:45 emas
    expect(result.dueDate).toBe(new Date(2026, 0, 16, 0, 0, 0, 0).getTime())
  })

  it('dueDate = shu kun boshi + interval kun', () => {
    const result = reviewSrsState(state({ interval: 6, repetitions: 2 }), 4, NOW)

    expect(result.interval).toBe(15)
    expect(result.dueDate).toBe(addDays(startOfDay(NOW), 15))
  })

  it('oy chegarasidan to‘g‘ri o‘tadi', () => {
    const jan30 = new Date(2026, 0, 30, 9, 0).getTime()

    const result = reviewSrsState(state({ interval: 1, repetitions: 1 }), 4, jan30)

    expect(result.interval).toBe(6)
    // 30-yanvar + 6 kun = 5-fevral
    expect(result.dueDate).toBe(new Date(2026, 1, 5, 0, 0, 0, 0).getTime())
  })
})

describe('reviewSrsState — sof funksiya', () => {
  it('kiruvchi obyektni o‘zgartirmaydi', () => {
    const original = state({ interval: 6, repetitions: 2, easeFactor: 2.5 })
    const snapshot = { ...original }

    reviewSrsState(original, 0, NOW)

    expect(original).toEqual(snapshot)
  })

  it('bir xil kiruvchi ma’lumot uchun bir xil natija qaytaradi', () => {
    const input = state({ interval: 6, repetitions: 2 })

    expect(reviewSrsState(input, 4, NOW)).toEqual(reviewSrsState(input, 4, NOW))
  })
})

describe('baholarni tekshirish', () => {
  it.each([-1, 6, 2.5, Number.NaN])('noto‘g‘ri baho (%s) uchun xato tashlaydi', (grade) => {
    expect(() => reviewSrsState(state(), grade as Grade, NOW)).toThrow(RangeError)
  })
})

describe('isDue', () => {
  it('dueDate o‘tgan yoki hozir bo‘lsa — takrorlashga tayyor', () => {
    expect(isDue({ dueDate: NOW - 1 }, NOW)).toBe(true)
    expect(isDue({ dueDate: NOW }, NOW)).toBe(true)
  })

  it('dueDate kelajakda bo‘lsa — tayyor emas', () => {
    expect(isDue({ dueDate: NOW + 1 }, NOW)).toBe(false)
  })
})

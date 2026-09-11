import { describe, expect, it } from 'vitest'
import { PASSING_GRADE, reviewSrsState } from '@/core/srs'
import { GAME_WRONG_GRADE, gameGrade } from './grade'

describe('gameGrade', () => {
  it('xato javob SM-2 uchun YIQILISH emas', () => {
    /*
     * Ilgari 2 berilardi: interval 1 kunga tushar, takrorlar noldan
     * boshlanar, `lapses` oshar edi. Xotira o'yinida deyarli har
     * urinish "xato" — ya'ni har o'yin o'nlab so'zni takrorlash
     * navbatiga tiqardi.
     */
    expect(GAME_WRONG_GRADE).toBeGreaterThanOrEqual(PASSING_GRADE)

    const before = { interval: 21, repetitions: 4, easeFactor: 2.5, dueDate: 0 }
    const after = reviewSrsState(before, gameGrade(false), 0)

    expect(after.repetitions).toBe(5)
    expect(after.interval).toBeGreaterThan(1)
  })

  it('xato signal YO‘QOLMAYDI — yengillik kamayadi', () => {
    const before = { interval: 21, repetitions: 4, easeFactor: 2.5, dueDate: 0 }

    expect(reviewSrsState(before, gameGrade(false), 0).easeFactor).toBeLessThan(
      reviewSrsState(before, gameGrade(true), 0).easeFactor,
    )
  })
})

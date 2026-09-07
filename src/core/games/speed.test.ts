import { describe, expect, it } from 'vitest'
import { SPEED_SECONDS, answerSpeed, startSpeed, tickSpeed } from './speed'

describe('startSpeed', () => {
  it('to‘liq vaqt bilan boshlanadi', () => {
    expect(startSpeed()).toEqual({
      secondsLeft: SPEED_SECONDS,
      score: 0,
      answered: 0,
      finished: false,
    })
  })
})

describe('tickSpeed', () => {
  it('soniya kamayadi', () => {
    expect(tickSpeed(startSpeed(10)).secondsLeft).toBe(9)
  })

  it('nolga yetganda o‘yin tugaydi', () => {
    expect(tickSpeed(startSpeed(1))).toMatchObject({ secondsLeft: 0, finished: true })
  })

  it('tugagan o‘yinda soniya MANFIYGA ketmaydi', () => {
    const finished = tickSpeed(startSpeed(1))

    expect(tickSpeed(finished).secondsLeft).toBe(0)
  })
})

describe('answerSpeed', () => {
  it('to‘g‘ri javob ochko qo‘shadi', () => {
    expect(answerSpeed(startSpeed(), true)).toMatchObject({ score: 1, answered: 1 })
  })

  it('xato javob faqat javoblar sonini oshiradi', () => {
    expect(answerSpeed(startSpeed(), false)).toMatchObject({ score: 0, answered: 1 })
  })

  it('TUGAGAN o‘yinda javob hisobga o‘tmaydi', () => {
    /*
     * Taymer nolga yetgan paytda bosilgan tugma ochko qo'shsa,
     * natija yolg'on bo'lardi.
     */
    const finished = tickSpeed(startSpeed(1))

    expect(answerSpeed(finished, true).score).toBe(0)
  })

  it('holat O‘ZGARTIRILMAYDI', () => {
    const before = startSpeed()

    answerSpeed(before, true)

    expect(before.score).toBe(0)
  })
})

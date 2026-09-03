import { describe, expect, it } from 'vitest'
import { COMBO_BONUS_EVERY, COMBO_BONUS_XP, comboBonusXp, nextCombo } from './combo'

describe('nextCombo', () => {
  it('to‘g‘ri javob komboni oshiradi', () => {
    expect(nextCombo(3, 'correct')).toBe(4)
  })

  it('xato javob komboni nolga tushiradi', () => {
    expect(nextCombo(9, 'wrong')).toBe(0)
  })

  it('imlo xatosi komboni BUZMAYDI', () => {
    // `almost` — bitta harf bilan adashilgan TO'G'RI javob. O'nlik
    // komboni shu uchun yo'qotish foydalanuvchini yozishdan qo'rqitardi.
    expect(nextCombo(10, 'almost')).toBe(10)
  })
})

describe('comboBonusXp', () => {
  it(`har ${COMBO_BONUS_EVERY}-chi javobda bonus beradi`, () => {
    expect(comboBonusXp(COMBO_BONUS_EVERY)).toBe(COMBO_BONUS_XP)
    expect(comboBonusXp(COMBO_BONUS_EVERY * 2)).toBe(COMBO_BONUS_XP)
  })

  it('oraliqdagi javoblarda bonus yo‘q', () => {
    expect(comboBonusXp(COMBO_BONUS_EVERY - 1)).toBe(0)
    expect(comboBonusXp(COMBO_BONUS_EVERY + 1)).toBe(0)
  })

  it('kombo nolda bonus yo‘q', () => {
    // Aks holda `0 % 5 === 0` har xatodan keyin bonus berardi
    expect(comboBonusXp(0)).toBe(0)
  })
})

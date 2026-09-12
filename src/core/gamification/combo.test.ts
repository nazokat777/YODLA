import { describe, expect, it } from 'vitest'
import {
  COMBO_BONUS_EVERY,
  COMBO_BONUS_XP,
  comboBonusXp,
  comboMilestone,
  nextCombo,
  nextComboMilestone,
} from './combo'

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
    // O'nlik pog'ona ikki baravar
    expect(comboBonusXp(COMBO_BONUS_EVERY * 2)).toBe(COMBO_BONUS_XP * 2)
    expect(comboBonusXp(COMBO_BONUS_EVERY * 3)).toBe(COMBO_BONUS_XP)
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

describe('kombo pog‘onalari', () => {
  it('pog‘onada bayram, oralig‘ida yo‘q', () => {
    expect(comboMilestone(3)?.title).toMatch(/×3/)
    expect(comboMilestone(4)).toBeNull()
    expect(comboMilestone(10)?.title).toMatch(/×10/)
  })

  it('keyingi pog‘ona — kutish uchun', () => {
    expect(nextComboMilestone(0)).toBe(3)
    expect(nextComboMilestone(3)).toBe(5)
    expect(nextComboMilestone(50)).toBeNull()
  })

  it('o‘nlik pog‘onada bonus ikki baravar', () => {
    expect(comboBonusXp(5)).toBe(5)
    expect(comboBonusXp(10)).toBe(10)
    expect(comboBonusXp(7)).toBe(0)
  })
})

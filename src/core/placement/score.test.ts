import { describe, expect, it } from 'vitest'
import { scorePlacement } from './score'

describe('scorePlacement', () => {
  it('3 tadan 2 tasi to‘g‘ri bo‘lsa daraja o‘tilgan hisoblanadi', () => {
    expect(scorePlacement({ A1: 2, A2: 0, B1: 0 })).toBe('A2')
  })

  it('3 tadan 1 tasi yetarli emas', () => {
    expect(scorePlacement({ A1: 1, A2: 3, B1: 3 })).toBe('A1')
  })

  it('past daraja yiqilsa yuqorilari hisobga olinmaydi', () => {
    // A2 yiqilgan — B1 dagi natija ahamiyatsiz
    expect(scorePlacement({ A1: 3, A2: 1, B1: 3 })).toBe('A2')
  })

  it('hammasi o‘tilganda eng yuqori daraja qaytadi', () => {
    // B1 dan yuqori daraja kontentda yo'q
    expect(scorePlacement({ A1: 3, A2: 3, B1: 3 })).toBe('B1')
  })

  it('hech narsa to‘g‘ri bo‘lmasa A1', () => {
    expect(scorePlacement({ A1: 0, A2: 0, B1: 0 })).toBe('A1')
  })
})

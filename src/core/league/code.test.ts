import { describe, expect, it } from 'vitest'
import { seededRandom } from '@/lib/random'
import { generateCode } from './code'
import { normalizeCode } from './friends'

describe('generateCode', () => {
  it('olti belgidan iborat', () => {
    expect(generateCode(seededRandom(1))).toHaveLength(6)
  })

  it('CHALKASHTIRADIGAN belgilar ishlatilmaydi', () => {
    /*
     * Kod og'zaki aytiladi ("kodim K7M2P9") va qo'lda kiritiladi.
     * `0`/`O` va `1`/`I` juftlari ko'chirishda xatoga olib kelardi, va
     * xato kod bilan do'st qo'shib bo'lmaydi — foydalanuvchi sababini
     * bilmasdi.
     */
    const random = seededRandom(2026)
    const forbidden = /[O0I1]/

    for (let i = 0; i < 500; i += 1) {
      expect(generateCode(random)).not.toMatch(forbidden)
    }
  })

  it('faqat katta harf va raqam', () => {
    const random = seededRandom(9)

    for (let i = 0; i < 200; i += 1) {
      expect(generateCode(random)).toMatch(/^[A-Z2-9]{6}$/)
    }
  })

  it('yaratilgan kod ILOVANING O‘Z tekshiruvidan o‘tadi', () => {
    // Generator va tekshiruvchi bir-biridan ajralib ketmasligi kerak:
    // ajralsa, foydalanuvchi do'st sifatida qo'shila olmasdi
    const random = seededRandom(31)

    for (let i = 0; i < 200; i += 1) {
      const code = generateCode(random)
      expect(normalizeCode(code)).toBe(code)
    }
  })

  it('takrorlanish deyarli yo‘q', () => {
    // 32^6 ≈ 1 mlrd; ming urinishda to'qnashuv bo'lmasligi kerak
    const random = seededRandom(77)
    const seen = new Set<string>()

    for (let i = 0; i < 1000; i += 1) seen.add(generateCode(random))

    expect(seen.size).toBe(1000)
  })
})

import { describe, expect, it } from 'vitest'
import { pickOne, seededRandom, shuffle } from './random'

describe('shuffle', () => {
  it('kiruvchi massivni O‘ZGARTIRMAYDI', () => {
    const input = [1, 2, 3, 4]
    shuffle(input, seededRandom(1))

    expect(input).toEqual([1, 2, 3, 4])
  })

  it('hamma element saqlanadi', () => {
    const result = shuffle(['a', 'b', 'c', 'd', 'e'], seededRandom(7))

    expect([...result].sort()).toEqual(['a', 'b', 'c', 'd', 'e'])
  })

  it('bo‘sh va bitta elementli massivda yiqilmaydi', () => {
    expect(shuffle([], seededRandom(1))).toEqual([])
    expect(shuffle(['x'], seededRandom(1))).toEqual(['x'])
  })

  it('manba chetki qiymat qaytarsa ham element yo‘qolmaydi', () => {
    // `random()` 0 ga yaqin yoki 1 ga yaqin bo'lsa indeks chegaradan
    // chiqib ketmasligi kerak
    expect([...shuffle([1, 2, 3], () => 0)].sort()).toEqual([1, 2, 3])
    expect([...shuffle([1, 2, 3], () => 0.999999)].sort()).toEqual([1, 2, 3])
  })

  it('TENG taqsimlaydi — to‘g‘ri javob doim bir joyga tushmaydi', () => {
    /*
     * Bu eng muhim xossa. Fisher–Yates ni noto'g'ri yozish oson:
     * `j = random() * n` (uzunlikka bo'lish, qolgan qismga emas) ham
     * "aralashtirilgan" ko'rinadi, lekin taqsimot qiyshiq bo'ladi.
     *
     * Mashqda bu shuni anglatardi: to'g'ri javob ma'lum bir o'rinda
     * ko'proq chiqadi va bola so'zni emas, JOYNI eslab qoladi.
     *
     * Urug' qat'iy — test hech qachon tasodifan yiqilmaydi.
     */
    const random = seededRandom(2026)
    const TRIALS = 4000
    const items = ['a', 'b', 'c', 'd']

    // counts[element][position]
    const counts = new Map(items.map((item) => [item, [0, 0, 0, 0]]))

    for (let trial = 0; trial < TRIALS; trial += 1) {
      shuffle(items, random).forEach((item, position) => {
        counts.get(item)![position] += 1
      })
    }

    const expected = TRIALS / items.length
    for (const [item, positions] of counts) {
      for (const [position, count] of positions.entries()) {
        // ±15% — to'g'ri aralashtirish uchun keng, qiyshiq bo'lgani
        // uchun tor: noto'g'ri yozilganda chetlanish bir necha barobar
        expect(
          Math.abs(count - expected) / expected,
          `${item} → ${position}-o'rin: ${count}`,
        ).toBeLessThan(0.15)
      }
    }
  })
})

describe('pickOne', () => {
  it('bo‘sh massivda undefined', () => {
    expect(pickOne([], seededRandom(1))).toBeUndefined()
  })

  it('har doim massivning O‘Z elementini qaytaradi', () => {
    const items = ['a', 'b', 'c']
    const random = seededRandom(5)

    for (let i = 0; i < 50; i += 1) {
      expect(items).toContain(pickOne(items, random))
    }
  })

  it('chetki qiymatda ham chegaradan chiqmaydi', () => {
    expect(pickOne([1, 2, 3], () => 0.999999)).toBe(3)
    expect(pickOne([1, 2, 3], () => 0)).toBe(1)
  })
})

describe('seededRandom', () => {
  it('bir xil urug‘ — bir xil ketma-ketlik', () => {
    const first = Array.from({ length: 10 }, seededRandom(42))
    const second = Array.from({ length: 10 }, seededRandom(42))

    // Testlar shu xossaga tayanadi: mashq generatori natijasi oldindan
    // aytib bo'ladigan bo'lishi kerak
    expect(first).toEqual(second)
  })

  it('boshqa urug‘ — boshqa ketma-ketlik', () => {
    expect(Array.from({ length: 5 }, seededRandom(1))).not.toEqual(
      Array.from({ length: 5 }, seededRandom(2)),
    )
  })

  it('natija [0, 1) oralig‘ida', () => {
    const random = seededRandom(123)

    for (let i = 0; i < 500; i += 1) {
      const value = random()
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })
})

/**
 * Tasodifiylik yordamchilari.
 *
 * MUHIM: barcha funksiyalar tasodif manbaini ARGUMENT sifatida oladi.
 * `Math.random` to'g'ridan-to'g'ri chaqirilsa, mashq generatorini test
 * qilib bo'lmasdi — testlarda oldindan aytib bo'ladigan manba beriladi.
 */

/** Standart manba */
export type RandomSource = () => number

/** Fisher–Yates aralashtirish — kiruvchi massivni o'zgartirmaydi */
export function shuffle<T>(items: readonly T[], random: RandomSource = Math.random): T[] {
  const result = [...items]

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
}

/** Massivdan bitta tasodifiy element (bo'sh massivda undefined) */
export function pickOne<T>(items: readonly T[], random: RandomSource = Math.random): T | undefined {
  if (items.length === 0) return undefined
  return items[Math.floor(random() * items.length)]
}

/**
 * Takrorlanadigan (deterministik) tasodif manbai — testlar uchun.
 * Mulberry32 algoritmi: bir xil urug'dan har doim bir xil ketma-ketlik.
 */
export function seededRandom(seed: number): RandomSource {
  let state = seed >>> 0

  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

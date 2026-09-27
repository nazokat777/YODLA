/**
 * QARMOQ (PEG) USULI — raqamga bog'langan obrazlar.
 *
 * Har raqamning doimiy "qarmog'i" bor (shakli yoki ma'nosi o'xshash
 * narsa). Yodlanadigan har so'z o'z raqamining qarmog'iga harakatli
 * sahna bilan ilinadi — keyin so'zlar TARTIB BILAN eslanadi: "3 —
 * svetofor... svetoforda nima bor edi?"
 *
 * Mnemonika darsidagi eng kuchli metodik g'oya: avval usulsiz TEST,
 * keyin usul, keyin qayta test — o'quvchi o'sishni o'z natijasida
 * ko'radi (videoda eng katta o'sish 6 barobar). Ishonish emas, ko'rish.
 */
export interface Peg {
  number: number
  /** Qarmoq obrazi */
  image: string
  emoji: string
  /** Nega aynan shu — eslab qolish uchun */
  why: string
}

export const PEGS: readonly Peg[] = [
  { number: 1, image: 'quyosh', emoji: '☀️', why: 'yagona' },
  { number: 2, image: 'paypoq', emoji: '🧦', why: 'doim juft' },
  { number: 3, image: 'svetofor', emoji: '🚦', why: '3 rang' },
  { number: 4, image: 'stol', emoji: '🪑', why: '4 oyoq' },
  { number: 5, image: 'yulduz', emoji: '⭐', why: '5 qirra' },
  { number: 6, image: 'qulf', emoji: '🔓', why: 'shakli 6 ga o‘xshaydi' },
  { number: 7, image: 'bolta', emoji: '🪓', why: 'shakli 7 ga o‘xshaydi' },
  { number: 8, image: 'qum soat', emoji: '⏳', why: 'shakli 8 ga o‘xshaydi' },
  { number: 9, image: 'mushuk', emoji: '🐱', why: '9 joni bor' },
  { number: 10, image: 'barmoqlar', emoji: '🖐️', why: '10 barmoq' },
]

/** Birinchi (usulsiz) sinov so'zlari — aniq, ko'rinadigan narsalar */
export const ROUND_A: readonly string[] = [
  'olma',
  'velosiped',
  'fil',
  'choynak',
  'gilam',
  'kalit',
  'baliq',
  'soyabon',
  'non',
  'raketa',
]

/** Ikkinchi (usul bilan) sinov so'zlari — birinchisi bilan aralashmasin */
export const ROUND_B: readonly string[] = [
  'tarvuz',
  'avtobus',
  'jirafa',
  'qalam',
  'deraza',
  'shlyapa',
  'tuxum',
  'gitara',
  'piyola',
  'poyezd',
]

/** Esda saqlash vaqti (soniya) — ikki sinovda bir xil, taqqoslash halol bo'lsin */
export const MEMORIZE_SECONDS = 45

/**
 * Natija: nechta so'z O'Z O'RNIDA.
 *
 * Tartib muhim: qarmoq usulining kuchi aynan tartibni saqlashda. Tartibsiz
 * "qaysi so'zlar bor edi" sanalsa, usulsiz ham yaxshi natija chiqib,
 * taqqoslash ma'nosiz bo'lardi.
 */
export function scoreRecall(expected: readonly string[], given: readonly (string | null)[]): number {
  return expected.reduce((score, word, index) => score + (given[index] === word ? 1 : 0), 0)
}

/**
 * O'sish haqida jumla — ikkinchi natija birinchisidan qanchalik yaxshi.
 * Birinchisi 0 bo'lsa "×" hisoblab bo'lmaydi — farq aytiladi.
 */
export function growthText(before: number, after: number): string {
  if (after <= before) return 'Usul mashq bilan kuchayadi — ertaga yana urinib ko‘ring.'
  if (before === 0) return `0 dan ${after} ga — usul ishladi!`
  const ratio = after / before
  return ratio >= 1.5
    ? `${Math.round(ratio * 10) / 10} barobar ko‘proq — usul ishladi!`
    : `+${after - before} ta so‘z — usul ishladi!`
}

/** Qarmoq bo'yicha sahna maslahati — ikkinchi sinovda ko'rsatiladi */
export function pegHint(peg: Peg, word: string): string {
  return `${peg.number} — ${peg.emoji} ${peg.image}: ${peg.image} bilan ${word}ni bitta g‘alati sahnada tasavvur qiling`
}

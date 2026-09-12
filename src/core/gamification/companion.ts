/**
 * YO'LDOSH — bola bilan birga "o'sadigan" jonzot.
 *
 * PSIXOLOGIYA (g'amxo'rlik effekti, Tamagotchi): odam o'zi parvarish
 * qilgan narsaga bog'lanadi. Yo'ldosh so'zlar bilan oziqlanadi: har
 * mustahkam yodlangan so'z uni keyingi bosqichga yaqinlashtiradi.
 * Bola "dars qilish" uchun emas, "yo'ldoshim o'ssin" deb qaytadi —
 * motiv tashqidan ichkiga ko'chadi.
 *
 * Bosqichlar KO'RILGAN so'zlar soniga bog'liq (yodlangan emas): birinchi
 * o'zgarish tez kelishi kerak (birinchi darsdan keyin), aks holda
 * bog'lanish boshlanmaydi. Keyingilari o'sib boruvchi masofada.
 */
export interface CompanionStage {
  /** Shu bosqichga kirish uchun ko'rilgan so'zlar */
  minWords: number
  name: string
  emoji: string
  /** Bosqichga xos qisqa gap — yo'ldosh "gapiradi" */
  line: string
}

export const COMPANION_STAGES: readonly CompanionStage[] = [
  { minWords: 0, name: 'Tuxum', emoji: '🥚', line: 'Ichida kimdir bor… birinchi so‘z uni uyg‘otadi.' },
  { minWords: 4, name: 'Jo‘ja', emoji: '🐣', line: 'Salom! Men so‘zlar bilan o‘saman.' },
  { minWords: 20, name: 'Polapon', emoji: '🐥', line: 'Har yangi so‘z — menga bir dona don!' },
  { minWords: 50, name: 'Qush', emoji: '🐤', line: 'Endi uchishni o‘rganyapman.' },
  { minWords: 120, name: 'Boyo‘g‘li', emoji: '🦉', line: 'Ko‘p so‘z bilaman — dono bo‘lyapman.' },
  { minWords: 250, name: 'Burgut', emoji: '🦅', line: 'Baland uchamiz! Uch til — uch osmon.' },
  { minWords: 500, name: 'Ajdar', emoji: '🐉', line: 'Afsonaviy! Sen bilan hamma narsa mumkin.' },
]

export function companionStage(seenWords: number): CompanionStage {
  return [...COMPANION_STAGES].reverse().find((stage) => seenWords >= stage.minWords) ?? COMPANION_STAGES[0]!
}

export function nextCompanionStage(seenWords: number): CompanionStage | null {
  return COMPANION_STAGES.find((stage) => stage.minWords > seenWords) ?? null
}

/** Joriy bosqich ichidagi progress (0..1) — keyingisiga qancha qoldi */
export function companionProgress(seenWords: number): number {
  const current = companionStage(seenWords)
  const next = nextCompanionStage(seenWords)
  if (!next) return 1
  return (seenWords - current.minWords) / (next.minWords - current.minWords)
}

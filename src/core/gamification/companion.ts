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

/** Yo'ldosh gapiradigan holat — bosh ekran uni shundan tanlaydi */
export interface CompanionContext {
  /** Bugun hali javob berilmagan va streak uzilishi mumkin */
  streakAtRisk: boolean
  /** Kunlik maqsad bajarilgan */
  goalDone: boolean
  /** Takrorlashga tayyor so'zlar */
  dueCount: number
}

/**
 * Yo'ldoshning gapi — HOLATGA qarab, bosqich gapi emas.
 *
 * Statik gap ikkinchi kuni "o'qilmaydi"; holatga bog'liq gap esa
 * yo'ldoshni tirik qiladi va bolaga hozir nima qilishni aytadi
 * (takrorlash bor, streak xavfda, maqsad bajarildi). Ustuvorlik:
 * xavf → takrorlash → maqsad → bosqich gapi.
 */
export function companionLine(stage: CompanionStage, context: CompanionContext): string {
  if (stage.minWords === 0) return stage.line
  if (context.streakAtRisk) return 'Bugun hali mashq qilmadik… ketdikmi? 🔥'
  if (context.dueCount > 0) return `${context.dueCount} ta so‘z qaytishini kutyapman — takrorlaymizmi?`
  if (context.goalDone) return 'Bugun to‘ydim! Ertaga yana kel 💚'
  return stage.line
}

/**
 * YO'LDOSH BEZAKLARI — olov darajasi bilan ochiladi.
 *
 * To'plam (collection) hissi: bezak yo'ldoshga taqiladi va u yerda
 * qoladi. Streak — "yo'qotmaslik" motivi; bezak esa unga "ega bo'lish"
 * motivini qo'shadi: 7 kun — bant, 14 — shlyapa, 30 — toj, 100 — yulduz.
 * Streak uzilsa bezak YO'QOLMAYDI: u erishilgan narsa, jarima emas.
 */
export const COMPANION_ACCESSORIES: readonly { minStreak: number; emoji: string; name: string }[] = [
  { minStreak: 3, emoji: '✨', name: 'Uchqun' },
  { minStreak: 7, emoji: '🎀', name: 'Bant' },
  { minStreak: 14, emoji: '🎩', name: 'Shlyapa' },
  { minStreak: 30, emoji: '👑', name: 'Toj' },
  { minStreak: 100, emoji: '🌟', name: 'Yulduz' },
]

/** Eng uzun streak bo'yicha ochilgan bezaklar (uzilsa ham qoladi) */
export function companionAccessories(longestStreak: number) {
  return COMPANION_ACCESSORIES.filter((item) => longestStreak >= item.minStreak)
}

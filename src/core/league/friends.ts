import type { LeagueRow } from './rank'

/**
 * Kod alifbosi bilan AYNAN bir xil: `I` va `O` yo'q (`1` va `0` bilan
 * chalkashadi). Naqsh kengroq bo'lsa, hech qachon mavjud bo'lmagan kod
 * "to'g'ri" deb qabul qilinardi va foydalanuvchi xatoni serverdan
 * bilardi — kech va tushunarsiz.
 */
const CODE_PATTERN = /^[A-HJ-NP-Z2-9]{6}$/

/**
 * Foydalanuvchi kiritgan kodni tozalaydi.
 *
 * Kod og'zaki aytiladi va qo'lda ko'chiriladi — bo'shliq va kichik harf
 * odatiy xato. Format noto'g'ri bo'lsa `null`: chaqiruvchi xato xabarini
 * ko'rsatadi.
 */
export function normalizeCode(input: string): string | null {
  const cleaned = input.replace(/\s+/g, '').toUpperCase()

  return CODE_PATTERN.test(cleaned) ? cleaned : null
}

/**
 * Do'stlar reytingi: o'zim va men qo'shganlar.
 *
 * O'zim HAR DOIM ro'yxatda — aks holda "kim oldinda" degan savolga
 * javob bo'lmasdi.
 */
export function filterFriends(
  rows: LeagueRow[],
  myCode: string,
  friendCodes: string[],
): LeagueRow[] {
  const allowed = new Set([myCode, ...friendCodes])

  return rows.filter((row) => allowed.has(row.code))
}

/** Taklif havolasi — kod parametri bilan */
export function buildInviteUrl(origin: string, code: string): string {
  return `${origin}/league?add=${code}`
}

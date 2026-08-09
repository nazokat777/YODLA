export interface LeagueRow {
  code: string
  name: string
  xp: number
}

export interface RankedEntry extends LeagueRow {
  /** 1 dan boshlanadigan o'rin */
  rank: number
  isMe: boolean
}

/**
 * Reytingni tartiblaydi.
 *
 * Teng XP da ism bo'yicha tartiblanadi — aks holda ro'yxat har
 * yuklanishda o'rin almashib, foydalanuvchini chalkashtirardi.
 */
export function rankEntries(rows: LeagueRow[], myCode: string | null): RankedEntry[] {
  return [...rows]
    .sort((a, b) => (b.xp !== a.xp ? b.xp - a.xp : a.name.localeCompare(b.name)))
    .map((row, index) => ({ ...row, rank: index + 1, isMe: row.code === myCode }))
}

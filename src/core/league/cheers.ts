/**
 * Tayyor xabarlar.
 *
 * NEGA ERKIN MATN EMAS: ilovadan bolalar ham foydalanadi, moderatsiya
 * imkoni esa yo'q. Tanlab yuboriladigan qisqa xabarlar motivatsiya
 * beradi, lekin haqorat yoki spam uchun yo'l qoldirmaydi.
 *
 * Ro'yxat serverda ham tekshiriladi (`yodla_send_cheer`) — mijozga
 * ishonib bo'lmaydi.
 */
export type CheerKind = 'bravo' | 'streak' | 'keep' | 'wow'

export interface Cheer {
  kind: CheerKind
  icon: string
  label: string
}

export const CHEERS: Cheer[] = [
  { kind: 'bravo', icon: '👏', label: 'Barakalla' },
  { kind: 'streak', icon: '🔥', label: "Zo'r streak" },
  { kind: 'keep', icon: '💪', label: 'Davom et' },
  { kind: 'wow', icon: '🚀', label: 'Ajoyib' },
]

const BY_KIND = new Map(CHEERS.map((cheer) => [cheer.kind, cheer]))

/** Turdan xabarni topadi; noma'lum tur — `null` (eski yozuvlar uchun) */
export function cheerByKind(kind: string): Cheer | null {
  return BY_KIND.get(kind as CheerKind) ?? null
}

import { startOfDay } from '@/lib/date'

/**
 * Bugun OCHILGAN kunning so'zi — darsda "buni bilasan!" belgisi uchun.
 *
 * `localStorage`: bir kunlik, bitta id — bazaga yozadigan narsa emas.
 * O'qishda kun mos kelmasa (ertaga) — yo'q deb hisoblanadi.
 */
const KEY = 'polyglotpro:wod'

export function rememberRevealedWord(cardId: string, now: number = Date.now()): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ day: startOfDay(now), cardId }))
  } catch {
    // Saqlash imkoni bo'lmasa — belgi shunchaki chiqmaydi
  }
}

export function revealedWordToday(now: number = Date.now()): string | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as { day?: number; cardId?: string }
    return data.day === startOfDay(now) && typeof data.cardId === 'string' ? data.cardId : null
  } catch {
    return null
  }
}

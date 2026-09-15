import type { CardRecord } from '@/core/db'
import { unitIdOf, type PathUnit } from '@/core/path'
import { weakness } from '@/core/mastery'
import { shuffle, type RandomSource } from '@/lib/random'

/**
 * Bir imtihondagi eng ko'p savol.
 *
 * O'lchov: 24 savol × ~15 s ≈ 6 daqiqa — bola uchun diqqat chegarasi.
 * 10-darsda 40+ so'z bo'ladi; hammasini so'rash imtihonni jazoga
 * aylantirardi. Qamrov esa TANLASH bilan ta'minlanadi (pastga qarang).
 */
export const EXAM_MAX_SIZE = 24

/** Endigina tugagan bo'limdan eng ko'p nechta so'z */
const FRESH_UNIT_MAX = 8

/**
 * Imtihon so'zlarini tanlaydi.
 *
 * Uch qoida — "birorta mavzu qolib ketmasin" talabi shu yerda:
 *  1. ENDIGINA tugagan bo'limdan eng ko'p 8 ta (eng zaiflari) — u hali
 *     mustahkamlanmagan, imtihon uni birinchi marta qayta chaqiradi.
 *  2. Oldingi HAR bo'limdan kamida bittadan (aylanma: har bo'limning
 *     eng zaif so'zi, keyin ikkinchi eng zaifi…) — hech bir mavzu
 *     tekshiruvsiz qolmaydi.
 *  3. Natija ARALASHTIRILADI (interleaving): mavzular ketma-ket emas,
 *     aralash kelganda miya har savolda "bu qaysi mavzu?" deb qo'shimcha
 *     ish qiladi va iz chuqurroq qoladi (Rohrer & Taylor 2007).
 */
export function pickExamCards(
  covered: readonly PathUnit[],
  cards: readonly CardRecord[],
  now: number,
  random: RandomSource = Math.random,
  size: number = EXAM_MAX_SIZE,
): CardRecord[] {
  if (covered.length === 0) return []

  const byUnit = new Map<string, CardRecord[]>()
  for (const unit of covered) byUnit.set(unit.id, [])
  for (const card of cards) {
    if (!card.level || !card.topic) continue
    byUnit.get(unitIdOf(card.level, card.topic))?.push(card)
  }
  // Har bo'lim ichida zaifi birinchi
  for (const list of byUnit.values()) list.sort((a, b) => weakness(b, now) - weakness(a, now))

  const fresh = covered[covered.length - 1]!
  const picked: CardRecord[] = []
  const seen = new Set<string>()
  const take = (card: CardRecord | undefined) => {
    if (!card || seen.has(card.id) || picked.length >= size) return
    seen.add(card.id)
    picked.push(card)
  }

  // 1. Endigina tugagan bo'lim
  for (const card of (byUnit.get(fresh.id) ?? []).slice(0, FRESH_UNIT_MAX)) take(card)

  // 2. Oldingilardan aylanma — eng eski bo'limdan boshlab (u eng ko'p unutilgan)
  const earlier = covered.slice(0, -1).map((unit) => byUnit.get(unit.id) ?? [])
  for (let round = 0; picked.length < size; round += 1) {
    let added = false
    for (const list of earlier) {
      const card = list[round]
      if (card && !seen.has(card.id)) {
        take(card)
        added = true
      }
      if (picked.length >= size) break
    }
    if (!added) break
  }

  // Joy qolsa — endigina tugagan bo'limning qolganlari
  for (const card of (byUnit.get(fresh.id) ?? []).slice(FRESH_UNIT_MAX)) take(card)

  return shuffle(picked, random)
}

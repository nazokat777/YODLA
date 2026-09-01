import type { CardRecord } from '@/core/db'

/**
 * Seans navbatining bitta qadami.
 *
 * `stage` — shu so'z seans ichida nechanchi marta chiqyapti (0 dan).
 * Mashq turi shunga qarab qiyinlashadi: bir so'z avval tanib olishda,
 * keyin eshitishda, oxirida yozishda uchraydi.
 */
export interface LessonStep {
  card: CardRecord
  stage: number
}

/**
 * Navbatdagi qadamlarning eng ko'p soni.
 *
 * Xato javob qadamni navbat oxiriga qaytaradi, ya'ni yomon kunda dars
 * cheksiz cho'zilishi mumkin. Dars jazoga aylanmasligi kerak — chegaraga
 * yetilganda so'z keyingi darsda baribir qaytadi.
 */
export const MAX_LESSON_STEPS = 20

/**
 * Kartalardan seans navbatini quradi.
 *
 * TARTIB AYLANMA: avval hamma so'zning 1-bosqichi, keyin hammasining
 * 2-bosqichi. Shunda bir so'zning takrorlari orasida boshqa so'zlar
 * turadi — aks holda javobni ekrandan nusxa ko'chirish mumkin bo'lardi
 * va mashq eslab chaqirishni talab qilmasdi.
 *
 * @param stagesFor har karta necha marta chiqishi (kamida 1)
 */
export function buildLessonQueue(
  cards: readonly CardRecord[],
  stagesFor: (card: CardRecord) => number,
): LessonStep[] {
  const stages = cards.map((card) => Math.max(1, Math.floor(stagesFor(card))))
  const deepest = Math.max(0, ...stages)

  const queue: LessonStep[] = []

  for (let stage = 0; stage < deepest; stage += 1) {
    cards.forEach((card, index) => {
      if (stage < stages[index]) queue.push({ card, stage })
    })
  }

  return queue.slice(0, MAX_LESSON_STEPS)
}

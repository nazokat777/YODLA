/** Bitta javob uchun o'rtacha vaqt (soniya) — o'lchov: bola 10–20 s */
export const SECONDS_PER_ANSWER = 15

/**
 * Qolgan vaqt taxmini (daqiqa, kamida 1).
 *
 * NN/g #1 (tizim holati): o'zlashtirish rejimida savollar soni
 * o'zgaruvchan (so'z ikki xil mashqda bilinguncha qaytadi) — "0/4 so'z"
 * yana qancha davom etishini aytmaydi. Taxminiy vaqt bolaga "yana
 * qancha?" savoliga javob beradi. Taxmin: har so'zga ~2 javob.
 */
export function estimateMinutes(remainingWords: number, answersPerWord = 2): number {
  const seconds = Math.max(0, remainingWords) * answersPerWord * SECONDS_PER_ANSWER
  return Math.max(1, Math.round(seconds / 60))
}

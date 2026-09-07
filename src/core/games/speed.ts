/** O'yin necha soniya davom etadi */
export const SPEED_SECONDS = 60

/**
 * Xato javobdan keyin qizil holat necha ms turadi.
 *
 * Qisqa: o'yinning butun mazmuni tezlikda. Uzoq pauza ritmni buzadi
 * va vaqt bosimini yo'qotadi.
 */
export const WRONG_PAUSE_MS = 700

/** Vaqtga qarshi o'yin holati */
export interface SpeedState {
  /** Qolgan soniyalar */
  secondsLeft: number
  /** To'g'ri javoblar */
  score: number
  /** Jami javoblar — aniqlikni hisoblash uchun */
  answered: number
  /** O'yin tugadimi */
  finished: boolean
}

export function startSpeed(seconds: number = SPEED_SECONDS): SpeedState {
  return { secondsLeft: seconds, score: 0, answered: 0, finished: false }
}

/**
 * Bir soniya o'tdi.
 *
 * Vaqt nolga yetganda o'yin tugaydi. Tugagan o'yinda soniya
 * KAMAYMAYDI — aks holda taymer manfiy songa ketardi.
 */
export function tickSpeed(state: SpeedState): SpeedState {
  if (state.finished) return state

  const secondsLeft = Math.max(0, state.secondsLeft - 1)

  return { ...state, secondsLeft, finished: secondsLeft === 0 }
}

/**
 * Javob berildi.
 *
 * TUGAGAN o'yinda javob HISOBGA O'TMAYDI: taymer nolga yetgan
 * paytda bosilgan tugma ochko qo'shsa, natija yolg'on bo'lardi.
 */
export function answerSpeed(state: SpeedState, correct: boolean): SpeedState {
  if (state.finished) return state

  return {
    ...state,
    score: state.score + (correct ? 1 : 0),
    answered: state.answered + 1,
  }
}

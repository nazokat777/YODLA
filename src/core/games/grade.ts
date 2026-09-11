import { PASSING_GRADE } from '@/core/srs'
import type { Grade } from '@/core/types'

/**
 * O'yinlar va passiv mashqlar (juft topish) SM-2 ga qaysi bahoni beradi.
 *
 * XATO = 3, ya'ni "qiyin, lekin o'tdi". Ilgari 2 berilardi va bu
 * "yumshoq" deb atalardi — aslida 2 < PASSING_GRADE, ya'ni SM-2 uchun
 * u TO'LIQ unutish: interval 1 kunga tushar, takrorlar noldan boshlanar,
 * `lapses` oshar edi. Natija: xotira o'yinida (12 yopiq katak!) har
 * juftlik urinishi so'zni "qiyin so'zlar" ro'yxatiga va ertangi
 * takrorlash navbatiga tiqardi — bola o'yin o'ynagani uchun jazolanardi.
 *
 * 3 baho yengillikni (easeFactor) kamaytiradi — ya'ni signal yo'qolmaydi,
 * keyingi interval qisqaroq o'sadi — lekin jadval buzilmaydi.
 */
export const GAME_CORRECT_GRADE: Grade = 4
export const GAME_WRONG_GRADE: Grade = 3

/** O'yin natijasini SM-2 bahosiga aylantiradi */
export function gameGrade(correct: boolean): Grade {
  return correct ? GAME_CORRECT_GRADE : GAME_WRONG_GRADE
}

// Kompilyatsiya vaqtidagi qo'riqchi: xato bahosi hech qachon "yiqilish"
// bo'lib qolmasin
if (GAME_WRONG_GRADE < PASSING_GRADE) {
  throw new Error('GAME_WRONG_GRADE SM-2 yiqilishiga aylanib qoldi')
}

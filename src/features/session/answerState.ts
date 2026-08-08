/**
 * Foydalanuvchi javobining holati.
 *
 * Bitta shakl barcha mashq turlari uchun ishlatiladi: shu tufayli seans
 * dvigateli mashq turini bilmasdan ham holatni tozalab, uzatib turadi.
 * Har tur o'ziga kerakli maydonni ishlatadi, qolganlari bo'sh qoladi.
 *
 * (Komponent fayllaridan ajratilgan — aks holda Vite'ning "fast refresh"
 * mexanizmi buziladi: bitta fayl faqat komponentlar eksport qilishi kerak.)
 */
export interface ExerciseAnswerState {
  /** Variantli mashqlarda tanlangan indeks */
  choiceIndex: number | null
  /** Yozma mashqlarda kiritilgan matn */
  text: string
  /** Jumla qurishda tanlangan so'zlar (token indekslari, tartibi muhim) */
  tokenOrder: number[]
}

/** Yangi mashq boshlanganidagi bo'sh javob */
export const EMPTY_ANSWER: ExerciseAnswerState = { choiceIndex: null, text: '', tokenOrder: [] }

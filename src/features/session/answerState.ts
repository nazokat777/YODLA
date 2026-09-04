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

/**
 * Yangi mashq boshlanganidagi bo'sh javob.
 *
 * MUZLATILGAN: bu YAGONA obyekt barcha mashqlar orasida bo'lishiladi.
 * Kimdir `answer.tokenOrder.push(i)` deb yozsa (hozir hamma joyda nusxa
 * olinadi), o'sha massiv abadiy to'lib qolardi va keyingi mashqlar
 * oldingi javoblar bilan boshlanardi — sababi topilishi juda qiyin
 * nuqson. `freeze` bilan bunday yozuv darhol xato beradi.
 */
const NO_TOKENS: number[] = []
Object.freeze(NO_TOKENS)

export const EMPTY_ANSWER: ExerciseAnswerState = Object.freeze({
  choiceIndex: null,
  text: '',
  tokenOrder: NO_TOKENS,
})

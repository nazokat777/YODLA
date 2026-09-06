import type { ExerciseType } from '@/core/types'

/** Bitta mashq turi uchun ko'rsatma */
export interface ExerciseHelp {
  /** Qisqa sarlavha — nima qilinishi */
  title: string
  /** Bir-ikki jumlalik tushuntirish */
  body: string
}

/**
 * Har mashq turi uchun ko'rsatma.
 *
 * NEGA KERAK: ilova ettita turli mashq turini ARALASHTIRIB beradi va
 * birinchi marta kirgan odam, ayniqsa bola, "eshitib tanlash" bilan
 * "harflardan yig'ish" o'rtasidagi farqni ekrandagi bitta qatordan
 * tushunib olishi shart emas. Ko'rsatma har turning BIRINCHI marta
 * chiqishida o'zi ochiladi, keyin esa faqat "?" tugmasi orqali.
 */
export const EXERCISE_HELP: Record<ExerciseType, ExerciseHelp> = {
  recognition: {
    title: "So'zni tanish",
    body: "Yuqorida chet tilidagi so'z turibdi. Uning o'zbekcha ma'nosini variantlardan tanlang. Bilmasangiz — 🔊 tugmasini bosib eshitib ko'ring.",
  },
  listening: {
    title: 'Eshitib tanish',
    body: "🔊 tugmasini bosing va so'zni tinglang. Nimani eshitganingizni variantlardan tanlang. Xohlagancha qayta eshitishingiz mumkin.",
  },
  recall: {
    title: "Tarjimani yozish",
    body: "O'zbekcha so'z berilgan — uni chet tilida yozing. Bitta-ikkita harf xato bo'lsa ham javob 'Almost' deb qabul qilinadi.",
  },
  construction: {
    title: 'Jumla tuzish',
    body: "So'zlar aralashtirib berilgan. Ularni to'g'ri tartibda bosib jumla tuzing. Noto'g'ri bossangiz, so'zni qayta bosib qaytarib olasiz.",
  },
  cloze: {
    title: "Tushib qolgan so'z",
    body: "Jumlada bitta so'z o'rniga ___ turibdi. Ma'noga mos so'zni variantlardan tanlang.",
  },
  spelling: {
    title: 'Harflardan yig‘ish',
    body: "Harflar aralashtirilgan. Ularni ketma-ket bosib so'zni yig'ing. Xato bossangiz, harfni qayta bosib olib tashlaysiz.",
  },
  matching: {
    title: 'Juftlarni topish',
    body: "Chapda — chet tilidagi so'zlar, o'ngda — tarjimalar. Avval so'zni, keyin uning tarjimasini bosing. To'g'ri juft yo'qoladi.",
  },
}

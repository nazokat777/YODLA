/**
 * PolyglotPro — umumiy (domen) tiplar.
 * Bu fayl butun ilova bo'ylab bir xil ma'lumot shakllarini kafolatlaydi.
 */

/** Qo'llab-quvvatlanadigan tillar */
export type LanguageCode = 'en' | 'ru' | 'ar'

/** CEFR darajalari (MVP uchun uchtasi) */
export type LevelCode = 'A1' | 'A2' | 'B1'

/** Matn yo'nalishi — arab tili uchun RTL */
export type TextDirection = 'ltr' | 'rtl'

/** Yozuv turi — transliteratsiya (o'qishga yordam) shunga qarab tanlanadi */
export type ScriptCode = 'latin' | 'cyrillic' | 'arabic'

/** Til haqidagi metama'lumot (UI'da ko'rsatish uchun) */
export interface LanguageMeta {
  code: LanguageCode
  /** O'zbekcha nomi */
  name: string
  /** Ona tilidagi nomi */
  nativeName: string
  dir: TextDirection
  script: ScriptCode
  /** Web Speech API uchun til tegi */
  speechLocale: string
}

/**
 * SRS kartasi — ilovaning yadro modeli.
 * To'liq algoritm Faza 2'da (src/core/srs) amalga oshiriladi.
 */
export interface Card {
  id: string
  /** O'rganilayotgan so'z */
  word: string
  /** O'zbekcha tarjima */
  translation: string
  language: LanguageCode
  /** Keyingi takrorlashgacha kunlar soni */
  interval: number
  /** Ketma-ket muvaffaqiyatli takrorlashlar soni */
  repetitions: number
  /** Yengillik koeffitsienti: 1.3 … 2.5 (default 2.5) */
  easeFactor: number
  /** Takrorlash vaqti (timestamp, ms) */
  dueDate: number
  /** Foydalanuvchi yaratgan mnemonik assotsiatsiya */
  mnemonic?: string
  /** Vizual bog'lanish uchun rasm */
  imageUrl?: string
}

/** SM-2 javob sifati bahosi: 0 (umuman esimda yo'q) … 5 (mukammal) */
export type Grade = 0 | 1 | 2 | 3 | 4 | 5

/** Mashq (test) turlari — Faza 3 */
export type ExerciseType =
  /** 4 variantdan to'g'ri tarjimani tanla (oson) */
  | 'recognition'
  /** Tarjimani ko'rib, so'zni klaviaturadan yoz (o'rta) */
  | 'recall'
  /** Audio eshitib, ma'nosini tanla */
  | 'listening'
  /** So'zlardan to'g'ri jumla tuz (qiyin) */
  | 'construction'
  /** Jumlada tushib qolgan so'zni variantlardan tanla */
  | 'cloze'
  /** Aralash harflardan so'zni yig' */
  | 'spelling'
  /** Bir nechta so'z va tarjimani juftlab chiq (ko'p-kartali) */
  | 'matching'

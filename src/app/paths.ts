/**
 * Ilova marshrutlari (yo'llari) bir joyda.
 * Komponentlarda satrlarni qo'lda yozmang — shu konstantalardan foydalaning.
 */
export const PATHS = {
  onboarding: '/onboarding',
  home: '/',
  lesson: '/lesson',
  /** Aniq darsga o'tish: lessonPath('food-a1') → "/lesson/food-a1" */
  lessonById: (lessonId: string) => `/lesson/${lessonId}`,
  review: '/review',
  /**
   * Faqat QIYIN so'zlar seansi.
   *
   * Alohida yo'l (`/review` ga parametr emas): bu boshqa maqsadli
   * mashq — muddati yetganini emas, eng ko'p unutilganini beradi.
   */
  weakReview: '/review/weak',
  stats: '/stats',
  profile: '/profile',
  /** Foydalanuvchi yozgan mnemonik assotsiatsiyalar */
  mnemonics: '/mnemonics',
  league: '/league',
  /** O'yinlar sahifasi — bosh ekrandagi kartadan ochiladi */
  games: '/games',
  speedGame: '/games/speed',
  memoryGame: '/games/memory',
  trueFalseGame: '/games/truefalse',
} as const

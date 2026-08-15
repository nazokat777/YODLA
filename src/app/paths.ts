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
  stats: '/stats',
  profile: '/profile',
  /** Foydalanuvchi yozgan mnemonik assotsiatsiyalar */
  mnemonics: '/mnemonics',
  league: '/league',
} as const

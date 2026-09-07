import { startOfDay } from '@/lib/date'

/** Kunlik chaqiriq turi */
export type ChallengeKind = 'perfectWords' | 'speedScore' | 'finishLesson'

export interface DailyChallenge {
  kind: ChallengeKind
  /** Nishonga yetish uchun kerakli son */
  target: number
  /** Foydalanuvchiga ko'rsatiladigan matn */
  title: string
  icon: string
}

/** Bajarilgani uchun beriladigan bonus */
export const CHALLENGE_BONUS_XP = 50

const CHALLENGES: readonly DailyChallenge[] = [
  {
    kind: 'perfectWords',
    target: 10,
    title: '10 ta so‘zga xatosiz javob bering',
    icon: '🎯',
  },
  {
    kind: 'speedScore',
    target: 12,
    title: 'Vaqtga qarshi o‘yinda 12 ochko to‘plang',
    icon: '⚡',
  },
  {
    kind: 'finishLesson',
    target: 1,
    title: 'Bitta darsni to‘liq o‘zlashtiring',
    icon: '📗',
  },
]

/**
 * Shu kunning chaqirig'i.
 *
 * SANADAN hisoblanadi, tasodifiy tanlanmaydi: aks holda foydalanuvchi
 * sahifani yangilaganda vazifa o'zgarib turardi va uni bajarish
 * mumkin bo'lmasdi. Bir kun ichida u BARQAROR bo'lishi shart.
 *
 * Kun boshi timestamp'i kunlar soniga aylantirilib, ro'yxat uzunligiga
 * bo'linadi — natijada har kuni navbatdagi vazifa keladi va ular
 * aylanib turadi.
 */
export function dailyChallenge(now: number = Date.now()): DailyChallenge {
  const days = Math.floor(startOfDay(now) / (24 * 60 * 60 * 1000))

  return CHALLENGES[Math.abs(days) % CHALLENGES.length]!
}

/** Chaqiriq bajarildimi */
export function isChallengeDone(challenge: DailyChallenge, progress: number): boolean {
  return progress >= challenge.target
}

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { generateCode } from '@/core/league'
import type { LanguageCode, LevelCode } from '@/core/types'

/**
 * Ilova sozlamalari (Zustand).
 *
 * MVP'da bu holat localStorage'ga saqlanadi — u kichik va sinxron.
 * So'z kartalari va o'quv tarixi esa Faza 2'da IndexedDB (Dexie) ga yoziladi.
 */
interface SettingsState {
  /** Foydalanuvchi o'rganayotgan til (hali tanlanmagan bo'lsa null) */
  learningLanguage: LanguageCode | null
  /** Kunlik maqsad — kuniga nechta so'z (geymifikatsiya, Faza 4) */
  dailyGoalWords: number
  /** Daraja testi natijasi — darslar shu darajadan boshlanadi (Faza 6) */
  startingLevel: LevelCode
  /** Liga kodi — faqat rozilik berilganda yaratiladi (Faza 7) */
  leagueCode: string | null
  /** Reytingda ko'rinadigan ism */
  leagueName: string
  /** Onboarding tugallanganmi */
  onboardingCompleted: boolean
  /** Arab tili uchun interfeysni ham RTL qilish */
  rtlInterface: boolean
  /** Javob feedback tovushlari (TZ 4: instant feedback) */
  soundEnabled: boolean

  setLearningLanguage: (language: LanguageCode) => void
  setDailyGoalWords: (words: number) => void
  setStartingLevel: (level: LevelCode) => void
  /** Ligaga qo'shilish: kod yaratiladi va ism saqlanadi */
  joinLeague: (name: string) => void
  completeOnboarding: () => void
  setRtlInterface: (enabled: boolean) => void
  setSoundEnabled: (enabled: boolean) => void
  /** Barcha sozlamalarni boshlang'ich holatga qaytarish (test/debug uchun) */
  reset: () => void
}

const INITIAL = {
  learningLanguage: null,
  dailyGoalWords: 20,
  startingLevel: 'A1',
  leagueCode: null,
  leagueName: '',
  onboardingCompleted: false,
  rtlInterface: false,
  soundEnabled: true,
} satisfies Partial<SettingsState>

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...INITIAL,

      setLearningLanguage: (learningLanguage) =>
        set({
          learningLanguage,
          // Arab tili tanlanganda interfeys ham o'ngdan-chapga o'tadi
          rtlInterface: learningLanguage === 'ar',
        }),

      setDailyGoalWords: (dailyGoalWords) => set({ dailyGoalWords }),
      setStartingLevel: (startingLevel) => set({ startingLevel }),

      joinLeague: (leagueName) =>
        set((state) => ({
          leagueName,
          // Kod bir marta yaratiladi: qayta kirishda o'sha kod qoladi,
          // aks holda reytingda ikkita yozuv paydo bo'lardi
          leagueCode: state.leagueCode ?? generateCode(),
        })),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      setRtlInterface: (rtlInterface) => set({ rtlInterface }),
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      reset: () => set(INITIAL),
    }),
    {
      name: 'polyglotpro:settings',
      /**
       * DIQQAT: yangi maydon qo'shilganda versiyani OSHIRMANG.
       * Zustand'ning standart `merge` funksiyasi saqlangan holatni
       * boshlang'ich qiymatlar ustiga yozadi, shuning uchun yangi maydon
       * o'z sukut qiymatini oladi (soundEnabled → true).
       * Versiya oshirilsa va `migrate` berilmasa, saqlangan holat butunlay
       * tashlanadi — foydalanuvchi tanlagan tilini yo'qotadi.
       * Versiyani faqat maydon MA'NOSI o'zgarganda oshiring va `migrate` yozing.
       */
      version: 1,
    },
  ),
)

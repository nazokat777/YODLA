import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LanguageCode } from '@/core/types'

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
  /** Onboarding tugallanganmi */
  onboardingCompleted: boolean
  /** Arab tili uchun interfeysni ham RTL qilish */
  rtlInterface: boolean
  /** Javob feedback tovushlari (TZ 4: instant feedback) */
  soundEnabled: boolean

  setLearningLanguage: (language: LanguageCode) => void
  setDailyGoalWords: (words: number) => void
  completeOnboarding: () => void
  setRtlInterface: (enabled: boolean) => void
  setSoundEnabled: (enabled: boolean) => void
  /** Barcha sozlamalarni boshlang'ich holatga qaytarish (test/debug uchun) */
  reset: () => void
}

const INITIAL = {
  learningLanguage: null,
  dailyGoalWords: 20,
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

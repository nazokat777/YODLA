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
  /** Javob feedback tovushlari (TZ 4: instant feedback) */
  soundEnabled: boolean
  /** Eslatma soati (0..23), mahalliy vaqt */
  reminderHour: number
  /**
   * Faol push obunasining manzili.
   *
   * Bu YAGONA identifikator: seans tugaganda "bugun mashq qildim" belgisi
   * shu manzil bo'yicha yangilanadi.
   */
  pushEndpoint: string | null

  setLearningLanguage: (language: LanguageCode) => void
  setDailyGoalWords: (words: number) => void
  setStartingLevel: (level: LevelCode) => void
  /** Ligaga qo'shilish: kod yaratiladi va ism saqlanadi */
  joinLeague: (name: string) => void
  completeOnboarding: () => void
  setSoundEnabled: (enabled: boolean) => void
  setReminderHour: (hour: number) => void
  setPushEndpoint: (endpoint: string | null) => void
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
  soundEnabled: true,
  reminderHour: 19,
  pushEndpoint: null,
} satisfies Partial<SettingsState>

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...INITIAL,

      /*
       * INTERFEYS YO'NALISHI O'ZGARMAYDI.
       *
       * Ilgari arab tili tanlanganda butun sahifa RTL bo'lardi. Lekin
       * interfeys matni har doim O'ZBEKCHA — lotin yozuvi, chapdan
       * o'ngga. Sahifani teskari o'girish o'zbekcha jumlalarni buzardi:
       * "Bu so'z nimani anglatadi?" ekranda "?Bu so'z nimani anglatadi"
       * bo'lib chiqardi va ilova buzilgandek ko'rinardi.
       *
       * Arabchaning o'zi (so'z, jumla, variantlar) alohida `dir` bilan
       * belgilanadi — bu allaqachon har bir komponentda bor.
       */
      setLearningLanguage: (learningLanguage) => set({ learningLanguage }),

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
      setSoundEnabled: (soundEnabled) => set({ soundEnabled }),
      setReminderHour: (reminderHour) => set({ reminderHour }),
      setPushEndpoint: (pushEndpoint) => set({ pushEndpoint }),
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

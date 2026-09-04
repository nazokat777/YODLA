import { beforeEach, describe, expect, it } from 'vitest'
import { useSettingsStore } from './useSettingsStore'

beforeEach(() => {
  useSettingsStore.getState().reset()
})

describe('useSettingsStore', () => {
  it('boshlang‘ich holatda til tanlanmagan', () => {
    expect(useSettingsStore.getState().learningLanguage).toBeNull()
    expect(useSettingsStore.getState().onboardingCompleted).toBe(false)
  })

  it('reset hamma sozlamani qaytaradi', () => {
    const store = useSettingsStore.getState()
    store.setLearningLanguage('ru')
    store.setDailyGoalWords(30)
    store.completeOnboarding()

    useSettingsStore.getState().reset()

    expect(useSettingsStore.getState().learningLanguage).toBeNull()
    expect(useSettingsStore.getState().dailyGoalWords).toBe(20)
    expect(useSettingsStore.getState().onboardingCompleted).toBe(false)
  })
})

describe('joinLeague', () => {
  it('birinchi qo‘shilishda kod yaratadi', () => {
    useSettingsStore.getState().joinLeague('Ali')

    const { leagueCode, leagueName } = useSettingsStore.getState()

    expect(leagueName).toBe('Ali')
    expect(leagueCode).toMatch(/^[A-Z2-9]{6}$/)
  })

  it('QAYTA qo‘shilganda kod O‘ZGARMAYDI', () => {
    useSettingsStore.getState().joinLeague('Ali')
    const first = useSettingsStore.getState().leagueCode

    useSettingsStore.getState().joinLeague('Ali Valiyev')

    // Kod — foydalanuvchining shaxsi. Yangisi yaratilsa, reytingda
    // ikkita yozuv paydo bo'lardi va eski XP yo'qolgandek ko'rinardi.
    expect(useSettingsStore.getState().leagueCode).toBe(first)
    expect(useSettingsStore.getState().leagueName).toBe('Ali Valiyev')
  })
})

describe('saqlanadigan holat (persist)', () => {
  it('yangi maydon qo‘shilsa eski saqlangan holat YO‘QOLMAYDI', () => {
    /*
     * Zustand'ning standart `merge` funksiyasi saqlangan holatni
     * boshlang'ich qiymatlar USTIGA yozadi. Shuning uchun keyinchalik
     * qo'shilgan maydon o'z sukut qiymatini oladi va foydalanuvchi
     * hech nima yo'qotmaydi.
     *
     * Versiya oshirilsa va `migrate` berilmasa, zustand saqlangan
     * holatni BUTUNLAY tashlaydi — foydalanuvchi tanlagan tilini
     * yo'qotadi. Fayldagi izoh aynan shundan ogohlantiradi, lekin uni
     * hech nima tekshirmasdi.
     */
    // `merge` ga o'rami YECHILGAN holat keladi (`{state, version}` emas)
    const stored = { learningLanguage: 'ar', dailyGoalWords: 30 }

    const merged = useSettingsStore.persist.getOptions().merge?.(
      stored,
      useSettingsStore.getState(),
    ) as { learningLanguage: string; dailyGoalWords: number; soundEnabled: boolean }

    expect(merged.learningLanguage).toBe('ar')
    expect(merged.dailyGoalWords).toBe(30)
    // Saqlangan holatda YO'Q maydon — sukut qiymatini oladi
    expect(merged.soundEnabled).toBe(true)
  })

  it('versiya 1 — oshirilsa migrate ham kerak', () => {
    // Bu test versiyani ATAYLAB qotiradi. Oshirmoqchi bo'lgan odam shu
    // yerda to'xtaydi va `migrate` yozishni eslaydi.
    expect(useSettingsStore.persist.getOptions().version).toBe(1)
    expect(useSettingsStore.persist.getOptions().migrate).toBeUndefined()
  })
})

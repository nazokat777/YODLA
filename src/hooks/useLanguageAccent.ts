import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * Til aksenti: `html[data-lang]` — CSS o'zgaruvchilari shundan rang
 * oladi (qahramon karta, faol navigatsiya, girih naqshi). Ilova
 * o'rganilayotgan tilga qarab "kiyinadi" — til almashganini
 * ko'rsatadigan eng kuchli, lekin so'zsiz belgi.
 *
 * ILOVA ILDIZIDA: dars ekrani AppShell'dan tashqarida (pastki
 * navigatsiyasiz) — u yerda ham aksent kerak.
 */
export function useLanguageAccent(): void {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)

  useEffect(() => {
    const root = document.documentElement
    if (learningLanguage) root.dataset.lang = learningLanguage
    else delete root.dataset.lang
  }, [learningLanguage])
}

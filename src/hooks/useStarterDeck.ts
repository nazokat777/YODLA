import { useEffect } from 'react'
import { addMissingCards } from '@/core/db'
import { STARTER_DECKS } from '@/content/starterDecks'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * Tanlangan til uchun boshlang'ich so'zlar to'plamini bazaga yozadi.
 *
 * `addMissingCards` idempotent — shuning uchun effekt bir necha marta
 * ishga tushsa ham (React StrictMode ikki marta chaqiradi) dublikat
 * yaratilmaydi va mavjud progress buzilmaydi.
 */
export function useStarterDeck() {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)

  useEffect(() => {
    if (!learningLanguage) return

    // Effekt sinxron emas — xatoni yutib yubormaslik uchun aniq ushlaymiz
    addMissingCards(STARTER_DECKS[learningLanguage]).catch((error: unknown) => {
      console.error("Boshlang'ich to'plamni yuklab bo'lmadi:", error)
    })
  }, [learningLanguage])
}

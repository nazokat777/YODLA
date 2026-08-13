import { useEffect } from 'react'
import { addMissingCards } from '@/core/db'
import { loadStarterDeck } from '@/content/starterDecks'
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

    // Lug'at dangasa yuklanadi (til bo'lagi), so'ng bazaga yoziladi.
    // Xatoni yutib yubormaslik uchun aniq ushlaymiz.
    loadStarterDeck(learningLanguage)
      .then((deck) => addMissingCards(deck))
      .catch((error: unknown) => {
        console.error("Boshlang'ich to'plamni yuklab bo'lmadi:", error)
      })
  }, [learningLanguage])
}

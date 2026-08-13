import { useEffect } from 'react'
import { addMissingCards, syncCardContent } from '@/core/db'
import { loadStarterDeck } from '@/content/starterDecks'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * Tanlangan til uchun boshlang'ich so'zlar to'plamini bazaga yozadi.
 *
 * Ikki qadam:
 *  1. `addMissingCards` — yangi so'zlarni qo'shadi;
 *  2. `syncCardContent` — MAVJUD kartalarning kontentini yangilaydi.
 *
 * Ikkinchisisiz kontent yaxshilanishlari (yangi jumla, mavzu, daraja) faqat
 * ilovani yangi o'rnatganlarga yetib borardi.
 *
 * Ikkalasi ham idempotent — effekt bir necha marta ishga tushsa ham
 * (React StrictMode ikki marta chaqiradi) dublikat yaratilmaydi va
 * takrorlash progressi buzilmaydi.
 */
export function useStarterDeck() {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)

  useEffect(() => {
    if (!learningLanguage) return

    // Lug'at dangasa yuklanadi (til bo'lagi), so'ng bazaga yoziladi.
    // Xatoni yutib yubormaslik uchun aniq ushlaymiz.
    loadStarterDeck(learningLanguage)
      .then(async (deck) => {
        await addMissingCards(deck)
        await syncCardContent(deck)
      })
      .catch((error: unknown) => {
        console.error("Boshlang'ich to'plamni yuklab bo'lmadi:", error)
      })
  }, [learningLanguage])
}

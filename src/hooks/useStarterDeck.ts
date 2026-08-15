import { useEffect } from 'react'
import { addMissingCards, pruneRemovedCards, syncCardContent } from '@/core/db'
import { loadStarterDeck } from '@/content/starterDecks'
import { deckFingerprint } from '@/content/fingerprint'
import type { LanguageCode } from '@/core/types'
import { useSettingsStore } from '@/stores/useSettingsStore'

/** Oxirgi sinxronlangan lug'at barmoq izi shu kalitda saqlanadi */
const syncKey = (language: LanguageCode) => `polyglotpro:deck-sync:${language}`

/**
 * Tanlangan til uchun boshlang'ich so'zlar to'plamini bazaga yozadi.
 *
 * Uch qadam:
 *  1. `addMissingCards` — yangi so'zlarni qo'shadi;
 *  2. `syncCardContent` — MAVJUD kartalarning kontentini yangilaydi;
 *  3. `pruneRemovedCards` — lug'atdan chiqarilgan, hali o'rganilmagan
 *     kartalarni tozalaydi.
 *
 * Ikkinchisisiz kontent yaxshilanishlari (yangi jumla, mavzu, daraja) faqat
 * ilovani yangi o'rnatganlarga yetib borardi; uchinchisisiz esa sifatsiz
 * so'zlar (masalan darslikdagi shaxs ismlari) eski bazalarda qolib ketardi.
 *
 * 2 va 3-qadamlar FAQAT kontent o'zgarganda bajariladi. O'lchov: 3600 kartada
 * ular ~170 ms oladi va deyarli har safar hech narsa topmaydi — lug'at build
 * artefakti, u faqat yangi versiya chiqqanda o'zgaradi. Barmoq izini
 * hisoblash esa ~9 ms.
 *
 * 1-qadam HAR DOIM bajariladi: u xavfsizlik to'ri. Brauzer IndexedDB'ni
 * tozalab, localStorage'ni qoldirishi mumkin — o'shanda barmoq iziga
 * ishonib qolsak, foydalanuvchi bo'sh ilova bilan qolardi.
 *
 * Barcha qadamlar idempotent — effekt bir necha marta ishga tushsa ham
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

        const fingerprint = deckFingerprint(deck)
        if (localStorage.getItem(syncKey(learningLanguage)) === fingerprint) return

        await syncCardContent(deck)
        await pruneRemovedCards(learningLanguage, deck)

        // Belgi FAQAT muvaffaqiyatdan keyin qo'yiladi: sinxronlash yarim
        // yo'lda uzilsa, keyingi ochilishda qaytadan urinilsin
        localStorage.setItem(syncKey(learningLanguage), fingerprint)
      })
      .catch((error: unknown) => {
        console.error("Boshlang'ich to'plamni yuklab bo'lmadi:", error)
      })
  }, [learningLanguage])
}

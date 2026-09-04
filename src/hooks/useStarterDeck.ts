import { useEffect } from 'react'
import { addMissingCards, countCards, pruneRemovedCards, syncCardContent } from '@/core/db'
import { flatten, loadLanguageDeck } from '@/content/starterDecks'
import { deckFingerprint } from '@/content/fingerprint'
import { removeRetiredCards } from '@/content/retired'
import { saveTopicOrder } from '@/content/topicOrderCache'
import { topicOrderFromDeck } from '@/core/path'
import type { LanguageCode } from '@/core/types'
import { useSettingsStore } from '@/stores/useSettingsStore'

/** Oxirgi sinxronlangan lug'at barmoq izi shu kalitda saqlanadi */
const syncKey = (language: LanguageCode) => `polyglotpro:deck-sync:${language}`

/** Lug'at oxirgi marta qaysi build bilan tekshirilgani */
const buildKey = (language: LanguageCode) => `polyglotpro:deck-build:${language}`

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
 * 2 va 3-qadamlar FAQAT kontent o'zgarganda bajariladi (barmoq izi bo'yicha).
 *
 * Barcha qadamlar idempotent — effekt bir necha marta ishga tushsa ham
 * (React StrictMode ikki marta chaqiradi) dublikat yaratilmaydi va
 * takrorlash progressi buzilmaydi.
 */
export function useStarterDeck() {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)

  useEffect(() => {
    if (!learningLanguage) return

    let cancelled = false

    void (async () => {
      try {
        /*
         * TEZ YO'L: hech nima qilish shart emasmi.
         *
         * Lug'at build artefakti — u faqat yangi versiya chiqqanda
         * o'zgaradi. Shuning uchun build belgisi o'sha bo'lsa VA bazada
         * kartalar tursa, 700 kB lik lug'at bo'lagini yuklash ham,
         * mingta kartani bazadan so'rash ham keraksiz. O'lchov: bu ish
         * har ochilishda ~200 ms olardi (telefonda ancha ko'p) va deyarli
         * har safar hech narsa topmasdi.
         *
         * Karta sonini tekshirish MAJBURIY: brauzer IndexedDB'ni tozalab,
         * localStorage'ni qoldirishi mumkin — faqat belgiga ishonsak,
         * foydalanuvchi bo'sh ilova bilan qolardi.
         */
        /*
         * Chiqarilgan kartalar TEZ YO'LDAN OLDIN o'chiriladi.
         *
         * Ular `pruneRemovedCards` ga tayanolmaydi: u o'rganilgan
         * kartaga tegmaydi, nomaqbul kontent esa o'rganilgan bo'lsa ham
         * qolmasligi kerak. Amal arzon (birlamchi kalit bo'yicha) va
         * idempotent.
         */
        await removeRetiredCards()
        if (cancelled) return

        const checkedBuild = localStorage.getItem(buildKey(learningLanguage))
        if (checkedBuild === __DECK_BUILD_ID__) {
          const existing = await countCards(learningLanguage)
          if (existing > 0 || cancelled) return
        }

        // Lug'at dangasa yuklanadi (til bo'lagi), so'ng bazaga yoziladi
        const levels = await loadLanguageDeck(learningLanguage)
        if (cancelled) return

        // Bosh ekrandagi o'quv yo'li mavzular tartibini shu yerdan oladi —
        // aks holda u lug'atni O'ZI qaytadan yuklardi
        saveTopicOrder(learningLanguage, topicOrderFromDeck(levels))

        const deck = flatten(levels)

        await addMissingCards(deck)

        const fingerprint = deckFingerprint(deck)
        if (localStorage.getItem(syncKey(learningLanguage)) !== fingerprint) {
          await syncCardContent(deck)
          await pruneRemovedCards(learningLanguage, deck)

          // Belgi FAQAT muvaffaqiyatdan keyin qo'yiladi: sinxronlash yarim
          // yo'lda uzilsa, keyingi ochilishda qaytadan urinilsin
          localStorage.setItem(syncKey(learningLanguage), fingerprint)
        }

        localStorage.setItem(buildKey(learningLanguage), __DECK_BUILD_ID__)
      } catch (error) {
        console.error("Boshlang'ich to'plamni yuklab bo'lmadi:", error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [learningLanguage])
}

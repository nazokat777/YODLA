import { useEffect, useState } from 'react'
import { loadLanguageDeck } from '@/content/starterDecks'
import { readTopicOrder, saveTopicOrder } from '@/content/topicOrderCache'
import { topicOrderFromDeck } from '@/core/path'
import type { LanguageCode } from '@/core/types'

/**
 * Mavzular tartibi — lug'atdan olinadi, lug'at dangasa yuklanadi.
 * `null` — hali kelmagan.
 *
 * Avval KESH. Tartib lug'at bazaga yozilayotganda saqlab qo'yiladi,
 * shuning uchun odatda shu yerda topiladi va butun lug'atni (inglizchada
 * ~700 kB JS) qayta yuklash kerak bo'lmaydi.
 *
 * Kesh bo'sh bo'lishi mumkin: yangi versiya endi chiqqan yoki
 * foydalanuvchi tilni endi almashtirgan. Unda lug'at yuklanadi va
 * natija keyingi safar uchun saqlanadi.
 *
 * Lug'at bo'lagi yuklanmasligi MUMKIN (yangi versiya chiqqach eski
 * sahifada bo'lak nomi o'zgargan, yoki oflaynda til almashtirilgan).
 * Unda BO'SH tartib qaytadi: yo'l alifbo bo'yicha chiziladi — ideal
 * emas, lekin ekran "yuklanmoqda"da abadiy qotib qolmaydi.
 */
export function useTopicOrder(language: LanguageCode | null): string[] | null {
  const [topicOrder, setTopicOrder] = useState<string[] | null>(null)

  useEffect(() => {
    if (!language) return

    const cached = readTopicOrder(language)
    if (cached) {
      setTopicOrder(cached)
      return
    }

    let cancelled = false
    void loadLanguageDeck(language)
      .then((deck) => {
        if (cancelled) return
        const order = topicOrderFromDeck(deck)
        saveTopicOrder(language, order)
        setTopicOrder(order)
      })
      .catch((error: unknown) => {
        console.error('Mavzular tartibini yuklab bo‘lmadi:', error)
        if (!cancelled) setTopicOrder([])
      })
    return () => {
      cancelled = true
    }
  }, [language])

  return topicOrder
}

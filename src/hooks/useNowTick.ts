import { useEffect, useState } from 'react'

/** Standart yangilanish oralig'i: bir daqiqa */
const DEFAULT_INTERVAL_MS = 60_000

/**
 * Vaqt o'tishini kuzatuvchi hook: davriy ravishda yangilanadigan timestamp.
 *
 * Nega kerak: `useLiveQuery` faqat BAZAGA YOZUV bo'lganda qayta ishga tushadi.
 * Ichida `Date.now()` ishlatilgan so'rov (masalan "muddati yetgan kartalar")
 * so'rov bajarilgan paytdagi vaqtda qotib qoladi. Foydalanuvchi ilovani
 * ochiq qoldirib, yarim tundan o'tsa, "bugun takrorlash" soni yangilanmasdi.
 *
 * Qaytarilgan qiymatni `useLiveQuery` bog'liqliklariga qo'shish kifoya.
 */
export function useNowTick(intervalMs: number = DEFAULT_INTERVAL_MS): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const refresh = () => setNow(Date.now())

    const timer = window.setInterval(refresh, intervalMs)
    // Ilova fonga o'tib qaytganda taymer kechikkan bo'lishi mumkin —
    // qaytishda darhol yangilaymiz.
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', refresh)

    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', refresh)
    }
  }, [intervalMs])

  return now
}

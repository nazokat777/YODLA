import { useEffect } from 'react'
import { getDailyStatsSince } from '@/core/db'
import { startOfDay } from '@/lib/date'
import { pushToday } from '@/lib/supabase'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * Bugungi natijani ligaga yuboradi.
 *
 * Faqat ROZILIK berilgan bo'lsa ishlaydi (`leagueCode` mavjud). Yuborilishi:
 * ism, bugungi XP va noyob so'zlar soni — boshqa hech narsa.
 *
 * Xatolik jimgina yutiladi: reyting qo'shimcha imkoniyat, o'rganish
 * jarayoniga xalaqit bermasligi kerak. Keyingi seansda qayta urinadi.
 */
export function useLeagueSync(trigger: unknown) {
  const leagueCode = useSettingsStore((s) => s.leagueCode)
  const leagueName = useSettingsStore((s) => s.leagueName)

  useEffect(() => {
    if (!leagueCode) return

    let cancelled = false

    void (async () => {
      const today = startOfDay(Date.now())
      const stats = await getDailyStatsSince(today)
      const todayStat = stats.find((stat) => stat.day === today)

      if (!todayStat || cancelled) return

      await pushToday({
        code: leagueCode,
        name: leagueName,
        xp: todayStat.xp,
        words: todayStat.cardIds.length,
      })
    })()

    return () => {
      cancelled = true
    }
  }, [leagueCode, leagueName, trigger])
}

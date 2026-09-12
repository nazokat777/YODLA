import { useLiveQuery } from 'dexie-react-hooks'
import { Panel } from '@/components/ui/Panel'
import { getAllCards, getDailyStat, getProgressSnapshot, getRecentDailyStats } from '@/core/db'
import { streakTier } from '@/core/gamification'
import { personalBestDay, tomorrowPreview } from '@/core/stats'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * Seans yakunidagi "KEYIN NIMA": bugungi rekord va ertangi kun.
 *
 * Halqa ataylab OCHIQ qoldiriladi (Zeigarnik): "ertaga 7 ta so'z seni
 * kutadi, streak 8 bo'ladi" — bola ertangi kunni bugun tasavvur qiladi.
 * Rekord — kechagi o'zing bilan musobaqa: bolalar uchun eng xavfsizi.
 *
 * Hamma raqam JONLI manbadan (kartalar, kunlik statistika): seans
 * yozuvlari tugagach o'qiladi, taxmin yo'q.
 */
export function TomorrowCard() {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)

  const data = useLiveQuery(async () => {
    if (!learningLanguage) return null
    const now = Date.now()
    const [cards, snapshot, today, history] = await Promise.all([
      getAllCards(learningLanguage),
      getProgressSnapshot(now),
      getDailyStat(now),
      getRecentDailyStats(60),
    ])

    return {
      preview: tomorrowPreview(cards, snapshot.streak.current, now),
      record: personalBestDay(history, today),
      todayXp: today.xp,
    }
  }, [learningLanguage])

  if (!data) return null

  const { preview, record, todayXp } = data
  const tier = streakTier(preview.streakTomorrow)

  return (
    <Panel data-testid="tomorrow-card" className="flex flex-col gap-2">
      {record && (
        <p
          data-testid="record-day"
          className="mastered-pop flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-flame-500 px-3 py-2 text-sm font-extrabold text-white"
        >
          <span aria-hidden="true">🏅</span>
          Yangi kunlik rekord: {todayXp} XP (avvalgisi {record.previousBest})
        </p>
      )}

      <p className="text-sm text-ink-600">Ertaga seni nima kutadi</p>
      <ul className="flex flex-col gap-1 text-sm font-semibold">
        <li className="flex items-center gap-2">
          <span aria-hidden="true">🔁</span>
          {preview.dueTomorrow > 0
            ? `${preview.dueTomorrow} ta so‘z takrorga chiqadi — ular sen uchun tayyor bo‘ladi`
            : 'Yangi so‘zlar seni kutadi'}
        </li>
        <li className="flex items-center gap-2">
          <span aria-hidden="true">{tier.emoji}</span>
          Ertaga kelsang streak {preview.streakTomorrow} bo‘ladi
          {tier.minDays === preview.streakTomorrow && ` — ${tier.name} darajasi!`}
        </li>
      </ul>
    </Panel>
  )
}

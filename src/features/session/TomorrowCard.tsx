import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { PATHS } from '@/app/paths'
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
/** Daraja shuncha XP dan yaqin bo'lsa — "hozir" taklifi */
const NEAR_LEVEL_XP = 30

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
      // Maqsad gradienti: daraja YAQIN bo'lsa — hozir aytiladi
      xpToLevel: snapshot.level.xpForNextLevel - snapshot.level.xpIntoLevel,
      nextLevel: snapshot.level.level + 1,
      dueNow: cards.filter((card) => card.totalReviews > 0 && card.dueDate <= now).length,
    }
  }, [learningLanguage])

  if (!data) return null

  const { preview, record, todayXp, xpToLevel, nextLevel, dueNow } = data
  const tier = streakTier(preview.streakTomorrow)
  /*
   * MAQSAD GRADIENTI (Hull): maqsadga yaqinlashganda harakat tezlashadi.
   * Daraja 30 XP dan yaqin bo'lsa — "hozir bitta qisqa takror yetadi".
   * Faqat takrorlanadigan so'z BOR bo'lsa: aks holda taklif bo'sh.
   */
  const almostLevel = xpToLevel <= NEAR_LEVEL_XP && dueNow > 0

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

      {almostLevel && (
        <Link
          to={PATHS.review}
          data-testid="almost-level"
          className="tap-highlight-none lightning-pulse rounded-xl bg-gradient-to-r from-brand-500 to-sky-500 px-3 py-2 text-sm font-extrabold text-white shadow-pop"
        >
          🎯 {nextLevel}-darajagacha atigi {xpToLevel} XP — {Math.min(dueNow, 3)} ta so‘z takrorlash yetadi →
        </Link>
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

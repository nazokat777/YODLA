import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Panel } from '@/components/ui/Panel'
import { claimWeeklyMilestone, db, getDailyStatsSince } from '@/core/db'
import {
  WEEKLY_MILESTONES,
  activeDaysThisWeek,
  claimableMilestones,
  startOfWeek,
  weekDays,
  weekKey,
} from '@/core/gamification'
import { cn } from '@/lib/cn'
import { playChestSound } from '@/lib/sound'
import { haptic } from '@/lib/haptics'
import { useSettingsStore } from '@/stores/useSettingsStore'

const DAY_LABELS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'] as const

/**
 * HAFTALIK SAYOHAT — 7 qadam, yo'lda 3 sandiq.
 *
 * Sandiq YETILGANDA o'zi ochilmaydi: "Ochish" tugmasi bor. Mukofot
 * foydalanuvchining o'z harakati bilan keladi — bu dofamin uchun
 * "o'zi tushgan" mukofotdan kuchliroq (agentlik). Ochilgan sandiq
 * xaritada ochiq holda qoladi — hafta davomida ko'rinadigan yutuq.
 */
export function WeeklyQuest() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const [justClaimed, setJustClaimed] = useState<number | null>(null)

  const data = useLiveQuery(async () => {
    const now = Date.now()
    const [stats, profile] = await Promise.all([
      getDailyStatsSince(startOfWeek(now)),
      db.profile.get('me'),
    ])
    const key = weekKey(now)

    return {
      key,
      days: weekDays(stats, now),
      active: activeDaysThisWeek(stats, now),
      claimed: profile?.weeklyQuestClaims?.[key] ?? [],
    }
  }, [])

  if (!data) return null

  const claimable = claimableMilestones(data.active, data.claimed)

  const handleClaim = async (days: number, xp: number) => {
    const given = await claimWeeklyMilestone(data.key, days, xp)
    if (!given) return
    setJustClaimed(days)
    if (soundEnabled) playChestSound()
    haptic('celebrate')
  }

  return (
    <Panel data-testid="weekly-quest" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="font-bold">Haftalik sayohat</h2>
        <span data-testid="weekly-active" className="text-sm text-ink-600">
          {data.active}/7 kun
        </span>
      </div>

      {/* Yo'l: 7 kun, orasida sandiqlar */}
      <ol className="flex items-end justify-between gap-1">
        {data.days.map((active, index) => {
          const dayNumber = index + 1
          const milestone = WEEKLY_MILESTONES.find((m) => m.days === dayNumber)
          const opened = milestone ? data.claimed.includes(milestone.days) : false
          const reached = milestone ? data.active >= milestone.days : false

          return (
            <li key={dayNumber} className="flex flex-1 flex-col items-center gap-1">
              {milestone ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    'text-xl transition-transform',
                    reached && !opened && 'chest-wobble',
                    !reached && 'opacity-40 grayscale',
                  )}
                >
                  {opened ? '✅' : milestone.icon}
                </span>
              ) : (
                <span aria-hidden="true" className="h-7" />
              )}
              <span
                data-testid={`week-day-${dayNumber}`}
                data-active={active}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold',
                  active ? 'bg-brand-500 text-white shadow-pop' : 'bg-ink-300/40 text-ink-600',
                )}
              >
                {active ? '✓' : DAY_LABELS[index]}
              </span>
            </li>
          )
        })}
      </ol>

      {claimable.length > 0 && (
        <button
          type="button"
          data-testid="weekly-claim"
          onClick={() => void handleClaim(claimable[0]!.days, claimable[0]!.xp)}
          className="tap-highlight-none combo-pop rounded-xl bg-gradient-to-r from-flame-500 to-brand-500 px-4 py-2.5 font-extrabold text-white shadow-pop"
        >
          {claimable[0]!.icon} {claimable[0]!.days} kunlik sandiqni ochish — +{claimable[0]!.xp} XP
        </button>
      )}

      {justClaimed !== null && claimable.length === 0 && (
        <p data-testid="weekly-claimed" role="status" className="text-center text-sm font-bold text-brand-700">
          🎉 Sandiq ochildi — XP hisobga qo‘shildi!
        </p>
      )}

      {claimable.length === 0 && justClaimed === null && (
        <p className="text-center text-xs text-ink-600">
          {nextHint(data.active, data.claimed, daysLeftInWeek())}
        </p>
      )}
    </Panel>
  )
}

/** Bugundan keyin bu haftada nechta kun qoldi (bugun hisobga kirmaydi) */
function daysLeftInWeek(now: number = Date.now()): number {
  return 6 - ((new Date(now).getDay() + 6) % 7)
}

/**
 * Keyingi sandiqgacha nechta kun — kutish.
 *
 * HALOL: hafta oxirigacha yetib bo'lmasa "2 kundan keyin" deb
 * aldamaydi — "keyingi hafta yangi xarita" deydi.
 */
function nextHint(active: number, claimed: readonly number[], daysLeft: number): string {
  const next = WEEKLY_MILESTONES.find((m) => m.days > active || !claimed.includes(m.days))
  if (!next) return 'Bu hafta hammasi ochildi. Zo‘r!'
  const left = next.days - active
  if (left <= 0) return `${next.icon} Sandiq tayyor!`
  if (left > daysLeft) return '🗺️ Dushanbada yangi xarita — yana boshlaymiz'
  return `${next.icon} Keyingi sandiq ${left} kundan keyin`
}

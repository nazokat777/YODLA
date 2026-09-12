import { useEffect, useState } from 'react'
import { db, markStreakTierCelebrated } from '@/core/db'
import { STREAK_TIERS, streakTier } from '@/core/gamification'
import { haptic } from '@/lib/haptics'
import { playMilestoneSound } from '@/lib/sound'
import { useSettingsStore } from '@/stores/useSettingsStore'

interface StreakTierToastProps {
  streak: number
}

/**
 * OLOV DARAJASI BAYRAMI — yangi darajaga chiqilgan kuni bir marta.
 *
 * Darajalar bor edi, lekin ularga yetganda hech nima bo'lmasdi — kutish
 * bor, mukofot yo'q. Endi: bosh ekranga kirganda gradient banner,
 * fanfara, tebranish. Bazada belgilanadi — qayta chiqmaydi.
 *
 * Boshlang'ich daraja (1 kun) nishonlanmaydi: birinchi kunning o'zi
 * boshqa bayramlar bilan to'la.
 */
export function StreakTierToast({ streak }: StreakTierToastProps) {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const [shown, setShown] = useState<{ name: string; emoji: string } | null>(null)

  useEffect(() => {
    const tier = streakTier(streak)
    if (tier.minDays < STREAK_TIERS[STREAK_TIERS.length - 2]!.minDays) return // Boshlanish

    let cancelled = false
    void db.profile
      .get('me')
      .then(async (profile) => {
        if (!profile || cancelled) return
        if ((profile.celebratedStreakTiers ?? []).includes(tier.minDays)) return
        const fresh = await markStreakTierCelebrated(tier.minDays)
        if (!fresh || cancelled) return
        setShown({ name: tier.name, emoji: tier.emoji })
        if (soundEnabled) playMilestoneSound()
        haptic('celebrate')
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [streak, soundEnabled])

  if (!shown) return null

  return (
    <div
      data-testid="streak-tier-toast"
      role="status"
      className="levelup-in relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-r from-flame-500 via-amber-400 to-flame-600 px-4 py-3 text-white shadow-pop-lg"
    >
      <span aria-hidden="true" className="levelup-sweep pointer-events-none absolute inset-0" />
      <p className="relative flex items-center gap-3">
        <span aria-hidden="true" className="text-3xl">
          {shown.emoji}
        </span>
        <span>
          <span className="block text-xs font-extrabold uppercase tracking-[0.25em] text-white/85">
            Yangi olov darajasi
          </span>
          <span className="block text-lg font-extrabold">
            {shown.name} — {streak} kun ketma-ket!
          </span>
        </span>
      </p>
    </div>
  )
}

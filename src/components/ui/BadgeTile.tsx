import type { BadgeDefinition, BadgeStats } from '@/core/gamification'
import { cn } from '@/lib/cn'
import { ProgressBar } from './ProgressBar'

interface BadgeTileProps {
  badge: BadgeDefinition
  stats: BadgeStats
  isUnlocked: boolean
}

/**
 * Bitta nishon katakchasi.
 *
 * Ochilmagan nishon ham KO'RSATILADI (o'chirilgan holda va progress bilan) —
 * "yana 3 ta so'z qoldi" ko'rinishi keyingi qadamni aniq qiladi.
 */
export function BadgeTile({ badge, stats, isUnlocked }: BadgeTileProps) {
  const { value, target } = badge.progress(stats)

  return (
    <li
      className={cn(
        'flex flex-col items-center gap-1 rounded-2xl border-2 p-3 text-center',
        isUnlocked ? 'border-brand-500 bg-brand-50' : 'border-ink-300 bg-white',
      )}
    >
      <span
        aria-hidden="true"
        className={cn('text-3xl', !isUnlocked && 'opacity-30 grayscale')}
      >
        {badge.icon}
      </span>

      <p className={cn('text-xs font-bold', !isUnlocked && 'text-ink-600')}>{badge.title}</p>

      {isUnlocked ? (
        // Rangdan tashqari matnli belgi ham bor (WCAG 1.4.1)
        <p className="text-[10px] font-semibold text-brand-700">✓ Ochilgan</p>
      ) : (
        <>
          <ProgressBar
            value={value}
            max={target}
            className="h-1.5"
            label={`${badge.title}: ${value} / ${target}`}
          />
          <p className="text-[10px] text-ink-600">
            {value} / {target}
          </p>
        </>
      )}
    </li>
  )
}

import { STRENGTH_NAMES, wordStrength } from '@/core/srs'
import type { Card } from '@/core/types'
import { cn } from '@/lib/cn'

interface WordStrengthMeterProps {
  card: Pick<Card, 'interval' | 'repetitions'>
  className?: string
}

/** Har bosqichning rangi — kuchayib boradi */
const SEGMENT_COLOR = ['bg-ink-300', 'bg-flame-500', 'bg-sky-500', 'bg-brand-500'] as const

/**
 * So'zning "kuchi" — to'rt bo'lakli kichik indikator.
 *
 * NEGA KERAK: SM-2 ning `interval` i son sifatida foydalanuvchiga hech
 * nima aytmaydi ("6 kun" — bu yaxshimi?). To'rt bosqich esa O'SISHNI
 * ko'rsatadi: bola bugun qilgan ishi so'zni oldinga surganini ko'radi.
 *
 * Ko'rinadigan progress motivatsiyaning asosiy manbalaridan biri;
 * ko'rinmaydigani esa umuman ishlamaydi.
 */
export function WordStrengthMeter({ card, className }: WordStrengthMeterProps) {
  const strength = wordStrength(card)

  return (
    <span
      data-testid="word-strength"
      className={cn('inline-flex items-center gap-1.5', className)}
    >
      <span aria-hidden="true" className="flex gap-0.5">
        {[0, 1, 2, 3].map((step) => (
          <span
            key={step}
            className={cn(
              'h-1.5 w-4 rounded-full transition-colors',
              step <= strength ? SEGMENT_COLOR[strength] : 'bg-ink-300/40',
            )}
          />
        ))}
      </span>
      {/* Nomi ham yoziladi: rang bilan ma'no berish yetarli emas
          (WCAG 1.4.1) va bo'laklar o'zi hech nima anglatmaydi */}
      <span className="text-xs font-semibold text-ink-600">{STRENGTH_NAMES[strength]}</span>
    </span>
  )
}

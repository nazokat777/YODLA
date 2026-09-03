import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Ichki bo'shliq o'lchamlari */
const PADDING = { none: '', sm: 'p-3', md: 'p-4' } as const

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /**
   * Ichki bo'shliq.
   *
   * NEGA PROP, `className` EMAS: `cn()` shunchaki satrlarni birlashtiradi,
   * Tailwind ziddiyatlarini YECHMAYDI. `className="p-3"` uzatilsa,
   * elementda `p-4 p-3` ikkalasi ham qoladi va qaysi biri ishlashini CSS
   * faylidagi tartib hal qiladi — chaqiruvchining niyati emas. Amalda
   * `p-4` yutib, uzatilgan `p-3` jimgina yo'qolardi.
   */
  padding?: keyof typeof PADDING
}

/**
 * Oq fonli "karta" konteyner.
 *
 * DIQQAT: nomi ataylab `Panel` — chunki `Card` nomi SRS domen modeli
 * (so'z kartasi) uchun band. Bu chalkashlikning oldini oladi.
 */
export function Panel({ className, padding = 'md', ...rest }: PanelProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-ink-300/60 bg-white shadow-sm',
        PADDING[padding],
        className,
      )}
      {...rest}
    />
  )
}

import { cn } from '@/lib/cn'

interface ProgressBarProps {
  /** Joriy qiymat */
  value: number
  /** Maksimal qiymat (0 bo'lsa, progress 0% deb hisoblanadi) */
  max: number
  className?: string
  /** Ekran o'quvchilar uchun tavsif */
  label?: string
}

/**
 * Umumiy progress indikatori.
 * Kunlik maqsad, dars progressi va XP darajasi uchun qayta ishlatiladi.
 */
export function ProgressBar({ value, max, className, label }: ProgressBarProps) {
  // 0 ga bo'lishdan himoya + 0..100 oralig'iga qisish
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0

  return (
    <div
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn('h-3 w-full overflow-hidden rounded-full bg-ink-300/50', className)}
    >
      <div
        className="h-full rounded-full bg-brand-500 transition-[width] duration-500 ease-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

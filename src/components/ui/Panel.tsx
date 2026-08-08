import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

/**
 * Oq fonli "karta" konteyner.
 *
 * DIQQAT: nomi ataylab `Panel` — chunki `Card` nomi SRS domen modeli
 * (so'z kartasi) uchun band. Bu chalkashlikning oldini oladi.
 */
export function Panel({ className, ...rest }: PanelProps) {
  return (
    <div
      className={cn('rounded-2xl border border-ink-300/60 bg-white p-4 shadow-sm', className)}
      {...rest}
    />
  )
}

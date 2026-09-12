import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from './Button'

interface ConfirmSheetProps {
  open: boolean
  title: string
  children?: ReactNode
  /** Asosiy (xavfsiz) harakat — sukut bo'yicha fokus shunda */
  primaryLabel: string
  /** Xavfli harakat (chiqish, o'chirish) */
  dangerLabel: string
  onPrimary: () => void
  onDanger: () => void
}

/**
 * Pastdan chiqadigan tasdiq varaqasi.
 *
 * NN/g #3 va #5: qaytarib bo'lmaydigan harakatdan oldin so'raladi.
 * XAVFSIZ tugma asosiy (yashil, fokus unda) — tasodifiy Enter/bosish
 * eng yomon natijaga olib bormasin. Esc va fon bosilganda ham bekor.
 */
export function ConfirmSheet({
  open,
  title,
  children,
  primaryLabel,
  dangerLabel,
  onPrimary,
  onDanger,
}: ConfirmSheetProps) {
  const primaryRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    primaryRef.current?.focus()

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onPrimary()
      // Fokus varaqa ichida aylanadi: Tab orqa fondagi tugmalarga chiqib ketmasin
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>('button, [href], input')
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (!first || !last) return
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onPrimary])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      {/* Fon — bosilsa bekor (xavfsiz tomon) */}
      <button
        type="button"
        aria-label="Yopish"
        onClick={onPrimary}
        className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        data-testid="confirm-sheet"
        className="levelup-in relative w-full max-w-[480px] rounded-t-[var(--radius-card)] bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-pop-lg"
      >
        <h2 id="confirm-title" className="text-lg font-extrabold">
          {title}
        </h2>
        {children && <div className="mt-2 text-sm text-ink-600">{children}</div>}
        <div className="mt-4 flex flex-col gap-2">
          <Button ref={primaryRef} block size="lg" onClick={onPrimary}>
            {primaryLabel}
          </Button>
          <Button block variant="ghost" onClick={onDanger}>
            {dangerLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}

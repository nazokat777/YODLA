import { useEffect, useRef } from 'react'
import { particleBurst, withMotion } from '@/lib/motion'
import { haptic } from '@/lib/haptics'
import { playMilestoneSound } from '@/lib/sound'
import { useSettingsStore } from '@/stores/useSettingsStore'

interface LevelUpBannerProps {
  from: number
  to: number
  title: string
}

/**
 * DARAJA OSHDI — seansning eng katta bayrami.
 *
 * NEGA ALOHIDA: XP bar sekin to'ladi va daraja oshgan lahza odatda
 * hech kim sezmay o'tib ketadi. Holbuki bu — uzoq harakatning
 * yakuni, ya'ni dofamin uchun eng "qimmat" nuqta (maqsadga yetish).
 * Katta raqam, unvon, zarrachalar va fanfara — bola buni ESLAB QOLADI,
 * eslab qolgan narsaga esa qaytib keladi.
 *
 * Ovoz seans ohanglaridan farq qiladi (fanfara) — miya "bu boshqa,
 * kattaroq voqea" deb belgilaydi.
 */
export function LevelUpBanner({ from, to, title }: LevelUpBannerProps) {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (soundEnabled) playMilestoneSound()
    haptic('celebrate')

    let cancelled = false
    let revert = () => {}

    void withMotion(
      rootRef.current,
      (gsap) => {
        particleBurst(gsap, '[data-spark]')
      },
      ['physics2D'],
    ).then((fn) => {
      if (cancelled) fn()
      else revert = fn
    })

    return () => {
      cancelled = true
      revert()
    }
  }, [soundEnabled])

  return (
    <div
      ref={rootRef}
      data-testid="level-up"
      role="status"
      className="levelup-in relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-br from-brand-600 via-sky-600 to-flame-500 px-4 py-5 text-center text-white shadow-pop-lg"
    >
      {/* Yorug'lik supurgisi — "sahna nuri" */}
      <span aria-hidden="true" className="levelup-sweep pointer-events-none absolute inset-0" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0">
        {Array.from({ length: 18 }, (_, i) => (
          <span
            key={i}
            data-spark
            className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-white"
          />
        ))}
      </span>

      <p className="relative text-xs font-extrabold uppercase tracking-[0.3em] text-white/80">
        Level up
      </p>
      <p className="relative mt-1 flex items-center justify-center gap-3 font-extrabold">
        <span className="text-2xl text-white/60 line-through decoration-2">{from}</span>
        <span aria-hidden="true" className="text-xl text-white/70">
          →
        </span>
        <span className="levelup-number text-6xl drop-shadow-[0_6px_0_rgba(0,0,0,0.25)]">{to}</span>
      </p>
      <p className="relative mt-1 text-lg font-extrabold">{title}</p>
      <p className="relative text-sm text-white/80">Sen o‘sding. Bu — sening darajang.</p>
    </div>
  )
}

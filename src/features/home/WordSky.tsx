import { useMemo, useState, type CSSProperties } from 'react'
import type { CardRecord } from '@/core/db'
import { skyStars } from '@/core/stats'
import { Link } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { cn } from '@/lib/cn'

interface WordSkyProps {
  cards: readonly CardRecord[]
}

/** Kuchga qarab yulduz radiusi va yorqinligi */
const STAR_LOOK = [
  { r: 0.9, opacity: 0.35 },
  { r: 1.1, opacity: 0.6 },
  { r: 1.5, opacity: 0.85 },
  { r: 2.1, opacity: 1 },
] as const

/**
 * SO'Z OSMONI — o'rganilgan har so'z bitta yulduz.
 *
 * Bo'sh osmon ham ko'rsatiladi: "birinchi yulduzingizni yoqing" — bo'sh
 * joy to'ldirishga undaydi (Zeigarnik). Yulduzga bosilsa so'z chiqadi:
 * osmon shunchaki bezak emas, foydalanuvchining O'Z lug'ati.
 *
 * SVG: 160 yulduz uchun DOM yengil, animatsiya CSS bilan
 * (`prefers-reduced-motion` da o'chadi).
 */
export function WordSky({ cards }: WordSkyProps) {
  const { stars, total, dueTotal } = useMemo(() => skyStars(cards), [cards])
  const [picked, setPicked] = useState<string | null>(null)
  const pickedStar = stars.find((star) => star.id === picked) ?? null

  return (
    <section aria-labelledby="word-sky-title" className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h2 id="word-sky-title" className="font-bold">
          Sening osmoning
        </h2>
        <span data-testid="sky-count" className="text-sm text-ink-600">
          {total} yulduz
        </span>
      </div>

      <div className="relative overflow-hidden rounded-[var(--radius-card)] bg-gradient-to-b from-[#0b1a3a] via-[#122a5c] to-[#1d3f7a] shadow-pop">
        <svg
          viewBox="0 0 100 56"
          className="block h-40 w-full"
          role="img"
          aria-label={`${total} ta o‘rganilgan so‘z yulduz sifatida`}
        >
          {stars.map((star, index) => {
            const look = STAR_LOOK[star.strength] ?? STAR_LOOK[0]
            return (
              <circle
                key={star.id}
                data-testid="sky-star"
                cx={star.x}
                cy={(star.y / 100) * 56}
                r={look.r}
                // Xiralashayotgan yulduz — sarg'ish va tez-tez so'nadi
                fill={star.due ? '#fbbf24' : '#fff7d6'}
                opacity={look.opacity}
                className={cn('cursor-pointer', star.due ? 'sky-fading' : 'sky-twinkle')}
                // Miltillash BAZAVIY yorqinlikdan boshlanadi — aks holda CSS
                // animatsiya kuchga qarab berilgan opacity ni yeb qo'yardi
                style={
                  {
                    animationDelay: `${(index % 12) * 0.35}s`,
                    '--twinkle-base': star.due ? 0.5 : look.opacity,
                  } as CSSProperties
                }
                onClick={() => setPicked(star.id)}
              >
                <title>
                  {star.word} — {star.translation}
                </title>
              </circle>
            )
          })}
        </svg>

        {total === 0 && (
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center text-sm font-semibold text-white/80">
            Hali yulduz yo‘q. Birinchi darsdan keyin shu yerda yonadi ✨
          </p>
        )}

        {/*
          YUMSHOQ yo'qotish signali: unutish egri chizig'i ko'rinadigan
          bo'ladi, lekin jazo sifatida emas — "qutqarish mumkin" taklifi.
        */}
        {dueTotal > 0 && (
          <Link
            to={PATHS.review}
            data-testid="sky-rescue"
            className="tap-highlight-none absolute left-2 top-2 rounded-full bg-amber-400/90 px-2.5 py-1 text-xs font-bold text-ink-900 shadow-pop"
          >
            🌠 {dueTotal} yulduz xiralashmoqda — yorqinlashtirish
          </Link>
        )}

        {pickedStar && (
          <button
            type="button"
            data-testid="sky-picked"
            onClick={() => setPicked(null)}
            className="tap-highlight-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-white/95 px-3 py-1 text-sm font-bold text-ink-900 shadow-pop"
          >
            ✨ {pickedStar.word} — {pickedStar.translation}
          </button>
        )}
      </div>
    </section>
  )
}

import { useEffect, useRef } from 'react'
import { loadGsap } from '@/lib/motion'

/** Zarralar soni — ko'zga tashlanadi, lekin qurilmani qiynamaydi */
const PARTICLES = 24

/** Brend palitrasi: konfetti ilovaning bir qismidek ko'rinadi */
const COLORS = ['#10b981', '#6ee7b7', '#f59e0b', '#fbbf24', '#ffffff']

/**
 * Tantana konfettisi.
 *
 * Yangi bog'liqliksiz: oddiy `div` zarralar, GSAP ularni tasodifiy
 * burchak ostida uchiradi. Zarralar `aria-hidden` — ekran o'quvchi uchun
 * ma'nosi yo'q, tantana esa vizual hodisa.
 *
 * `prefers-reduced-motion` da GSAP umuman yuklanmaydi va zarralar
 * ko'rinmas holicha qoladi (`opacity-0`) — hech qanday harakat bo'lmaydi.
 */
export function Confetti() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    let context: { revert: () => void } | null = null

    void loadGsap().then((gsap) => {
      if (!gsap || cancelled || !rootRef.current) return

      context = gsap.context(() => {
        gsap.fromTo(
          '[data-particle]',
          { opacity: 1, x: 0, y: 0, scale: 0.4 },
          {
            // Har zarra o'z yo'nalishida uchadi va pastga tushadi
            x: () => gsap.utils.random(-160, 160),
            y: () => gsap.utils.random(-180, 40),
            scale: () => gsap.utils.random(0.6, 1.2),
            rotation: () => gsap.utils.random(-180, 180),
            opacity: 0,
            duration: 0.9,
            ease: 'power2.out',
            stagger: 0.01,
          },
        )
      }, rootRef)
    })

    return () => {
      cancelled = true
      context?.revert()
    }
  }, [])

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-8 flex justify-center"
    >
      {Array.from({ length: PARTICLES }, (_, index) => (
        <span
          key={index}
          data-particle
          // Boshlang'ich holat — ko'rinmas: animatsiya bo'lmasa ekranda
          // qotib qolgan nuqtalar turmasligi kerak
          className="absolute h-2.5 w-2.5 rounded-sm opacity-0"
          style={{ backgroundColor: COLORS[index % COLORS.length] }}
        />
      ))}
    </div>
  )
}

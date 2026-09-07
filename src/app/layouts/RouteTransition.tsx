import { useEffect, useRef, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { withMotion } from '@/lib/motion'

interface RouteTransitionProps {
  children: ReactNode
}

/**
 * Sahifalar orasidagi o'tish.
 *
 * Usiz ekranlar bir-birini BIRDAN almashtiradi va foydalanuvchi
 * qayerdan qayerga o'tganini sezmaydi — ilova "sakrab" turgandek
 * tuyuladi. Qisqa siljish uzluksizlik hissini beradi.
 *
 * 180 ms — chegara: undan uzunroq bo'lsa navigatsiya SEKIN bo'lib
 * qoladi va bu eng bezovta qiladigan narsa.
 *
 * OPACITY ATAYLAB YO'Q: animatsiya tugamay qolsa (fon tab,
 * to'xtatilgan rAF) butun sahifa ko'rinmas bo'lib qolardi. Siljish
 * esa yarim yo'lda ham o'qiladi.
 */
export function RouteTransition({ children }: RouteTransitionProps) {
  const { pathname } = useLocation()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    let revert = () => {}

    void withMotion(ref.current, (gsap) => {
      gsap.from(ref.current, {
        y: 12,
        duration: 0.18,
        ease: 'power2.out',
        clearProps: 'transform',
      })
    }).then((fn) => {
      if (cancelled) fn()
      else revert = fn
    })

    return () => {
      cancelled = true
      revert()
    }
  }, [pathname])

  return (
    <div ref={ref} className="flex flex-1 flex-col">
      {children}
    </div>
  )
}

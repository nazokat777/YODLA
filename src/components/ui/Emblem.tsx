import { cn } from '@/lib/cn'

export type EmblemKind = 'coin' | 'trophy' | 'target' | 'spark' | 'rocket'

interface EmblemProps {
  kind: EmblemKind
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = { sm: 'h-12 w-12', md: 'h-20 w-20', lg: 'h-28 w-28' } as const

/**
 * Ilovaning bezak belgilari — SVG.
 *
 * NEGA SVG (avvalgi 3D personaj rasmi emas): rasm har o'lchamda bir xil
 * emas, fayl og'irligi bor va uslubi ilovaning qolgan qismiga
 * yopishmasdi. Vektor belgilar esa brend ranglarida chiziladi, istalgan
 * o'lchamda tiniq va nol kilobayt qo'shadi.
 *
 * NEGA TANGA XP UCHUN: raqamning yonidagi tanga "sovrin" hissini beradi —
 * bola uchun "+145 XP" mavhum son, tanga esa yig'iladigan narsa.
 *
 * Bezak — `aria-hidden`. Ma'no doim yonidagi matnda bo'ladi.
 */
export function Emblem({ kind, size = 'md', className }: EmblemProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={cn('select-none', SIZES[size], className)}
    >
      <defs>
        <linearGradient id={`em-gold-${kind}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde68a" />
          <stop offset="55%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id={`em-brand-${kind}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
      {SHAPES[kind](kind)}
    </svg>
  )
}

/** Har belgining chizmasi. `id` gradient havolasi uchun kerak */
const SHAPES: Record<EmblemKind, (id: string) => React.ReactNode> = {
  // Tanga: qalin gardish + ichki disk + "XP" + yaltiroq nuqta
  coin: (id) => (
    <>
      <circle cx="32" cy="32" r="26" fill={`url(#em-gold-${id})`} />
      <circle cx="32" cy="32" r="20" fill="#fbbf24" />
      <text
        x="32"
        y="39"
        textAnchor="middle"
        fontSize="17"
        fontWeight="800"
        fill="#92400e"
        fontFamily="Nunito, system-ui, sans-serif"
      >
        XP
      </text>
      <ellipse cx="23" cy="19" rx="6" ry="3.5" fill="#fffbeb" opacity="0.75" />
    </>
  ),
  // Kubok
  trophy: (id) => (
    <>
      <path d="M18 12h28v14a14 14 0 0 1-28 0z" fill={`url(#em-gold-${id})`} />
      <path d="M18 15h-7v5a9 9 0 0 0 9 9zM46 15h7v5a9 9 0 0 1-9 9z" fill="#d97706" />
      <rect x="28" y="39" width="8" height="9" fill="#b45309" />
      <rect x="20" y="47" width="24" height="6" rx="3" fill={`url(#em-gold-${id})`} />
      <ellipse cx="26" cy="19" rx="4" ry="2.5" fill="#fffbeb" opacity="0.6" />
    </>
  ),
  // Nishon (maqsad)
  target: (id) => (
    <>
      <circle cx="32" cy="32" r="26" fill={`url(#em-brand-${id})`} />
      <circle cx="32" cy="32" r="17" fill="#ffffff" />
      <circle cx="32" cy="32" r="10" fill={`url(#em-brand-${id})`} />
      <circle cx="32" cy="32" r="4" fill="#ffffff" />
    </>
  ),
  // Uchqun — "yangi boshlanish"
  spark: (id) => (
    <>
      <path
        d="M32 5l6.5 17.5L56 29l-17.5 6.5L32 53l-6.5-17.5L8 29l17.5-6.5z"
        fill={`url(#em-brand-${id})`}
      />
      <circle cx="32" cy="29" r="5" fill="#ffffff" opacity="0.85" />
    </>
  ),
  // Raketa — "boshladik"
  rocket: (id) => (
    <>
      <path d="M32 4c9 8 13 18 13 28l-13 8-13-8c0-10 4-20 13-28z" fill={`url(#em-brand-${id})`} />
      <circle cx="32" cy="24" r="6" fill="#ffffff" />
      <path d="M19 34l-7 9 11-3zM45 34l7 9-11-3z" fill="#059669" />
      <path d="M27 44h10l-5 14z" fill={`url(#em-gold-${id})`} />
    </>
  ),
}

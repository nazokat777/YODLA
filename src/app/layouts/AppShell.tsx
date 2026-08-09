import { NavLink, Outlet } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { cn } from '@/lib/cn'

/** Pastki navigatsiya elementlari */
const NAV_ITEMS = [
  { to: PATHS.home, label: 'Bosh sahifa', icon: '🏠', end: true },
  { to: PATHS.review, label: 'Takrorlash', icon: '🔁', end: false },
  { to: PATHS.league, label: 'Liga', icon: '🏆', end: false },
  { to: PATHS.stats, label: 'Statistika', icon: '📊', end: false },
  { to: PATHS.profile, label: 'Profil', icon: '👤', end: false },
]

/**
 * Asosiy ekranlar uchun qobiq (layout):
 * kontent + pastki navigatsiya paneli.
 *
 * Mobil-birinchi: kontent maksimal 480px kenglikda markazlashtiriladi,
 * katta ekranlarda ham telefon ko'rinishini saqlaydi.
 */
export function AppShell() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-[480px] flex-col bg-slate-50">
      {/* Kontent — pastki panel balandligi (4rem) qadar joy qoldiriladi */}
      <main className="flex-1 px-4 pt-4 pb-24">
        <Outlet />
      </main>

      <nav
        aria-label="Asosiy navigatsiya"
        className="fixed inset-x-0 bottom-0 mx-auto w-full max-w-[480px] border-t border-ink-300/60 bg-white/95 backdrop-blur"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul className="flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'tap-highlight-none flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors',
                    isActive ? 'text-brand-600' : 'text-ink-600 hover:text-ink-900',
                  )
                }
              >
                <span aria-hidden="true" className="text-xl">
                  {item.icon}
                </span>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

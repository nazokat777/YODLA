import { useEffect } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { PATHS } from '@/app/paths'
import { cn } from '@/lib/cn'
import { RouteTransition } from './RouteTransition'

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
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)

  /*
   * Til aksenti: `html[data-lang]` — CSS o'zgaruvchilari shundan rang
   * oladi (qahramon karta, faol navigatsiya). Ilova o'rganilayotgan
   * tilga qarab "kiyinadi" — bu til almashganini ko'rsatadigan eng
   * kuchli, lekin so'zsiz belgi.
   */
  useEffect(() => {
    const root = document.documentElement
    if (learningLanguage) root.dataset.lang = learningLanguage
    else delete root.dataset.lang
  }, [learningLanguage])

  return (
    <div className="mx-auto flex min-h-full w-full max-w-[480px] flex-col bg-slate-50">
      {/* Kontent — pastki panel balandligi (4rem) qadar joy qoldiriladi */}
      <main className="flex flex-1 flex-col px-4 pt-4 pb-24">
        <RouteTransition>
          <Outlet />
        </RouteTransition>
      </main>

      <nav
        aria-label="Asosiy navigatsiya"
        /*
          `z-20` ANIQ berilgan: o'quv yo'li ro'yxati chiziq ustida
          turishi uchun `z-10` oldi va navigatsiya undan YUQORIDA
          bo'lishi shart. Amalda hozir ham shunday, lekin bu qatlam
          tartibi tasodifga bog'liq bo'lib qolmasligi kerak —
          navigatsiya hech qachon kontent ostida qolmasligi kerak.
        */
        className="fixed inset-x-0 bottom-0 z-20 mx-auto w-full max-w-[480px] border-t border-ink-300/40 bg-white/85 backdrop-blur-xl"
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
                    'tap-highlight-none relative flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-colors',
                    // Faol bo'limda ikonka kattaroq va ustida chiziq turadi:
                    // rangdan tashqari ikkinchi belgi (WCAG 1.4.1)
                    // Faol bo'lim: ikonka ostida yumshoq "tabletka" va
                    // yuqoridagi chiziq — rangdan tashqari ikkinchi belgi
                    // (WCAG 1.4.1); ikonka biroz ko'tariladi
                    isActive
                      ? 'text-brand-700 before:absolute before:top-0 before:h-1 before:w-10 before:rounded-b-full before:bg-[var(--accent-from)] [&>span:first-of-type]:-translate-y-0.5 [&>span:first-of-type]:scale-110 [&>span:first-of-type]:bg-[var(--accent-from)]/15'
                      : 'text-ink-600 hover:text-ink-900',
                  )
                }
              >
                <span
                  aria-hidden="true"
                  className="flex h-8 w-12 items-center justify-center rounded-2xl text-xl transition-[transform,background-color] duration-200"
                >
                  {item.icon}
                </span>
                {/*
                  `truncate`: 320 px li ekranda beshta yorliq uchun 64 px
                  dan joy qolmaydi va "Bosh sahifa" qo'shnisiga tegib
                  ketardi. Ikonka baribir har bo'limni ajratib turadi.
                */}
                <span className="w-full truncate px-0.5 text-center">{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

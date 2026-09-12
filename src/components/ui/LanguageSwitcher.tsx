import { LANGUAGE_LIST } from '@/core/config/languages'
import { LanguageBadge } from './LanguageBadge'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/cn'
import { useLayoutEffect, useRef } from 'react'
import { flipFrom, flipState, withMotion } from '@/lib/motion'

/**
 * Ixcham til almashtirgich (segment nazorati).
 *
 * Har til uchun SRS progressi bazada ALOHIDA saqlanadi (kartalar `lang:word`
 * kaliti bilan). Shuning uchun tilni almashtirish progressni yo'qotmaydi:
 * boshqa tilga o'tib qaytsangiz, so'zlaringiz o'sha joyida turadi.
 *
 * Streak/XP esa ataylab GLOBAL (tildan qat'i nazar bitta odat) — shuning
 * uchun almashtirgich ularga tegmaydi.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)
  const setLearningLanguage = useSettingsStore((s) => s.setLearningLanguage)
  const rootRef = useRef<HTMLDivElement>(null)
  /** Bosishdan OLDINGI tabletka holati — Flip uchun */
  const pendingState = useRef<unknown>(null)

  /*
   * FLIP: faol tabletka eski tugmadan yangisiga SUZIB o'tadi (sakramaydi).
   * Bosishda eski holat olinadi, React DOM'ni yangilagach (`useLayoutEffect`
   * — chizishdan oldin) farq animatsiya qilinadi. Tabletka `absolute`
   * emas — u shunchaki faol tugmaning foni, Flip ikkala tugmani ham
   * o'lchab, ko'chishni "chizadi".
   */
  const handlePick = (code: typeof learningLanguage) => {
    if (!code || code === learningLanguage) return
    pendingState.current = flipState(
      rootRef.current?.querySelectorAll('[data-lang-pill]') ?? [],
    )
    setLearningLanguage(code)
  }

  useLayoutEffect(() => {
    const state = pendingState.current
    pendingState.current = null
    if (!state) return
    void withMotion(rootRef.current, () => flipFrom(state), ['flip'])
  }, [learningLanguage])

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label="O'rganilayotgan tilni tanlash"
      className={cn(
        'flex gap-1 rounded-2xl border-2 border-ink-300 bg-white p-1',
        className,
      )}
    >
      {LANGUAGE_LIST.map((lang) => {
        const isActive = learningLanguage === lang.code
        // "Ingliz tili" → "Ingliz": chip tor joyga sig'ishi uchun qisqa nom;
        // to'liq nom aria-label'da qoladi.
        const shortName = lang.name.split(' ')[0]

        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => handlePick(lang.code)}
            aria-pressed={isActive}
            aria-label={lang.name}
            className={cn(
              'tap-highlight-none relative flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-sm font-bold transition-colors',
              isActive ? 'text-white' : 'text-ink-600 hover:bg-brand-50',
            )}
          >
            {/* Tabletka — faol tugmaning foni; Flip aynan shuni ko'chiradi */}
            {isActive && (
              <span
                data-lang-pill
                // Eski va yangi tabletka — bitta "shaxs": Flip shu id bilan
                // ularni bog'laydi va ko'chishni chizadi
                data-flip-id="lang-pill"
                aria-hidden="true"
                className="absolute inset-0 -z-10 rounded-xl bg-[var(--accent-to)]"
              />
            )}
            <LanguageBadge language={lang} size="sm" active={isActive} />
            <span>{shortName}</span>
          </button>
        )
      })}
    </div>
  )
}

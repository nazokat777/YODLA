import { LANGUAGE_LIST } from '@/core/config/languages'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/cn'

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

  return (
    <div
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
            onClick={() => setLearningLanguage(lang.code)}
            aria-pressed={isActive}
            aria-label={lang.name}
            className={cn(
              'tap-highlight-none flex flex-1 items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-sm font-bold transition-colors',
              isActive ? 'bg-brand-500 text-white' : 'text-ink-600 hover:bg-brand-50',
            )}
          >
            <span className="text-lg" aria-hidden="true">
              {lang.flag}
            </span>
            <span>{shortName}</span>
          </button>
        )
      })}
    </div>
  )
}

import { Button } from '@/components/ui/Button'
import { LanguageBadge } from '@/components/ui/LanguageBadge'
import { Mascot } from '@/components/ui/Mascot'
import { LANGUAGE_LIST } from '@/core/config/languages'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/cn'

/** Onboarding, 1-qadam: o'rganiladigan tilni tanlash */
export function LanguageStep({ onNext }: { onNext: () => void }) {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)
  const setLearningLanguage = useSettingsStore((s) => s.setLearningLanguage)

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex flex-col items-center text-center">
        <Mascot mood="idle" size="lg" className="mb-3" />
        <h1 className="text-2xl font-extrabold">Qaysi tilni o'rganamiz?</h1>
        <p className="mt-2 text-sm text-ink-600">
          Kuniga 5 daqiqa — va so'zlar o'zi esda qoladi.
        </p>
        <p className="mt-1 text-xs text-ink-600">
          Bittadan boshlang — keyin Profil orqali boshqa til ham qo'shsangiz bo'ladi.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {LANGUAGE_LIST.map((lang) => {
          const isSelected = learningLanguage === lang.code
          return (
            <li key={lang.code}>
              <button
                type="button"
                onClick={() => setLearningLanguage(lang.code)}
                aria-pressed={isSelected}
                className={cn(
                  'tap-highlight-none flex w-full items-center gap-4 rounded-2xl border-2 bg-white p-4 text-start transition-colors',
                  isSelected
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-ink-300 hover:border-ink-600/40',
                )}
              >
                <LanguageBadge language={lang} size="lg" />
                <span className="flex flex-col">
                  <span className="font-bold">{lang.name}</span>
                  <span className="text-sm text-ink-600" dir={lang.dir} lang={lang.code}>
                    {lang.nativeName}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-auto pt-8">
        <Button block size="lg" disabled={!learningLanguage} onClick={onNext}>
          Davom etish
        </Button>
      </div>
    </div>
  )
}

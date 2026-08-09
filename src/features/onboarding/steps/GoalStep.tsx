import { Button } from '@/components/ui/Button'
import { Mascot } from '@/components/ui/Mascot'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/cn'

/** Kunlik maqsad variantlari — so'z/kun */
const GOALS = [
  { words: 10, title: 'Yengil', hint: '~3 daqiqa' },
  { words: 20, title: 'Oddiy', hint: '~5 daqiqa' },
  { words: 30, title: 'Jiddiy', hint: '~8 daqiqa' },
] as const

/**
 * Onboarding, 3-qadam: kunlik maqsad.
 *
 * Maqsadni foydalanuvchi O'ZI tanlaydi — o'zi qo'ygan maqsadga sodiqlik
 * tashqaridan berilganiga qaraganda yuqori bo'ladi.
 */
export function GoalStep({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const dailyGoalWords = useSettingsStore((s) => s.dailyGoalWords)
  const setDailyGoalWords = useSettingsStore((s) => s.setDailyGoalWords)

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex flex-col items-center text-center">
        <Mascot mood="happy" size="md" className="mb-3" />
        <h1 className="text-2xl font-extrabold">Kunlik maqsad</h1>
        <p className="mt-2 text-sm text-ink-600">
          Keyin Profil orqali o'zgartirsangiz bo'ladi.
        </p>
      </div>

      <ul className="flex flex-col gap-3">
        {GOALS.map((goal) => {
          const isSelected = dailyGoalWords === goal.words
          return (
            <li key={goal.words}>
              <button
                type="button"
                onClick={() => setDailyGoalWords(goal.words)}
                aria-pressed={isSelected}
                className={cn(
                  'tap-highlight-none flex w-full items-center justify-between rounded-2xl border-2 bg-white p-4 text-start transition-colors',
                  isSelected
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-ink-300 hover:border-ink-600/40',
                )}
              >
                <span className="flex flex-col">
                  <span className="font-bold">{goal.title}</span>
                  <span className="text-sm text-ink-600">{goal.hint}</span>
                </span>
                <span className="text-lg font-extrabold text-brand-700">{goal.words} so'z</span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="mt-auto flex flex-col gap-2 pt-8">
        <Button block size="lg" onClick={onNext}>
          Davom etish
        </Button>
        <Button block variant="ghost" onClick={onBack}>
          Orqaga
        </Button>
      </div>
    </div>
  )
}

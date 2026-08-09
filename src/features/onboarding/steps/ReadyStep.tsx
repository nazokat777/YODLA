import { Button } from '@/components/ui/Button'
import { Mascot } from '@/components/ui/Mascot'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * Onboarding, 4-qadam: yakun.
 *
 * Asosiy tugma to'g'ridan-to'g'ri DARSGA olib boradi (TZ 6.1): bosh
 * ekranga tushgan yangi foydalanuvchi nima qilishni bilmay qolishi mumkin.
 */
export function ReadyStep({ onFinish }: { onFinish: (destination: 'lesson' | 'home') => void }) {
  const startingLevel = useSettingsStore((s) => s.startingLevel)
  const dailyGoalWords = useSettingsStore((s) => s.dailyGoalWords)

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-6 flex flex-col items-center text-center">
        <Mascot mood="celebrating" size="lg" className="mb-3" />
        <h1 className="text-2xl font-extrabold">Tayyor!</h1>
        <p className="mt-2 text-sm text-ink-600">
          Boshlang'ich daraja: <strong>{startingLevel}</strong> · Kuniga{' '}
          <strong>{dailyGoalWords} so'z</strong>
        </p>
      </div>

      <div className="mt-auto flex flex-col gap-2 pt-8">
        <Button block size="lg" onClick={() => onFinish('lesson')}>
          Birinchi darsni boshlash
        </Button>
        <Button block variant="ghost" onClick={() => onFinish('home')}>
          Keyinroq
        </Button>
      </div>
    </div>
  )
}

import { Button } from '@/components/ui/Button'
import { Emblem } from '@/components/ui/Emblem'
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
      {/*
        `justify-center`: bu qadamda kontent kam va uni yuqorida qoldirsak
        ekranning yarmi bo'sh qolardi. Markazlashtirilgan sarlavha +
        pastdagi tugmalar to'liq, "tugallangan" ekran hosil qiladi.
      */}
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <Emblem kind="rocket" size="lg" className="mb-3" />
        <h1 className="text-2xl font-extrabold">Tayyor!</h1>
        <p className="mt-2 text-sm text-ink-600">
          Boshlang'ich daraja: <strong>{startingLevel}</strong> · Kuniga{' '}
          <strong>{dailyGoalWords} so'z</strong>
        </p>

        {/* Nima bo'lishini oldindan aytish: birinchi dars qo'rqinchli emas */}
        <p className="mt-4 max-w-xs text-sm text-ink-600">
          Birinchi darsda 4 ta yangi so'z bo'ladi. Har so'z bir necha xil
          mashqda takrorlanadi — shuning uchun u esda qoladi.
        </p>
      </div>

      <div className="flex flex-col gap-2 pt-8">
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

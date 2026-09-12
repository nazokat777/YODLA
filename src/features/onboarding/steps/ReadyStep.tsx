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

        {/*
          Yo'ldosh birinchi daqiqadan: tuxum "ichida kimdir bor" — birinchi
          dars uni uyg'otadi. G'amxo'rlik halqasi darsdan OLDIN boshlanadi.
        */}
        <p
          data-testid="onboarding-companion"
          className="mt-3 flex items-center gap-2 rounded-full bg-flame-500/15 px-3 py-1.5 text-sm font-bold text-flame-700"
        >
          <span aria-hidden="true" className="flicker text-xl">
            🥚
          </span>
          Yo‘ldoshing tuxumda — birinchi dars uni uyg‘otadi
        </p>
        <p className="mt-2 text-sm text-ink-600">
          Boshlang'ich daraja: <strong>{startingLevel}</strong> · Kuniga{' '}
          <strong>{dailyGoalWords} so'z</strong>
        </p>

        {/* Nima bo'lishini oldindan aytish: birinchi dars qo'rqinchli emas */}
        <p className="mt-4 max-w-xs text-sm text-ink-600">
          Birinchi darsda 4 ta yangi so'z bo'ladi — taxminan 2 daqiqa. Har so'z
          bir necha xil mashqda takrorlanadi — shuning uchun u esda qoladi.
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

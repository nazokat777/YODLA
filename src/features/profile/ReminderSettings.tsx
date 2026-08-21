import { useState } from 'react'
import { Panel } from '@/components/ui/Panel'
import { disablePush, enablePush, isPushSupported } from '@/lib/push'
import { isCloudEnabled } from '@/lib/supabase'
import { useSettingsStore } from '@/stores/useSettingsStore'

/** Tanlash mumkin bo'lgan soatlar — tunda eslatma bermaymiz */
const HOURS = [7, 8, 9, 12, 15, 18, 19, 20, 21]

/**
 * Kunlik eslatma sozlamasi.
 *
 * Ruxsat FOYDALANUVCHI BOSGANDA so'raladi: brauzer avtomatik so'rovni
 * bloklaydi, ustiga so'ralmagan ruxsat oynasi bezor qiladi.
 */
export function ReminderSettings() {
  const reminderHour = useSettingsStore((s) => s.reminderHour)
  const setReminderHour = useSettingsStore((s) => s.setReminderHour)
  const pushEndpoint = useSettingsStore((s) => s.pushEndpoint)
  const setPushEndpoint = useSettingsStore((s) => s.setPushEndpoint)

  const [isBusy, setIsBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function toggle(next: boolean) {
    setIsBusy(true)
    setMessage(null)

    if (!next) {
      await disablePush()
      setPushEndpoint(null)
      setIsBusy(false)
      return
    }

    const result = await enablePush(reminderHour)
    setIsBusy(false)

    switch (result.status) {
      case 'enabled':
        setPushEndpoint(result.endpoint)
        break
      case 'denied':
        setMessage(
          'Bildirishnomaga ruxsat berilmadi. Brauzer sozlamalaridan ruxsat bering.',
        )
        break
      default:
        setMessage('Hozir yoqib bo‘lmadi — keyinroq urinib ko‘ring.')
    }
  }

  /** Yoqilgan holatda soat o'zgarsa, obuna qayta yoziladi */
  async function changeHour(hour: number) {
    setReminderHour(hour)
    if (!pushEndpoint) return

    const result = await enablePush(hour)
    if (result.status === 'enabled') setPushEndpoint(result.endpoint)
  }

  // Shart hook'lardan KEYIN tekshiriladi: React hook'lari shartli
  // chaqirilmasligi kerak
  if (!isCloudEnabled() || !isPushSupported()) {
    return (
      <Panel className="text-sm text-ink-600">
        <p className="font-bold text-ink-900">Kunlik eslatma</p>
        <p className="mt-1">
          Bu brauzer eslatmalarni qo‘llab-quvvatlamaydi. iPhone’da ilovani
          avval bosh ekranga qo‘shing.
        </p>
      </Panel>
    )
  }

  return (
    <Panel className="flex flex-col gap-3">
      <label className="flex cursor-pointer items-center justify-between gap-4">
        <span>
          <span className="block font-bold">Kunlik eslatma</span>
          <span className="text-sm text-ink-600">
            Mashq qilmagan kuningizda bildirishnoma keladi
          </span>
        </span>
        <input
          type="checkbox"
          role="switch"
          aria-label="Kunlik eslatma"
          checked={pushEndpoint !== null}
          disabled={isBusy}
          onChange={(event) => void toggle(event.target.checked)}
          className="h-6 w-6 accent-brand-500"
        />
      </label>

      <div className="flex items-center justify-between gap-4">
        <label htmlFor="reminder-hour" className="text-sm font-semibold text-ink-600">
          Eslatma vaqti
        </label>
        <select
          id="reminder-hour"
          value={reminderHour}
          onChange={(event) => void changeHour(Number(event.target.value))}
          className="h-11 rounded-xl border-2 border-ink-300 bg-white px-3 font-semibold"
        >
          {HOURS.map((hour) => (
            <option key={hour} value={hour}>
              {String(hour).padStart(2, '0')}:00
            </option>
          ))}
        </select>
      </div>

      {message && <p className="text-sm text-wrong-600">{message}</p>}

      <p className="text-xs text-ink-600">
        iPhone’da eslatma faqat ilova bosh ekranga qo‘shilgan bo‘lsa ishlaydi.
      </p>
    </Panel>
  )
}

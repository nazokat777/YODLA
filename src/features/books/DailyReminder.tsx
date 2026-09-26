import { useState } from 'react'
import { Panel } from '@/components/ui/Panel'
import type { DailyTask } from '@/core/books'
import { buildDailyReminderIcs, downloadIcs } from '@/lib/calendarReminder'
import { useSettingsStore } from '@/stores/useSettingsStore'

/** Tanlash uchun soatlar */
const HOURS = [7, 8, 12, 16, 18, 19, 20, 21]

/**
 * HAR KUNGI ESLATMA — telefon kalendariga.
 *
 * Bildirishnoma matnida bugungi ish ANIQ yoziladi ("kamida 5 ta so'z +
 * takrorlash"): mavhum "dars qiling" emas, bajariladigan vazifa. Soat
 * sozlamalardagi eslatma soati bilan bir xil saqlanadi.
 */
export function DailyReminder({ task }: { task: DailyTask | null }) {
  const reminderHour = useSettingsStore((s) => s.reminderHour)
  const setReminderHour = useSettingsStore((s) => s.setReminderHour)
  const [note, setNote] = useState<string | null>(null)

  const add = () => {
    const words = task?.newWords ?? 5
    const ics = buildDailyReminderIcs({
      hour: reminderHour,
      title: '🧠 YODLA — bugungi so‘zlar',
      description: `Kamida ${task?.minWords ?? 5} ta, rejada ${words} ta yangi so‘z + takrorlash. 15 daqiqa yetadi — zanjirni uzmang!`,
      url: `${window.location.origin}/books`,
    })
    setNote(
      downloadIcs(ics)
        ? 'Fayl yuklandi — uni oching va «Kalendarga qo‘shish»ni bosing.'
        : 'Faylni yaratib bo‘lmadi — brauzer ruxsat bermadi.',
    )
  }

  return (
    <Panel padding="sm" data-testid="daily-reminder">
      <h2 className="font-bold">🔔 Har kungi eslatma</h2>
      <p className="mt-0.5 text-xs text-ink-600">
        Telefon kalendariga qo‘shiladi — ilova yopiq, internet yo‘q bo‘lsa ham har kuni shu
        soatda eslatadi.
      </p>
      <div className="mt-2 flex items-center gap-2">
        <label htmlFor="reminder-hour-books" className="text-sm font-semibold text-ink-600">
          Soat
        </label>
        <select
          id="reminder-hour-books"
          value={reminderHour}
          onChange={(event) => setReminderHour(Number(event.target.value))}
          className="h-10 rounded-xl border-2 border-ink-300 bg-white px-2 text-sm font-bold"
        >
          {HOURS.map((hour) => (
            <option key={hour} value={hour}>
              {String(hour).padStart(2, '0')}:00
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={add}
          data-testid="reminder-add"
          className="tap-highlight-none ms-auto rounded-2xl bg-brand-700 px-3 py-2 text-sm font-extrabold text-white"
        >
          Kalendarga qo‘shish
        </button>
      </div>
      {note && (
        <p role="status" className="mt-2 text-xs font-semibold text-brand-700">
          {note}
        </p>
      )}
    </Panel>
  )
}

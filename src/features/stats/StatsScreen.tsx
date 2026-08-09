import { useLiveQuery } from 'dexie-react-hooks'
import { Panel } from '@/components/ui/Panel'
import { getDailyStatsSince } from '@/core/db'
import { buildWeeklySeries, type DayPoint } from '@/core/stats'
import { addDays, startOfDay } from '@/lib/date'
import { useNowTick } from '@/hooks/useNowTick'
import { useProgress } from '@/hooks/useProgress'

/** Hafta kunlari — diagramma ostidagi belgilar */
const WEEKDAYS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh']

/**
 * Statistika ekrani: haftalik diagramma va asosiy ko'rsatkichlar.
 *
 * Diagramma SVG bilan qo'lda chiziladi — 7 ta ustun uchun grafik
 * kutubxona qo'shish ortiqcha bo'lardi.
 */
export function StatsScreen() {
  const now = useNowTick()
  const progress = useProgress()

  const weekStats = useLiveQuery(
    () => getDailyStatsSince(addDays(startOfDay(now), -6)),
    [now],
  )

  const series = buildWeeklySeries(weekStats ?? [], now)
  const weekXp = series.reduce((sum, point) => sum + point.xp, 0)
  const weekWords = series.reduce((sum, point) => sum + point.words, 0)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Statistika</h1>

      <div className="grid grid-cols-3 gap-2">
        <Tile label="Streak" value={progress?.streak.current ?? 0} accent="text-flame-600" />
        <Tile label="Haftalik XP" value={weekXp} accent="text-brand-600" />
        <Tile label="Jami XP" value={progress?.profile.totalXp ?? 0} accent="text-ink-900" />
      </div>

      <Panel>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-bold">So'nggi 7 kun</h2>
          <span className="text-sm text-ink-600">{weekWords} so'z</span>
        </div>
        <WeeklyChart series={series} />
      </Panel>

      <p className="text-xs text-ink-600">
        Nishonlar Profil bo'limida — bu yerda takrorlanmaydi.
      </p>
    </div>
  )
}

/** Ustunli diagramma — balandlik eng katta kunga nisbatan */
function WeeklyChart({ series }: { series: DayPoint[] }) {
  const max = Math.max(...series.map((point) => point.xp), 1)

  return (
    <div className="flex h-32 items-end justify-between gap-2">
      {series.map((point) => {
        const height = Math.round((point.xp / max) * 100)
        const weekday = WEEKDAYS[new Date(point.day).getDay()]

        return (
          <div key={point.day} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-xs font-semibold text-ink-600">{point.xp || ''}</span>
            <div
              // Bo'sh kun ham ko'rinadi (ingichka chiziq): "kun o'tkazdim"
              // degan haqiqat yashirilmasligi kerak
              style={{ height: `${Math.max(height, 3)}%` }}
              className={point.xp > 0 ? 'w-full rounded-t-lg bg-brand-500' : 'w-full rounded-t-lg bg-ink-300'}
              role="presentation"
            />
            <span className="text-xs text-ink-600">{weekday}</span>
          </div>
        )
      })}
    </div>
  )
}

function Tile({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <Panel className="p-3 text-center">
      <p className={`text-2xl font-extrabold ${accent}`}>{value}</p>
      <p className="mt-0.5 text-xs text-ink-600">{label}</p>
    </Panel>
  )
}

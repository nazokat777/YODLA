import { useLiveQuery } from 'dexie-react-hooks'
import { Panel } from '@/components/ui/Panel'
import { getDailyStatsSince } from '@/core/db'
import { addDays, startOfDay } from '@/lib/date'
import { cn } from '@/lib/cn'

/** Necha hafta ko'rsatiladi */
const WEEKS = 8

/** XP → to'rt darajali "issiqlik" */
function level(xp: number): 0 | 1 | 2 | 3 {
  if (xp <= 0) return 0
  if (xp < 50) return 1
  if (xp < 150) return 2
  return 3
}

const LEVEL_CLASS = {
  0: 'bg-ink-300/30',
  1: 'bg-brand-300',
  2: 'bg-brand-500',
  3: 'bg-brand-700',
} as const

/**
 * FAOLLIK XARITASI — oxirgi 8 hafta, har kun bitta katak.
 *
 * Endowed progress uzoq masofada: streak bugunni, sayohat haftani,
 * bu esa ikki oyni ko'rsatadi. Bo'sh kunlar ham ko'rinadi — halol
 * tasvir; to'lgan kataklar esa "men shuncha yo'l bosdim" hissi.
 * Dushanbadan boshlanadi (haftalik sayohat bilan bir xil).
 */
export function ActivityGrid() {
  const now = Date.now()
  const today = startOfDay(now)
  // Oxirgi to'liq 8 hafta: bugungi haftaning dushanbasidan 7 hafta orqaga
  const sinceMonday = (new Date(today).getDay() + 6) % 7
  const start = addDays(today, -sinceMonday - 7 * (WEEKS - 1))

  const stats = useLiveQuery(() => getDailyStatsSince(start), [start])
  if (!stats) return null

  const byDay = new Map(stats.map((stat) => [stat.day, stat.xp]))
  const days = Array.from({ length: WEEKS * 7 }, (_, index) => addDays(start, index))
  const activeDays = days.filter((day) => (byDay.get(day) ?? 0) > 0).length

  return (
    <Panel data-testid="activity-grid">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-bold">Oxirgi 8 hafta</h2>
        <span className="text-sm text-ink-600">{activeDays} faol kun</span>
      </div>
      {/* 7 qator (kun) × 8 ustun (hafta) — ustunlar hafta, yuqoridan dushanba */}
      <div
        role="img"
        aria-label={`Oxirgi 8 haftada ${activeDays} faol kun`}
        className="grid grid-flow-col gap-1"
        style={{ gridTemplateRows: 'repeat(7, minmax(0, 1fr))' }}
      >
        {days.map((day) => {
          const xp = byDay.get(day) ?? 0
          const future = day > today
          return (
            <span
              key={day}
              data-testid="activity-cell"
              data-level={future ? 'future' : level(xp)}
              title={`${new Date(day).toLocaleDateString('uz-UZ')}: ${xp} XP`}
              className={cn(
                'aspect-square w-full rounded-[3px]',
                future ? 'bg-transparent' : LEVEL_CLASS[level(xp)],
                day === today && 'ring-2 ring-flame-500',
              )}
            />
          )
        })}
      </div>
    </Panel>
  )
}

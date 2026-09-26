import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { Panel } from '@/components/ui/Panel'
import type { DailyTask } from '@/core/books'
import { cn } from '@/lib/cn'
import { FocusTimer } from './FocusTimer'
import { DailyReminder } from './DailyReminder'

interface TodayPanelProps {
  /** Rejadagi bugungi vazifa (reja yo'q bo'lsa `null`) */
  task: DailyTask | null
  /** Bugun ko'rilgan noyob so'zlar */
  doneToday: number
  /** Muddati kelgan takrorlashlar */
  dueCount: number
  /** Bugun yozilgan ilgaklar (assotsiatsiyalar) */
  hooksToday: number
  /** Bugungi kun kaliti — qo'lda belgilanadigan bandlar shu bilan saqlanadi */
  dayKey: number
  onOpenMap: () => void
}

/** Qo'lda belgilanadigan band — ilova o'zi tekshira olmaydi */
const MANUAL_KEY = 'yodla:mnemonika-manual'

/** Qo'lda belgilangan bandlar (kun bo'yicha) — faqat shu qurilmada */
function readManual(dayKey: number): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(MANUAL_KEY)
    const parsed = raw ? (JSON.parse(raw) as { day: number; items: Record<string, boolean> }) : null
    return parsed?.day === dayKey ? parsed.items : {}
  } catch {
    return {}
  }
}

function writeManual(dayKey: number, items: Record<string, boolean>): void {
  try {
    localStorage.setItem(MANUAL_KEY, JSON.stringify({ day: dayKey, items }))
  } catch {
    // Saqlab bo'lmasa ham belgi shu seansda ko'rinadi
  }
}

interface CheckItem {
  id: string
  icon: string
  title: string
  hint: string
  done: boolean
  /** Ilova o'zi tekshiradi (bosib bo'lmaydi) */
  auto: boolean
  to?: string
}

/**
 * BUGUN — neyrobiologik chek-ro'yxat.
 *
 * Har band 7 qadamli algoritmning bir qadami. Ilova tekshira oladigan
 * bandlar (so'zlar, takrorlash, ilgak) AVTOMATIK belgilanadi — bola
 * "bajardim" deb aldamaydi va o'zini aldamaydi. Faqat ilova ko'ra
 * olmaydigan ish (ovoz chiqarib gap tuzish) qo'lda belgilanadi.
 *
 * Birinchi band — MINIMAL PLANKA: eng yomon kunda ham bajariladigan
 * kichik ulush. U bajarilsa zanjir uzilmaydi.
 */
export function TodayPanel({ task, doneToday, dueCount, hooksToday, dayKey, onOpenMap }: TodayPanelProps) {
  const [manual, setManual] = useState<Record<string, boolean>>(() => readManual(dayKey))
  useEffect(() => setManual(readManual(dayKey)), [dayKey])

  const toggle = (id: string) => {
    const next = { ...manual, [id]: !manual[id] }
    setManual(next)
    writeManual(dayKey, next)
  }

  const minWords = task?.minWords ?? 5
  const items: CheckItem[] = [
    {
      id: 'min',
      icon: '🧱',
      title: `Minimal planka — ${minWords} ta yangi so‘z`,
      hint: 'Eng yomon kuningizda ham shuncha. Bajarilsa — zanjir uzilmaydi.',
      done: doneToday >= minWords,
      auto: true,
      to: PATHS.lesson,
    },
    ...(task && task.newWords > minWords
      ? [
          {
            id: 'plan',
            icon: '📌',
            title: `Rejadagi ulush — ${task.newWords} ta so‘z`,
            hint: `${task.doneWords}/${task.newWords} bajarildi`,
            done: task.done,
            auto: true,
            to: PATHS.lesson,
          },
        ]
      : []),
    {
      id: 'review',
      icon: '📅',
      title: 'Takrorlash — unutish arafasidagilar',
      hint: dueCount > 0 ? `${dueCount} ta so‘z kutyapti` : 'Hammasi takrorlangan',
      done: dueCount === 0,
      auto: true,
      to: PATHS.review,
    },
    {
      id: 'hook',
      icon: '🪝',
      title: 'Bitta qiyin so‘zga ilgak yozing',
      hint: 'Tovushga o‘xshash o‘zbekcha so‘z + bitta kulgili sahna',
      done: hooksToday > 0,
      auto: true,
      to: PATHS.mnemonics,
    },
    {
      id: 'sentence',
      icon: '💬',
      title: 'Bugungi 3 ta so‘z bilan gap tuzing',
      hint: 'Ovoz chiqarib ayting — so‘z ishlatilgandagina birikadi',
      done: manual.sentence === true,
      auto: false,
    },
    {
      id: 'reverse',
      icon: '🔁',
      title: 'O‘zbekchasidan ayting — faol eslash',
      hint: 'Tarjimani ko‘rib, so‘zni o‘zingiz yozasiz va gap tuzasiz — gapirish yo‘nalishi',
      done: manual.reverse === true,
      auto: false,
      to: PATHS.activeReview,
    },
  ]

  const doneCount = items.filter((item) => item.done).length

  return (
    <div className="flex flex-col gap-3">
      <Panel padding="sm" tone={doneCount === items.length ? 'brand' : 'default'} data-testid="today-summary">
        <div className="flex items-baseline justify-between">
          <h2 className="font-extrabold">Bugungi chek-ro‘yxat</h2>
          <span className="text-sm font-bold text-ink-600">
            {doneCount}/{items.length}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-ink-600">
          {doneCount === items.length
            ? '🎉 Bugun hammasi bajarildi — miya kechasi uyquda so‘zlarni mustahkamlaydi.'
            : items[0]!.done
              ? 'Planka bajarildi, zanjir saqlandi. Qolgani — bonus.'
              : 'Kichikdan boshlang: avval minimal planka.'}
        </p>
      </Panel>

      {!task && (
        <Panel padding="sm" className="text-sm">
          Reja hali yo‘q.{' '}
          <button type="button" onClick={onOpenMap} className="font-bold text-brand-700 underline">
            Xaritada kitob va muddatni tanlang
          </button>{' '}
          — kunlik ulush o‘zi hisoblanadi.
        </Panel>
      )}

      <ul className="flex flex-col gap-2" data-testid="today-checklist">
        {items.map((item) => (
          <li key={item.id}>
            <Panel padding="sm" className={cn('flex items-center gap-3', item.done && 'opacity-80')}>
              {item.auto ? (
                <span
                  data-testid={`check-${item.id}`}
                  data-done={item.done}
                  aria-label={item.done ? 'bajarildi' : 'bajarilmagan'}
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-extrabold',
                    item.done ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-300',
                  )}
                >
                  {item.done ? '✓' : ''}
                </span>
              ) : (
                <button
                  type="button"
                  data-testid={`check-${item.id}`}
                  data-done={item.done}
                  aria-pressed={item.done}
                  aria-label={`${item.title} — belgilash`}
                  onClick={() => toggle(item.id)}
                  className={cn(
                    'tap-highlight-none flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-extrabold',
                    item.done ? 'border-brand-500 bg-brand-500 text-white' : 'border-ink-300 bg-white',
                  )}
                >
                  {item.done ? '✓' : ''}
                </button>
              )}
              <span className="flex min-w-0 flex-col">
                <span className={cn('text-sm font-bold', item.done && 'line-through decoration-2')}>
                  <span aria-hidden="true">{item.icon} </span>
                  {item.title}
                </span>
                <span className="text-xs text-ink-600">{item.hint}</span>
              </span>
              {item.to && !item.done && (
                <Link to={item.to} className="ms-auto shrink-0 text-sm font-bold text-brand-700">
                  →
                </Link>
              )}
            </Panel>
          </li>
        ))}
      </ul>

      <FocusTimer />

      <DailyReminder task={task} />
    </div>
  )
}

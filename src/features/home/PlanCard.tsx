import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { Panel } from '@/components/ui/Panel'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { db, getDailyStat, planKey } from '@/core/db'
import { buildBooks, dailyTask, planPace, planProgress } from '@/core/books'
import type { CardRecord } from '@/core/db'
import { useSettingsStore } from '@/stores/useSettingsStore'

interface PlanCardProps {
  /** Shu tildagi kartalar — bosh ekran ularni baribir o'qiydi */
  cards: CardRecord[] | undefined
}

/**
 * BOSH EKRANDAGI REJA — bugungi chek-ro'yxat.
 *
 * Reja tanlanmagan bo'lsa: taklif ("kitobni necha kunda tugatamiz?").
 * Tanlangan bo'lsa: bugungi ulush, bajarilgani, rejaga nisbatan holat
 * va tugash sanasi. Bola bosh ekranda "bugun nima qilishim kerak"
 * degan savolga bir qarashda javob oladi.
 */
export function PlanCard({ cards }: PlanCardProps) {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)

  const state = useLiveQuery(async () => {
    if (!learningLanguage) return null
    const [profile, daily] = await Promise.all([db.profile.get('me'), getDailyStat()])
    return {
      language: learningLanguage,
      plans: profile?.studyPlans ?? {},
      doneToday: daily.cardIds.length,
    }
  }, [learningLanguage])

  if (!cards || !learningLanguage || state?.language !== learningLanguage) return null

  const books = buildBooks(cards)
  // Rejasi bor kitoblardan BIRINCHISI — bir vaqtda bitta maqsad
  const active = books
    .map((book) => ({ book, record: state.plans[planKey(learningLanguage, book.id)] }))
    .find((entry) => entry.record !== undefined)

  if (!active?.record) {
    const biggest = books.reduce<{ words: number } | null>(
      (best, book) => (best === null || book.words > best.words ? book : best),
      null,
    )
    if (!biggest) return null

    return (
      <Link to={PATHS.books} data-home-card data-testid="plan-invite" className="block">
        <Panel interactive className="flex items-center gap-3">
          <span className="text-2xl" aria-hidden="true">
            🗺️
          </span>
          <span className="flex min-w-0 flex-col">
            <span className="font-bold">Mnemonika xaritasi</span>
            <span className="text-sm text-ink-600">
              Kitobni necha kunda tugatasiz? Reja tuzing — kunlik ulush o‘zi hisoblanadi.
            </span>
          </span>
          <span aria-hidden="true" className="ms-auto text-ink-600">
            ›
          </span>
        </Panel>
      </Link>
    )
  }

  const { book, record } = active
  const plan = {
    bookId: record.bookId,
    days: record.days,
    startedAt: record.startedAt,
    learnedAtStart: record.learnedAtStart,
  }
  const progress = planProgress(book, plan, Date.now())
  // Qolgan kunlarga bo'linadi: bugun orqada qolinsa, ulush o'zi oshadi
  const pace = planPace(book, Math.max(1, plan.days - (progress.dayNumber - 1)))
  const task = dailyTask(pace, progress, state.doneToday)

  return (
    <Panel data-home-card data-testid="plan-card" tone={task.done ? 'default' : 'brand'}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-bold">
          {progress.done ? '🎉 Kitob tugadi' : task.done ? '✅ Bugungi vazifa bajarildi' : '📌 Bugungi vazifa'}
        </h2>
        <Link to={PATHS.books} className="shrink-0 text-xs font-bold text-brand-700">
          Xarita ›
        </Link>
      </div>

      <p className="mt-0.5 text-sm text-ink-600">
        {book.title} · {progress.dayNumber}-kun / {plan.days}
      </p>

      {!progress.done && (
        <>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-sm font-bold">{task.newWords} ta yangi so‘z</span>
            <span className="text-xs font-bold text-ink-600">
              {task.doneWords}/{task.newWords}
            </span>
          </div>
          <div className="mt-1">
            <ProgressBar
              value={task.doneWords}
              max={Math.max(1, task.newWords)}
              label="Bugungi vazifa"
            />
          </div>
          <p className="mt-1.5 text-xs text-ink-600">
            {progress.behind > 0
              ? `${progress.behind} so‘z orqada — bugun biroz ko‘proq`
              : progress.ahead > 0
                ? `${progress.ahead} so‘z oldinda 🚀`
                : 'Rejada ketyapsiz'}
          </p>
        </>
      )}
    </Panel>
  )
}

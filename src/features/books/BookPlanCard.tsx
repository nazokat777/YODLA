import { Button } from '@/components/ui/Button'
import { LinkButton } from '@/components/ui/LinkButton'
import { Panel } from '@/components/ui/Panel'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { PATHS } from '@/app/paths'
import {
  dailyTask,
  planPace,
  planProgress,
  PLAN_PRESETS,
  type BookStats,
  type StudyPlan,
} from '@/core/books'
import { cn } from '@/lib/cn'
import { formatDayMonth } from '@/lib/format'

interface BookPlanCardProps {
  book: BookStats
  /** Belgilangan reja (yo'q bo'lsa `null`) */
  plan: StudyPlan | null
  /** Bugun ko'rilgan noyob so'zlar */
  doneToday: number
  /** Shu kitobning keyingi darsi (bo'lim id) — tugma shu yerga */
  nextUnitId?: string | null
  /** Muddat tanlash paneli ochiqmi */
  open: boolean
  onToggle: () => void
  onChoose: (days: number) => void
  onCancel: () => void
}

/** Sana: "12-noyabr" */
const formatDate = formatDayMonth

/**
 * Bitta kitob: raqamlari, rejasi va bugungi vazifasi.
 *
 * Reja yo'q bo'lsa — taklif ("necha kunda tugatamiz?"); bor bo'lsa —
 * bugungi chek-ro'yxat, rejaga nisbatan holat va tugash sanasi.
 */
export function BookPlanCard({
  book,
  plan,
  doneToday,
  nextUnitId = null,
  open,
  onToggle,
  onChoose,
  onCancel,
}: BookPlanCardProps) {
  const now = Date.now()
  const progress = plan ? planProgress(book, plan, now) : null
  const pace = plan ? planPace(book, Math.max(1, plan.days - ((progress?.dayNumber ?? 1) - 1))) : null
  const task = pace && progress ? dailyTask(pace, progress, doneToday) : null

  return (
    <Panel data-testid={`book-${book.id}`} tone={task && !task.done ? 'brand' : 'default'}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-extrabold">{book.title}</h2>
        <span className="shrink-0 text-xs font-bold text-ink-600">
          {book.learned}/{book.words} so‘z
        </span>
      </div>

      <div className="mt-2">
        <ProgressBar value={book.learned} max={book.words} label={`${book.title} progressi`} />
      </div>

      <p className="mt-2 text-xs text-ink-600">
        {book.lessons} dars · darsda ~{book.wordsPerLesson} so‘z · {book.sentences} jumla ·{' '}
        {book.mature} so‘z uzoq xotirada
      </p>

      {/* REJA BOR: bugungi vazifa va muddat */}
      {plan && progress && pace && task && (
        <div className="mt-3 flex flex-col gap-2" data-testid={`plan-${book.id}`}>
          {progress.done ? (
            <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm font-bold text-brand-700">
              🎉 Kitob tugadi! Endi takrorlash uni xotirada ushlab turadi.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 rounded-xl bg-white/70 px-3 py-2">
                <span className="text-sm font-bold">
                  {task.done ? '✅ Bugungi vazifa bajarildi' : `📌 Bugun: ${task.newWords} ta yangi so‘z`}
                </span>
                <span className="shrink-0 text-xs font-bold text-ink-600">
                  {task.doneWords}/{task.newWords}
                </span>
              </div>
              <ProgressBar value={task.doneWords} max={Math.max(1, task.newWords)} label="Bugungi vazifa" />
              <p className="text-xs text-ink-600">
                {progress.dayNumber}-kun · {plan.days} kunlik reja ·{' '}
                {progress.behind > 0
                  ? `${progress.behind} so‘z orqada`
                  : progress.ahead > 0
                    ? `${progress.ahead} so‘z oldinda 🚀`
                    : 'rejada'}{' '}
                · tugash: {formatDate(progress.finishAt)}
              </p>
              <LinkButton
                to={nextUnitId ? PATHS.lessonById(nextUnitId) : PATHS.lesson}
                block
                size="lg"
                data-testid={`plan-start-${book.id}`}
              >
                {task.done ? 'Yana bir dars' : `Bugungi darsni boshlash · ≈${pace.minutesPerDay} daq`}
              </LinkButton>
            </>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="self-start text-xs font-semibold text-ink-600 underline"
          >
            Rejani bekor qilish
          </button>
        </div>
      )}

      {/* REJA YO'Q: taklif */}
      {!plan && (
        <div className="mt-3">
          <Button block variant="secondary" onClick={onToggle} data-testid={`plan-open-${book.id}`}>
            {open ? 'Yopish' : '🗺️ Reja tuzish — necha kunda tugataman?'}
          </Button>

          {open && (
            <ul className="mt-2 flex flex-col gap-2">
              {PLAN_PRESETS.map((preset) => {
                const option = planPace(book, preset.days)
                return (
                  <li key={preset.days}>
                    <button
                      type="button"
                      data-testid={`preset-${book.id}-${preset.days}`}
                      onClick={() => onChoose(preset.days)}
                      className={cn(
                        'tap-highlight-none flex w-full items-center justify-between gap-2 rounded-2xl border-2 border-ink-300 bg-white px-3 py-2 text-start',
                        'transition-colors hover:border-brand-500',
                      )}
                    >
                      <span className="flex flex-col">
                        <span className="font-bold">{preset.label}</span>
                        <span className="text-xs text-ink-600">{preset.hint}</span>
                      </span>
                      <span className="shrink-0 text-end text-xs font-bold text-brand-700">
                        kuniga {option.wordsPerDay} so‘z
                        <span className="block font-semibold text-ink-600">
                          ≈{option.minutesPerDay} daq
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}
    </Panel>
  )
}

import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSearchParams } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { Panel } from '@/components/ui/Panel'
import {
  computeLanguageStats,
  db,
  getAllCards,
  getDailyStat,
  planKey,
  removeStudyPlan,
  saveStudyPlan,
} from '@/core/db'
import {
  buildBooks,
  nextUnitOfBook,
  dailyTask,
  planPace,
  planProgress,
  type StudyPlan,
} from '@/core/books'
import { startOfDay } from '@/lib/date'
import { buildUnits } from '@/core/path'
import { useTopicOrder } from '@/features/home/useTopicOrder'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/cn'
import { BookPlanCard } from './BookPlanCard'
import { MethodsPanel } from './MethodsPanel'
import { TodayPanel } from './TodayPanel'

type Tab = 'today' | 'map' | 'methods'

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'today', label: 'Bugun' },
  { id: 'map', label: 'Xarita' },
  { id: 'methods', label: 'Usullar' },
]

/**
 * MNEMONIKA — kitobni kunlarga bo'lib, xotira usullari bilan yodlash.
 *
 * Uch qism:
 *  - BUGUN — neyrobiologik chek-ro'yxat: minimal planka, rejadagi ulush,
 *    takrorlash, ilgak, gap tuzish, teskari eslash + diqqat taymeri;
 *  - XARITA — har kitobning aniq raqamlari (so'z, dars, jumla) va
 *    "necha kunda tugataman" rejasi;
 *  - USULLAR — yodlash algoritmi va har qadam ilovaning qayerida.
 *
 * NEGA: "Enterprise 1 — 3640 ta so'z" degan son qo'rqitadi va hech
 * narsa aytmaydi. Bu yerda u BAJARILADIGAN kunlik ishga aylanadi —
 * mnemonika darslaridagi birinchi qoida: "hajmni bil".
 */
export function BooksScreen() {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)
  const startingLevel = useSettingsStore((s) => s.startingLevel)
  // O'quv yo'li tartibi — kitobning KEYINGI darsini topish uchun
  const topicOrder = useTopicOrder(learningLanguage)
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: Tab = (TABS.find((t) => t.id === searchParams.get('tab'))?.id ?? 'today') as Tab
  const setTab = (next: Tab) => setSearchParams(next === 'today' ? {} : { tab: next }, { replace: true })
  const [openBookId, setOpenBookId] = useState<string | null>(null)

  const data = useLiveQuery(async () => {
    if (!learningLanguage) return null
    const now = Date.now()
    const [cards, daily, profile] = await Promise.all([
      getAllCards(learningLanguage),
      getDailyStat(now),
      db.profile.get('me'),
    ])
    const dayStart = startOfDay(now)

    return {
      language: learningLanguage,
      books: buildBooks(cards),
      cards,
      plans: profile?.studyPlans ?? {},
      /** Bugun ko'rilgan NOYOB so'zlar — kunlik vazifa shuni sanaydi */
      doneToday: daily.cardIds.length,
      dueCount: computeLanguageStats(cards, now).due,
      hooksToday: cards.filter((card) => (card.mnemonicAt ?? 0) >= dayStart).length,
      seenCount: cards.filter((card) => card.totalReviews > 0).length,
      dayKey: dayStart,
    }
  }, [learningLanguage])

  // Til almashganda eski tilning kitoblari bir lahza ham ko'rinmasin
  const fresh = data?.language === learningLanguage ? data : undefined

  const totals = useMemo(() => {
    const books = fresh?.books ?? []
    return {
      words: books.reduce((sum, book) => sum + book.words, 0),
      learned: books.reduce((sum, book) => sum + book.learned, 0),
      lessons: books.reduce((sum, book) => sum + book.lessons, 0),
      sentences: books.reduce((sum, book) => sum + book.sentences, 0),
    }
  }, [fresh])

  /** O'quv yo'li bo'limlari — reja tugmasi kitobning keyingi darsini ochadi */
  const units = useMemo(
    () =>
      fresh && topicOrder !== null
        ? buildUnits(fresh.cards, { minLevel: startingLevel, topicOrder })
        : [],
    [fresh, topicOrder, startingLevel],
  )

  /** Rejasi bor BIRINCHI kitobning bugungi vazifasi — "Bugun" uchun */
  const activeTask = useMemo(() => {
    if (!fresh) return null
    for (const book of fresh.books) {
      const record = fresh.plans[planKey(fresh.language, book.id)]
      if (!record) continue
      const plan: StudyPlan = { ...record }
      const progress = planProgress(book, plan, Date.now())
      const pace = planPace(book, Math.max(1, plan.days - (progress.dayNumber - 1)))
      return { task: dailyTask(pace, progress, fresh.doneToday), bookId: book.id }
    }
    return null
  }, [fresh])

  /** Bugungi yangi so'zlar qayerdan — rejadagi kitobning keyingi darsi */
  const lessonTo = useMemo(() => {
    const unitId = activeTask ? nextUnitOfBook(units, activeTask.bookId) : null
    return unitId ? PATHS.lessonById(unitId) : PATHS.lesson
  }, [activeTask, units])

  if (!fresh) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-extrabold">Mnemonika</h1>
        <Panel className="text-ink-600">Yuklanmoqda…</Panel>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-extrabold">🧠 Mnemonika</h1>
        <p className="mt-1 text-sm text-ink-600">
          Kitobni kunlarga bo‘lamiz, har kuni aniq ish beramiz va xotira usullari bilan yodlatamiz.
        </p>
      </header>

      <div role="tablist" aria-label="Mnemonika bo‘limlari" className="grid grid-cols-3 gap-1 rounded-2xl bg-ink-300/25 p-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            data-testid={`tab-${item.id}`}
            onClick={() => setTab(item.id)}
            className={cn(
              'tap-highlight-none rounded-xl py-2 text-sm font-extrabold transition-colors',
              tab === item.id ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'today' && (
        <TodayPanel
          task={activeTask?.task ?? null}
          lessonTo={lessonTo}
          doneToday={fresh.doneToday}
          dueCount={fresh.dueCount}
          hooksToday={fresh.hooksToday}
          seenCount={fresh.seenCount}
          dayKey={fresh.dayKey}
          onOpenMap={() => setTab('map')}
        />
      )}

      {tab === 'map' && (
        <>
          <Panel padding="sm" data-testid="books-totals">
            <div className="grid grid-cols-4 gap-2 text-center">
              <Total value={fresh.books.length} label="Kitob" />
              <Total value={totals.words} label="So‘z" />
              <Total value={totals.lessons} label="Dars" />
              <Total value={totals.sentences} label="Jumla" />
            </div>
            <p className="mt-2 text-center text-xs text-ink-600">
              {totals.learned} ta so‘z boshlandi · {totals.words - totals.learned} ta oldinda
            </p>
          </Panel>

          <ul className="flex flex-col gap-3">
            {fresh.books.map((book) => {
              const key = planKey(fresh.language, book.id)
              const record = fresh.plans[key]

              return (
                <li key={book.id}>
                  <BookPlanCard
                    book={book}
                    plan={record ? { ...record } : null}
                    doneToday={fresh.doneToday}
                    nextUnitId={nextUnitOfBook(units, book.id)}
                    open={openBookId === book.id}
                    onToggle={() => setOpenBookId(openBookId === book.id ? null : book.id)}
                    onChoose={(days) =>
                      void saveStudyPlan(key, { bookId: book.id, days, learnedAtStart: book.learned })
                    }
                    onCancel={() => void removeStudyPlan(key)}
                  />
                </li>
              )
            })}
          </ul>
        </>
      )}

      {tab === 'methods' && <MethodsPanel />}
    </div>
  )
}

function Total({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-lg font-extrabold">{value}</span>
      <span className="text-xs text-ink-600">{label}</span>
    </div>
  )
}

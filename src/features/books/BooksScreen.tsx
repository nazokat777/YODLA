import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { Panel } from '@/components/ui/Panel'
import { db, getAllCards, getDailyStat, planKey, removeStudyPlan, saveStudyPlan } from '@/core/db'
import { buildBooks, type BookStats, type StudyPlan } from '@/core/books'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/cn'
import { BookPlanCard } from './BookPlanCard'

/**
 * MNEMONIKA — kitob xaritasi va o'quv rejasi.
 *
 * NEGA ALOHIDA EKRAN: "Enterprise 1 — 3640 ta so'z" degan son bolani
 * ham, ota-onani ham qo'rqitadi va hech narsa aytmaydi. Bu yerda o'sha
 * son BAJARILADIGAN rejaga aylanadi: "kuniga 20 ta so'z — 6 oyda
 * tugaysan", "bugun 20 tadan 12 tasi bajarildi".
 *
 * Xarita bir necha psixologik tayanchga quriladi:
 *  - katta maqsadni kunlik ulushga bo'lish (implementation intentions);
 *  - bajarilgan ishni KO'RSATISH (progress bar, chek-belgi);
 *  - tugash SANASI — mavhum "bir kun" emas, aniq kun;
 *  - orqada qolganda ulush oshadi, lekin ikki baravardan ko'p emas:
 *    bajarib bo'lmaydigan vazifa bolani butunlay to'xtatadi.
 */
export function BooksScreen() {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)
  const [openBookId, setOpenBookId] = useState<string | null>(null)

  const data = useLiveQuery(async () => {
    if (!learningLanguage) return null
    const [cards, daily, profile] = await Promise.all([
      getAllCards(learningLanguage),
      getDailyStat(),
      db.profile.get('me'),
    ])

    return {
      language: learningLanguage,
      books: buildBooks(cards),
      plans: profile?.studyPlans ?? {},
      /** Bugun ko'rilgan NOYOB so'zlar — kunlik vazifa shuni sanaydi */
      doneToday: daily.cardIds.length,
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

  if (!fresh) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-extrabold">Mnemonika xaritasi</h1>
        <Panel className="text-ink-600">Yuklanmoqda…</Panel>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-2xl font-extrabold">Mnemonika xaritasi</h1>
        <p className="mt-1 text-sm text-ink-600">
          Kitobni necha kunda tugatishni o‘zingiz tanlaysiz — ilova uni kunlik ulushga bo‘lib
          beradi va har kuni nima qilishni aytadi.
        </p>
      </header>

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
          const plan: StudyPlan | null = record
            ? {
                bookId: record.bookId,
                days: record.days,
                startedAt: record.startedAt,
                learnedAtStart: record.learnedAtStart,
              }
            : null

          return (
            <li key={book.id}>
              <BookPlanCard
                book={book}
                plan={plan}
                doneToday={fresh.doneToday}
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

      <Panel padding="sm" className="text-sm text-ink-600">
        <h2 className="mb-1 font-extrabold text-ink-900">Qanday yodlatamiz</h2>
        <ul className="flex list-disc flex-col gap-1 ps-4">
          <li>
            <b>Eslab chaqirish:</b> o‘zbekchasini beramiz — inglizcha/arabchasini o‘zingiz
            topasiz. Tanib olishdan ko‘ra qiyin, shuning uchun mustahkamroq.
          </li>
          <li>
            <b>Gap ichida:</b> so‘z yolg‘iz emas, jumlada beriladi — kontekst xotirani
            ikkilantiradi.
          </li>
          <li>
            <b>Oraliqli takror:</b> har so‘z unutish arafasida qaytadi (SM-2).
          </li>
          <li>
            <b>Mnemonik usul:</b> har yangi so‘zga bitta ko‘rsatma — obraz, ovoz, harakat yoki
            o‘xshash so‘z.
          </li>
          <li>
            <b>Yig‘ma imtihon:</b> har bo‘limdan keyin oldingi hamma darsdan tekshiruv.
          </li>
        </ul>
        <Link to={PATHS.mnemonics} className="mt-2 inline-block font-bold text-brand-700">
          Assotsiatsiyalarim →
        </Link>
      </Panel>
    </div>
  )
}

function Total({ value, label }: { value: number; label: string }) {
  return (
    <div className={cn('flex flex-col')}>
      <span className="text-lg font-extrabold">{value}</span>
      <span className="text-xs text-ink-600">{label}</span>
    </div>
  )
}

export type { BookStats }

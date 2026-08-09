import { useLiveQuery } from 'dexie-react-hooks'
import { PATHS } from '@/app/paths'
import { LanguageBadge } from '@/components/ui/LanguageBadge'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { LinkButton } from '@/components/ui/LinkButton'
import { Panel } from '@/components/ui/Panel'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { LANGUAGES } from '@/core/config/languages'
import { getLanguageStats, getNextDueDate } from '@/core/db'
import { levelTitle } from '@/core/gamification'
import { formatTimeUntil } from '@/lib/format'
import { useNowTick } from '@/hooks/useNowTick'
import { useProgress } from '@/hooks/useProgress'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * Bosh ekran (TZ 6.2): streak, kunlik maqsad progressi,
 * "Bugun takrorlash" tugmasi va lug'at holati.
 *
 * Barcha ko'rsatkichlar jonli: takrorlash ekranida javob berilsa,
 * bu yerdagi raqamlar o'zi yangilanadi.
 */
export function HomeScreen() {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)
  const dailyGoalWords = useSettingsStore((s) => s.dailyGoalWords)
  const language = learningLanguage ? LANGUAGES[learningLanguage] : null

  // `useLiveQuery` faqat bazaga yozuv bo'lganda qayta hisoblaydi. "Muddati
  // yetgan" va "bugungi kun" tushunchalari esa vaqtga bog'liq — shuning
  // uchun soat ham bog'liqlik sifatida qo'shiladi.
  const now = useNowTick()
  const progress = useProgress()

  const stats = useLiveQuery(
    () => (learningLanguage ? getLanguageStats(learningLanguage, now) : undefined),
    [learningLanguage, now],
  )

  const nextDueAt = useLiveQuery(
    () => (learningLanguage ? getNextDueDate(learningLanguage, now) : undefined),
    [learningLanguage, now],
  )

  // `undefined` — hali yuklanmoqda; uni "0 ta karta" deb ko'rsatish noto'g'ri
  const isLoading = stats === undefined
  const dueCount = stats?.due ?? 0

  const streak = progress?.streak.current ?? 0
  const wordsToday = progress?.daily.cardIds.length ?? 0
  const level = progress?.level

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-ink-600">O'rganilmoqda</p>
          <h1 className="flex items-center gap-2 text-xl font-extrabold">
            {language ? (
              <>
                <LanguageBadge language={language} size="sm" />
                {language.name}
              </>
            ) : (
              'Til tanlanmagan'
            )}
          </h1>
        </div>

        <div
          data-testid="streak-badge"
          className={cnStreak(progress?.streak.atRisk ?? false)}
          title={
            progress?.streak.atRisk
              ? 'Streak xavf ostida — bugun hali mashq qilmadingiz'
              : undefined
          }
        >
          <span aria-hidden="true">🔥</span>
          <span>{streak}</span>
          <span className="sr-only">kunlik streak</span>
        </div>
      </header>

      {/* Til almashtirgich: har til alohida progress bilan — istalgan payt
          o'tish mumkin, so'zlar yo'qolmaydi */}
      <LanguageSwitcher />

      {/* Daraja va XP */}
      {level && (
        <Panel>
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-bold">
              {level.level}-daraja
              <span className="ms-2 text-sm font-normal text-ink-600">
                {levelTitle(level.level)}
              </span>
            </h2>
            <span data-testid="total-xp" className="text-sm font-semibold text-ink-600">
              {progress?.profile.totalXp ?? 0} XP
            </span>
          </div>
          <ProgressBar
            value={level.xpIntoLevel}
            max={level.xpForNextLevel}
            label={`Keyingi darajagacha: ${level.xpForNextLevel - level.xpIntoLevel} XP`}
          />
          <p className="mt-1 text-xs text-ink-600">
            Keyingi darajagacha {level.xpForNextLevel - level.xpIntoLevel} XP
          </p>
        </Panel>
      )}

      <Panel>
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-bold">Kunlik maqsad</h2>
          <span data-testid="daily-goal" className="text-sm text-ink-600">
            {wordsToday} / {dailyGoalWords} so'z
          </span>
        </div>
        <ProgressBar value={wordsToday} max={dailyGoalWords} label="Kunlik maqsad progressi" />
        {wordsToday >= dailyGoalWords && (
          <p className="mt-2 text-sm font-bold text-brand-700">🎯 Bugungi maqsad bajarildi!</p>
        )}
      </Panel>

      <Panel>
        <div className="mb-1 flex items-baseline justify-between">
          <h2 className="font-bold">Bugun takrorlash</h2>
          {dueCount > 0 && (
            <span className="rounded-full bg-brand-500 px-2.5 py-0.5 text-sm font-bold text-white">
              {dueCount}
            </span>
          )}
        </div>
        <p className="mb-3 text-sm text-ink-600">
          {isLoading
            ? 'Yuklanmoqda…'
            : dueCount > 0
              ? `${dueCount} ta so'z unutish arafasida.`
              : nextDueAt != null
                ? `Hammasi bajarildi. Keyingi takrorlash — ${formatTimeUntil(nextDueAt, now)}.`
                : 'Hozircha takrorlanadigan so‘z yo‘q.'}
        </p>
        <div className="flex flex-col gap-2">
          <LinkButton to={PATHS.review} block variant={dueCount > 0 ? 'primary' : 'secondary'}>
            {dueCount > 0 ? 'Takrorlashni boshlash' : 'Takrorlashni ochish'}
          </LinkButton>
          <LinkButton to={PATHS.lesson} block variant={dueCount > 0 ? 'secondary' : 'primary'}>
            Yangi so'zlarni o'rganish
          </LinkButton>
        </div>
      </Panel>

      <section>
        <h2 className="mb-2 font-bold">Lug'at holati</h2>
        <div className="grid grid-cols-3 gap-2">
          <StatTile label="Yangi" value={stats?.fresh} accent="text-ink-600" />
          <StatTile label="O'rganilmoqda" value={stats?.learning} accent="text-flame-600" />
          <StatTile label="Mustahkam" value={stats?.mature} accent="text-brand-600" />
        </div>
      </section>

    </div>
  )
}

/** Streak nishoni uslubi — xavf ostida bo'lsa diqqatni tortadi */
function cnStreak(atRisk: boolean): string {
  return [
    'flex items-center gap-1 rounded-full px-3 py-1.5 font-bold',
    atRisk
      ? 'bg-flame-500/25 text-flame-600 ring-2 ring-flame-500'
      : 'bg-flame-500/10 text-flame-600',
  ].join(' ')
}

/** Bitta statistika katakchasi */
function StatTile({
  label,
  value,
  accent,
}: {
  label: string
  value: number | undefined
  accent: string
}) {
  return (
    <Panel className="p-3 text-center">
      <p className={`text-2xl font-extrabold ${accent}`}>{value ?? '—'}</p>
      <p className="mt-0.5 text-xs text-ink-600">{label}</p>
    </Panel>
  )
}

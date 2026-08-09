import { BadgeTile } from '@/components/ui/BadgeTile'
import { LanguageBadge } from '@/components/ui/LanguageBadge'
import { LANGUAGE_LIST } from '@/core/config/languages'
import { Panel } from '@/components/ui/Panel'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { BADGES, levelTitle, MAX_STREAK_FREEZES, type BadgeStats } from '@/core/gamification'
import { useProgress } from '@/hooks/useProgress'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useLiveQuery } from 'dexie-react-hooks'
import { getGlobalCardStats } from '@/core/db'
import { cn } from '@/lib/cn'

/**
 * Profil ekrani (TZ 6.5): statistika, nishonlar, daraja va sozlamalar.
 */
export function ProfileScreen() {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)
  const setLearningLanguage = useSettingsStore((s) => s.setLearningLanguage)
  const dailyGoalWords = useSettingsStore((s) => s.dailyGoalWords)
  const setDailyGoalWords = useSettingsStore((s) => s.setDailyGoalWords)
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled)

  const progress = useProgress()
  const cardStats = useLiveQuery(() => getGlobalCardStats(), [])

  // Nishonlar progressi uchun yig'ma ko'rsatkichlar
  const badgeStats: BadgeStats = {
    learnedWords: cardStats?.learned ?? 0,
    matureWords: cardStats?.mature ?? 0,
    currentStreak: progress?.streak.current ?? 0,
    longestStreak: progress?.longestStreak ?? 0,
    totalXp: progress?.profile.totalXp ?? 0,
    level: progress?.level.level ?? 1,
    totalAnswers: progress?.daily.answered ?? 0,
    perfectSessions: progress?.profile.perfectSessions ?? 0,
  }

  const unlocked = new Set(progress?.profile.unlockedBadges ?? [])

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Profil</h1>

      {/* Daraja */}
      {progress && (
        <Panel>
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xl font-extrabold text-white">
              {progress.level.level}
            </div>
            <div className="flex-1">
              <p className="font-extrabold">{levelTitle(progress.level.level)}</p>
              <p className="text-sm text-ink-600">{progress.profile.totalXp} XP</p>
            </div>
          </div>
          <ProgressBar
            className="mt-3"
            value={progress.level.xpIntoLevel}
            max={progress.level.xpForNextLevel}
            label="Keyingi darajagacha progress"
          />
        </Panel>
      )}

      {/* Streak */}
      {progress && (
        <Panel>
          <h2 className="mb-3 font-bold">Ketma-ketlik</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            <Metric icon="🔥" value={progress.streak.current} label="Joriy" />
            <Metric icon="🏆" value={progress.longestStreak} label="Rekord" />
            <Metric
              icon="🧊"
              value={progress.profile.freezesAvailable}
              label={`Muzlatish (max ${MAX_STREAK_FREEZES})`}
            />
          </div>
          {progress.streak.atRisk && (
            <p className="mt-3 rounded-xl bg-flame-500/15 px-3 py-2 text-sm font-semibold text-flame-600">
              Bugun hali mashq qilmadingiz — ketma-ketlik uzilib qolishi mumkin.
            </p>
          )}
        </Panel>
      )}

      {/* Nishonlar */}
      <section>
        <h2 className="mb-2 font-bold">
          Nishonlar
          <span className="ms-2 text-sm font-normal text-ink-600">
            {unlocked.size} / {BADGES.length}
          </span>
        </h2>
        <ul className="grid grid-cols-3 gap-2">
          {BADGES.map((badge) => (
            <BadgeTile
              key={badge.id}
              badge={badge}
              stats={badgeStats}
              isUnlocked={unlocked.has(badge.id)}
            />
          ))}
        </ul>
      </section>

      {/* Sozlamalar */}
      <Panel>
        <h2 className="mb-3 font-bold">O'rganilayotgan til</h2>
        <div className="flex gap-2">
          {LANGUAGE_LIST.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLearningLanguage(lang.code)}
              aria-pressed={learningLanguage === lang.code}
              className={cn(
                'tap-highlight-none flex-1 rounded-xl border-2 p-3 text-center transition-colors',
                learningLanguage === lang.code
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-ink-300',
              )}
            >
              <LanguageBadge language={lang} className="mb-1" />
              <span className="block text-xs font-semibold">{lang.nativeName}</span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel>
        <h2 className="mb-3 font-bold">Kunlik maqsad</h2>
        <div className="flex gap-2">
          {[10, 20, 30].map((goal) => (
            <button
              key={goal}
              type="button"
              onClick={() => setDailyGoalWords(goal)}
              aria-pressed={dailyGoalWords === goal}
              className={cn(
                'tap-highlight-none flex-1 rounded-xl border-2 p-3 font-bold transition-colors',
                dailyGoalWords === goal ? 'border-brand-500 bg-brand-50' : 'border-ink-300',
              )}
            >
              {goal} so'z
            </button>
          ))}
        </div>
      </Panel>

      <Panel>
        <label className="flex cursor-pointer items-center justify-between gap-4">
          <span>
            <span className="block font-bold">Javob tovushlari</span>
            <span className="text-sm text-ink-600">
              To'g'ri va xato javoblarda qisqa signal
            </span>
          </span>
          <input
            type="checkbox"
            checked={soundEnabled}
            onChange={(event) => setSoundEnabled(event.target.checked)}
            className="h-6 w-6 accent-brand-500"
          />
        </label>
      </Panel>
    </div>
  )
}

/** Bitta ko'rsatkich katakchasi */
function Metric({ icon, value, label }: { icon: string; value: number; label: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2">
      <p className="text-xl" aria-hidden="true">
        {icon}
      </p>
      <p className="text-xl font-extrabold">{value}</p>
      <p className="text-[10px] text-ink-600">{label}</p>
    </div>
  )
}

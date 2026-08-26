import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Mascot } from '@/components/ui/Mascot'
import { Panel } from '@/components/ui/Panel'
import {
  CHEERS,
  cheerByKind,
  buildInviteUrl,
  filterFriends,
  leagueTier,
  normalizeCode,
  rankEntries,
  tierTitle,
  type CheerKind,
  type LeagueRow,
  type RankedEntry,
} from '@/core/league'
import { getDailyStatsSince } from '@/core/db'
import { buildWeeklySeries } from '@/core/stats'
import {
  addFriend,
  fetchCheers,
  fetchFriendCodes,
  fetchWeeklyLeague,
  isCloudEnabled,
  sendCheer,
  type ReceivedCheer,
} from '@/lib/supabase'
import { useSearchParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { addDays, startOfDay } from '@/lib/date'
import { useNowTick } from '@/hooks/useNowTick'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { cn } from '@/lib/cn'

/**
 * Liga ekrani (TZ 6.6): haftalik reyting.
 *
 * MUHIM: SOXTA RAQIBLAR YO'Q. Ro'yxatda faqat haqiqiy foydalanuvchilar;
 * yolg'iz bo'lsangiz shu ochiq yoziladi. Foydalanuvchining o'z loyihasidagi
 * qoida ham shunday: "Halol bo'l. Soxta statistika yo'q."
 *
 * Ma'lumot faqat ROZILIK bilan yuboriladi va faqat ism + haftalik XP.
 */
export function LeagueScreen() {
  const leagueCode = useSettingsStore((s) => s.leagueCode)
  const leagueName = useSettingsStore((s) => s.leagueName)
  const joinLeague = useSettingsStore((s) => s.joinLeague)

  if (!leagueCode) return <JoinCard onJoin={joinLeague} />

  return <Standings myCode={leagueCode} myName={leagueName} />
}

/** Rozilik kartasi — nima yuborilishi ochiq aytiladi */
function JoinCard({ onJoin }: { onJoin: (name: string) => void }) {
  const [name, setName] = useState('')

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Liga</h1>

      <Panel className="flex flex-col gap-3 text-center">
        <Mascot mood="happy" size="md" className="mx-auto" />
        <p className="text-lg font-extrabold">Ligaga qo'shilish</p>
        <p className="text-sm text-ink-600">
          Ismingiz va haftalik XP'ingiz serverga yuboriladi va reytingda ko'rinadi.
          So'zlaringiz va xatolaringiz qurilmada qoladi.
        </p>
        <p className="text-xs text-ink-600">Xohlasangiz taxallus yozing.</p>

        <label htmlFor="league-name" className="text-start text-sm font-semibold">
          Ism
        </label>
        <input
          id="league-name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={24}
          placeholder="Masalan: Ali"
          className="h-12 w-full rounded-xl border-2 border-ink-300 bg-white px-3 focus:border-brand-500 focus:outline-none"
        />

        <Button block size="lg" disabled={name.trim().length === 0} onClick={() => onJoin(name.trim())}>
          Qo'shilish
        </Button>
      </Panel>
    </div>
  )
}

/** Reyting: bulut bo'lsa server ma'lumoti, bo'lmasa faqat o'z natijangiz */
function Standings({ myCode, myName }: { myCode: string; myName: string }) {
  const now = useNowTick()

  // Oxirgi 7 kun — liga haftalik hisobda ishlaydi
  const weekStats = useLiveQuery(
    () => getDailyStatsSince(addDays(startOfDay(now), -6)),
    [now],
  )

  const [rows, setRows] = useState<LeagueRow[] | null>(null)
  const [isLoading, setIsLoading] = useState(isCloudEnabled())
  const [friendCodes, setFriendCodes] = useState<string[]>([])
  const [view, setView] = useState<'all' | 'friends'>('all')

  // Taklif havolasi (`?add=KOD`) maydonni TO'LDIRADI, lekin o'zi
  // qo'shmaydi: havolani bosgan odam bilmagan holda kimnidir kuzata
  // boshlamasligi kerak
  const [searchParams] = useSearchParams()
  const [codeInput, setCodeInput] = useState(() => searchParams.get('add') ?? '')
  const [addMessage, setAddMessage] = useState<string | null>(null)
  const [cheers, setCheers] = useState<ReceivedCheer[]>([])
  /** Qaysi kishiga xabar tanlanmoqda */
  const [cheerTarget, setCheerTarget] = useState<string | null>(null)

  // O'z haftalik XP'im lokal statistikadan — bulut yo'q bo'lsa ham ko'rinadi
  const myWeeklyXp = useMemo(() => {
    const series = buildWeeklySeries(weekStats ?? [], now)
    return series.reduce((sum, point) => sum + point.xp, 0)
  }, [weekStats, now])

  useEffect(() => {
    if (!isCloudEnabled()) return

    let cancelled = false

    void fetchWeeklyLeague().then((data) => {
      if (cancelled) return

      setRows(data)
      setIsLoading(false)
    })

    void fetchFriendCodes(myCode).then((codes) => {
      if (!cancelled) setFriendCodes(codes)
    })

    void fetchCheers(myCode).then((received) => {
      if (!cancelled) setCheers(received)
    })

    return () => {
      cancelled = true
    }
  }, [myCode])

  const visibleRows = useMemo(() => {
    const all = rows ?? []
    return view === 'friends' ? filterFriends(all, myCode, friendCodes) : all
  }, [rows, view, myCode, friendCodes])

  const ranked = useMemo(() => rankEntries(visibleRows, myCode), [visibleRows, myCode])

  async function handleAddFriend() {
    const code = normalizeCode(codeInput)

    if (!code) {
      setAddMessage('Kod 6 belgidan iborat bo‘lishi kerak')
      return
    }
    if (code === myCode) {
      setAddMessage('Bu sizning kodingiz')
      return
    }

    const result = await addFriend(myCode, code)

    // Uch holat ataylab ajratilgan: kod qo'lda kiritiladi va bitta harf
    // adashsa, "internetni tekshiring" foydalanuvchini noto'g'ri yo'ldan
    // olib ketardi
    setAddMessage(
      {
        added: 'Do‘st qo‘shildi',
        'unknown-code': 'Bunday kod topilmadi — qaytadan tekshiring',
        failed: 'Qo‘shib bo‘lmadi — internetni tekshiring',
      }[result],
    )

    if (result === 'added') {
      setFriendCodes((current) => [...new Set([...current, code])])
      setCodeInput('')
    }
  }

  async function handleCheer(toCode: string, kind: CheerKind) {
    setCheerTarget(null)

    const sent = await sendCheer(myCode, toCode, kind)
    // Kunlik cheklov bazada: bir xil xabar kuniga bir marta
    setAddMessage(sent ? 'Xabar yuborildi' : 'Bugun bu xabar allaqachon yuborilgan')
  }

  async function handleInvite() {
    const url = buildInviteUrl(window.location.origin, myCode)
    const text = `YODLA'da til o‘rganamiz! Kodim: ${myCode}`

    try {
      if (navigator.share) {
        await navigator.share({ title: 'YODLA', text, url })
        return
      }
      await navigator.clipboard.writeText(`${text} ${url}`)
      setAddMessage('Havola nusxalandi')
    } catch {
      // Foydalanuvchi bekor qilishi mumkin — bu xato emas
    }
  }
  const tier = leagueTier(myWeeklyXp)

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Liga</h1>

      <Panel className="text-center">
        <p className="text-sm text-ink-600">Haftalik daraja</p>
        <p data-testid="my-tier" className="text-2xl font-extrabold text-brand-700">
          {tierTitle(tier)}
        </p>
        <p className="mt-1 text-sm text-ink-600">
          {myName} · <strong>{myWeeklyXp} XP</strong> (7 kun)
        </p>
        <p className="mt-2 text-xs text-ink-600">
          Kodingiz: <strong>{myCode}</strong>
        </p>
      </Panel>

      {!isCloudEnabled() && (
        <Panel className="border-flame-500 bg-flame-500/10">
          <p className="text-sm font-semibold text-flame-600">
            Lokal rejim: reyting server ulangach ishlaydi.
          </p>
          <p className="mt-1 text-xs text-ink-600">
            Hozircha faqat o'z natijangiz ko'rinadi — bu soxta raqiblar ko'rsatishdan yaxshiroq.
          </p>
        </Panel>
      )}

      {isCloudEnabled() && isLoading && <Panel className="text-ink-600">Yuklanmoqda…</Panel>}

      {isCloudEnabled() && !isLoading && rows === null && (
        <Panel className="text-sm text-ink-600">
          Reytingni olib bo'lmadi — internet yo'q bo'lishi mumkin. Natijangiz saqlangan.
        </Panel>
      )}

      {cheers.length > 0 && (
        <Panel className="border-brand-500 bg-brand-50">
          <h2 className="mb-2 font-bold text-brand-700">Sizga xabarlar</h2>
          <ul className="flex flex-wrap gap-2">
            {cheers.slice(-8).map((cheer) => {
              const preset = cheerByKind(cheer.kind)
              if (!preset) return null

              return (
                <li
                  key={`${cheer.from_code}-${cheer.kind}-${cheer.d}`}
                  className="rounded-full bg-white px-3 py-1 text-sm font-semibold"
                >
                  <span aria-hidden="true">{preset.icon}</span> {preset.label}
                </li>
              )
            })}
          </ul>
        </Panel>
      )}

      {/* Ko'rinish almashtirgich */}
      <div
        role="group"
        aria-label="Reyting ko'rinishi"
        className="flex gap-1 rounded-2xl border-2 border-ink-300 bg-white p-1"
      >
        {(['all', 'friends'] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setView(option)}
            aria-pressed={view === option}
            className={cn(
              'tap-highlight-none flex-1 rounded-xl px-2 py-2 text-sm font-bold transition-colors',
              view === option ? 'bg-brand-500 text-white' : 'text-ink-600 hover:bg-brand-50',
            )}
          >
            {option === 'all' ? 'Hammasi' : "Do'stlar"}
          </button>
        ))}
      </div>

      {ranked.length > 0 && (
        <section>
          <h2 className="mb-2 font-bold">Haftalik reyting</h2>
          <ol className="flex flex-col gap-2">
            {ranked.map((entry) => (
              <li
                key={entry.code}
                className={cn(
                  'flex items-center gap-3 rounded-2xl border-2 bg-white p-3',
                  entry.isMe ? 'border-brand-500 bg-brand-50' : 'border-ink-300',
                )}
              >
                <span className="w-7 text-center font-extrabold text-ink-600">{entry.rank}</span>
                <span className="flex-1 font-bold">{entry.name}</span>
                <span className="font-extrabold text-brand-700">{entry.xp} XP</span>

                {!entry.isMe && (
                  <button
                    type="button"
                    onClick={() => setCheerTarget(cheerTarget === entry.code ? null : entry.code)}
                    aria-label={`${entry.name}ga xabar yuborish`}
                    className="tap-highlight-none flex h-9 w-9 items-center justify-center rounded-full hover:bg-brand-50"
                  >
                    <span aria-hidden="true">💬</span>
                  </button>
                )}
              </li>
            ))}
          </ol>

          {cheerTarget && (
            <CheerPicker
              entry={ranked.find((entry) => entry.code === cheerTarget)}
              onPick={(kind) => void handleCheer(cheerTarget, kind)}
              onClose={() => setCheerTarget(null)}
            />
          )}

          {ranked.length === 1 && (
            <p className="mt-2 text-xs text-ink-600">
              {view === 'friends'
                ? "Hali do'st qo'shmadingiz. Kodingizni ulashing yoki do'stingiz kodini kiriting."
                : "Hozircha ligada 1 kishi — havolani do'stlaringizga yuboring."}
            </p>
          )}
        </section>
      )}

      <Panel className="flex flex-col gap-3">
        <h2 className="font-bold">Do'st qo'shish</h2>

        <label htmlFor="friend-code" className="text-sm text-ink-600">
          Do'stingizning kodi
        </label>
        <div className="flex gap-2">
          <input
            id="friend-code"
            type="text"
            value={codeInput}
            onChange={(event) => setCodeInput(event.target.value)}
            maxLength={8}
            placeholder="Masalan: N2NAWS"
            autoComplete="off"
            autoCapitalize="characters"
            className="h-12 flex-1 rounded-xl border-2 border-ink-300 bg-white px-3 uppercase focus:border-brand-500 focus:outline-none"
          />
          <Button onClick={() => void handleAddFriend()} disabled={codeInput.trim().length === 0}>
            Qo'shish
          </Button>
        </div>

        {addMessage && (
          <p role="status" className="text-sm font-semibold text-brand-700">
            {addMessage}
          </p>
        )}

        <Button variant="secondary" block onClick={() => void handleInvite()}>
          Taklif qilish
        </Button>
      </Panel>
    </div>
  )
}

/**
 * Xabar tanlash paneli.
 *
 * Erkin matn yo'q — faqat ro'yxatdan. Moderatsiya imkoni bo'lmagan
 * ilovada bu yagona xavfsiz yo'l.
 */
function CheerPicker({
  entry,
  onPick,
  onClose,
}: {
  entry: RankedEntry | undefined
  onPick: (kind: CheerKind) => void
  onClose: () => void
}) {
  if (!entry) return null

  return (
    <Panel className="mt-2 border-brand-500">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-bold">{entry.name}ga xabar</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Yopish"
          // 44×44 — barmoq uchun eng kichik ishonchli o'lcham
          className="tap-highlight-none -me-2 flex h-11 w-11 items-center justify-center rounded-full text-xl text-ink-600"
        >
          ✕
        </button>
      </div>

      <ul className="grid grid-cols-2 gap-2">
        {CHEERS.map((cheer) => (
          <li key={cheer.kind}>
            <button
              type="button"
              onClick={() => onPick(cheer.kind)}
              className="tap-highlight-none flex w-full items-center gap-2 rounded-xl border-2 border-ink-300 bg-white p-2 text-sm font-semibold hover:border-brand-500"
            >
              <span aria-hidden="true">{cheer.icon}</span>
              {cheer.label}
            </button>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

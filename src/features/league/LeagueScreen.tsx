import { PhaseNotice } from '@/components/ui/PhaseNotice'

/**
 * Liga ekrani (TZ 6.6): haftalik leaderboard.
 * Bronza → Kumush → Oltin → Olmos. Faza 7'da to'ldiriladi.
 */
export function LeagueScreen() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">Liga</h1>
      <PhaseNotice phase="Faza 7">
        Haftalik reyting jadvali. MVP'da lokal (soxta) raqiblar bilan ishlaydi.
      </PhaseNotice>
    </div>
  )
}

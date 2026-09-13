/** Shuncha kun zaxira bo'lmasa (va so'zlar bo'lsa) — eslatma */
const NUDGE_AFTER_DAYS = 14

/** Eslatma kerakmi — sof qaror: 30+ so'z va 14 kundan beri zaxira yo'q */
export function shouldNudgeBackup(
  lastBackupAt: number | null,
  seenWords: number,
  now: number = Date.now(),
): boolean {
  if (seenWords < 30) return false
  if (lastBackupAt === null) return true
  return now - lastBackupAt > NUDGE_AFTER_DAYS * 24 * 60 * 60 * 1000
}


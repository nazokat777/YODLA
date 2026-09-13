import { useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmSheet } from '@/components/ui/ConfirmSheet'
import { Panel } from '@/components/ui/Panel'
import { createBackup, parseBackup, restoreBackup, type Backup } from '@/core/db'
import { shouldNudgeBackup } from './backupNudge'

/** Zustand persist kaliti — sozlamalar ham zaxiraga kiradi */
const SETTINGS_KEY = 'polyglotpro:settings'
/** Oxirgi zaxira vaqti — eslatma uchun */
const LAST_BACKUP_KEY = 'polyglotpro:lastBackup'
function readLastBackup(): number | null {
  try {
    const raw = localStorage.getItem(LAST_BACKUP_KEY)
    return raw ? Number(raw) : null
  } catch {
    return null
  }
}

function fileName(now: Date): string {
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `yodla-zaxira-${now.getFullYear()}-${mm}-${dd}.json`
}

/**
 * ZAXIRA NUSXA — progress faqat shu qurilmada; server yo'q.
 *
 * Yuklab olish: bitta JSON fayl. Tiklash: faylni tanlash → TASDIQ
 * (qaytarib bo'lmaydi: shu qurilmadagi progress fayldagisi bilan
 * almashtiriladi) → natija.
 */
export function BackupPanel({ seenWords = 0 }: { seenWords?: number }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [lastBackup, setLastBackup] = useState<number | null>(readLastBackup)
  const nudge = shouldNudgeBackup(lastBackup, seenWords)
  const [pending, setPending] = useState<Backup | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const handleDownload = async () => {
    const backup = await createBackup(localStorage.getItem(SETTINGS_KEY))
    const blob = new Blob([JSON.stringify(backup)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = fileName(new Date())
    link.click()
    URL.revokeObjectURL(url)
    try {
      localStorage.setItem(LAST_BACKUP_KEY, String(Date.now()))
    } catch {
      // eslatma shunchaki qolaveradi
    }
    setLastBackup(Date.now())
    setMessage(`Saqlandi: ${backup.cards.length} ta so‘z progressi`)
  }

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    const parsed = parseBackup(await file.text())
    if (!parsed) {
      setMessage('Bu fayl YODLA zaxirasi emas yoki buzilgan.')
      return
    }
    setPending(parsed)
  }

  const handleRestore = async () => {
    if (!pending) return
    const result = await restoreBackup(pending)
    if (pending.settings) localStorage.setItem(SETTINGS_KEY, pending.settings)
    setPending(null)
    setMessage(
      `Tiklandi: ${result.restored} ta so‘z${result.skipped > 0 ? `, ${result.skipped} tasi topilmadi` : ''}. Ilova qayta yuklanadi…`,
    )
    // Sozlamalar (Zustand) faqat qayta yuklashda o'qiladi
    window.setTimeout(() => window.location.reload(), 1200)
  }

  return (
    <Panel data-testid="backup-panel" tone={nudge ? 'warning' : 'default'} className="flex flex-col gap-3">
      <div>
        <h2 className="font-bold">Zaxira nusxa</h2>
        {/* Ko'p so'z, uzoq vaqt zaxirasiz — yo'qotish xavfi yumshoq aytiladi */}
        {nudge && (
          <p data-testid="backup-nudge" className="mb-1 text-sm font-bold text-flame-700">
            ⚠️ {seenWords} ta so‘z progressi faqat shu qurilmada. Zaxira olib qo‘ying.
          </p>
        )}
        <p className="text-sm text-ink-600">
          Progress faqat shu qurilmada saqlanadi. Telefon almashtirsangiz — faylni
          yuklab oling va yangi qurilmada tiklang.
        </p>
      </div>
      <div className="flex gap-2">
        <Button variant="secondary" block onClick={() => void handleDownload()}>
          ⬇️ Yuklab olish
        </Button>
        <Button variant="secondary" block onClick={() => fileRef.current?.click()}>
          ⬆️ Tiklash
        </Button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        aria-label="Zaxira faylini tanlash"
        className="hidden"
        onChange={(event) => {
          void handleFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />
      {message && (
        <p role="status" data-testid="backup-message" className="text-sm font-semibold text-ink-600">
          {message}
        </p>
      )}

      <ConfirmSheet
        open={pending !== null}
        title="Zaxiradan tiklaysizmi?"
        primaryLabel="Bekor qilish"
        dangerLabel="Ha, tiklash"
        onPrimary={() => setPending(null)}
        onDanger={() => void handleRestore()}
      >
        Fayldagi {pending?.cards.length ?? 0} ta so‘z progressi shu qurilmadagi progress
        O‘RNIGA yoziladi. Buni qaytarib bo‘lmaydi.
      </ConfirmSheet>
    </Panel>
  )
}

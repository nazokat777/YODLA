import { Button } from './Button'
import { Panel } from './Panel'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

/**
 * "Ilovani o'rnatish" kartasi — faqat brauzer ruxsat berganda ko'rinadi.
 * Bosh ekrandagi ikonka kunlik qaytish uchun eng kuchli signal.
 */
/** Android brauzerida (o'rnatilmagan holda) — APK havolasi */
function isAndroidBrowser(): boolean {
  if (typeof navigator === 'undefined') return false
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches
  return /Android/i.test(navigator.userAgent) && !standalone
}

export function InstallCard() {
  const { canInstall, install } = useInstallPrompt()

  /*
   * Brauzer o'z taklifini bermasa (allaqachon rad etilgan, yoki Chrome
   * emas) — Android'da to'g'ridan-to'g'ri APK. TWA: keyingi
   * yangilanishlar o'zi keladi, qayta o'rnatish kerak emas.
   */
  if (!canInstall) {
    if (!isAndroidBrowser()) return null
    return (
      <Panel data-testid="apk-card" tone="brand" className="flex items-center gap-3">
        <span aria-hidden="true" className="text-3xl">
          📲
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">Android ilovasi</span>
          <span className="block text-sm text-ink-600">
            APK — o‘rnating, keyingi yangilanishlar o‘zi keladi
          </span>
        </span>
        <a
          href="/YODLA.apk"
          download
          className="tap-highlight-none shrink-0 rounded-xl bg-brand-500 px-3 py-2 text-sm font-bold text-white"
        >
          Yuklab olish
        </a>
      </Panel>
    )
  }

  return (
    <Panel data-testid="install-card" tone="brand" className="flex items-center gap-3">
      <span aria-hidden="true" className="text-3xl">
        📲
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-bold">Ilovani o‘rnating</span>
        <span className="block text-sm text-ink-600">
          Bosh ekranda ikonka — bir bosishda dars, internetsiz ham
        </span>
      </span>
      <Button size="sm" onClick={() => void install()}>
        O‘rnatish
      </Button>
    </Panel>
  )
}

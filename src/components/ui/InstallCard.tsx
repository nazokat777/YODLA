import { Button } from './Button'
import { Panel } from './Panel'
import { useInstallPrompt } from '@/hooks/useInstallPrompt'

/**
 * "Ilovani o'rnatish" kartasi — faqat brauzer ruxsat berganda ko'rinadi.
 * Bosh ekrandagi ikonka kunlik qaytish uchun eng kuchli signal.
 */
export function InstallCard() {
  const { canInstall, install } = useInstallPrompt()
  if (!canInstall) return null

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

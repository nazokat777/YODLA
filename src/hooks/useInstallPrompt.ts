import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * PWA o'rnatish taklifi.
 *
 * Bosh ekrandagi ikonka — kunlik qaytishning eng kuchli "signali"
 * (odat halqasining cue qismi): brauzer ichida qolgan ilova unutiladi.
 * Brauzer `beforeinstallprompt` bersa — o'z tugmamiz orqali chaqiramiz;
 * bermasa (iOS Safari, allaqachon o'rnatilgan) — hech nima ko'rsatilmaydi.
 */
export function useInstallPrompt(): { canInstall: boolean; install: () => Promise<boolean> } {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvent(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setEvent(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = async () => {
    if (!event) return false
    await event.prompt()
    const { outcome } = await event.userChoice
    if (outcome === 'accepted') setEvent(null)
    return outcome === 'accepted'
  }

  return { canInstall: event !== null, install }
}

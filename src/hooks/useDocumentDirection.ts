import { useEffect } from 'react'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * <html> elementiga `dir` va `lang` atributlarini o'rnatadi.
 *
 * Arab tili tanlanganda butun interfeys RTL rejimiga o'tadi (TZ 5-bo'lim).
 * Tailwind'ning logik utilitalari (ms-*, me-*, text-start) shu atributga
 * qarab avtomatik moslashadi.
 */
export function useDocumentDirection() {
  const rtlInterface = useSettingsStore((s) => s.rtlInterface)

  useEffect(() => {
    const root = document.documentElement
    root.dir = rtlInterface ? 'rtl' : 'ltr'
    // Interfeys matni o'zbekcha — shuning uchun lang="uz" o'zgarmaydi
    root.lang = 'uz'
  }, [rtlInterface])
}

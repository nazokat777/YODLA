import { useEffect } from 'react'
import { touchPushActivity } from '@/lib/supabase'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * "Bugun mashq qildim" belgisini serverga yuboradi.
 *
 * NEGA KERAK: eslatmani kim OLMASLIGI kerakligini server hal qiladi —
 * Web Push kelgan bildirishnomani yashirishga ruxsat bermaydi
 * (`userVisibleOnly`). Yuboriladigan yagona narsa — SANA.
 *
 * Xatolik jimgina yutiladi: eslatma qulaylik, o'rganishga xalaqit
 * bermasligi kerak. Keyingi seansda qayta urinadi.
 */
export function usePushActivity(isFinished: boolean) {
  const pushEndpoint = useSettingsStore((s) => s.pushEndpoint)

  useEffect(() => {
    // FAQAT seans tugagach. Boshida yuborilsa, ilovani ochib bironta
    // savolga javob bermay chiqqan odam ham "bugun mashq qildi" deb
    // belgilanardi va o'sha kechqurun eslatma kelmasdi.
    if (!isFinished || !pushEndpoint) return

    // Mahalliy sana: server ham foydalanuvchining mintaqasi bo'yicha
    // solishtiradi, UTC bo'yicha emas
    const now = new Date()
    const day = [
      now.getFullYear(),
      String(now.getMonth() + 1).padStart(2, '0'),
      String(now.getDate()).padStart(2, '0'),
    ].join('-')

    void touchPushActivity(pushEndpoint, day).catch((error: unknown) => {
      console.error('Faollik sanasini yuborib bo‘lmadi:', error)
    })
  }, [pushEndpoint, isFinished])
}

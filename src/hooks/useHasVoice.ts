import { useEffect, useState } from 'react'
import { hasVoiceForLocale, isSpeechSupported } from '@/lib/speech'

/** Ovozlar yuklanishini kutish oralig'i va urinishlar soni (~2 soniya) */
const RETRY_MS = 250
const MAX_TRIES = 8

/**
 * Shu til uchun talaffuz ovozi bormi.
 *
 * Ovozlar ASINXRON yuklanadi va bu yerda ikki tuzoq bor:
 *
 *  1. Birinchi renderda `getVoices()` bo'sh bo'ladi — shuning uchun boshida
 *     "bor" deb hisoblaymiz (tugma miltillab yo'qolmasin).
 *  2. `voiceschanged` hodisasi Chrome'da ba'zan komponent ulanmasidan OLDIN
 *     otib bo'ladi — faqat unga tayansak holat "bor"da qotib qolardi.
 *
 * Shuning uchun hodisaga obuna bo'lamiz VA ro'yxat to'lguncha qisqa vaqt
 * qayta-qayta tekshiramiz.
 */
export function useHasVoice(locale: string): boolean {
  // Boshlang'ich qiymat DARHOL hisoblanadi. Qattiq `true` qo'yilsa, nutq
  // sintezi umuman yo'q muhitda qiymat birinchi effektda `false` ga o'zgarib,
  // ortiqcha qayta chizishni keltirib chiqarardi — mashq qayta yaratilib,
  // foydalanuvchi yozayotgan javob o'chib ketardi.
  //
  // `hasVoiceForLocale` ovozlar hali yuklanmagan bo'lsa baribir `true`
  // qaytaradi, shuning uchun tugma miltillamaydi.
  const [available, setAvailable] = useState(() => hasVoiceForLocale(locale))

  useEffect(() => {
    if (!isSpeechSupported()) {
      setAvailable(false)
      return
    }

    // Havola bir marta olinadi: tozalash paytida global almashgan bo'lishi
    // mumkin va u yerda qayta o'qish xatoga olib borardi
    const synth = window.speechSynthesis

    let tries = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    const check = () => {
      // `getVoices()` chaqiruvining o'zi ro'yxat yuklanishini boshlab yuboradi
      const loaded = synth.getVoices().length > 0
      setAvailable(hasVoiceForLocale(locale))

      tries += 1
      if (loaded || tries >= MAX_TRIES) return

      timer = setTimeout(check, RETRY_MS)
    }

    check()

    // Hodisa API'si bo'lmasligi mumkin (eski webview'lar, testdagi soxta
    // obyektlar). Bunda qayta tekshiruvning o'zi yetarli — talaffuz
    // tugmasi butun ekranni yiqitmasligi kerak.
    const canListen = typeof synth.addEventListener === 'function'
    if (canListen) synth.addEventListener('voiceschanged', check)

    return () => {
      clearTimeout(timer)
      if (canListen) synth.removeEventListener('voiceschanged', check)
    }
  }, [locale])

  return available
}

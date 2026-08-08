/**
 * Talaffuz (Web Speech API — SpeechSynthesis).
 *
 * Brauzer qo'llab-quvvatlamasa yoki tilga ovoz topilmasa, ilova ishlashda
 * davom etadi — "eshitib tushunish" mashqlari shunchaki yaratilmaydi.
 */

/** Brauzerda nutq sintezi bormi */
export function isSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance === 'function'
  )
}

/**
 * Berilgan tilga mos ovoz mavjudmi.
 *
 * DIQQAT: `getVoices()` birinchi chaqiruvda ko'pincha bo'sh massiv qaytaradi
 * (ovozlar asinxron yuklanadi). Shuning uchun ovoz topilmasa ham `true`
 * qaytaramiz: brauzer baribir standart ovoz bilan o'qib berishi mumkin.
 * Faqat ovozlar YUKLANGAN va orasida bu til yo'q bo'lsa `false` bo'ladi.
 */
export function hasVoiceForLocale(locale: string): boolean {
  if (!isSpeechSupported()) return false

  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return true

  const language = locale.split('-')[0].toLowerCase()
  return voices.some((voice) => voice.lang.toLowerCase().startsWith(language))
}

/**
 * Matnni ovoz chiqarib o'qish.
 *
 * @param rate  o'qish tezligi — o'rganuvchi uchun 1.0 dan sekinroq qulay
 */
export function speak(text: string, locale: string, rate = 0.85): void {
  if (!isSpeechSupported()) return

  try {
    // Oldingi o'qish tugamagan bo'lsa to'xtatiladi, aks holda navbatga tushadi
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = locale
    utterance.rate = rate

    window.speechSynthesis.speak(utterance)
  } catch (error) {
    console.error('Talaffuzni ijro etib bo‘lmadi:', error)
  }
}

/** Joriy o'qishni to'xtatish (ekrandan chiqishda chaqiriladi) */
export function cancelSpeech(): void {
  if (!isSpeechSupported()) return

  try {
    window.speechSynthesis.cancel()
  } catch {
    // To'xtatib bo'lmasa ham ilova ishlashda davom etadi
  }
}

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
 * Berilgan lokalga eng mos ovozni topish.
 *
 * NEGA BU KERAK: `utterance.lang` ni belgilashning O'ZI yetarli emas. Agar
 * ovoz aniq tanlanmasa, brauzer TIZIMDAGI STANDART ovozni ishlatadi — va
 * u boshqa tilda bo'lishi mumkin. Masalan Windows'da faqat ruscha ovoz
 * o'rnatilgan bo'lsa, inglizcha "water" ruscha talaffuz bilan o'qiladi va
 * foydalanuvchi so'zni NOTO'G'RI yodlab qoladi.
 *
 * Avval aynan mos lokal ("en-US"), keyin o'sha til ("en-GB" ham bo'ladi).
 */
export function getVoiceForLocale(locale: string): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null

  const voices = window.speechSynthesis.getVoices()
  const wanted = locale.toLowerCase()
  const language = wanted.split('-')[0]

  return (
    voices.find((voice) => voice.lang.toLowerCase() === wanted) ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith(language)) ??
    null
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

  return getVoiceForLocale(locale) !== null
}

/**
 * Matnni ovoz chiqarib o'qish.
 *
 * Mos ovoz topilmasa JIM turadi: noto'g'ri tildagi ovoz bilan o'qish
 * o'rgatishga zarar — foydalanuvchi buzuq talaffuzni to'g'ri deb yodlaydi.
 *
 * @param rate  o'qish tezligi — o'rganuvchi uchun 1.0 dan sekinroq qulay
 * @returns o'qish boshlanganmi
 */
export function speak(text: string, locale: string, rate = 0.85): boolean {
  if (!isSpeechSupported()) return false

  try {
    const voices = window.speechSynthesis.getVoices()
    const voice = getVoiceForLocale(locale)

    // Ovozlar YUKLANGAN va orasida bu til yo'q — o'qimaymiz
    if (!voice && voices.length > 0) return false

    // Oldingi o'qish tugamagan bo'lsa to'xtatiladi, aks holda navbatga tushadi
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = locale
    utterance.rate = rate
    // Ovozlar hali yuklanmagan bo'lsa `voice` null qoladi — brauzer o'zi
    // `lang` bo'yicha tanlaydi
    if (voice) utterance.voice = voice

    window.speechSynthesis.speak(utterance)
    return true
  } catch (error) {
    console.error('Talaffuzni ijro etib bo‘lmadi:', error)
    return false
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

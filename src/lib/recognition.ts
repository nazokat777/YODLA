/**
 * Nutqni tanish (Web Speech API — SpeechRecognition).
 *
 * DIQQAT — bu SpeechSynthesis EMAS. Chrome/Edge da audio Google serveriga
 * yuboriladi, ya'ni INTERNET SHART. Firefox da API umuman yo'q. Shuning
 * uchun bu yerda "qo'llab-quvvatlanmasa jim yiqilish" emas, ochiq holat
 * qaytariladi: chaqiruvchi tugmani umuman ko'rsatmasligi kerak.
 */

/* --- Brauzer tiplari ---------------------------------------------------
 * `@types/dom-speech-recognition` paketini qo'shmaymiz: bizga interfeysning
 * arzimas qismi kerak, loyihaning bog'liqliklari esa yengil qolgani ma'qul.
 */

interface SpeechAlternativeLike {
  transcript: string
}

interface SpeechResultLike {
  readonly length: number
  [index: number]: SpeechAlternativeLike
}

interface SpeechResultListLike {
  readonly length: number
  [index: number]: SpeechResultLike
}

interface SpeechResultEventLike {
  results: SpeechResultListLike
}

interface SpeechErrorEventLike {
  error: string
}

interface RecognitionLike {
  lang: string
  maxAlternatives: number
  interimResults: boolean
  continuous: boolean
  start(): void
  abort(): void
  onresult: ((event: SpeechResultEventLike) => void) | null
  onerror: ((event: SpeechErrorEventLike) => void) | null
  onend: (() => void) | null
}

type RecognitionCtor = new () => RecognitionLike

/** Nechta variant so'raladi — "yumshoq" taqqoslash uchun bittasi kam */
const MAX_ALTERNATIVES = 5

/** Tinglash shuncha vaqtdan keyin majburan to'xtaydi */
const DEFAULT_TIMEOUT_MS = 5000

function getRecognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null

  const scope = window as unknown as {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }

  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null
}

/** Brauzerda nutqni tanish bormi */
export function isRecognitionSupported(): boolean {
  return getRecognitionCtor() !== null
}

/**
 * Mikrofonga ruxsat rad etilganmi.
 *
 * NEGA MODUL DARAJASIDA: rad javobidan keyin har bosishda tizim oynasini
 * qayta ochishga urinish bezor qiladi va baribir natija bermaydi —
 * brauzer taqiqni eslab qoladi. Bayroq shu seans davomida yashaydi.
 */
let micBlocked = false

export function isMicBlocked(): boolean {
  return micBlocked
}

/** Testlar uchun boshlang'ich holatga qaytarish */
export function resetMicBlock(): void {
  micBlocked = false
}

export type RecognitionOutcome =
  | { status: 'heard'; alternatives: string[] }
  | { status: 'no-speech' }
  | { status: 'denied' }
  | { status: 'failed' }

/**
 * Bir marta tinglab, eshitilgan variantlarni qaytarish.
 *
 * Natija HECH QACHON istisno tashlamaydi — har bir nosozlik alohida holat
 * bo'lib qaytadi, chunki foydalanuvchiga "mikrofonga ruxsat bering" va
 * "internet yo'q" butunlay boshqa xabarlar bo'lishi kerak.
 */
export function listenOnce(
  locale: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<RecognitionOutcome> {
  const Ctor = getRecognitionCtor()
  if (!Ctor) return Promise.resolve({ status: 'failed' })

  return new Promise<RecognitionOutcome>((resolve) => {
    let settled = false
    let timer: ReturnType<typeof setTimeout> | undefined

    /** Birinchi natija g'olib: `onend` har doim `onresult`dan keyin keladi */
    function finish(outcome: RecognitionOutcome) {
      if (settled) return
      settled = true
      if (timer !== undefined) clearTimeout(timer)
      resolve(outcome)
    }

    let recognition: RecognitionLike
    try {
      recognition = new Ctor()
    } catch (error) {
      console.error('Nutqni tanishni boshlab bo‘lmadi:', error)
      finish({ status: 'failed' })
      return
    }

    recognition.lang = locale
    recognition.maxAlternatives = MAX_ALTERNATIVES
    recognition.interimResults = false
    recognition.continuous = false

    recognition.onresult = (event) => {
      const result = event.results[0]
      if (!result) {
        finish({ status: 'no-speech' })
        return
      }

      const alternatives: string[] = []
      for (let index = 0; index < result.length; index += 1) {
        const transcript = result[index]?.transcript
        if (transcript) alternatives.push(transcript)
      }

      finish(
        alternatives.length > 0
          ? { status: 'heard', alternatives }
          : { status: 'no-speech' },
      )
    }

    recognition.onerror = (event) => {
      // Ruxsat rad etilishi — yagona QAYTMAYDIGAN xato, qolganlari vaqtinchalik
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        micBlocked = true
        finish({ status: 'denied' })
        return
      }

      if (event.error === 'no-speech' || event.error === 'aborted') {
        finish({ status: 'no-speech' })
        return
      }

      finish({ status: 'failed' })
    }

    // Natijasiz tugadi — odatda foydalanuvchi indamadi
    recognition.onend = () => finish({ status: 'no-speech' })

    timer = setTimeout(() => {
      recognition.abort()
      finish({ status: 'no-speech' })
    }, timeoutMs)

    try {
      recognition.start()
    } catch (error) {
      console.error('Tinglashni boshlab bo‘lmadi:', error)
      finish({ status: 'failed' })
    }
  })
}

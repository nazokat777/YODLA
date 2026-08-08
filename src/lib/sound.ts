/**
 * Instant feedback tovushlari (TZ 4: "to'g'ri javobda tovush").
 *
 * Web Audio API bilan generatsiya qilinadi — audio fayl yuklash shart emas,
 * ilova hajmi oshmaydi va offline ham ishlaydi.
 */

type AudioContextConstructor = typeof AudioContext

/** Kontekst bir marta yaratiladi va qayta ishlatiladi */
let context: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  const Constructor: AudioContextConstructor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext

  if (!Constructor) return null

  try {
    context ??= new Constructor()

    // Brauzer avtomatik ijroni to'xtatgan bo'lishi mumkin —
    // foydalanuvchi bosgandan keyin qayta tiklanadi
    if (context.state === 'suspended') void context.resume()

    return context
  } catch {
    return null
  }
}

/** Bitta ohang: chastota (Hz), boshlanish kechikishi va davomiyligi (sekund) */
function playTone(frequency: number, startAt: number, duration: number): void {
  const audio = getContext()
  if (!audio) return

  const oscillator = audio.createOscillator()
  const gain = audio.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.value = frequency

  // Keskin "klik" eshitilmasligi uchun ovoz silliq ko'tarilib-tushadi
  const start = audio.currentTime + startAt
  gain.gain.setValueAtTime(0, start)
  gain.gain.linearRampToValueAtTime(0.18, start + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)

  oscillator.connect(gain)
  gain.connect(audio.destination)
  oscillator.start(start)
  oscillator.stop(start + duration)
}

/** To'g'ri javob — ko'tariluvchi ikki ohang (quvnoq) */
export function playCorrectSound(): void {
  playTone(660, 0, 0.12) // E5
  playTone(880, 0.1, 0.18) // A5
}

/** Xato javob — bitta past, yumshoq ohang (jazolovchi emas) */
export function playWrongSound(): void {
  playTone(220, 0, 0.22) // A3
}

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

/**
 * To'g'ri javob — ko'tariluvchi ikki ohang (quvnoq).
 *
 * @param step kombo bilan ohang KO'TARILADI (yarim tonlarda, 0..8):
 *   har ketma-ket to'g'ri javob biroz balandroq jaranglaydi — quloq
 *   o'sishni his qiladi, bu ko'zdagi hisobdan tezroq va chuqurroq
 *   ishlaydi. Kombo uzilsa ohang boshiga qaytadi — jazo emas, faqat
 *   "yangidan" degan belgi.
 */
export function playCorrectSound(step = 0): void {
  const ratio = 2 ** (Math.min(8, Math.max(0, step)) / 12)
  playTone(660 * ratio, 0, 0.12) // E5 dan yuqoriga
  playTone(880 * ratio, 0.1, 0.18) // A5 dan yuqoriga
}

/** Kombo pog'onasi — uch ohangli qisqa fanfara */
export function playMilestoneSound(): void {
  playTone(784, 0, 0.1) // G5
  playTone(988, 0.09, 0.1) // B5
  playTone(1319, 0.18, 0.24) // E6
}

/** So'z YODLANDI — yumshoq, iliq akkord (mayor) */
export function playMasteredSound(): void {
  playTone(523, 0, 0.35) // C5
  playTone(659, 0.02, 0.35) // E5
  playTone(784, 0.04, 0.4) // G5
}

/** Sandiq ochildi — "sehr" tomchisi: tez ko'tariluvchi arpejio */
export function playChestSound(): void {
  playTone(523, 0, 0.08)
  playTone(659, 0.06, 0.08)
  playTone(784, 0.12, 0.08)
  playTone(1047, 0.18, 0.3)
}

/** Xato javob — bitta past, yumshoq ohang (jazolovchi emas) */
export function playWrongSound(): void {
  playTone(220, 0, 0.22) // A3
}

/**
 * Xotira usullari — yangi so'z tanishtirilganda beriladigan BITTA
 * mikro-ko'rsatma.
 *
 * NEYROBIOLOGIYA: so'zni shunchaki o'qish sayoz iz qoldiradi. Iz chuqur
 * bo'lishi uchun miya so'z ustida ISH qilishi kerak (levels of
 * processing, Craik & Lockhart 1972). Har usul alohida tadqiqotda
 * isbotlangan:
 *  - obraz (dual coding, Paivio) — rasm + so'z ikki yo'l bilan yoziladi;
 *  - ovoz chiqarib aytish (production effect, MacLeod 2010);
 *  - o'zi bilan bog'lash (self-reference effect, Rogers 1977);
 *  - o'xshash so'z (keyword method, Atkinson 1975) — tarjimadan 2–3
 *    barobar mustahkam;
 *  - harakat (enactment effect, Engelkamp);
 *  - o'zi gap tuzish (generation effect, Slamecka & Graf 1978);
 *  - g'alati obraz (bizarreness effect, McDaniel & Einstein 1986).
 *
 * Bola hammasini bir vaqtda qilolmaydi — shuning uchun BITTA, so'zga
 * qarab barqaror (bir so'z har safar bir xil usul: usul so'zning
 * "o'z"iga aylanadi).
 */
export interface MemoryTip {
  /** Usul nomi — bola vaqt o'tib ularni o'zi taniydi */
  method: string
  icon: string
  /** Ko'rsatma — so'z va tarjima qo'yilgan */
  text: string
}

interface TipInput {
  word: string
  translation: string
  /** Kartada jumla bor — "gapda ishlat" usuli faqat shunda */
  hasSentence: boolean
  /**
   * So'z KO'RINADIGAN narsa (rasmi bor). Mavhum so'zga ("kerak", "balki")
   * "ko'z oldingga keltir" deyish ma'nosiz — unga ovoz, gap, o'xshash
   * so'z usullari beriladi. Ixtiyoriy: bilinmasa "ko'rinadi" deb olinadi.
   */
  isConcrete?: boolean
}

type TipTemplate = (input: TipInput) => MemoryTip

/** Obrazga tayanadigan usullar — faqat aniq (rasmli) so'zlarga */
const VISUAL_METHODS = new Set(['Obraz', 'G‘alati obraz', 'Harakat'])

const TIPS: TipTemplate[] = [
  ({ translation }) => ({
    method: 'Obraz',
    icon: '👀',
    text: `Ko‘z oldingga keltir: «${translation}» qanday ko‘rinadi — rangi, o‘lchami, qayerda turibdi?`,
  }),
  ({ word }) => ({
    method: 'Ovoz',
    icon: '🗣️',
    text: `«${word}» deb ovoz chiqarib 3 marta ayt — o‘z ovozing bilan aytilgan so‘z yaxshiroq qoladi.`,
  }),
  ({ word, translation }) => ({
    method: 'Men bilan',
    icon: '🙋',
    text: `«${translation}» sening hayotingda qayerda uchraydi? O‘sha joyni «${word}» deb atab qo‘y.`,
  }),
  ({ word }) => ({
    method: 'O‘xshash so‘z',
    icon: '🔗',
    text: `«${word}» o‘zbekcha qaysi so‘zga o‘xshab eshitiladi? O‘sha so‘z bilan bitta kulgili rasm o‘yla.`,
  }),
  ({ word }) => ({
    method: 'Harakat',
    icon: '✋',
    text: `«${word}» deb ayt va uni qo‘l bilan ko‘rsat yoki harakat qil — tana eslab qoladi.`,
  }),
  ({ translation }) => ({
    method: 'G‘alati obraz',
    icon: '😄',
    text: `«${translation}»ni juda g‘alati holatda tasavvur qil — ulkan, uchayotgan, gapirayotgan. G‘alati narsa esdan chiqmaydi.`,
  }),
]

/** Faqat jumlasi bor so'z uchun */
const SENTENCE_TIP: TipTemplate = ({ word }) => ({
  method: 'Gapda',
  icon: '📖',
  text: `Pastdagi gapni ovoz chiqarib o‘qi, keyin «${word}» bilan O‘ZING bitta gap tuz.`,
})

/** Barqaror kichik xesh — bir so'z har safar bir xil usul */
function hash(text: string): number {
  let h = 0
  for (let i = 0; i < text.length; i += 1) h = (h * 31 + text.charCodeAt(i)) >>> 0
  return h
}

/**
 * So'z uchun xotira usuli.
 *
 * Jumlasi bor so'zlarning har uchinchisiga "gapda ishlat" — u eng kuchli
 * (generation), lekin hammasiga berilsa zerikarli bo'lardi.
 */
export function memoryTip(input: TipInput & { id: string }): MemoryTip {
  const h = hash(input.id)
  if (input.hasSentence && h % 3 === 0) return SENTENCE_TIP(input)
  const pool =
    input.isConcrete === false
      ? TIPS.filter((tip) => !VISUAL_METHODS.has(tip(input).method))
      : TIPS
  return pool[h % pool.length]!(input)
}

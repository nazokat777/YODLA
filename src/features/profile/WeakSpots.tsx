import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import { Panel } from '@/components/ui/Panel'
import { WordImage } from '@/components/ui/WordImage'
import { getAllCards } from '@/core/db'
import {
  EXERCISE_TYPE_NAMES,
  hasWeakSpots,
  isStillStruggling,
  pickWeakest,
  skillSummary,
} from '@/core/mastery'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { LANGUAGES } from '@/core/config/languages'

/** Ro'yxatda nechta qiyin so'z ko'rsatiladi */
const HARD_WORDS_SHOWN = 8

/**
 * Kamida shuncha xato bo'lmasa so'z "qiyin" deb atalmaydi.
 *
 * Bir marta adashish qiyinlik emas: bola chalg'igan yoki tugmani
 * noto'g'ri bosgan bo'lishi mumkin. "Qiyin so'zlaringiz" deb bexato
 * bilingan so'zni ko'rsatish esa foydalanuvchini chalg'itardi.
 */
const MIN_LAPSES = 2

/**
 * "Ustida ishlash kerak" — foydalanuvchi qayerda qiynalayotganini
 * ko'rsatadi.
 *
 * Ikki xil zaiflik ko'rsatiladi va ular BOSHQA-BOSHQA narsalar:
 *  - QAYSI SO'Z unutilyapti (`lapses`),
 *  - QAYSI KO'NIKMA oqsayapti (`typeStats`) — bola so'zning ma'nosini
 *    tanishi, lekin uni yozolmasligi mumkin.
 *
 * MA'LUMOT YETMASA butun bo'lim CHIZILMAYDI: yangi foydalanuvchiga
 * bo'sh ro'yxat ko'rsatish "men hech nima bilmayman" degan noto'g'ri
 * taassurot qoldirardi.
 */
export function WeakSpots() {
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)
  const language = learningLanguage ? LANGUAGES[learningLanguage] : null

  const cards = useLiveQuery(
    () => (learningLanguage ? getAllCards(learningLanguage) : undefined),
    [learningLanguage],
  )

  if (!cards) return null

  // Hali aytadigan gap yo'q — qaror `core/mastery` da tekshiriladi
  if (!hasWeakSpots(cards, MIN_LAPSES)) return null

  const struggled = cards.filter((card) => isStillStruggling(card, MIN_LAPSES))
  const hardWords = pickWeakest(struggled, HARD_WORDS_SHOWN, Date.now())
  const weakestSkill = skillSummary(cards)[0]

  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-bold">Ustida ishlash kerak</h2>

      {weakestSkill && weakestSkill.wrong > 0 && (
        <Panel>
          <p className="text-sm text-ink-600">Eng qiyin kelayotgan mashq</p>
          <p className="mt-1 font-bold">{EXERCISE_TYPE_NAMES[weakestSkill.type]}</p>
          <p className="mt-1 text-sm text-ink-600">
            {weakestSkill.seen} tadan {weakestSkill.wrong} tasi xato
          </p>
        </Panel>
      )}

      {hardWords.length > 0 && (
        <Panel interactive padding="sm">
          <p className="mb-2 px-1 text-sm text-ink-600">
            Eng ko‘p unutilayotgan so‘zlar
          </p>

          <ul className="flex flex-col gap-1">
            {hardWords.map((card) => (
              <li key={card.id} className="flex items-center gap-2 rounded-xl px-1 py-1.5">
                <WordImage translation={card.translation} size="sm" />
                <span className="min-w-0 flex-1">
                  {/* Arab shrifti va yo'nalishi `[dir='rtl']` orqali — usiz
                      arabcha so'z lotin shriftida chiqardi */}
                  <span
                    dir={language?.dir}
                    lang={language?.code}
                    className="block truncate font-semibold"
                  >
                    {card.word}
                  </span>
                  <span className="block truncate text-xs text-ink-600">{card.translation}</span>
                </span>
                <span className="shrink-0 rounded-full bg-flame-500/15 px-2 py-0.5 text-xs font-bold text-flame-700">
                  {card.lapses} marta unutilgan
                </span>
              </li>
            ))}
          </ul>

          {/*
            Aniqlash o'z-o'zidan foyda bermaydi — foydalanuvchiga
            shu yerdayoq MASHQ QILISH imkoni kerak.
          */}
          <Link
            to={PATHS.weakReview}
            className="tap-highlight-none mt-2 block rounded-xl bg-brand-500 px-4 py-2.5 text-center font-bold text-white"
          >
            Shu so‘zlarni mashq qilish
          </Link>
        </Panel>
      )}
    </section>
  )
}

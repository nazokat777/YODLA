import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { SpeakButton } from '@/components/ui/SpeakButton'
import { WordImage } from '@/components/ui/WordImage'
import { LANGUAGES } from '@/core/config/languages'
import type { CardRecord } from '@/core/db'
import { readingFor } from '@/core/text/transliterate'
import { cancelSpeech, speak } from '@/lib/speech'
import { useHasVoice } from '@/hooks/useHasVoice'

interface WordPreviewProps {
  cards: CardRecord[]
  onStart: () => void
}

/** "Hammasini eshitish"da so'zlar orasidagi pauza (ms) */
const LISTEN_GAP_MS = 1600

/**
 * DARS OLDIDAN — bugungi so'zlarning TO'LIQ ro'yxati.
 *
 * Har so'z: rasm, yozilishi, o'qilishi (arab/kirill uchun), tarjimasi,
 * talaffuzi va (bo'lsa) jumlasi. Yodlash shundan KEYIN boshlanadi.
 *
 * NEGA: mnemonika algoritmining birinchi qadami — HAJMNI bilish. Bola
 * bugun nechta va qaysi so'zlarni olishini ko'rsa, ish chegarali va
 * bajariladigan bo'lib tuyuladi (noaniq "dars" emas, aniq 4 ta so'z).
 * Bundan tashqari, ro'yxatni bir ko'rib chiqish — birinchi tanishuv:
 * mashqdagi har so'z endi "qayerdadir ko'rganman" bo'ladi.
 */
export function WordPreview({ cards, onStart }: WordPreviewProps) {
  const language = LANGUAGES[cards[0]!.language]
  const hasVoice = useHasVoice(language.speechLocale)
  const [playing, setPlaying] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Ekrandan chiqilsa navbat to'xtaydi — ovoz keyingi ekranda davom etmasin
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      cancelSpeech()
    },
    [],
  )

  const playAll = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const step = (index: number) => {
      if (index >= cards.length) {
        setPlaying(null)
        return
      }
      setPlaying(index)
      speak(cards[index]!.word, language.speechLocale)
      timerRef.current = setTimeout(() => step(index + 1), LISTEN_GAP_MS)
    }
    step(0)
  }

  return (
    <div className="flex flex-col gap-3" data-testid="word-preview">
      <Panel tone="brand" padding="sm">
        <h2 className="text-lg font-extrabold">Bugungi {cards.length} ta so‘z</h2>
        <p className="mt-0.5 text-sm text-ink-600">
          Avval tanishib chiqing: har birini eshiting va ovoz chiqarib takrorlang. Keyin yodlashni
          boshlaymiz.
        </p>
        {hasVoice && (
          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={playAll}
            data-testid="preview-play-all"
          >
            🔊 Hammasini eshitish
          </Button>
        )}
      </Panel>

      <ol className="flex flex-col gap-2">
        {cards.map((card, index) => {
          const reading = readingFor(card.word, language.script)
          const sentenceReading = card.sentence
            ? readingFor(card.sentence, language.script)
            : null

          return (
            <li key={card.id}>
              <Panel
                padding="sm"
                data-testid={`preview-${card.id}`}
                className={playing === index ? 'ring-2 ring-brand-500' : undefined}
              >
                <div className="flex items-center gap-3">
                  <span className="w-5 shrink-0 text-sm font-extrabold text-ink-600">
                    {index + 1}
                  </span>
                  <WordImage translation={card.translation} size="sm" />
                  <span className="flex min-w-0 flex-col">
                    <span
                      dir={language.dir}
                      lang={language.code}
                      className={
                        language.dir === 'rtl' ? 'text-2xl font-extrabold' : 'text-lg font-extrabold'
                      }
                    >
                      {card.word}
                    </span>
                    {reading && (
                      <span className="text-xs font-semibold text-ink-600" data-testid="preview-reading">
                        [{reading}]
                      </span>
                    )}
                    <span className="font-bold text-brand-700">{card.translation}</span>
                  </span>
                  <span className="ms-auto">
                    <SpeakButton text={card.word} locale={language.speechLocale} fallback="hint" />
                  </span>
                </div>

                {card.sentence && (
                  <div className="mt-2 rounded-xl bg-ink-300/15 px-2.5 py-1.5 text-sm">
                    <p
                      dir={language.dir}
                      lang={language.code}
                      className={language.dir === 'rtl' ? 'text-lg' : undefined}
                    >
                      {card.sentence}
                    </p>
                    {sentenceReading && <p className="text-xs text-ink-600">{sentenceReading}</p>}
                    {card.sentenceTranslation && (
                      <p className="text-xs text-ink-600">{card.sentenceTranslation}</p>
                    )}
                  </div>
                )}
              </Panel>
            </li>
          )
        })}
      </ol>

      <div className="sticky bottom-0 bg-gradient-to-t from-white via-white/95 to-white/0 pt-3 pb-1">
        <Button block size="lg" onClick={onStart} data-testid="preview-start">
          Yodlashni boshlash
        </Button>
      </div>
    </div>
  )
}

import { cn } from '@/lib/cn'
import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { Panel } from '@/components/ui/Panel'
import { PronounceButton } from '@/components/ui/PronounceButton'
import { WordImage } from '@/components/ui/WordImage'
import { SpeakButton } from '@/components/ui/SpeakButton'
import { LANGUAGES } from '@/core/config/languages'
import type { CardRecord } from '@/core/db'
import { enterStagger, scrambleReveal, withMotion } from '@/lib/motion'
import { speak } from '@/lib/speech'
import { WordDisplay } from './WordDisplay'
import { transliterate } from '@/core/text/transliterate'
import { revealedWordToday } from '@/lib/wordOfDayMemo'

interface WordIntroProps {
  card: CardRecord
  onContinue: () => void
}

/**
 * Yangi so'z bilan TANISHTIRISH.
 *
 * NEGA KERAK: bola hech qachon ko'rmagan so'zning tarjimasini
 * variantlardan "topa olmaydi" — u faqat taxmin qiladi. Taxmin esa
 * hech nima o'rgatmaydi va xato javob ruhini tushiradi.
 *
 * Shuning uchun so'z BIRINCHI marta uchraganda avval ko'rsatiladi:
 * so'z, tarjimasi, talaffuzi va (bo'lsa) jumla. Faqat shundan keyin
 * mashqlar boshlanadi. Bu "tanishtir → so'ra" tartibi — darslikda ham,
 * Duolingo'da ham shunday.
 */
export function WordIntro({ card, onContinue }: WordIntroProps) {
  const language = LANGUAGES[card.language]
  const isRevealedWordOfDay = revealedWordToday() === card.id
  const sentenceReading = card.sentence ? transliterate(card.sentence, language.script) : null
  const rootRef = useRef<HTMLDivElement>(null)

  // Yangi so'z darhol O'QIB beriladi: eshitmasdan yodlash qiyin
  useEffect(() => {
    speak(card.word, language.speechLocale)
  }, [card.word, language.speechLocale])

  useEffect(() => {
    let cancelled = false
    let revert = () => {}

    void withMotion(
      rootRef.current,
      (gsap) => {
        enterStagger(gsap, '[data-intro]', { stagger: 0.08, duration: 0.4, y: 20 })
        /*
         * So'z "OCHILADI": harflar shovqindan asl holiga keladi.
         * Kutish → aniqlik. Matn oxirida asliga teng — animatsiya
         * to'xtab qolsa ham so'z to'g'ri.
         */
        const wordNode = rootRef.current?.querySelector('[data-testid="intro-word"]')
        if (wordNode) scrambleReveal(gsap, wordNode, card.word)
      },
      ['scrambleText'],
    ).then((fn) => {
      if (cancelled) fn()
      else revert = fn
    })

    return () => {
      cancelled = true
      revert()
    }
  }, [card.id, card.word])

  return (
    <div ref={rootRef} className="flex flex-1 flex-col gap-4">
      {/*
        `justify-center` bilan o'ralgan blok: tanishtirishda kontent kam va
        uni tepada qoldirsak ekranning yarmi bo'sh qolardi.

        Nishon ham SHU blok ichida: tashqarida qolganda u ekran tepasida
        yolg'iz osilib turar, karta esa o'rtada — ikkisi bir-biriga
        aloqasiz ko'rinardi.
      */}
      <div className="flex flex-1 flex-col justify-center gap-4">
      <p
        data-intro
        className="self-start rounded-full bg-flame-500/15 px-3 py-1 text-xs font-extrabold text-flame-700"
      >
        {/* Bosh ekranda ochilgan kunning so'zi darsda uchradi — "buni bilasan!" */}
        {isRevealedWordOfDay ? '🔮 Kunning so‘zi — buni bilasan!' : '✨ Yangi so‘z'}
      </p>
      <Panel
        data-intro
        className={cn(
          'relative flex flex-col items-center gap-3 overflow-hidden py-6 text-center',
          // Arab so'zi uchun girih (geometrik) naqsh — arab yozuvining
          // madaniy muhiti, 6% shaffoflikda: matnga xalaqit bermaydi
          language.dir === 'rtl' && 'arabesque',
        )}
      >
        {/* Rasmi bor so'zlarda ma'no matndan OLDIN ko'rinadi */}
        <WordImage translation={card.translation} size="lg" />

        <div dir={language.dir} lang={language.code}>
          {/*
            `key={card.id}`: ScrambleText `<p>` ning matn tugunini
            almashtiradi; React eski tugunni ushlab qolib, keyingi so'zni
            YANGILAMASLIGI mumkin edi. Har so'zda element qaytadan yaratiladi.
          */}
          <WordDisplay key={card.id} text={card.word} language={language} testId="intro-word" />
        </div>

        <div className="flex items-center gap-2">
          <SpeakButton text={card.word} locale={language.speechLocale} size="lg" />
          <PronounceButton
            text={card.word}
            locale={language.speechLocale}
            language={language.code}
          />
        </div>

        {/* Ajratuvchi chiziq: so'z va tarjima ikki alohida narsa ekani ko'rinsin */}
        <span aria-hidden="true" className="h-px w-16 bg-ink-300" />

        <p className="text-2xl font-extrabold text-brand-700">
          {/*
            Ekran o'quvchi kartani "вода, voda, suv" deb o'qiydi va
            oxirgisi TARJIMA ekani hech nimadan bilinmaydi — chiziq
            faqat ko'z uchun. Ko'rinmas yorliq shu bog'lanishni aytadi.
          */}
          <span className="sr-only">Ma'nosi: </span>
          {card.translation}
        </p>
      </Panel>

      {card.sentence && (
        <Panel data-intro padding="sm" className="text-center">
          <p
            dir={language.dir}
            lang={language.code}
            // Arabcha jumla kattaroq — 16 px Nasx yozuvi bola uchun mayda
            className={cn('font-bold', language.dir === 'rtl' && 'text-xl leading-relaxed')}
          >
            {card.sentence}
          </p>
          {/*
            Jumlaning O'QILISHI — so'zdagi kabi. Arab yozuvini endi
            o'rganayotgan bola jumlani ko'radi, lekin o'qiy olmaydi;
            transliteratsiya uni ovoz chiqarib o'qishga imkon beradi.
          */}
          {sentenceReading && (
            <p
              dir="ltr"
              lang="uz"
              data-testid="intro-sentence-reading"
              className="mt-0.5 text-xs text-ink-600"
            >
              {sentenceReading}
            </p>
          )}
          {card.sentenceTranslation && (
            <p className="mt-1 text-sm text-ink-600">{card.sentenceTranslation}</p>
          )}
        </Panel>
      )}
      </div>

      <div className="pt-2">
        <Button block size="lg" onClick={onContinue}>
          Tushundim
        </Button>
      </div>
    </div>
  )
}

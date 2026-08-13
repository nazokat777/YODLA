import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Mascot } from '@/components/ui/Mascot'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { SpeakButton } from '@/components/ui/SpeakButton'
import { loadLanguageDeck } from '@/content/starterDecks'
import { LANGUAGES } from '@/core/config/languages'
import { LEVEL_ORDER } from '@/core/config/levels'
import { buildPlacementQuiz, scorePlacement, type PlacementQuestion } from '@/core/placement'
import type { LanguageCode, LevelCode } from '@/core/types'
import { cn } from '@/lib/cn'

interface PlacementStepProps {
  language: LanguageCode
  /** Test tugadi (yoki o'tkazib yuborildi) — natija bilan */
  onDone: (level: LevelCode) => void
}

/** Boshlang'ich hisob: har daraja uchun nol to'g'ri javob */
function emptyScore(): Record<LevelCode, number> {
  return LEVEL_ORDER.reduce(
    (acc, level) => ({ ...acc, [level]: 0 }),
    {} as Record<LevelCode, number>,
  )
}

/**
 * Onboarding, 2-qadam: daraja testi.
 *
 * MUHIM: bu yerda `SessionRunner` ISHLATILMAYDI va bazaga hech narsa
 * yozilmaydi. `SessionRunner` har javobni SM-2 bahosi, XP va kunlik
 * statistika sifatida yozadi — natijada foydalanuvchi hali o'rganishni
 * boshlamasdan turib bilmagan so'zlari "unutilgan" deb belgilanardi.
 * Bu yerdan faqat bitta qiymat chiqadi: boshlang'ich daraja.
 */
export function PlacementStep({ language, onDone }: PlacementStepProps) {
  const meta = LANGUAGES[language]

  // Savollar lug'atdan yasaladi — lug'at dangasa yuklanadi. Bir marta
  // yasaladi: har javobdan keyin qayta yasalsa, foydalanuvchi siljimasdi
  const [quiz, setQuiz] = useState<PlacementQuestion[]>([])
  useEffect(() => {
    let cancelled = false
    void loadLanguageDeck(language).then((deck) => {
      if (!cancelled) setQuiz(buildPlacementQuiz(deck))
    })
    return () => {
      cancelled = true
    }
  }, [language])

  const [index, setIndex] = useState(0)
  const [score, setScore] = useState<Record<LevelCode, number>>(emptyScore)

  const question = quiz[index]

  // Lug'at hali yuklanmoqda
  if (!question) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <Mascot mood="thinking" size="md" />
        <p className="text-ink-600">Yuklanmoqda…</p>
      </div>
    )
  }

  function handleAnswer(choice: number) {
    const isCorrect = choice === question.correctIndex
    const nextScore = isCorrect
      ? { ...score, [question.level]: score[question.level] + 1 }
      : score

    setScore(nextScore)

    if (index + 1 >= quiz.length) {
      onDone(scorePlacement(nextScore))
      return
    }

    setIndex(index + 1)
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="mb-4 flex flex-col items-center text-center">
        <Mascot mood="thinking" size="md" className="mb-2" />
        <h1 className="text-xl font-extrabold">Darajangizni aniqlaymiz</h1>
        <p className="mt-1 text-sm text-ink-600">
          Bilmasangiz — xato javob ham natijaga yordam beradi.
        </p>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <ProgressBar value={index} max={quiz.length} label="Test progressi" />
        <span data-testid="placement-progress" className="text-sm font-semibold text-ink-600">
          {index + 1}/{quiz.length}
        </span>
      </div>

      <div className="mb-4 flex flex-col items-center gap-2 rounded-2xl border-2 border-ink-300 bg-white p-6">
        <p
          data-testid="placement-word"
          dir={meta.dir}
          lang={meta.code}
          className="text-center text-3xl font-extrabold"
        >
          {question.word}
        </p>
        {/* Notanish yozuvdagi so'zni eshitmasa, foydalanuvchi taxmin qila
            olmaydi — talaffuz testda ham kerak */}
        <SpeakButton text={question.word} locale={meta.speechLocale} />
      </div>

      <ul className="flex flex-col gap-2">
        {question.options.map((option, choice) => (
          <li key={option}>
            <button
              type="button"
              onClick={() => handleAnswer(choice)}
              className={cn(
                'tap-highlight-none w-full rounded-2xl border-2 border-ink-300 bg-white p-4',
                'text-start font-semibold transition-colors hover:border-brand-500',
              )}
            >
              {option}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-6">
        <Button block variant="ghost" onClick={() => onDone('A1')}>
          Testni o'tkazib yuborish
        </Button>
      </div>
    </div>
  )
}

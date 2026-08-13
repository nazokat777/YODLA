import { useEffect, useRef } from 'react'
import { Panel } from '@/components/ui/Panel'
import { LANGUAGES } from '@/core/config/languages'
import type { Exercise } from '@/core/exercises'
import { cn } from '@/lib/cn'
import { speak } from '@/lib/speech'
import { ChoiceGrid } from './ChoiceGrid'
import { SpeakButton } from '@/components/ui/SpeakButton'
import { WordDisplay } from './WordDisplay'
import type { ExerciseAnswerState } from './answerState'

interface ExerciseViewProps {
  exercise: Exercise
  answer: ExerciseAnswerState
  onAnswerChange: (answer: ExerciseAnswerState) => void
  /** Javob berilib, natija ko'rsatilyaptimi */
  revealed: boolean
  /**
   * Javobni tekshirishga yuborish.
   *
   * Javob argument sifatida beriladi, chunki variantli mashqlarda tanlash
   * VA yuborish bir harakatda bo'ladi: `setState` shu render'da hali
   * ko'rinmaydi, shuning uchun tanlangan qiymat to'g'ridan-to'g'ri uzatiladi.
   */
  onSubmit: (answer?: ExerciseAnswerState) => void
}

/**
 * Mashq turiga qarab mos ko'rinishni chizadi.
 *
 * Javob HOLATI bu yerda saqlanmaydi — u yuqoridagi seansda turadi,
 * chunki tekshirish va baholash ham o'sha yerda bo'ladi.
 */
export function ExerciseView(props: ExerciseViewProps) {
  const { exercise } = props
  const language = LANGUAGES[exercise.card.language]

  switch (exercise.type) {
    case 'recognition':
      return (
        <div className="flex flex-col gap-4">
          <Panel className="flex min-h-32 flex-col items-center justify-center gap-2 text-center">
            <WordDisplay text={exercise.prompt} language={language} testId="exercise-prompt" />
            {/* So'zni o'qiy olmaslik — notanish yozuvda eng katta to'siq */}
            <SpeakButton text={exercise.prompt} locale={language.speechLocale} size="lg" />
          </Panel>
          <p className="text-sm font-semibold text-ink-600">Bu so'z nimani anglatadi?</p>
          <ChoiceGrid
            options={exercise.options}
            correctIndex={exercise.correctIndex}
            selectedIndex={props.answer.choiceIndex}
            revealed={props.revealed}
            onSelect={(choiceIndex) => {
              // Variant tanlash = javob berish: alohida "Tekshirish" qadami
              // seans ritmini buzadi
              const chosen = { ...props.answer, choiceIndex }
              props.onAnswerChange(chosen)
              props.onSubmit(chosen)
            }}
          />
        </div>
      )

    case 'listening':
      return (
        <ListeningView
          {...props}
          exercise={exercise}
          speechLocale={language.speechLocale}
        />
      )

    case 'recall':
      return (
        <RecallView {...props} exercise={exercise} />
      )

    case 'construction':
      return <ConstructionView {...props} exercise={exercise} />

    case 'cloze':
      return <ClozeView {...props} exercise={exercise} />

    case 'spelling':
      return <SpellingView {...props} exercise={exercise} />

    // Juft topish o'z ko'rinishida (MatchingView) seans darajasida chiziladi
    case 'matching':
      return null
  }
}

/* ------------------------------------------------------------------ */

/** 3. Eshitib tushunish */
function ListeningView({
  exercise,
  answer,
  onAnswerChange,
  onSubmit,
  revealed,
  speechLocale,
}: ExerciseViewProps & {
  exercise: Extract<Exercise, { type: 'listening' }>
  speechLocale: string
}) {
  // Mashq ochilganda so'z bir marta o'qib beriladi
  useEffect(() => {
    speak(exercise.spokenText, speechLocale)
  }, [exercise.spokenText, speechLocale])

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex min-h-32 flex-col items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => speak(exercise.spokenText, speechLocale)}
          aria-label="So'zni qayta eshitish"
          className="tap-highlight-none flex h-20 w-20 items-center justify-center rounded-full bg-brand-500 text-4xl text-white shadow-[0_4px_0_0] shadow-brand-700 transition-transform active:translate-y-[2px] active:shadow-none"
        >
          🔊
        </button>
        <p className="text-sm text-ink-600">Eshitish uchun bosing</p>
      </Panel>

      <p className="text-sm font-semibold text-ink-600">Nima eshitdingiz?</p>
      <ChoiceGrid
        options={exercise.options}
        correctIndex={exercise.correctIndex}
        selectedIndex={answer.choiceIndex}
        revealed={revealed}
        onSelect={(choiceIndex) => {
          const chosen = { ...answer, choiceIndex }
          onAnswerChange(chosen)
          onSubmit(chosen)
        }}
      />
    </div>
  )
}

/** 2. Eslab yozish */
function RecallView({
  exercise,
  answer,
  onAnswerChange,
  revealed,
  onSubmit,
}: ExerciseViewProps & { exercise: Extract<Exercise, { type: 'recall' }> }) {
  const language = LANGUAGES[exercise.card.language]
  const inputRef = useRef<HTMLInputElement>(null)

  // Yangi mashq ochilganda kursor darhol maydonda bo'ladi
  useEffect(() => {
    inputRef.current?.focus()
  }, [exercise.id])

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex min-h-32 flex-col items-center justify-center gap-1 text-center">
        <p className="text-sm text-ink-600">Bu so'zni {language.name}da yozing</p>
        <p className="text-3xl font-extrabold">{exercise.prompt}</p>
      </Panel>

      <input
        ref={inputRef}
        type="text"
        value={answer.text}
        disabled={revealed}
        dir={language.dir}
        lang={language.code}
        onChange={(event) => onAnswerChange({ ...answer, text: event.target.value })}
        onKeyDown={(event) => {
          if (event.key === 'Enter') onSubmit()
        }}
        placeholder="Javobingiz…"
        // Mobil klaviaturada avtomatik tuzatishlar mashqni buzadi
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        aria-label="Javob"
        className={cn(
          'h-14 w-full rounded-2xl border-2 border-ink-300 bg-white px-4 text-lg font-semibold',
          'focus:border-brand-500 focus:outline-none disabled:bg-slate-50',
          language.dir === 'rtl' && 'text-2xl',
        )}
      />
    </div>
  )
}

/** 4. Jumla qurish */
function ConstructionView({
  exercise,
  answer,
  onAnswerChange,
  revealed,
}: ExerciseViewProps & { exercise: Extract<Exercise, { type: 'construction' }> }) {
  const language = LANGUAGES[exercise.card.language]
  const used = new Set(answer.tokenOrder)
  const poolRef = useRef<HTMLDivElement>(null)

  function addToken(index: number) {
    if (revealed || used.has(index)) return

    onAnswerChange({ ...answer, tokenOrder: [...answer.tokenOrder, index] })

    // Bosilgan tugma yashiriladi va fokus <body> ga tushib ketardi — keyingi
    // so'zga yetish uchun klaviatura foydalanuvchisi sahifa boshidan qayta
    // Tab bosishga majbur bo'lardi. Fokusni keyingi mavjud so'zga ko'chiramiz.
    requestAnimationFrame(() => {
      const next = poolRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')
      next?.focus({ preventScroll: true })
    })
  }

  function removeToken(position: number) {
    if (revealed) return
    onAnswerChange({
      ...answer,
      tokenOrder: answer.tokenOrder.filter((_, i) => i !== position),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex min-h-24 flex-col items-center justify-center gap-1 text-center">
        <p className="text-sm text-ink-600">Shu jumlani tuzing</p>
        <p className="text-xl font-bold">{exercise.prompt}</p>
      </Panel>

      {/* Yig'ilayotgan jumla */}
      <div
        dir={language.dir}
        className="flex min-h-16 flex-wrap content-start gap-2 rounded-2xl border-2 border-dashed border-ink-300 p-3"
      >
        {answer.tokenOrder.length === 0 && (
          <p className="text-sm text-ink-600">So'zlarni tartib bilan bosing…</p>
        )}
        {answer.tokenOrder.map((tokenIndex, position) => (
          <button
            key={`${tokenIndex}-${position}`}
            type="button"
            disabled={revealed}
            onClick={() => removeToken(position)}
            lang={language.code}
            // Yig'ilgan va tanlanmagan so'zlar bir xil matnga ega — ekran
            // o'quvchi ularni faqat shu nom orqali farqlaydi
            aria-label={`${exercise.tokens[tokenIndex]} — olib tashlash`}
            className="tap-highlight-none min-h-11 rounded-xl border-2 border-brand-500 bg-brand-50 px-3 py-2 font-semibold"
          >
            {exercise.tokens[tokenIndex]}
          </button>
        ))}
      </div>

      {/* Tanlanmagan so'zlar */}
      <div ref={poolRef} dir={language.dir} className="flex flex-wrap gap-2">
        {exercise.tokens.map((token, index) => (
          <button
            key={`${token}-${index}`}
            type="button"
            disabled={revealed || used.has(index)}
            onClick={() => addToken(index)}
            lang={language.code}
            aria-label={`${token} — qo'shish`}
            className={cn(
              'tap-highlight-none min-h-11 rounded-xl border-2 border-ink-300 bg-white px-3 py-2 font-semibold transition-opacity',
              used.has(index) && 'invisible',
            )}
          >
            {token}
          </button>
        ))}
      </div>
    </div>
  )
}

/** 5. Gap ichida — jumlada tushib qolgan so'zni tanlash */
function ClozeView({
  exercise,
  answer,
  onAnswerChange,
  onSubmit,
  revealed,
}: ExerciseViewProps & { exercise: Extract<Exercise, { type: 'cloze' }> }) {
  const language = LANGUAGES[exercise.card.language]

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex min-h-32 flex-col items-center justify-center gap-2 text-center">
        <p className="text-sm text-ink-600">Tushib qolgan so'zni toping</p>
        <p
          dir={language.dir}
          lang={language.code}
          data-testid="cloze-sentence"
          className={cn('text-2xl font-bold leading-relaxed', language.dir === 'rtl' && 'text-3xl')}
        >
          {exercise.prompt}
        </p>
      </Panel>

      <ChoiceGrid
        options={exercise.options}
        correctIndex={exercise.correctIndex}
        selectedIndex={answer.choiceIndex}
        revealed={revealed}
        onSelect={(choiceIndex) => {
          // Tanib olish kabi: variant tanlash o'zi javob berish hisoblanadi
          const chosen = { ...answer, choiceIndex }
          onAnswerChange(chosen)
          onSubmit(chosen)
        }}
      />
    </div>
  )
}

/** 6. Harfma-harf — aralash harflardan so'zni yig'ish */
function SpellingView({
  exercise,
  answer,
  onAnswerChange,
  revealed,
}: ExerciseViewProps & { exercise: Extract<Exercise, { type: 'spelling' }> }) {
  const language = LANGUAGES[exercise.card.language]
  const used = new Set(answer.tokenOrder)
  const poolRef = useRef<HTMLDivElement>(null)

  function addLetter(index: number) {
    if (revealed || used.has(index)) return

    onAnswerChange({ ...answer, tokenOrder: [...answer.tokenOrder, index] })

    // Jumla qurishdagi kabi: bosilgan tugma yashirilganda fokus <body> ga
    // tushib ketmasligi uchun keyingi mavjud harfga ko'chiriladi
    requestAnimationFrame(() => {
      const next = poolRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')
      next?.focus({ preventScroll: true })
    })
  }

  function removeLetter(position: number) {
    if (revealed) return

    onAnswerChange({
      ...answer,
      tokenOrder: answer.tokenOrder.filter((_, i) => i !== position),
    })
  }

  return (
    <div className="flex flex-col gap-4">
      <Panel className="flex min-h-24 flex-col items-center justify-center gap-1 text-center">
        <p className="text-sm text-ink-600">Bu so'zni harflardan yig'ing</p>
        <p className="text-xl font-bold">{exercise.prompt}</p>
      </Panel>

      {/* Yig'ilayotgan so'z — bo'sh kataklar nechta harf kerakligini ko'rsatadi */}
      <div className="flex min-h-16 flex-wrap content-start items-center gap-2 rounded-2xl border-2 border-dashed border-ink-300 p-3">
        {answer.tokenOrder.map((letterIndex, position) => (
          <button
            key={`${letterIndex}-${position}`}
            type="button"
            disabled={revealed}
            onClick={() => removeLetter(position)}
            lang={language.code}
            // Yig'ilgan va tanlanmagan harflar bir xil matnga ega — ekran
            // o'quvchi ularni faqat shu nom orqali farqlaydi
            aria-label={`${exercise.letters[letterIndex]} — olib tashlash`}
            className="tap-highlight-none flex h-12 w-11 items-center justify-center rounded-xl border-2 border-brand-500 bg-brand-50 text-xl font-extrabold"
          >
            {exercise.letters[letterIndex]}
          </button>
        ))}

        {/* Qolgan joylar — nechta harf kutilayotgani ko'rinib turadi */}
        {Array.from({ length: exercise.letters.length - answer.tokenOrder.length }).map(
          (_, position) => (
            <span
              key={`bosh-${position}`}
              aria-hidden="true"
              className="h-12 w-11 rounded-xl border-2 border-ink-300/60 bg-slate-50"
            />
          ),
        )}
      </div>

      {/* Tanlanmagan harflar */}
      <div ref={poolRef} className="flex flex-wrap justify-center gap-2">
        {exercise.letters.map((letter, index) => (
          <button
            key={`${letter}-${index}`}
            type="button"
            disabled={revealed || used.has(index)}
            onClick={() => addLetter(index)}
            lang={language.code}
            aria-label={`${letter} — qo'shish`}
            className={cn(
              'tap-highlight-none flex h-12 w-11 items-center justify-center rounded-xl border-2 border-ink-300 bg-white text-xl font-extrabold shadow-[0_2px_0_0] shadow-ink-300 transition-transform active:translate-y-[2px] active:shadow-none',
              used.has(index) && 'invisible',
            )}
          >
            {letter}
          </button>
        ))}
      </div>
    </div>
  )
}

import type { CardRecord } from '@/core/db'
import type { ExerciseType } from '@/core/types'

/** Har bir mashq turining umumiy qismi */
interface BaseExercise {
  /** Reyt va tahlil uchun barqaror identifikator */
  id: string
  type: ExerciseType
  /** Mashq qaysi karta uchun yaratilgan */
  card: CardRecord
}

/** 1. Tanib olish (oson): variantlardan to'g'ri tarjimani tanla */
export interface RecognitionExercise extends BaseExercise {
  type: 'recognition'
  /** O'rganilayotgan tildagi so'z */
  prompt: string
  /** Tarjima variantlari (2–4 ta) */
  options: string[]
  correctIndex: number
}

/** 2. Eslab yozish (o'rta): tarjimani ko'rib, so'zni klaviaturadan yoz */
export interface RecallExercise extends BaseExercise {
  type: 'recall'
  /** O'zbekcha tarjima */
  prompt: string
  /** Kutilayotgan so'z */
  answer: string
}

/** 3. Eshitib tushunish: audio eshitib, ma'nosini tanla */
export interface ListeningExercise extends BaseExercise {
  type: 'listening'
  /** TTS o'qiydigan matn */
  spokenText: string
  options: string[]
  correctIndex: number
}

/** 4. Jumla qurish (qiyin): so'zlardan to'g'ri jumla tuz */
export interface ConstructionExercise extends BaseExercise {
  type: 'construction'
  /** O'zbekcha jumla — nima qurish kerakligi */
  prompt: string
  /** Aralashtirilgan so'zlar */
  tokens: string[]
  /** To'g'ri jumla */
  answer: string
}

/** 5. Gap ichida (o'rta): jumlada tushgan so'zni variantlardan tanla */
export interface ClozeExercise extends BaseExercise {
  type: 'cloze'
  /** Jumla — o'rganilayotgan so'z o'rnida "___" */
  prompt: string
  /** O'RGANILAYOTGAN tildagi so'z variantlari (tarjima emas) */
  options: string[]
  correctIndex: number
}

/** 6. Harfma-harf (qiyin): aralash harflardan so'zni yig' */
export interface SpellingExercise extends BaseExercise {
  type: 'spelling'
  /** O'zbekcha tarjima — nima yozish kerakligi */
  prompt: string
  /** Aralashtirilgan harflar */
  letters: string[]
  /** To'g'ri so'z */
  answer: string
}

/** Juft topishdagi bitta juft */
export interface MatchingPair {
  cardId: string
  /** O'rganilayotgan tildagi so'z */
  word: string
  /** O'zbekcha tarjima */
  translation: string
}

/** 7. Juft topish (ko'p-kartali): so'z va tarjimani juftla */
export interface MatchingExercise extends BaseExercise {
  type: 'matching'
  /** Juftlanishi kerak bo'lgan kartalar (odatda 5 ta) */
  pairs: MatchingPair[]
}

export type Exercise =
  | RecognitionExercise
  | RecallExercise
  | ListeningExercise
  | ConstructionExercise
  | ClozeExercise
  | SpellingExercise
  | MatchingExercise

/** Javob natijasi */
export type AnswerVerdict =
  /** To'liq to'g'ri */
  | 'correct'
  /** Deyarli to'g'ri — kichik imlo xatosi (jazolanmaydi, lekin oson emas) */
  | 'almost'
  | 'wrong'

/** Variantli mashqlardagi maksimal variantlar soni */
export const MAX_CHOICES = 4

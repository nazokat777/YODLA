import type { BookStats } from './books'

/**
 * O'QUV REJASI — "bu kitobni necha kunda tugataman".
 *
 * NEGA KERAK: "3640 ta so'z" — bu son bolani ham, ota-onani ham
 * qo'rqitadi. "Kuniga 20 ta so'z — 3 oyda tugaysan" esa BAJARILADIGAN
 * vazifa. Katta maqsadni kunlik ulushga bo'lish (implementation
 * intentions, Gollwitzer 1999) bajarilish ehtimolini sezilarli
 * oshiradi: bola nima qilishini va qachon tugashini biladi.
 *
 * Reja SM-2 ni ALMASHTIRMAYDI: u faqat "bugun nechta YANGI so'z olaman"
 * ni belgilaydi. Takrorlash baribir muddati kelganda chiqadi — aks
 * holda reja tezlashib, yodlangan so'zlar unutilib ketardi.
 */
export interface StudyPlan {
  /** Qaysi kitob */
  bookId: string
  /** Necha kunda tugatish maqsadi */
  days: number
  /** Reja boshlangan kun (kun boshi timestamp) */
  startedAt: number
  /** Reja boshlanganda shu kitobdan nechta so'z bilingan edi */
  learnedAtStart: number
}

/** Tayyor variantlar — bola/ota-ona tanlashi uchun */
export const PLAN_PRESETS = [
  { days: 30, label: '1 oy', hint: 'Jadal' },
  { days: 60, label: '2 oy', hint: 'Muvozanatli' },
  { days: 90, label: '3 oy', hint: 'Bemalol' },
  { days: 180, label: '6 oy', hint: 'Sekin, barqaror' },
] as const

/** Kunlik ulush — reja natijasi */
export interface PlanPace {
  /** Kuniga nechta YANGI so'z */
  wordsPerDay: number
  /** Kuniga taxminan nechta dars */
  lessonsPerDay: number
  /** Kuniga taxminiy vaqt (daqiqa) */
  minutesPerDay: number
  /** Qolgan so'zlar */
  remainingWords: number
  /** Shu sur'atda necha kun kerak */
  daysNeeded: number
}

/**
 * Bitta YANGI so'zga ketadigan o'rtacha vaqt (soniya).
 *
 * O'lchov: tanishtiruv + o'zlashtirish mashqlari ≈ 45 s, ustiga o'sha
 * kunning takrorlashidan ulush ≈ 15 s. Ya'ni kuniga 20 yangi so'z
 * taxminan 20 daqiqa.
 */
export const SECONDS_PER_NEW_WORD = 60

/** Rejadan kunlik sur'at */
export function planPace(book: BookStats, days: number): PlanPace {
  const remainingWords = Math.max(0, book.words - book.learned)
  const safeDays = Math.max(1, days)
  const wordsPerDay = Math.max(1, Math.ceil(remainingWords / safeDays))
  const perLesson = book.wordsPerLesson || 1

  return {
    wordsPerDay,
    lessonsPerDay: Math.max(1, Math.round(wordsPerDay / perLesson)),
    minutesPerDay: Math.max(1, Math.round((wordsPerDay * SECONDS_PER_NEW_WORD) / 60)),
    remainingWords,
    daysNeeded: remainingWords === 0 ? 0 : Math.ceil(remainingWords / wordsPerDay),
  }
}

/** Reja bo'yicha bugungi holat */
export interface PlanProgress {
  /** Reja boshlanganidan beri o'tgan kunlar (bugun = 1) */
  dayNumber: number
  /**
   * Bugun BOSHLANGUNCHA rejada bajarilgan bo'lishi kerak so'zlar.
   *
   * Bugungi ulush bunga KIRMAYDI: aks holda kun boshida bola darhol
   * "orqada" bo'lib chiqar va vazifasi ikkilanardi.
   */
  expectedWords: number
  /** Reja boshlanganidan beri haqiqatda o'rganilgan */
  learnedWords: number
  /** Reja qamragan jami so'zlar */
  targetWords: number
  /** Rejadan orqada (0 — orqada emas) */
  behind: number
  /** Rejadan oldinda (0 — oldinda emas) */
  ahead: number
  /** Shu sur'atda tugash sanasi (timestamp) */
  finishAt: number
  /** Reja bajarildi */
  done: boolean
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Reja bo'yicha hozirgi holat.
 *
 * `learnedAtStart` — reja boshlanganda nechta so'z bilingan edi: reja
 * O'SHANDAN buyon qo'shilganini sanaydi, aks holda ilgari o'rgangan
 * so'zlar "bugungi ish" bo'lib ko'rinardi va reja birinchi kuniyoq
 * "bajarilgan" bo'lib chiqardi.
 */
export function planProgress(book: BookStats, plan: StudyPlan, now: number): PlanProgress {
  const dayNumber = Math.max(1, Math.floor((now - plan.startedAt) / DAY_MS) + 1)
  const targetWords = Math.max(0, book.words - plan.learnedAtStart)
  const perDay = Math.max(1, Math.ceil(targetWords / Math.max(1, plan.days)))
  const expectedWords = Math.min(targetWords, perDay * (dayNumber - 1))
  const learnedWords = Math.max(0, book.learned - plan.learnedAtStart)
  const left = Math.max(0, targetWords - learnedWords)

  return {
    dayNumber,
    expectedWords,
    learnedWords,
    targetWords,
    behind: Math.max(0, expectedWords - learnedWords),
    ahead: Math.max(0, learnedWords - expectedWords),
    finishAt: now + Math.ceil(left / perDay) * DAY_MS,
    done: left === 0,
  }
}

/**
 * MINIMAL PLANKA — "eng yomon kuningizda ham" bajariladigan ulush.
 *
 * Manba: mnemonika darslaridagi eng amaliy qoida — bardavomlik
 * intensivlikdan ustun. Haftada ikki kun uzoq o'tirgandan ko'ra har
 * kuni 15 daqiqa. Planka shunchalik kichik bo'lishi kerakki, kasal,
 * charchagan yoki band kunda ham bajarilsin — zanjir uzilmasin.
 */
export const MIN_DAILY_WORDS = 5

/** Bugungi vazifa — chek-ro'yxat uchun */
export interface DailyTask {
  /** Bugun olinishi kerak yangi so'zlar */
  newWords: number
  /** Bugun allaqachon olingan */
  doneWords: number
  /** Qoldi */
  leftWords: number
  /** Vazifa bajarildi */
  done: boolean
  /** Minimal planka (eng yomon kunda ham shuncha) */
  minWords: number
  /** Planka bajarildi — zanjir saqlandi */
  minDone: boolean
}

/**
 * Bugungi vazifa.
 *
 * Orqada qolgan bo'lsa ulush oshadi, lekin IKKI BARAVARDAN ko'p emas:
 * "60 ta so'z" degan vazifa bolani butunlay to'xtatib qo'yardi — u
 * o'zini aybdor his qiladi va ilovani tashlab ketadi. Qolgani rejaning
 * oxiriga suriladi.
 */
export function dailyTask(pace: PlanPace, progress: PlanProgress, doneToday: number): DailyTask {
  const catchUp = Math.min(pace.wordsPerDay * 2, pace.wordsPerDay + progress.behind)
  const newWords = progress.done ? 0 : catchUp
  // Planka vazifadan katta bo'lolmaydi: kuniga 2 so'zlik rejada
  // "kamida 5 ta" deyish mantiqsiz bo'lardi
  const minWords = progress.done ? 0 : Math.min(MIN_DAILY_WORDS, newWords)

  return {
    newWords,
    doneWords: Math.min(doneToday, newWords),
    leftWords: Math.max(0, newWords - doneToday),
    done: doneToday >= newWords,
    minWords,
    minDone: doneToday >= minWords,
  }
}

import type { ScriptCode } from '@/core/types'

/**
 * Notanish yozuvni o'zbek lotin alifbosida "o'qishga yordam" sifatida
 * ko'rsatish.
 *
 * Bu ILMIY transliteratsiya emas (ISO/DIN diakritikalari yo'q): maqsad —
 * boshlang'ich o'rganuvchi so'zni ovoz chiqarib o'qiy olishi. Shuning uchun
 * belgilar o'zbekcha odatiy yozilishga moslangan: خ → x, ش → sh, غ → g'.
 *
 * Nega kontentga qo'lda yozilmagan: arabcha so'zlar HARAKAT bilan
 * kiritilgan, ya'ni unlilar matnning o'zida bor — shuning uchun o'qilishni
 * hisoblab chiqarish mumkin. Har yangi so'z uchun qo'shimcha maydon
 * to'ldirish shart emas va xato qilish ehtimoli yo'q.
 */

/** Arab undoshlari va uzun unlilari */
const ARABIC_LETTERS: Record<string, string> = {
  ا: 'a',
  أ: 'a',
  إ: 'i',
  آ: 'a',
  ب: 'b',
  ت: 't',
  ث: 's',
  ج: 'j',
  ح: 'h',
  خ: 'x',
  د: 'd',
  ذ: 'z',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'd',
  ط: 't',
  ظ: 'z',
  ع: "'",
  غ: "g'",
  ف: 'f',
  ق: 'q',
  ك: 'k',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
  و: 'v',
  ي: 'y',
  ى: 'a',
  ة: 'a',
  ء: "'",
  ئ: "'",
  ؤ: "'",
}

/** Harakatlar (qisqa unlilar va tanvin) */
const ARABIC_MARKS: Record<string, string> = {
  'َ': 'a', // fatha
  'ِ': 'i', // kasra
  'ُ': 'u', // damma
  'ً': 'an', // tanvin fath
  'ٍ': 'in', // tanvin kasr
  'ٌ': 'un', // tanvin zamm
  'ٰ': 'a', // xanjar alif
}

const SUKUN = 'ْ'
const SHADDA = 'ّ'
const TATWEEL = 'ـ'

/**
 * Uzun unli belgilari qaysi qisqa unlidan keyin "cho'zilish" hisoblanadi.
 * Masalan `كِتَاب`: fathadan keyingi ا yangi tovush emas — "kitaab" emas,
 * "kitab" deb o'qiladi.
 */
const LENGTHENING: Record<string, string> = { ا: 'a', و: 'u', ي: 'i' }

/** Ta marbuta — so'z oxiridagi "a"; oldida unli bo'lsa takrorlanmaydi */
const TA_MARBUTA = 'ة'

/**
 * Alif oilasi: so'z boshida "tayanch" vazifasini bajaradi, so'z ichida esa
 * hamza (bo'g'iz to'xtami) bo'lib o'qiladi.
 */
const ALEF_FAMILY: Record<string, string> = { ا: 'a', أ: 'a', إ: 'i', آ: 'a' }

interface Part {
  text: string
  /** Shadda aynan undoshni ikkilantiradi, unlini emas */
  isConsonant: boolean
}

function transliterateArabic(text: string): string {
  const parts: Part[] = []
  const flat = () => parts.map((part) => part.text).join('')
  /** Oldingi manba belgisi tanvin edimi — undan keyingi alif o'qilmaydi */
  let afterTanwin = false

  const chars = [...text]

  for (const [position, char] of chars.entries()) {
    if (char === TATWEEL || char === SUKUN) {
      if (char === SUKUN) afterTanwin = false
      continue
    }

    if (char === SHADDA) {
      // DIQQAT: arabchada shadda harakatdan KEYIN yoziladi (`فَّ`), shuning
      // uchun "oxirgi chiqarilgan belgi" emas, oxirgi UNDOSH ikkilantiriladi
      const lastConsonant = parts.findLastIndex((part) => part.isConsonant)
      if (lastConsonant !== -1) {
        parts.splice(lastConsonant + 1, 0, { ...parts[lastConsonant] })
      }
      continue
    }

    const mark = ARABIC_MARKS[char]
    if (mark !== undefined) {
      parts.push({ text: mark, isConsonant: false })
      afterTanwin = mark.length === 2
      continue
    }

    if (char === TA_MARBUTA) {
      afterTanwin = false
      if (!flat().endsWith('a')) parts.push({ text: 'a', isConsonant: false })
      continue
    }

    const alef = ALEF_FAMILY[char]
    if (alef !== undefined) {
      const atWordStart = position === 0 || chars[position - 1] === ' '
      const next = chars[position + 1]
      const nextIsMark = next !== undefined && next in ARABIC_MARKS

      if (atWordStart) {
        afterTanwin = false
        // Harakat unlini o'zi beradi: `أَب` → "ab", `اِثْنَان` → "isnan".
        // Aks holda tayanch alif ham unli bo'lib qo'shilib ketardi ("aab").
        if (nextIsMark) continue

        parts.push({ text: alef, isConsonant: false })
        continue
      }

      // So'z ichidagi hamza — bo'g'iz to'xtami: `يَأْكُل` → "ya'kul"
      if (char !== 'ا') {
        afterTanwin = false
        parts.push({ text: "'", isConsonant: true })
        continue
      }
    }

    const lengthened = LENGTHENING[char]
    if (lengthened !== undefined) {
      // Tanvindan keyingi alif (`شُكْرًا`) — imlo belgisi, tovush emas
      if (afterTanwin) {
        afterTanwin = false
        continue
      }

      // O'zidan keyin harakat kelsa, bu UNDOSH: `حُرِّيَّة` → hurriyya.
      // Cho'ziq unli hech qachon o'z harakatiga ega bo'lmaydi.
      const next = chars[position + 1]
      const carriesVowel = next !== undefined && (next in ARABIC_MARKS || next === SHADDA)

      // Mos qisqa unlidan keyin kelsa — o'sha unlining cho'zig'i
      if (!carriesVowel && flat().endsWith(lengthened)) continue
    }

    afterTanwin = false
    parts.push({ text: ARABIC_LETTERS[char] ?? char, isConsonant: true })
  }

  return flat()
}

/** Kirill harflari (o'zbek lotinига moslangan) */
const CYRILLIC: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'yo',
  ж: 'j',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'x',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: "'",
  ы: 'i',
  ь: "'",
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

/** `ё` bu undoshlardan keyin "yo" emas, "o" bo'lib o'qiladi: `жёлтый` → joltiy */
const HUSHING = new Set(['ж', 'ч', 'ш', 'щ'])

function transliterateCyrillic(text: string): string {
  let out = ''
  let previous = ''

  for (const char of text) {
    const lower = char.toLowerCase()
    let mapped = CYRILLIC[lower]

    if (mapped === undefined) {
      out += char
      previous = lower
      continue
    }

    if (lower === 'ё' && HUSHING.has(previous)) mapped = 'o'

    // Bosh harf manbada bo'lsa, natijada ham bosh harf bo'ladi
    out += char === lower ? mapped : mapped.charAt(0).toUpperCase() + mapped.slice(1)
    previous = lower
  }

  return out
}

/**
 * Matnning o'qilishini qaytaradi. Lotin yozuvi uchun (yoki matn bo'sh
 * bo'lsa) `null` — chunki u yerda yordam kerak emas va bo'sh qator
 * interfeysда joy egallamasligi kerak.
 */
export function transliterate(text: string, script: ScriptCode): string | null {
  if (script === 'latin' || text.trim().length === 0) return null

  const result = script === 'arabic' ? transliterateArabic(text) : transliterateCyrillic(text)

  return result.trim().length > 0 ? result : null
}

import { db } from '@/core/db'

/**
 * Lug'atdan MAQSADLI ravishda chiqarilgan kartalar.
 *
 * Ikki sabab bor: nomaqbul kontent va BUZUQ kontent. Ikkalasiga ham bir
 * xil mantiq amal qiladi — bola so'zni bir marta ko'rgani uni abadiy
 * qoldirish sababi emas.
 *
 * NEGA ALOHIDA RO'YXAT: `pruneRemovedCards` faqat hali ko'rilmagan
 * kartalarni o'chiradi — foydalanuvchining oylab to'plagan progressini
 * yo'q qilmaslik uchun. Bu to'g'ri qoida, lekin NOMAQBUL KONTENT uchun
 * u teskari ishlaydi: bola `gun` yoki `гей` kartasini bir marta ko'rgani
 * uni abadiy qoldirish sababi emas.
 *
 * Shuning uchun bu ro'yxatdagi kartalar SHARTSIZ o'chiriladi. Yo'qotilgan
 * narsa — bir necha o'nlab so'zning takrorlash jadvali; yutuq — ilova
 * bolaga mos va to'g'ri bo'lib qolishi.
 *
 * Ro'yxat 2026-08-29 da to'ldirildi. Manba lug'atlari KATTALAR uchun
 * tuzilgan (Tatoeba, umumiy ruscha-o'zbekcha lug'at), shuning uchun
 * bunday so'zlar ularga tabiiy tushib qolgan.
 *
 * ARABCHA YO'Q: u Qiroat darsligidan olingan va uning lug'ati kursning
 * mazmuni — `deckIntegrity.test.ts` dagi izohga qarang.
 */
export const RETIRED_CARD_IDS: readonly string[] = [
  // Spirtli ichimlik va tamaki
  'en:beer',
  'en:brewery',
  'en:cig',
  'en:drunk',
  'en:pub',
  'en:smoke',
  'en:smoking',
  'en:wine',
  'ru:алкоголь',
  'ru:курево',
  'ru:нетрезвый',
  // Qurol va zo'ravonlik
  'en:gun',
  'en:guns',
  'en:kill',
  'en:killer',
  'ru:зарезать',
  'ru:застрелить',
  'ru:оружие',
  'ru:убийственный',
  'ru:угробить',
  // O'lim atributlari
  'en:virgo',
  'ru:гроб',
  'ru:могила',
  'ru:останки',
  // Jinsiy mavzu va yalang'ochlik
  'en:sex',
  'ru:гей',
  'ru:голый',
  'ru:догола',
  'ru:нагота',
  // Haqorat
  'en:stupid',
  /*
   * BUZUQ so'zlar — nomaqbul emas, shunchaki mavjud emas.
   *
   * `itt` — `it` ning OCR buzilishi (tarjimasi ham "u"). Uni qoldirish
   * bolaga ingliz tilida yo'q so'zni o'rgatardi.
   *
   * `هِرٌّ` tarjimasi `mushuk (2)` edi: darslikdagi omonim raqami, lekin
   * ikkinchi so'z lug'atga tushmagan — raqam hech nimani ajratmasdi.
   * So'zning o'zi qo'lda yozilgan dekada `mushuk` sifatida bor.
   */
  'en:itt',
  'ar:هِرٌّ',
]

/**
 * Chiqarilgan kartalarni bazadan o'chiradi. O'chirilganlar sonini
 * qaytaradi.
 *
 * Idempotent va arzon: `bulkDelete` birlamchi kalit bo'yicha ishlaydi,
 * yozuvlar o'qilmaydi. Shuning uchun ilova har ochilishida chaqirilishi
 * mumkin.
 */
export async function removeRetiredCards(): Promise<number> {
  const existing = await db.cards.bulkGet([...RETIRED_CARD_IDS])
  const found = RETIRED_CARD_IDS.filter((_, index) => existing[index] !== undefined)

  if (found.length === 0) return 0

  await db.cards.bulkDelete([...found])

  return found.length
}

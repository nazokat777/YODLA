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
  /*
   * DARSLIK IZOHLARI — so'z maydoniga o'zbekcha matn tushib qolgan.
   * "ayollar uchun => eng kuchli maqtov" kartasi bolaga hech nima
   * o'rgatmaydi: ikkala tomon ham o'zbekcha.
   */
  'en:ayollar uchun',
  'en:rasmdan bilinadi',
  'en:neytral kuchaytirish',
  'en:junsiz hayvonlarda',
  'en:suvda yashovchilarda',
  'en:erkak sherda',
  'en:sifat sifatida',
  "en:fe'lda ham",
  'en:buyurtma olish',
  'en:inuit tilidan',
  'en:gap boshida',
  'en:fransuz tilidan',
  'en:xayrlashuv',
  'en:xulosa',
  'en:fresh fish',
  'en:finish university',
  'en:oyoq',
  'en:yostiq',
  'en:oddiy maqtov',
  'en:yaxshi maqtov',
  'en:kuchli maqtov',
  'en:kun qismlari',
  'en:aniq vaqt',
  'en:oraliq',
  'en:aniq son',
  'en:olti oyoq',
  'en:maqtov',
  'en:eng sovuq',
  'en:aniq emas',
  'en:buyruq',
  'en:qarama-qarshilik',
  'en:keyingi voqea',
  'en:qisqartma',
  'en:tovush taqlidi',
  'en:rasmiy taqiq',
  'en:kelajak haqida',
  'en:qisqa javob',
  'en:yerda taraqlaydi',
  'en:asosan ayollar',
  'en:erkaklar uchun',
  'en:orollar nomi',
  'en:xatning boshi',
  'en:tartib sonlar',
  'en:soqchilar kapitani',
  /*
   * Kitob METAMA'LUMOTI va grammatika jadvalining kataklari:
   * `high-speed catamarans => 154-bet` (bet raqami),
   * `sb => somebody = kimdir` (lug'at qisqartmasi),
   * `he is => u ...` (jadval katagi, tugallanmagan tarjima).
   */
  'en:high-speed catamarans',
  'en:sb',
  'en:he is',
  'en:she is',
  'en:they are',
  // Tarjimasi qirqilgan edi: "bir payt ikkovlari..."
  'ar:فِيمَا هُمَا',
  // Tarjima o'rnida izoh edi: "ikkalasi bir xil"
  "en:seven o'clock",
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

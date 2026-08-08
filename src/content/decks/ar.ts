import type { NewCardRecordInput } from '@/core/db'
import type { LevelCode } from '@/core/types'

/**
 * Arab tili to'plami, CEFR darajalari bo'yicha.
 *
 * So'zlar HARAKAT bilan yoziladi (`مَدِينَة`) — to'g'ri talaffuz uchun.
 * `normalize.ts` javob tekshirishda harakatlarni tushiradi, shuning uchun
 * foydalanuvchi harakatsiz yozsa ham javob to'g'ri sanaladi.
 */
export const AR_DECK: Record<LevelCode, NewCardRecordInput[]> = {
  A1: [
    {
      word: 'مَرْحَبًا',
      translation: 'salom',
      language: 'ar',
      topic: 'Salomlashish',
      level: 'A1',
      sentence: 'مرحبا يا صديقي',
      sentenceTranslation: "Salom, do'stim",
    },
    {
      word: 'شُكْرًا',
      translation: 'rahmat',
      language: 'ar',
      topic: 'Salomlashish',
      level: 'A1',
      sentence: 'شكرا جزيلا',
      sentenceTranslation: 'Katta rahmat',
    },
    {
      word: 'مَاء',
      translation: 'suv',
      language: 'ar',
      topic: 'Ovqat',
      level: 'A1',
      sentence: 'أشرب الماء',
      sentenceTranslation: 'Men suv ichaman',
    },
    {
      word: 'خُبْز',
      translation: 'non',
      language: 'ar',
      topic: 'Ovqat',
      level: 'A1',
      sentence: 'الخبز طازج',
      sentenceTranslation: 'Non yangi',
    },
    {
      word: 'صَدِيق',
      translation: "do'st",
      language: 'ar',
      topic: 'Oila',
      level: 'A1',
      sentence: 'هو صديقي',
      sentenceTranslation: "U mening do'stim",
    },
    {
      word: 'بَيْت',
      translation: 'uy',
      language: 'ar',
      topic: 'Oila',
      level: 'A1',
      sentence: 'هذا بيتي',
      sentenceTranslation: 'Bu mening uyim',
    },
    {
      word: 'كِتَاب',
      translation: 'kitob',
      language: 'ar',
      topic: 'Maktab',
      level: 'A1',
      sentence: 'أقرأ الكتاب',
      sentenceTranslation: "Men kitob o'qiyman",
    },
    {
      word: 'صَبَاح',
      translation: 'ertalab',
      language: 'ar',
      topic: 'Vaqt',
      level: 'A1',
      sentence: 'صباح الخير',
      sentenceTranslation: 'Xayrli tong',
    },
    {
      word: 'طَرِيق',
      translation: "yo'l",
      language: 'ar',
      topic: 'Sayohat',
      level: 'A1',
      sentence: 'الطريق طويل',
      sentenceTranslation: "Yo'l uzoq",
    },
    {
      word: 'مَدِينَة',
      translation: 'shahar',
      language: 'ar',
      topic: 'Sayohat',
      level: 'A1',
      sentence: 'المدينة كبيرة',
      sentenceTranslation: 'Shahar katta',
    },
  ],

  A2: [
    {
      word: 'مَطَار',
      translation: 'aeroport',
      language: 'ar',
      topic: 'Sayohat',
      level: 'A2',
      sentence: 'المطار بعيد',
      sentenceTranslation: 'Aeroport uzoqda',
    },
  ],

  B1: [
    {
      word: 'قَرَار',
      translation: 'qaror',
      language: 'ar',
      topic: 'Fikr bildirish',
      level: 'B1',
      sentence: 'كان قرارا صعبا',
      sentenceTranslation: 'Bu qiyin qaror edi',
    },
  ],
}

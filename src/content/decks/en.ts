import type { NewCardRecordInput } from '@/core/db'
import type { LevelCode } from '@/core/types'

/**
 * Ingliz tili to'plami, CEFR darajalari bo'yicha.
 *
 * Har yozuvda qisqa jumla bor: u "jumla qurish" mashqi uchun ishlatiladi
 * va kontekstli kirish beradi (Krashen, i+1). Jumla bo'lmasa, o'sha mashq
 * turi bu karta uchun yaratilmaydi.
 */
export const EN_DECK: Record<LevelCode, NewCardRecordInput[]> = {
  A1: [
    {
      word: 'hello',
      translation: 'salom',
      language: 'en',
      topic: 'Salomlashish',
      level: 'A1',
      sentence: 'Hello my friend',
      sentenceTranslation: "Salom, do'stim",
    },
    {
      word: 'thank you',
      translation: 'rahmat',
      language: 'en',
      topic: 'Salomlashish',
      level: 'A1',
      sentence: 'Thank you very much',
      sentenceTranslation: 'Katta rahmat',
    },
    {
      word: 'water',
      translation: 'suv',
      language: 'en',
      topic: 'Ovqat',
      level: 'A1',
      sentence: 'I drink water',
      sentenceTranslation: 'Men suv ichaman',
    },
    {
      word: 'bread',
      translation: 'non',
      language: 'en',
      topic: 'Ovqat',
      level: 'A1',
      sentence: 'The bread is fresh',
      sentenceTranslation: 'Non yangi',
    },
    {
      word: 'friend',
      translation: "do'st",
      language: 'en',
      topic: 'Oila',
      level: 'A1',
      sentence: 'She is my friend',
      sentenceTranslation: "U mening do'stim",
    },
    {
      word: 'house',
      translation: 'uy',
      language: 'en',
      topic: 'Oila',
      level: 'A1',
      sentence: 'This is my house',
      sentenceTranslation: 'Bu mening uyim',
    },
    {
      word: 'book',
      translation: 'kitob',
      language: 'en',
      topic: 'Maktab',
      level: 'A1',
      sentence: 'I read a book',
      sentenceTranslation: "Men kitob o'qiyman",
    },
    {
      word: 'morning',
      translation: 'ertalab',
      language: 'en',
      topic: 'Vaqt',
      level: 'A1',
      sentence: 'Good morning',
      sentenceTranslation: 'Xayrli tong',
    },
    {
      word: 'road',
      translation: "yo'l",
      language: 'en',
      topic: 'Sayohat',
      level: 'A1',
      sentence: 'The road is long',
      sentenceTranslation: "Yo'l uzoq",
    },
    {
      word: 'city',
      translation: 'shahar',
      language: 'en',
      topic: 'Sayohat',
      level: 'A1',
      sentence: 'The city is big',
      sentenceTranslation: 'Shahar katta',
    },
  ],

  A2: [
    {
      word: 'airport',
      translation: 'aeroport',
      language: 'en',
      topic: 'Sayohat',
      level: 'A2',
      sentence: 'The airport is far',
      sentenceTranslation: 'Aeroport uzoqda',
    },
  ],

  B1: [
    {
      word: 'decision',
      translation: 'qaror',
      language: 'en',
      topic: 'Fikr bildirish',
      level: 'B1',
      sentence: 'It was a hard decision',
      sentenceTranslation: 'Bu qiyin qaror edi',
    },
  ],
}

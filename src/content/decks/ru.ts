import type { NewCardRecordInput } from '@/core/db'
import type { LevelCode } from '@/core/types'

/**
 * Rus tili to'plami, CEFR darajalari bo'yicha.
 *
 * `normalize.ts` javobda `ё` ni `е` ga aylantiradi, shuning uchun `ё` li
 * so'zlar xavfsiz: foydalanuvchi ikkala shaklda yozsa ham to'g'ri sanaladi.
 */
export const RU_DECK: Record<LevelCode, NewCardRecordInput[]> = {
  A1: [
    {
      word: 'привет',
      translation: 'salom',
      language: 'ru',
      topic: 'Salomlashish',
      level: 'A1',
      sentence: 'Привет мой друг',
      sentenceTranslation: "Salom, do'stim",
    },
    {
      word: 'спасибо',
      translation: 'rahmat',
      language: 'ru',
      topic: 'Salomlashish',
      level: 'A1',
      sentence: 'Большое спасибо',
      sentenceTranslation: 'Katta rahmat',
    },
    {
      word: 'вода',
      translation: 'suv',
      language: 'ru',
      topic: 'Ovqat',
      level: 'A1',
      sentence: 'Я пью воду',
      sentenceTranslation: 'Men suv ichaman',
    },
    {
      word: 'хлеб',
      translation: 'non',
      language: 'ru',
      topic: 'Ovqat',
      level: 'A1',
      sentence: 'Хлеб свежий',
      sentenceTranslation: 'Non yangi',
    },
    {
      word: 'друг',
      translation: "do'st",
      language: 'ru',
      topic: 'Oila',
      level: 'A1',
      sentence: 'Он мой друг',
      sentenceTranslation: "U mening do'stim",
    },
    {
      word: 'дом',
      translation: 'uy',
      language: 'ru',
      topic: 'Oila',
      level: 'A1',
      sentence: 'Это мой дом',
      sentenceTranslation: 'Bu mening uyim',
    },
    {
      word: 'книга',
      translation: 'kitob',
      language: 'ru',
      topic: 'Maktab',
      level: 'A1',
      sentence: 'Я читаю книгу',
      sentenceTranslation: "Men kitob o'qiyman",
    },
    {
      word: 'утро',
      translation: 'ertalab',
      language: 'ru',
      topic: 'Vaqt',
      level: 'A1',
      sentence: 'Доброе утро',
      sentenceTranslation: 'Xayrli tong',
    },
    {
      word: 'дорога',
      translation: "yo'l",
      language: 'ru',
      topic: 'Sayohat',
      level: 'A1',
      sentence: 'Дорога длинная',
      sentenceTranslation: "Yo'l uzoq",
    },
    {
      word: 'город',
      translation: 'shahar',
      language: 'ru',
      topic: 'Sayohat',
      level: 'A1',
      sentence: 'Город большой',
      sentenceTranslation: 'Shahar katta',
    },
  ],

  A2: [
    {
      word: 'аэропорт',
      translation: 'aeroport',
      language: 'ru',
      topic: 'Sayohat',
      level: 'A2',
      sentence: 'Аэропорт далеко',
      sentenceTranslation: 'Aeroport uzoqda',
    },
  ],

  B1: [
    {
      word: 'решение',
      translation: 'qaror',
      language: 'ru',
      topic: 'Fikr bildirish',
      level: 'B1',
      sentence: 'Это было трудное решение',
      sentenceTranslation: 'Bu qiyin qaror edi',
    },
  ],
}

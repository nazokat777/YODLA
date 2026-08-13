/**
 * Qo'lda tanlangan qo'shimcha ruscha lug'at (jumlasiz).
 *
 * Diskda tayyor ruscha manba topilmadi, shuning uchun bu so'zlar qo'lda
 * tanlangan. Skript mavjud ru.ts bilan to'qnashuvchi (so'z, tarjima yoki
 * normallashtirilgan shakl) yozuvlarni tashlaydi va sifat qoidalarini
 * `decks.test.ts` bilan bir xil qo'llaydi.
 *
 * Natija: src/content/decks/ru-extra.ts (repoga commit qilinadi).
 * Ishga tushirish:  node scripts/make-ru-extra.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'

const APOS = /['’‘ʻʼ`´′]/g
const normalizeRu = (t) => t.toLowerCase().replace(APOS, "'").replace(/\s+/g, ' ').trim().replace(/ё/g, 'е')

// [ruscha, o'zbekcha, mavzu, daraja]
const WORDS = [
  // A1 — Fe'llar
  ['читать', "o'qimoq", "Fe'llar", 'A1'],
  ['писать', 'yozmoq', "Fe'llar", 'A1'],
  ['говорить', 'gapirmoq', "Fe'llar", 'A1'],
  ['слушать', 'tinglamoq', "Fe'llar", 'A1'],
  ['работать', 'ishlamoq', "Fe'llar", 'A1'],
  ['играть', "o'ynamoq", "Fe'llar", 'A1'],
  ['петь', 'kuylamoq', "Fe'llar", 'A1'],
  ['бежать', 'yugurmoq', "Fe'llar", 'A1'],
  ['прыгать', 'sakramoq', "Fe'llar", 'A1'],
  ['открыть', 'ochmoq', "Fe'llar", 'A1'],
  ['закрыть', 'yopmoq', "Fe'llar", 'A1'],
  ['давать', 'bermoq', "Fe'llar", 'A1'],
  ['любить', 'sevmoq', "Fe'llar", 'A1'],
  ['знать', 'bilmoq', "Fe'llar", 'A1'],
  ['думать', "o'ylamoq", "Fe'llar", 'A1'],
  ['помнить', 'eslamoq', "Fe'llar", 'A1'],
  ['забыть', 'unutmoq', "Fe'llar", 'A1'],
  // A1 — Sifatlar
  ['большой', 'katta', 'Sifatlar', 'A1'],
  ['маленький', 'kichik', 'Sifatlar', 'A1'],
  ['новый', 'yangi', 'Sifatlar', 'A1'],
  ['длинный', 'uzun', 'Sifatlar', 'A1'],
  ['короткий', 'qisqa', 'Sifatlar', 'A1'],
  ['быстрый', 'tez', 'Sifatlar', 'A1'],
  ['медленный', 'sekin', 'Sifatlar', 'A1'],
  ['сильный', 'kuchli', 'Sifatlar', 'A1'],
  ['слабый', 'zaif', 'Sifatlar', 'A1'],
  ['лёгкий', 'yengil', 'Sifatlar', 'A1'],
  ['тяжёлый', "og'ir", 'Sifatlar', 'A1'],
  ['чистый', 'toza', 'Sifatlar', 'A1'],
  ['грязный', 'iflos', 'Sifatlar', 'A1'],
  ['горячий', 'issiq', 'Sifatlar', 'A1'],
  ['полный', "to'la", 'Sifatlar', 'A1'],
  ['высокий', 'baland', 'Sifatlar', 'A1'],
  ['низкий', 'past', 'Sifatlar', 'A1'],
  ['широкий', 'keng', 'Sifatlar', 'A1'],
  ['узкий', 'tor', 'Sifatlar', 'A1'],
  // A1 — Odamlar
  ['мужчина', 'erkak', 'Odamlar', 'A1'],
  ['женщина', 'ayol', 'Odamlar', 'A1'],
  ['брат', 'aka', 'Odamlar', 'A1'],
  ['сестра', 'opa', 'Odamlar', 'A1'],
  ['дедушка', 'bobo', 'Odamlar', 'A1'],
  ['бабушка', 'buvi', 'Odamlar', 'A1'],
  ['сын', "o'g'il", 'Odamlar', 'A1'],
  ['дочь', 'qiz', 'Odamlar', 'A1'],
  ['муж', 'er', 'Odamlar', 'A1'],
  ['жена', 'xotin', 'Odamlar', 'A1'],
  ['сосед', "qo'shni", 'Odamlar', 'A1'],
  ['человек', 'odam', 'Odamlar', 'A1'],
  // A2 — Shahar
  ['улица', "ko'cha", 'Shahar', 'A2'],
  ['площадь', 'maydon', 'Shahar', 'A2'],
  ['парк', "bog'", 'Shahar', 'A2'],
  ['мост', "ko'prik", 'Shahar', 'A2'],
  ['вокзал', 'bekat', 'Shahar', 'A2'],
  ['аптека', 'dorixona', 'Shahar', 'A2'],
  ['банк', 'bank', 'Shahar', 'A2'],
  ['почта', 'pochta', 'Shahar', 'A2'],
  ['рынок', 'bozor', 'Shahar', 'A2'],
  ['музей', 'muzey', 'Shahar', 'A2'],
  ['театр', 'teatr', 'Shahar', 'A2'],
  ['ресторан', 'restoran', 'Shahar', 'A2'],
  ['библиотека', 'kutubxona', 'Shahar', 'A2'],
  ['школа', 'maktab', 'Shahar', 'A2'],
  // A2 — Ovqat 2
  ['суп', "sho'rva", 'Ovqat 2', 'A2'],
  ['сыр', 'pishloq', 'Ovqat 2', 'A2'],
  ['масло', "sariyog'", 'Ovqat 2', 'A2'],
  ['сахар', 'shakar', 'Ovqat 2', 'A2'],
  ['фрукты', 'meva', 'Ovqat 2', 'A2'],
  ['овощи', 'sabzavot', 'Ovqat 2', 'A2'],
  ['картофель', 'kartoshka', 'Ovqat 2', 'A2'],
  ['помидор', 'pomidor', 'Ovqat 2', 'A2'],
  ['лук', 'piyoz', 'Ovqat 2', 'A2'],
  ['морковь', 'sabzi', 'Ovqat 2', 'A2'],
  ['яйцо', 'tuxum', 'Ovqat 2', 'A2'],
  ['мёд', 'asal', 'Ovqat 2', 'A2'],
  // A2 — Vaqt 2
  ['вечер', 'kechqurun', 'Vaqt 2', 'A2'],
  ['ночь', 'tun', 'Vaqt 2', 'A2'],
  ['минута', 'daqiqa', 'Vaqt 2', 'A2'],
  ['секунда', 'soniya', 'Vaqt 2', 'A2'],
  ['месяц', 'oy', 'Vaqt 2', 'A2'],
  ['сегодня', 'bugun', 'Vaqt 2', 'A2'],
  ['понедельник', 'dushanba', 'Vaqt 2', 'A2'],
  ['вторник', 'seshanba', 'Vaqt 2', 'A2'],
  ['среда', 'chorshanba', 'Vaqt 2', 'A2'],
  ['пятница', 'juma', 'Vaqt 2', 'A2'],
  ['суббота', 'shanba', 'Vaqt 2', 'A2'],
  ['воскресенье', 'yakshanba', 'Vaqt 2', 'A2'],
  // B1 — His-tuyg'u 2
  ['любовь', 'muhabbat', "His-tuyg'u 2", 'B1'],
  ['надежда', 'umid', "His-tuyg'u 2", 'B1'],
  ['гнев', "g'azab", "His-tuyg'u 2", 'B1'],
  ['гордость', "g'urur", "His-tuyg'u 2", 'B1'],
  ['стыд', 'uyat', "His-tuyg'u 2", 'B1'],
  ['зависть', 'hasad', "His-tuyg'u 2", 'B1'],
  ['доверие', 'ishonch', "His-tuyg'u 2", 'B1'],
  ['терпение', 'sabr', "His-tuyg'u 2", 'B1'],
  ['смелость', 'jasorat', "His-tuyg'u 2", 'B1'],
  ['мечта', 'orzu', "His-tuyg'u 2", 'B1'],
  // B1 — Ish 2
  ['зарплата', 'maosh', 'Ish 2', 'B1'],
  ['начальник', 'boshliq', 'Ish 2', 'B1'],
  ['коллега', 'hamkasb', 'Ish 2', 'B1'],
  ['проект', 'loyiha', 'Ish 2', 'B1'],
  ['задача', 'vazifa', 'Ish 2', 'B1'],
  ['успех', 'muvaffaqiyat', 'Ish 2', 'B1'],
  ['ошибка', 'xato', 'Ish 2', 'B1'],
  ['договор', 'shartnoma', 'Ish 2', 'B1'],
  ['клиент', 'mijoz', 'Ish 2', 'B1'],
  ['продукт', 'mahsulot', 'Ish 2', 'B1'],
  ['услуга', 'xizmat', 'Ish 2', 'B1'],
  ['цель', 'maqsad', 'Ish 2', 'B1'],
  // B1 — Ta'lim 2
  ['наука', 'fan', "Ta'lim 2", 'B1'],
  ['история', 'tarix', "Ta'lim 2", 'B1'],
  ['математика', 'matematika', "Ta'lim 2", 'B1'],
  ['язык', 'til', "Ta'lim 2", 'B1'],
  ['слово', "so'z", "Ta'lim 2", 'B1'],
  ['предложение', 'gap', "Ta'lim 2", 'B1'],
  ['правило', 'qoida', "Ta'lim 2", 'B1'],
  ['пример', 'misol', "Ta'lim 2", 'B1'],
  ['страница', 'sahifa', "Ta'lim 2", 'B1'],
  ['словарь', "lug'at", "Ta'lim 2", 'B1'],
]

// mavjud ru.ts dan band qiymatlar
const src = readFileSync('src/content/decks/ru.ts', 'utf8')
const takenWord = new Set()
const takenTr = new Set()
const takenNorm = new Set()
const re = /(word|translation): (?:'([^']*)'|"([^"]*)")/g
let m
while ((m = re.exec(src))) {
  const v = m[2] ?? m[3]
  if (m[1] === 'translation') takenTr.add(v.toLowerCase())
  else { takenWord.add(v); takenNorm.add(normalizeRu(v)) }
}

const buckets = { A1: [], A2: [], B1: [] }
const seenW = new Set(), seenT = new Set(), seenN = new Set()
let dropped = 0
for (const [ru, uz, topic, level] of WORDS) {
  const norm = normalizeRu(ru)
  const tr = uz.toLowerCase()
  if (takenWord.has(ru) || seenW.has(ru)) { dropped++; continue }
  if (takenNorm.has(norm) || seenN.has(norm)) { dropped++; continue }
  if (takenTr.has(tr) || seenT.has(tr)) { dropped++; continue }
  seenW.add(ru); seenN.add(norm); seenT.add(tr)
  buckets[level].push({ word: ru, uz, topic, level })
}

const esc = (s) => (s.includes("'") ? `"${s}"` : `'${s}'`)
let body = ''
for (const level of ['A1', 'A2', 'B1']) {
  body += `  ${level}: [\n`
  for (const w of buckets[level]) {
    body +=
      '    {\n' +
      `      word: ${esc(w.word)},\n` +
      `      translation: ${esc(w.uz)},\n` +
      `      language: 'ru',\n` +
      `      topic: ${esc(w.topic)},\n` +
      `      level: '${level}',\n` +
      '    },\n'
  }
  body += '  ],\n'
}
const out =
  "import type { NewCardRecordInput } from '@/core/db'\n" +
  "import type { LevelCode } from '@/core/types'\n\n" +
  '/**\n' +
  " * Qo'lda tanlangan qo'shimcha ruscha lug'at (jumlasiz).\n" +
  ' * Manba: scripts/make-ru-extra.mjs.\n' +
  ' */\n' +
  'export const RU_EXTRA: Record<LevelCode, NewCardRecordInput[]> = {\n' +
  body +
  '}\n'

writeFileSync('src/content/decks/ru-extra.ts', out)
const total = buckets.A1.length + buckets.A2.length + buckets.B1.length
console.log(`rus: +${total} (A1 ${buckets.A1.length}, A2 ${buckets.A2.length}, B1 ${buckets.B1.length}) — tashlandi ${dropped}`)

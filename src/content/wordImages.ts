/**
 * So'z → rasm xaritasi.
 *
 * NEGA O'ZBEKCHA TARJIMA BO'YICHA: bitta xarita uchala tilga ham
 * xizmat qiladi. `apple`, `яблоко` va `تُفَّاحَة` — hammasining o'zbekchasi
 * "olma", ya'ni rasm bir marta yozilib, uch joyda ishlaydi.
 *
 * NEGA FAQAT ANIQ NARSALAR: "olma"ni rasm bilan ko'rsatish mumkin,
 * "mohiyat"ni esa yo'q. Mavhum so'zga tasodifiy rasm qo'yish yordam
 * bermaydi — chalg'itadi. Shuning uchun ro'yxat QO'LDA tuzilgan va
 * har biri tekshirilgan; kalit so'z bo'yicha avtomatik qidiruv YO'Q.
 *
 * Qiymat — OpenMoji fayl nomi (Unicode kod nuqtasi). Rasmlar
 * `scripts/fetch-word-images.mjs` orqali `public/word-images/` ga
 * yuklab olinadi. Litsenziya: CC BY-SA 4.0 — `docs/ASSETS.md`.
 */
const WORD_IMAGES: Record<string, string> = {
  // ---- Ovqat va ichimlik ----
  suv: '1F4A7',
  non: '1F35E',
  sut: '1F95B',
  olma: '1F34E',
  guruch: '1F35A',
  "go'sht": '1F356',
  choy: '1F375',
  tuz: '1F9C2',
  uzum: '1F347',
  tarvuz: '1F349',
  apelsin: '1F34A',
  limon: '1F34B',
  sabzi: '1F955',
  pomidor: '1F345',
  kartoshka: '1F954',
  bodring: '1F952',
  piyoz: '1F9C5',
  qalampir: '1F336',
  pishloq: '1F9C0',
  nok: '1F350',
  tuxum: '1F95A',
  asal: '1F36F',
  "sariyog'": '1F9C8',
  "sho'rva": '1F372',
  kosa: '1F963',
  ovqat: '1F37D',
  sabzavot: '1F966',
  shirinlik: '1F36C',
  shakar: '1F36C',
  sharbat: '1F9C3',
  taom: '1F35B',
  qoshiq: '1F944',
  pichoq: '1F52A',

  // ---- Hayvonlar ----
  mushuk: '1F408',
  it: '1F415',
  kuchukcha: '1F436',
  qush: '1F426',
  baliq: '1F41F',
  sigir: '1F404',
  ot: '1F40E',
  "xo'roz": '1F413',
  tovuq: '1F414',
  echki: '1F410',
  tulki: '1F98A',
  quyon: '1F407',
  "bo'ri": '1F43A',
  ayiq: '1F43B',
  sichqon: '1F401',
  tuya: '1F42B',
  "yo'lbars": '1F405',
  olmaxon: '1F43F',
  "o'rdak": '1F986',
  "g'oz": '1F9A2',
  "to'ti": '1F99C',
  burgut: '1F985',
  fil: '1F418',
  maymun: '1F412',
  ilon: '1F40D',
  "o'rgimchak": '1F577',
  toshbaqa: '1F422',
  qurt: '1F41B',
  kapalak: '1F98B',
  hasharot: '1F41C',
  "cho'chqa": '1F416',
  kit: '1F433',
  "ho'kiz": '1F402',
  hayvon: '1F43E',
  pat: '1FAB6',

  // ---- Tana ----
  "qo'l": '1F590',
  "ko'z": '1F441',
  oyoq: '1F9B6',
  quloq: '1F442',
  burun: '1F443',
  "og'iz": '1F444',
  til: '1F445',
  tish: '1F9B7',
  barmoq: '1F446',
  suyak: '1F9B4',
  bilak: '1F4AA',

  // ---- Odamlar ----
  ona: '1F469',
  ota: '1F468',
  bola: '1F9D2',
  bolalar: '1F9D2',
  "o'g'il": '1F466',
  qiz: '1F467',
  buvi: '1F475',
  bobo: '1F474',
  oila: '1F46A',
  "do'st": '1F91D',
  erkak: '1F9D4',
  ayol: '1F9D5',
  chaqaloq: '1F476',
  qirol: '1F451',
  sartarosh: '1F488',
  dehqon: '1F33E',
  raqqos: '1F483',
  talaba: '1F393',
  bitiruvchi: '1F393',

  // ---- Uy va narsalar ----
  uy: '1F3E0',
  eshik: '1F6AA',
  deraza: '1FA9F',
  stul: '1FA91',
  kalit: '1F511',
  qulf: '1F512',
  karavot: '1F6CF',
  oyna: '1FA9E',
  choynak: '1FAD6',
  qaychi: '2702',
  supurgi: '1F9F9',
  sovun: '1F9FC',
  "cho'tka": '1FAA5',
  sham: '1F56F',
  taroq: '1F9F0',
  narvon: '1FA9C',
  qafas: '1F9FA',
  beshik: '1F6CF',

  // ---- Maktab va ish ----
  kitob: '1F4D5',
  daftar: '1F4D3',
  qalam: '270F',
  "qog'oz": '1F4C4',
  sumka: '1F392',
  maktab: '1F3EB',
  kutubxona: '1F4DA',
  dars: '1F4D6',
  savol: '2753',
  javob: '1F4AC',
  imtihon: '1F4DD',
  ish: '1F4BC',
  ofis: '1F3E2',
  xat: '2709',
  xabar: '1F4E8',
  tarix: '1F4DC',
  fan: '1F52C',
  matematika: '1F522',
  "san'at": '1F3A8',
  rasm: '1F5BC',
  reja: '1F4CB',
  natija: '1F4CA',
  loyiha: '1F4C1',
  hisob: '1F9EE',
  kompyuter: '1F4BB',
  ekran: '1F5A5',
  tarmoq: '1F310',
  "g'oya": '1F4A1',
  fikr: '1F4A1',
  aql: '1F9E0',
  pochta: '1F4EE',
  "lug'at": '1F4D2',
  sahifa: '1F4C3',
  alifbo: '1F524',

  // ---- Shahar va joylar ----
  shahar: '1F3D9',
  qishloq: '1F3E1',
  "ko'cha": '1F3D8',
  "yo'l": '1F6E3',
  kasalxona: '1F3E5',
  "do'kon": '1F3EA',
  bozor: '1F9FA',
  mehmonxona: '1F3E8',
  restoran: '1F374',
  teatr: '1F3AD',
  universitet: '1F3DB',
  minora: '1F5FC',
  "ko'prik": '1F309',
  oshxona: '1F373',
  hammom: '1F6C1',
  ombor: '1F3ED',
  muzey: '1F3DB',

  // ---- Sayohat ----
  aeroport: '2708',
  chipta: '1F3AB',
  poyezd: '1F686',
  chamadon: '1F9F3',
  xarita: '1F5FA',
  mashina: '1F697',
  velosiped: '1F6B2',
  qayiq: '26F5',
  chana: '1F6F7',
  parvoz: '1F6EB',
  "uchuvchi": '1F9D1',
  dunyo: '1F30D',
  bayroq: '1F3F3',

  // ---- Tabiat va ob-havo ----
  daraxt: '1F333',
  "o'rmon": '1F332',
  daryo: '1F30A',
  dengiz: '1F30A',
  "tog'": '26F0',
  gul: '1F33C',
  atirgul: '1F339',
  "o'simliklar": '1F331',
  yulduz: '2B50',
  oy: '1F319',
  quyosh: '2600',
  bulut: '2601',
  "yomg'ir": '1F327',
  qor: '2744',
  shamol: '1F32C',
  muz: '1F9CA',
  momaqaldiroq: '26C8',
  tuman: '1F32B',
  tosh: '1FAA8',
  qum: '1F3D6',
  "cho'l": '1F3DC',
  orol: '1F3DD',
  "yong'in": '1F525',
  alanga: '1F525',
  olov: '1F525',
  "yog'och": '1FAB5',
  qanot: '1FAB6',
  meva: '1F34F',

  // ---- Ranglar ----
  qizil: '1F534',
  "ko'k": '1F535',
  yashil: '1F7E2',
  qora: '26AB',
  oq: '26AA',
  sariq: '1F7E1',

  // ---- Kiyim ----
  kiyim: '1F457',
  libos: '1F457',
  "ko'ylak": '1F455',
  poyabzal: '1F45F',
  shapka: '1F452',
  palto: '1F9E5',
  shim: '1F456',
  jun: '1F9F6',

  // ---- Vaqt ----
  soat: '23F0',
  vaqt: '23F3',
  daqiqa: '23F1',
  kun: '1F4C5',
  hafta: '1F4C6',
  yil: '1F5D3',
  ertalab: '1F305',
  kechqurun: '1F307',
  tun: '1F303',
  bahor: '1F338',
  yoz: '1F3D6',
  kuz: '1F342',
  qish: '26C4',

  // ---- His-tuyg'u va salomatlik ----
  baxtli: '1F60A',
  baxt: '1F60A',
  xafa: '1F622',
  quvonch: '1F604',
  "qo'rquv": '1F628',
  "g'azab": '1F620',
  kulmoq: '1F602',
  "yig'lamoq": '1F62D',
  uxlamoq: '1F634',
  charchagan: '1F62B',
  hayron: '1F62E',
  "sog'lom": '1F4AA',
  salomatlik: '1F4AA',
  kasallik: '1F912',
  "og'riq": '1F915',
  dori: '1F48A',
  shifokor: '1FA7A',

  // ---- Sonlar ----
  bir: '0031-FE0F-20E3',
  ikki: '0032-FE0F-20E3',
  uch: '0033-FE0F-20E3',
  "to'rt": '0034-FE0F-20E3',
  besh: '0035-FE0F-20E3',
  olti: '0036-FE0F-20E3',
  yetti: '0037-FE0F-20E3',
  sakkiz: '0038-FE0F-20E3',
  "to'qqiz": '0039-FE0F-20E3',
  "o'n": '1F51F',
  nol: '0030-FE0F-20E3',

  // ---- Harakatlar ----
  yugurmoq: '1F3C3',
  suzmoq: '1F3CA',
  yozmoq: '270D',
  gapirmoq: '1F5E3',
  qaramoq: '1F440',
  "ko'rmoq": '1F440',
  yurmoq: '1F6B6',
  "o'qimoq": '1F4D6',
  bormoq: '1F6B6',
  tinglamoq: '1F442',
  eshitmoq: '1F442',
  yemoq: '1F374',
  ichmoq: '1F964',
  yuvmoq: '1F9FC',
  chizmoq: '1F58D',
  "o'ylamoq": '1F914',
  kutmoq: '23F3',
  topmoq: '1F50D',
  qidirmoq: '1F50D',
  sanamoq: '1F9EE',
  ovqatlanmoq: '1F37D',

  // ---- Kasblar va odamlar ----
  "o'qituvchi": '1F468-200D-1F3EB',
  "o'quvchi": '1F9D2',
  oshpaz: '1F468-200D-1F373',
  qahramon: '1F9B8',
  boshliq: '1F454',
  mijoz: '1F6CD',

  // ---- Yana narsalar ----
  yostiq: '1F6CF',
  choyshab: '1F6CF',
  qozon: '1F958',
  arra: '1FA9A',
  "bolg'a": '1F528',
  telefon: '1F4F1',
  televizor: '1F4FA',
  radio: '1F4FB',
  kamera: '1F4F7',
  gazeta: '1F4F0',
  maqola: '1F4F0',
  konvert: '2709',
  quti: '1F4E6',
  shar: '1F388',
  "qo'ng'iroqchi": '1F514',
  soyabon: '2602',
  tomchi: '1F4A7',
  qadam: '1F463',
  yurak: '2764',
  nur: '2728',
  sehr: '1FA84',
  sehrgar: '1F9D9',
  ertak: '1F4D6',
  "qal'a": '1F3F0',
  bino: '1F3E2',
  zavod: '1F3ED',
  ferma: '1F69C',
  daraxtzor: '1F332',
  barg: '1F343',
  "urug'": '1F331',
  mevalar: '1F34F',
  "yong'oq": '1F330',
  qulupnay: '1F353',
  banan: '1F34C',
  qovun: '1F348',
  "makkajo'xori": '1F33D',
  "qo'ziqorin": '1F344',
  loviya: '1FAD8',
  muzqaymoq: '1F368',
  tort: '1F370',
  pechene: '1F36A',
  shokolad: '1F36B',
  kofe: '2615',

  // ---- Boshqa ----
  pul: '1F4B0',
  narx: '1F3F7',
  bayram: '1F389',
  mukofot: '1F3C6',
  "o'yin": '1F3AE',
  "o'yinchoq": '1F9F8',
  "qo'g'irchoq": '1FA86',
  "to'p": '26BD',
  pianino: '1F3B9',
  kuylamoq: '1F3A4',
  qonun: '2696',
  tinchlik: '262E',
  erkinlik: '1F54A',
  "qo'ng'iroq": '1F514',
  "sovg'a": '1F381',
  kalendar: '1F4C5',
}

/**
 * Turli apostroflarni bitta ko'rinishga keltiradi.
 *
 * Lug'atlarda `o'zbek`, `o'zbek` va `o'zbek` uchrashi mumkin — ular BIR XIL
 * so'z, lekin obyekt kaliti sifatida uchta boshqa satr. Normallashtirmasa
 * "go'sht" rasmi kartaning yozilishiga qarab goh topilar, goh topilmasdi.
 */
function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/[‘’ʻʼ`´]/g, "'")
}

/**
 * Tarjimaga mos rasm kodini qaytaradi (topilmasa `null`).
 *
 * Avval butun tarjima qidiriladi, keyin qavs va vergulgacha bo'lgan qismi:
 * "olma (meva)" va "olma, anor" ham "olma" rasmini olishi kerak.
 */
export function imageCodeFor(translation: string): string | null {
  const full = normalize(translation)
  if (WORD_IMAGES[full]) return WORD_IMAGES[full]

  const head = normalize(full.split(/[(,;]/)[0] ?? '')

  return WORD_IMAGES[head] ?? null
}

/** Rasm manzili — `public/word-images/` ichidagi fayl */
export function imageUrlFor(translation: string): string | null {
  const code = imageCodeFor(translation)

  return code ? `/word-images/${code}.svg` : null
}

/** Yuklab olinishi kerak bo'lgan barcha kodlar (skript uchun) */
export const ALL_IMAGE_CODES: readonly string[] = [
  ...new Set(Object.values(WORD_IMAGES)),
]

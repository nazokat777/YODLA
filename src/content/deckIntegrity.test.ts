import { describe, expect, it } from 'vitest'
import { LEVEL_ORDER } from '@/core/config/levels'
import { makeCardId } from '@/core/srs'
import { loadLanguageDeck } from './starterDecks'
import type { LanguageCode } from '@/core/types'

/**
 * Lug'at yaxlitligi.
 *
 * Kontentning katta qismi SKRIPT bilan import qilingan (Mabdaul qiroat,
 * Enterprise app, ru.db, Tatoeba). Skript o'zgarganda yoki manba
 * yangilanganda buzilgan yozuvlar jimgina kirib kelishi mumkin — ularni
 * faqat foydalanuvchi mashq paytida ko'rardi.
 *
 * Bu testlar aynan shu jimgina buzilishlarni tutadi.
 */

import { unitIdOf } from '@/core/path'
import { MAX_UNIT_WORDS, MIN_UNIT_WORDS } from './chunkTopics'

const LANGUAGES: LanguageCode[] = ['en', 'ru', 'ar']

const ARABIC = /\p{Script=Arabic}/u
const CYRILLIC = /\p{Script=Cyrillic}/u
const LATIN = /\p{Script=Latin}/u

/** Bir tildagi barcha kartalar, daraja bo'yicha yassilangan */
async function allCards(language: LanguageCode) {
  const deck = await loadLanguageDeck(language)

  return LEVEL_ORDER.flatMap((level) => deck[level])
}

describe.each(LANGUAGES)('lug‘at yaxlitligi — %s', (language) => {
  it('so‘z va tarjima bo‘sh emas', async () => {
    const cards = await allCards(language)
    const broken = cards.filter(
      (card) => card.word.trim().length === 0 || card.translation.trim().length === 0,
    )

    expect(broken).toEqual([])
  })

  it('so‘z tarjimasiga teng emas', async () => {
    const cards = await allCards(language)

    // Bunday karta mashqda ma'nosiz: savol ham, javob ham bir xil
    const same = cards.filter(
      (card) => card.word.trim().toLowerCase() === card.translation.trim().toLowerCase(),
    )

    expect(same.map((card) => card.word)).toEqual([])
  })

  it('karta id‘lari takrorlanmaydi', async () => {
    const cards = await allCards(language)

    const seen = new Set<string>()
    const duplicates: string[] = []

    for (const card of cards) {
      const id = card.id ?? makeCardId(card.language, card.word)
      if (seen.has(id)) duplicates.push(id)
      else seen.add(id)
    }

    // Takroriy id `addMissingCards` da yutiladi, lekin u YO'QOTILGAN
    // kontent belgisi: ikkinchi yozuvning tarjimasi hech qachon ko'rinmaydi
    expect(duplicates).toEqual([])
  })

  it('tarjima o‘rniga transkripsiya tushmagan', async () => {
    const cards = await allCards(language)

    // Manbada ba'zi so'zlarga ma'no o'rniga talaffuz qo'yilgan
    // (`you'll → "/juːl/"`). Bunday karta hech nima o'rgatmaydi va eng
    // yomoni — boshqa savollarda chalg'ituvchi variant bo'lib chiqadi.
    const ipa = /[ˈˌːɪəʊæʌɜɒθðʃʒŋ]/
    const bad = cards.filter((card) => {
      const text = card.translation.trim()
      return (text.startsWith('/') && text.endsWith('/')) || ipa.test(text)
    })

    expect(bad.map((card) => `${card.word} → ${card.translation}`)).toEqual([])
  })

  it('tarjima butunlay bosh harfda emas', async () => {
    const cards = await allCards(language)

    // Grammatika jadvallarining ustun yorlig'i tarjima maydoniga tushib
    // qolardi: `wish to → "RASMIY"`, `skidded → "D IKKILANADI"`.
    // O'zbekcha tarjima hech qachon butunlay bosh harfda yozilmaydi.
    const bad = cards.filter((card) => {
      const letters = card.translation.replace(/[^\p{L}]/gu, '')
      return letters.length >= 3 && letters === letters.toUpperCase()
    })

    expect(bad.map((card) => `${card.word} → ${card.translation}`)).toEqual([])
  })

  it("so'z o'rganilayotgan tilning yozuvida", async () => {
    const cards = await allCards(language)

    const expected =
      language === 'ar' ? ARABIC : language === 'ru' ? CYRILLIC : LATIN

    const wrong = cards.filter((card) => !expected.test(card.word))

    expect(wrong.map((card) => card.word)).toEqual([])
  })

  it('tarjimada begona yozuv qolmagan', async () => {
    const cards = await allCards(language)

    // Tarjima o'zbekcha — lotin yozuvida. Arab yoki kirill harfi manba
    // chalkashganini bildiradi: darslikdagi havola tarjima maydoniga
    // tushib qolardi (`كَذَاكَ → "= كَذَلِكَ shuningdek"`) va "eslab yozish"
    // mashqida foydalanuvchidan uni ham yozish talab qilinardi.
    const wrong = cards.filter(
      (card) => ARABIC.test(card.translation) || CYRILLIC.test(card.translation),
    )

    expect(wrong.map((card) => `${card.word} → ${card.translation}`)).toEqual([])
  })

  it('jumla tarjimasi ishonchli ko‘rinadi', async () => {
    const cards = await allCards(language)
    const pairs = cards.filter((card) => card.sentence && card.sentenceTranslation)

    // Tarjimada arab yoki kirill harfi — juftlash siljib ketgani belgisi
    const foreign = pairs.filter(
      (card) =>
        ARABIC.test(card.sentenceTranslation ?? '') ||
        CYRILLIC.test(card.sentenceTranslation ?? ''),
    )
    expect(foreign.map((card) => card.word)).toEqual([])

    // Uzunliklar nisbati aqlli chegarada: besh barobar farq juftlash
    // xatosidan boshqa narsa emas
    const skewed = pairs.filter((card) => {
      const ratio = (card.sentenceTranslation ?? '').length / (card.sentence ?? '').length
      return ratio < 0.2 || ratio > 5
    })
    expect(
      skewed.map((card) => `${card.sentence} → ${card.sentenceTranslation}`),
    ).toEqual([])
  })

  it('tarjima o‘rniga darslik jadvali tushmagan', async () => {
    const cards = await allCards(language)

    const bad = cards.filter((card) => {
      const text = card.translation.trim()

      // `pencil sharpeners → "sharp + -en + -er"` — so'z yasalish jadvali
      if (/ \+ /.test(text)) return true

      // `cheaper → "the cheapest"` — daraja jadvali; tarjima o'rnida
      // inglizcha shakl turibdi va karta hech nima o'rgatmaydi
      if (/^the\s/i.test(text)) return true

      // `too tight → "aksi: loose"` — ma'no emas, boshqa so'zga havola
      return /^(aksi|teskari)\s*:/i.test(text)
    })

    expect(bad.map((card) => `${card.word} → ${card.translation}`)).toEqual([])
  })

  it('hech bir bo‘lim 20 so‘zdan katta emas', async () => {
    const cards = await allCards(language)

    const counts = new Map<string, number>()
    for (const card of cards) {
      if (!card.topic || !card.level) continue
      const key = `${card.level}|${card.topic}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    // O'quv yo'lida bir vaqtda BITTA bo'lim ochiq. Darslikdan kelgan
    // mavzular esa bob hajmida (269 so'zgacha) edi — keyingi bo'lim
    // ochilishi uchun ularning hammasini ko'rish kerak bo'lardi.
    const oversized = [...counts.entries()].filter(([, count]) => count > MAX_UNIT_WORDS)

    expect(oversized).toEqual([])
  })

  it('hech bir bo‘lim 3 so‘zdan kichik emas', async () => {
    const cards = await allCards(language)

    const counts = new Map<string, number>()
    for (const card of cards) {
      if (!card.topic || !card.level) continue
      const key = `${card.level}|${card.topic}`
      counts.set(key, (counts.get(key) ?? 0) + 1)
    }

    // Bir so'zli "dars" — o'quv yo'lida alohida doira, ichida bitta savol
    const tiny = [...counts.entries()].filter(([, count]) => count < MIN_UNIT_WORDS)

    expect(tiny).toEqual([])
  })

  it('bo‘lim id lari noyob', async () => {
    const cards = await allCards(language)

    const byId = new Map<string, Set<string>>()
    for (const card of cards) {
      if (!card.level || !card.topic) continue
      const id = unitIdOf(card.level, card.topic)
      byId.set(id, (byId.get(id) ?? new Set()).add(card.topic))
    }

    // Id mavzu nomidan slug bilan yasaladi, ya'ni tinish belgilari
    // bilan farq qiladigan ikki mavzu BITTA id ga tushishi mumkin.
    // Unda `buildUnits` ularni jimgina bitta bo'limga qo'shib yuborardi,
    // dars ekrani esa ikkalasining so'zlarini aralashtirib berardi.
    const collisions = [...byId.entries()]
      .filter(([, topics]) => topics.size > 1)
      .map(([id, topics]) => `${id}: ${[...topics].join(' | ')}`)

    expect(collisions).toEqual([])
  })

  it('qo‘lda topilgan buzuq so‘zlar qaytib kelmagan', async () => {
    const cards = await allCards(language)

    // Manba OCR bilan olingan va unda mavjud bo'lmagan so'zlar bor.
    // Ularni avtomatik aniqlab bo'lmadi (bir belgilik farq evristikasi
    // 245 ta haqiqiy so'zni ham belgiladi), shuning uchun ro'yxat QO'LDA
    // tekshirilgan. Import qayta ishga tushirilganda ular jimgina
    // qaytib kelmasligi uchun shu test turadi.
    const known = ['itt', 'thet']

    const found = cards.filter((card) => known.includes(card.word.toLowerCase()))

    expect(found.map((card) => `${card.word} → ${card.translation}`)).toEqual([])
  })

  it('tarjimada ma’nosiz omonim raqami qolmagan', async () => {
    const cards = await allCards(language)

    // `mushuk (2)` kabi: darslikda omonimni ajratish uchun qo'yilgan
    // raqam, lekin ikkinchi so'z lug'atga tushmagan — ya'ni raqam hech
    // nimani ajratmaydi. SONLARDA raqam qoladi: `olti (6)` foydali.
    const NUMERAL_WORDS = new Set([
      'bir', 'ikki', 'uch', 'besh', 'olti', 'yetti', 'sakkiz', 'yigirma',
      'qirq', 'ellik', 'oltmish', 'yetmish', 'sakson', 'yuz', 'ming', 'million',
    ])
    // Tutuq belgisi turlicha yozilishi mumkin — solishtirishdan oldin tekislanadi
    const plain = (text: string) => text.toLowerCase().replace(/[‘’ʻʼ`]/g, "'")
    const NUMERAL_WITH_APOSTROPHE = ["to'rt", "to'qqiz", "o'n", "o'ttiz", "to'qson"]

    const bad = cards.filter((card) => {
      const match = /^(.*?)\s*\(\d+\)$/.exec(card.translation.trim())
      if (!match) return false

      const words = plain(match[1]).split(/\s+/)

      return !words.some(
        (word) => NUMERAL_WORDS.has(word) || NUMERAL_WITH_APOSTROPHE.includes(word),
      )
    })

    expect(bad.map((card) => `${card.word} → ${card.translation}`)).toEqual([])
  })

  it('bolalarga mos kelmaydigan so‘z yo‘q', async () => {
    const cards = await allCards(language)

    /*
     * Manba lug'atlari KATTALAR uchun. Bola `sex`, `gun` yoki `гей`
     * kartasini ko'rishi kerak emas — bu til bilimi masalasi emas,
     * auditoriya masalasi.
     *
     * Ro'yxat import skriptlaridagi `UNSUITABLE_WORDS` ning aksi. Import
     * qayta ishga tushirilganda ular jimgina qaytib kelmasligi uchun shu
     * test turadi.
     *
     * ARABCHA yo'q: u Qiroat darsligidan olingan, umumiy lug'atdan emas.
     */
    const blocked = [
      'sex', 'gay', 'naked', 'drunk', 'beer', 'wine', 'vodka', 'alcohol',
      'cigarette', 'smoking', 'smoke', 'gun', 'guns', 'weapon', 'bomb',
      'kill', 'killer', 'murder', 'suicide', 'drug', 'drugs', 'idiot', 'stupid',
      'гей', 'голый', 'нагота', 'секс', 'пьяный', 'пиво', 'вино', 'водка',
      'оружие', 'пистолет', 'убийца', 'наркотик', 'идиот', 'дурак',
    ]

    const found = cards.filter((card) => blocked.includes(card.word.toLowerCase()))

    expect(found.map((card) => `${card.word} → ${card.translation}`)).toEqual([])
  })

  it('tarjimalar NOYOB — ikki bir xil variant chiqmaydi', async () => {
    const cards = await allCards(language)

    /*
     * Daraja testi (`core/placement/questions.ts`) chalg'ituvchilarni
     * BUTUN to'plamdan oladi va to'g'ri javobni aynan tenglik bilan
     * chiqarib tashlaydi. Ikki karta bir xil tarjimaga ega bo'lsa,
     * savolda IKKI BIR XIL variant chiqib, faqat bittasi to'g'ri deb
     * belgilanardi — va bu yangi foydalanuvchi ko'radigan BIRINCHI
     * ekran.
     *
     * Kod izohi shu qoidaga tayanadi, lekin uni hech nima tekshirmasdi.
     *
     * Tutuq belgisi tekislanadi: `do'st` va `do‘st` matn sifatida
     * boshqa, ekranda esa bir xil.
     */
    const plain = (text: string) =>
      text.toLowerCase().replace(/[‘’ʻʼ`]/g, "'").replace(/\s+/g, ' ').trim()

    const byText = new Map<string, string[]>()
    for (const card of cards) {
      const key = plain(card.translation)
      byText.set(key, [...(byText.get(key) ?? []), card.word])
    }

    const collisions = [...byText.entries()]
      .filter(([, words]) => words.length > 1)
      .map(([text, words]) => `${text}: ${words.join(', ')}`)

    expect(collisions).toEqual([])
  })

  it('inglizcha so‘z maydonida O‘ZBEKCHA matn yo‘q', async () => {
    if (language !== 'en') return

    const cards = await allCards(language)

    /*
     * Darslikning grammatik izohlari so'z maydoniga tushib qolgan edi:
     * `ayollar uchun => eng kuchli maqtov`, `buyruq => 8-mashqdagi
     * belgilar`. Bunday karta hech nima o'rgatmaydi — ikkala tomon ham
     * o'zbekcha.
     *
     * Rus va arab dekalarida bu sinf BO'LISHI MUMKIN EMAS: u yerda
     * yozuv turi tekshiriladi. Inglizcha esa o'zbekcha bilan bir
     * alifboni bo'lishadi, shuning uchun boshqa belgi kerak.
     *
     * BELGI: inglizchada `q` deyarli har doim `qu` bo'lib keladi
     * (`question`, `quick`), o'zbekchada esa yakka turadi (`maqtov`,
     * `oyoq`). Istisnolar — atoqli otlar.
     */
    const ALLOWED = ['iraq', 'qatar']

    const suspicious = cards.filter(
      (card) => /q(?!u)/i.test(card.word) && !ALLOWED.includes(card.word.toLowerCase()),
    )

    expect(suspicious.map((card) => `${card.word} → ${card.translation}`)).toEqual([])
  })

  it('mavzu nomi MAVJUD BO‘LMAGAN darsni o‘ylab topmaydi', async () => {
    const cards = await allCards(language)
    const topics = [...new Set(cards.map((card) => card.topic).filter(Boolean))]

    /*
     * Ilgari kitobning tuzilma qismlari ham "dars" deb atalardi:
     * `Enterprise 990-unit: Orqa muqova`. Foydalanuvchi bunday darsni
     * kitobdan qidirib topolmasdi — manbada u `isExtra: true` deb
     * belgilangan.
     *
     * Enterprise 1 da 15 ta dars bor (manbaning o'zi tasdiqlaydi:
     * "Progress Test 8 (Units 1-15)").
     */
    const invented = topics.filter((topic) => {
      const match = /(\d+)-dars/.exec(topic ?? '')
      if (!match) return false

      // Arabcha Qiroat kitoblarida darslar 60 tagacha
      const limit = language === 'ar' ? 60 : 15

      return Number(match[1]) > limit
    })

    expect(invented).toEqual([])
  })

  it('tarjima TUGALLANGAN', async () => {
    const cards = await allCards(language)

    // `he is => "u ..."` — jadval katagi. Yozish mashqida foydalanuvchi
    // "u ..." ni ko'rib nima kiritishni bilmasdi.
    const unfinished = cards.filter((card) => /(\.\.\.|…)\s*$/.test(card.translation))

    expect(unfinished.map((card) => `${card.word} → ${card.translation}`)).toEqual([])
  })

  it('tarjima o‘rnida BET RAQAMI yoki havola yo‘q', async () => {
    const cards = await allCards(language)

    // `high-speed catamarans => 154-bet` — kitob metama'lumoti, ma'no emas
    const reference = cards.filter(
      (card) =>
        /\d+\s*-?\s*bet/i.test(card.translation) ||
        /(Unit|Module|Page)\s*\d/i.test(card.translation),
    )

    expect(reference.map((card) => `${card.word} → ${card.translation}`)).toEqual([])
  })

  it('hamma karta shu tilga tegishli', async () => {
    const cards = await allCards(language)
    const foreign = cards.filter((card) => card.language !== language)

    expect(foreign.map((card) => card.word)).toEqual([])
  })

  it('daraja belgisi to‘g‘ri', async () => {
    const deck = await loadLanguageDeck(language)

    for (const level of LEVEL_ORDER) {
      const wrong = deck[level].filter((card) => card.level !== undefined && card.level !== level)
      expect(wrong.map((card) => card.word)).toEqual([])
    }
  })
})

describe('lug‘at qisqartmalari', () => {
  it('tarjimada `sb` yoki `sth` YO‘Q — bu lug‘at belgisi, so‘z emas', async () => {
    /*
     * `kimdir => inviting sb out` kartasi topilgan edi: maydonlar teskari
     * va tarjimada ingliz lug'atining qisqartmasi turardi. Bola bunday
     * kartadan hech nima o'rganmaydi.
     */
    const cards = await allCards('en')
    const bad = cards.filter((card) => /(?:^|\s)(?:sb|sth)(?:\s|$|\.)/.test(card.translation))

    expect(bad.map((card) => `${card.word} => ${card.translation}`)).toEqual([])
  })
})

describe('kitob metama’lumoti', () => {
  it('nashriyot iboralari lug‘atga tushmaydi', async () => {
    // "four-level series" ingliz tilining so'zi emas — kitobni sotish
    // uchun yozilgan ibora
    const cards = await allCards('en')
    const marketing = /four-level|write-in|easy-to-use|copyright (page|holder)|front matter/i
    const bad = cards.filter((card) => marketing.test(card.word))

    expect(bad.map((card) => card.word)).toEqual([])
  })

  it('muqova va kirish qismi BO‘LIM deb atalmaydi', async () => {
    // Foydalanuvchi haqli edi: kitobda "Orqa muqova" degan dars yo'q
    const cards = await allCards('en')
    const bad = cards.filter((card) => /muqova|mundarija|titul/i.test(card.topic ?? ''))

    expect(bad.map((card) => card.topic)).toEqual([])
  })
})

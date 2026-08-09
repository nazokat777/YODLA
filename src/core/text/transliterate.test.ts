import { describe, expect, it } from 'vitest'
import { transliterate } from './transliterate'

describe('transliterate — arab yozuvi', () => {
  const ar = (text: string) => transliterate(text, 'arabic')

  it('harakatlarni unli sifatida o‘qiydi', () => {
    expect(ar('كِتَاب')).toBe('kitab')
    expect(ar('بَيْت')).toBe('bayt')
    expect(ar('مَدِينَة')).toBe('madina')
  })

  it('tanvin "an/in/un" bo‘lib o‘qiladi, keyingi alif tushadi', () => {
    expect(ar('شُكْرًا')).toBe('shukran')
    expect(ar('مَرْحَبًا')).toBe('marhaban')
  })

  it('shadda undoshni ikkilantiradi', () => {
    expect(ar('تُفَّاحَة')).toBe('tuffaha')
    expect(ar('حُرِّيَّة')).toBe('hurriyya')
  })

  it('cho‘ziq unlilar takrorlanmaydi', () => {
    // ا fathadan keyin, ي kasradan keyin, و zammadan keyin — cho'ziqlik belgisi
    expect(ar('صَبَاح')).toBe('sabah')
    expect(ar('طَرِيق')).toBe('tariq')
    expect(ar('يَوْم')).toBe('yavm')
  })

  it('o‘zbek alifbosiga moslangan undoshlar', () => {
    // خ → x, ش → sh, غ → g'
    expect(ar('خُبْز')).toBe('xubz')
    expect(ar('شَمْس')).toBe('shams')
  })

  it('alif madda so‘z boshida bitta "a"', () => {
    expect(ar('آسِف')).toBe('asif')
  })

  it('so‘z boshidagi tayanch alif harakат bilan qo‘shilib ketmaydi', () => {
    expect(ar('أَب')).toBe('ab')
    expect(ar('أُمّ')).toBe('umm')
    expect(ar('اِثْنَان')).toBe('isnan')
  })

  it('so‘z ichidagi hamza — bo‘g‘iz to‘xtami', () => {
    expect(ar('يَأْكُل')).toBe("ya'kul")
    expect(ar('مَاء')).toBe("ma'")
  })
})

describe('transliterate — kirill yozuvi', () => {
  const ru = (text: string) => transliterate(text, 'cyrillic')

  it('asosiy harflarni o‘giradi', () => {
    expect(ru('привет')).toBe('privet')
    expect(ru('спасибо')).toBe('spasibo')
    expect(ru('город')).toBe('gorod')
  })

  it('shovqinli undoshlardan keyin "ё" — "o"', () => {
    // "jyoltiy" emas: jurnalistik amaliyotda ham "joltiy"
    expect(ru('жёлтый')).toBe('joltiy')
    expect(ru('чёрный')).toBe('chorniy')
  })

  it('boshqa joyda "ё" — "yo"', () => {
    expect(ru('ребёнок')).toBe('rebyonok')
  })

  it('yumshatish belgisi apostrof bilan beriladi', () => {
    expect(ru('здоровье')).toBe("zdorov'e")
  })

  it('bosh harflarni saqlaydi', () => {
    expect(ru('Москва')).toBe('Moskva')
  })
})

describe('transliterate — lotin yozuvi', () => {
  it('lotin uchun transliteratsiya kerak emas', () => {
    expect(transliterate('hello', 'latin')).toBeNull()
  })

  it('bo‘sh matnda null qaytadi', () => {
    expect(transliterate('  ', 'arabic')).toBeNull()
  })
})

import { describe, expect, it } from 'vitest'
import { splitTopic } from './topicTitle'

describe('splitTopic', () => {
  it('nuqtali ajratgichdan keyingi qism — bo‘lim nomi', () => {
    expect(splitTopic('Enterprise 1 · 5-dars: Family')).toEqual({
      section: 'Enterprise 1',
      title: '5-dars: Family',
    })
  })

  it('ikkitadan ortiq bo‘lakda faqat BIRINCHISI seksiya bo‘ladi', () => {
    // Qolgani bo'limning o'z nomi — u yerda ma'no bor, tashlab bo'lmaydi
    expect(splitTopic('Enterprise 1 · The Loch Ness Monster · Episode 2')).toEqual({
      section: 'Enterprise 1',
      title: 'The Loch Ness Monster · Episode 2',
    })
  })

  it('"N-dars" bilan tugagan nom ajratiladi', () => {
    expect(splitTopic('Qiroat 1-kitob 10-dars')).toEqual({
      section: 'Qiroat 1-kitob',
      title: '10-dars',
    })
  })

  it('daraja va tartib raqami bilan tugagan nom ajratiladi', () => {
    expect(splitTopic("Ruscha lug'at A1-10")).toEqual({
      section: "Ruscha lug'at · A1",
      title: '10-qism',
    })
  })

  it('qo‘lda yozilgan qisqa nom o‘zgarmaydi', () => {
    expect(splitTopic('Salomlashish')).toEqual({ section: null, title: 'Salomlashish' })
  })

  it('bo‘sh nom yiqilmaydi', () => {
    expect(splitTopic('')).toEqual({ section: null, title: '' })
  })

  it('ajratgichdan keyin bo‘sh qolsa, butun nom sarlavha bo‘ladi', () => {
    // Buzuq ma'lumot sarlavhani YO'Q QILMASLIGI kerak
    expect(splitTopic('Enterprise 1 · ')).toEqual({
      section: null,
      title: 'Enterprise 1 ·',
    })
  })
})

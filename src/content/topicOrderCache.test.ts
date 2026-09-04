import { afterEach, describe, expect, it, vi } from 'vitest'
import { readTopicOrder, saveTopicOrder } from './topicOrderCache'

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('topicOrderCache', () => {
  it('saqlangan tartib qaytariladi', () => {
    saveTopicOrder('en', ['Oila', 'Ovqat'])

    expect(readTopicOrder('en')).toEqual(['Oila', 'Ovqat'])
  })

  it('tillar ARALASHMAYDI', () => {
    saveTopicOrder('en', ['Oila'])

    // Har til o'z lug'atiga ega; aralashsa o'quv yo'li boshqa tilning
    // bo'limlari tartibida chiqardi
    expect(readTopicOrder('ru')).toBeNull()
  })

  it('hech nima saqlanmagan bo‘lsa null', () => {
    expect(readTopicOrder('ar')).toBeNull()
  })

  it('BUZUQ qiymat ekranni yiqitmaydi', () => {
    // Boshqa versiyadan qolgan yoki qo'lda buzilgan qiymat
    localStorage.setItem(`polyglotpro:topic-order:en:${__DECK_BUILD_ID__}`, '{oops')

    expect(readTopicOrder('en')).toBeNull()
  })

  it('massiv bo‘lmagan qiymat rad etiladi', () => {
    localStorage.setItem(`polyglotpro:topic-order:en:${__DECK_BUILD_ID__}`, '{"a":1}')

    expect(readTopicOrder('en')).toBeNull()
  })

  it('satr bo‘lmagan element bo‘lsa rad etiladi', () => {
    // Yarim buzilgan qiymat "tartib" sifatida ishlatilsa, bo'lim
    // nomlari o'rniga `undefined` chiqardi
    localStorage.setItem(`polyglotpro:topic-order:en:${__DECK_BUILD_ID__}`, '["Oila", 7]')

    expect(readTopicOrder('en')).toBeNull()
  })

  it('BOSHQA build dan qolgan kesh ISHLATILMAYDI', () => {
    /*
     * Kalitda build belgisi bor: yangi versiya chiqqanda mavzular
     * o'zgargan bo'lishi mumkin (bugungi "qismlarga bo'lish" kabi), va
     * eski tartib bo'lmagan bo'limlarni ko'rsatardi.
     */
    localStorage.setItem('polyglotpro:topic-order:en:eski-build', '["Oila"]')

    expect(readTopicOrder('en')).toBeNull()
  })

  it('xotira TO‘LGAN bo‘lsa ilova yiqilmaydi', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })

    // Kesh — tezlik uchun, majburiyat emas: yozilmasa tartib har safar
    // lug'atdan hisoblanadi
    expect(() => saveTopicOrder('en', ['Oila'])).not.toThrow()
  })
})

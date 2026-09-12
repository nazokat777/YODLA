import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { addMissingCards, db, type NewCardRecordInput } from '@/core/db'
import { saveTopicOrder } from '@/content/topicOrderCache'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { LessonScreen } from './LessonScreen'

const WORDS: NewCardRecordInput[] = [
  { word: 'hello', translation: 'salom', language: 'en', topic: 'Salomlashish', level: 'A1' },
  { word: 'mother', translation: 'ona', language: 'en', topic: 'Oila', level: 'A1' },
  { word: 'father', translation: 'ota', language: 'en', topic: 'Oila', level: 'A1' },
]

function renderLesson(path: string) {
  useSettingsStore.getState().reset()
  useSettingsStore.getState().setLearningLanguage('en')

  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/lesson/:lessonId?" element={<LessonScreen />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LessonScreen — bo‘lim bo‘yicha dars', () => {
  beforeEach(async () => {
    await db.cards.clear()
    await addMissingCards(WORDS)
  })

  it('faqat o‘sha bo‘lim so‘zlarini beradi', async () => {
    renderLesson('/lesson/a1-oila')

    // "Oila" bo'limida ikkita YANGI so'z bor, har biri uch bosqichda
    // Ko'rsatkich SO'ZLARNI sanaydi: bo'limda ikkita so'z bor
    expect(await screen.findByTestId('session-progress')).toHaveTextContent('0/2')
  })

  it('BIR so‘zli bo‘limda ham variantli mashq chiqadi — chalg‘ituvchilar butun lug‘atdan', async () => {
    /*
     * Arab A1 da "Maktab 0/1", "Vaqt 0/1" kabi bo'limlar bor. Chalg'ituvchi
     * manbai faqat bo'limning o'zi bo'lsa, bitta so'zga variant topilmas,
     * har mashq "tarjimani yozish" bo'lib qolar va o'zlashtirish qoidasi
     * (ikki XIL tur) hech qachon bajarilmasdi — dars 60 qadamgacha
     * cho'zilardi.
     */
    renderLesson('/lesson/a1-salomlashish')

    expect(await screen.findByTestId('session-progress')).toHaveTextContent('0/1')
    fireEvent.click(await screen.findByRole('button', { name: /tushundim/i }))

    // Variantlar orasida boshqa bo'limning tarjimalari bor
    expect((await screen.findAllByRole('button', { name: /ona|ota/ })).length).toBeGreaterThan(0)
  })

  it('dars ketayotganda ✕ tasdiq so‘raydi va "Davom etish" darsni saqlab qoladi', async () => {
    /*
     * NN/g #3/#5: o'zlashtirish halqasi xotirada — bir tasodifiy bosish
     * 9 ta to'g'ri javobni yo'qqa chiqarardi.
     */
    renderLesson('/lesson/a1-oila')
    await screen.findByTestId('session-progress')

    fireEvent.click(screen.getByRole('button', { name: /darsdan chiqish/i }))

    expect(await screen.findByRole('dialog')).toHaveTextContent(/tugatmasdan chiqasizmi/i)
    fireEvent.click(screen.getByRole('button', { name: 'Davom etish' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByTestId('session-progress')).toBeInTheDocument()
  })

  it('bo‘limsiz ochilganda butun to‘plamdan tanlaydi', async () => {
    renderLesson('/lesson')

    // Butun lug'atdan uchala so'z ham darsga tushadi
    expect(await screen.findByTestId('session-progress')).toHaveTextContent('0/3')
  })

  it('yo‘q bo‘lim id sida "so‘z yo‘q" DEMAYDI', async () => {
    renderLesson('/lesson/yoq-bunday-bolim')

    // Lug'atda 3 ta so'z bor. Eski xabar ("Bu tilda hali so'z yo'q")
    // yolg'on edi va foydalanuvchida "ilova hamma so'zimni yo'qotdi"
    // degan taassurot qoldirardi. Bunday havola eskirgan xatcho'p yoki
    // yangilanishdan keyin nomi o'zgargan bo'lim bo'lishi mumkin.
    expect(await screen.findByText(/bo.lim topilmadi/i)).toBeInTheDocument()
    expect(screen.queryByText(/hali so.z yo.q/i)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /bosh sahifa/i })).toBeInTheDocument()
  })

  it('lug‘at butunlay bo‘sh bo‘lsa boshqa xabar', async () => {
    await db.cards.clear()
    renderLesson('/lesson')

    expect(await screen.findByText(/hali so.z yo.q/i)).toBeInTheDocument()
  })
})

describe('LessonScreen — bo‘limsiz dars', () => {
  it('o‘quv yo‘lidagi JORIY bo‘limdan boshlanadi', async () => {
    /*
     * Ilgari bo'limsiz dars butun lug'atdan tuzilardi va tartib karta
     * qo'shilish tartibiga tushib qolardi: yangi foydalanuvchi
     * "Salomlashish" o'rniga import qilingan lug'atning birinchi
     * so'zlaridan boshlardi — holbuki yo'lda "Salomlashish" joriy deb
     * turardi.
     */
    await db.cards.clear()
    await addMissingCards([
      { word: 'hello', translation: 'salom', language: 'en', topic: 'Salomlashish', level: 'A1' },
      { word: 'bye', translation: 'xayr', language: 'en', topic: 'Salomlashish', level: 'A1' },
      { word: 'ability', translation: 'qobiliyat', language: 'en', topic: 'Boshqa', level: 'A1' },
    ])
    saveTopicOrder('en', ['Salomlashish', 'Boshqa'])

    renderLesson('/lesson')

    // Birinchi savol "Salomlashish" bo'limidan chiqadi
    expect(await screen.findByText(/salom|xayr/i)).toBeInTheDocument()
    expect(screen.queryByText('qobiliyat')).not.toBeInTheDocument()
  })
})

describe('LessonScreen — lug‘at fonda yuklanayotganda', () => {
  it('kartalar KEYIN kelsa, dars o‘zi boshlanadi', async () => {
    /*
     * Lug'at ilova ochilganda fonda bazaga yoziladi. Foydalanuvchi tilni
     * almashtirib, import tugagunicha darsga kirsa, ekran "Bu tilda hali
     * so'z yo'q" deb qotib qolardi: kartalar bir marta, effektda
     * o'qilardi va hech qachon qayta so'ralmasdi.
     */
    await db.cards.clear()

    renderLesson('/lesson')

    expect(await screen.findByText(/hali so.z yo.q/i)).toBeInTheDocument()

    // Import tugadi
    await addMissingCards(WORDS)

    await waitFor(
      () => {
        expect(screen.queryByText(/hali so.z yo.q/i)).not.toBeInTheDocument()
      },
      { timeout: 3000 },
    )
  })
})

describe('LessonScreen — aralash takror bosqichi', () => {
  it('BIRINCHI darsda aralash bosqich YO‘Q', async () => {
    /*
     * Qaytariladigan eski so'z bo'lmasa bosqich o'tkazib yuboriladi:
     * bo'sh takror seansi foydalanuvchini chalg'itardi.
     */
    await db.cards.clear()
    await addMissingCards(WORDS)

    renderLesson('/lesson')

    expect(await screen.findByTestId('session-progress')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Dars' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /aralash takror/i })).not.toBeInTheDocument()
  })
})

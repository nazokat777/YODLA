import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { CardRecord } from '@/core/db'

// Baza va nishonlar mock qilinadi — bu test faqat SEANS OQIMINI tekshiradi
vi.mock('@/core/db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/core/db')>()

  return {
    ...actual,
    gradeCard: vi.fn(async (id: string) => ({ id, interval: 1 }) as CardRecord),
    recordAnswer: vi.fn(async () => ({ xpGained: 5, goalJustCompleted: false })),
    finalizeSession: vi.fn(async () => ({ newlyUnlocked: [] })),
    claimSecretWord: vi.fn(async () => true),
  }
})

// Haftaning sehrli so'zi — testda birinchi karta
vi.mock('@/core/games', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/core/games')>()
  return { ...actual, secretWordId: () => 'en:water' }
})

import { gradeCard, recordAnswer } from '@/core/db'
import { SessionRunner } from './SessionRunner'

function makeCard(word: string, translation: string): CardRecord {
  return {
    id: `en:${word}`,
    word,
    translation,
    language: 'en',
    topic: 'Ovqat',
    // rep 1 → ladder pog'onasi ['recognition', 'listening', 'matching']
    interval: 1,
    repetitions: 1,
    easeFactor: 2.5,
    dueDate: 0,
    createdAt: 0,
    lastReviewedAt: null,
    totalReviews: 1,
    lapses: 0,
  }
}

const CARDS = [
  makeCard('water', 'suv'),
  makeCard('bread', 'non'),
  makeCard('tea', 'choy'),
  makeCard('salt', 'tuz'),
  makeCard('milk', 'sut'),
]

const word = (text: string) => screen.getByRole('button', { name: `${text} — so'z` })
const translation = (text: string) => screen.getByRole('button', { name: `${text} — tarjima` })

beforeEach(() => {
  vi.clearAllMocks()
  // jsdom'da nutq sintezi yo'q → eshitish tushib qoladi va shu pog'onada
  // ['recognition', 'matching'] qoladi; 0.9 ikkinchisini tanlaydi
  vi.spyOn(Math, 'random').mockReturnValue(0.9)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('SessionRunner — juft topish', () => {
  it('bir mashqda barcha juftlangan kartalar baholanadi', async () => {
    // Hammasi seansning o'z so'zlari — hammasi baholanadi
    render(<SessionRunner cards={CARDS} pool={CARDS} onFinish={() => {}} />)

    expect(await screen.findByText(/so.z va tarjimasini juftlang/i)).toBeInTheDocument()

    for (const card of CARDS) {
      fireEvent.click(word(card.word))
      fireEvent.click(translation(card.translation))
    }

    await waitFor(() => {
      expect(gradeCard).toHaveBeenCalledTimes(CARDS.length)
      expect(recordAnswer).toHaveBeenCalledTimes(CARDS.length)
    })

    // To'g'ri juft — baho 4 (tanib olishga yaqin passiv tur)
    for (const call of vi.mocked(gradeCard).mock.calls) {
      expect(call[1]).toBe(4)
    }
  })

  it('xato juftlangan karta jazolanmaydi — baho 3, yiqilish emas', async () => {
    render(<SessionRunner cards={CARDS} pool={CARDS} onFinish={() => {}} />)

    await screen.findByText(/so.z va tarjimasini juftlang/i)

    // Avval bitta xato juft
    fireEvent.click(word('water'))
    fireEvent.click(translation('non'))

    for (const card of CARDS) {
      fireEvent.click(word(card.word))
      fireEvent.click(translation(card.translation))
    }

    await waitFor(() => {
      expect(gradeCard).toHaveBeenCalledTimes(CARDS.length)
    })

    expect(vi.mocked(gradeCard)).toHaveBeenCalledWith('en:water', 3)
    expect(vi.mocked(gradeCard)).toHaveBeenCalledWith('en:tea', 4)
  })

  it('BEGONA (seansga kirmagan) juft baholanmaydi va hisobga kirmaydi', async () => {
    /*
     * Seansda bitta so'z, sheriklar `pool` dan to'ldirilgan. Ilgari
     * hammasi baholanardi: 1-darsda hali o'rgatilmagan so'z SM-2
     * jadvaliga tushib, "takrorlash" navbatida paydo bo'lardi.
     */
    const onFinish = vi.fn()
    render(<SessionRunner cards={[CARDS[0]]} pool={CARDS} onFinish={onFinish} />)

    await screen.findByText(/so.z va tarjimasini juftlang/i)

    for (const card of CARDS) {
      fireEvent.click(word(card.word))
      fireEvent.click(translation(card.translation))
    }

    // Navbatda bitta karta bor edi — juftlik yakunlangach seans tugaydi
    await waitFor(() => {
      expect(onFinish).toHaveBeenCalledWith(expect.objectContaining({ answered: 1, correct: 1 }))
    })
    expect(gradeCard).toHaveBeenCalledTimes(1)
    expect(gradeCard).toHaveBeenCalledWith(CARDS[0].id, 4)
    expect(recordAnswer).toHaveBeenCalledTimes(1)
  })
})

describe('SessionRunner — audio mashqlari', () => {
  beforeEach(() => vi.clearAllMocks())

  it('tilda ovoz bo‘lmasa "eshitib tushunish" mashqi BERILMAYDI', async () => {
    // Foydalanuvchining tizimidagi holat: faqat ruscha ovoz bor.
    // Ovozlar ro'yxati kechikib yuklanadi — birinchi tekshiruvda bo'sh.
    let calls = 0
    vi.stubGlobal('speechSynthesis', {
      getVoices: () => {
        calls += 1
        return calls > 1 ? [{ name: 'Irina', lang: 'ru-RU' } as SpeechSynthesisVoice] : []
      },
      addEventListener: () => {},
      removeEventListener: () => {},
      cancel: () => {},
      speak: () => {},
    })
    vi.stubGlobal('SpeechSynthesisUtterance', class {})

    const cards = [
      makeCard('water', 'suv'),
      makeCard('bread', 'non'),
      makeCard('tea', 'choy'),
    ]

    render(<SessionRunner cards={[cards[0]]} pool={cards} onFinish={() => {}} />)

    // Ovozsiz "Nima eshitdingiz?" mashqi javob berib bo'lmaydigan mashq —
    // ro'yxat yuklangach u yo'qolishi kerak
    await waitFor(() => {
      expect(screen.queryByText(/nima eshitdingiz/i)).not.toBeInTheDocument()
    })

    vi.unstubAllGlobals()
  })
})

describe('SessionRunner — bosqichlar', () => {
  /**
   * Ekrandagi mashqqa javob beradi.
   *
   * Tur oldindan noma'lum — aynan shu sinovning MAQSADI mashq turining
   * o'zgarishi. Shuning uchun ikkala shakl ham qo'llab-quvvatlanadi:
   * variantli (tanlash o'zi javob) va matnli ("Tekshirish" tugmasi).
   */
  async function answerCurrent(): Promise<void> {
    const choices = screen.queryAllByRole('button', { pressed: false })
    if (choices.length > 0) {
      fireEvent.click(choices[0])
      return
    }

    const input = screen.getByRole('textbox', { name: /javob/i })
    fireEvent.change(input, { target: { value: 'javob' } })
    fireEvent.click(screen.getByRole('button', { name: 'Tekshirish' }))
  }

  it('bir so‘z UCH marta chiqadi, lekin BIR marta baholanadi', async () => {
    // `Math.random` 0.9 juft topishni tanlardi; bu yerda oddiy mashqlar kerak
    vi.spyOn(Math, 'random').mockReturnValue(0)

    render(
      <SessionRunner
        cards={[CARDS[0]]}
        pool={CARDS}
        stagesFor={() => 3}
        onFinish={() => {}}
      />,
    )

    expect(await screen.findByTestId('session-progress')).toHaveTextContent('0/3')

    for (let step = 0; step < 3; step += 1) {
      await answerCurrent()

      // Javob to'g'ri bo'lsa "Davom etish", xato bo'lsa "Tushunarli"
      const next = await screen.findByRole('button', {
        name: /davom etish|tushunarli/i,
      })
      fireEvent.click(next)
    }

    // SM-2 jadvali FAQAT birinchi javobda yangilanadi. Aks holda bitta
    // darsdan keyin interval 1 → 6 → 15 kunga sakrardi — holbuki so'z
    // ikki daqiqada uch marta ko'rilgan, bu uzoq xotira dalili emas.
    expect(gradeCard).toHaveBeenCalledTimes(1)

    // XP esa har javob uchun beriladi — mashq ham mehnat
    expect(recordAnswer).toHaveBeenCalledTimes(3)
  })

  it('bosqich oshgani sayin mashq TURI o‘zgaradi', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    render(
      <SessionRunner
        cards={[CARDS[0]]}
        pool={CARDS}
        stagesFor={() => 3}
        onFinish={() => {}}
      />,
    )

    await screen.findByTestId('session-progress')

    const seen = new Set<string>()

    for (let step = 0; step < 3; step += 1) {
      // Variantli mashqda tugmalar, matnlida kiritish maydoni bo'ladi —
      // shakl o'zi turni ajratib beradi
      seen.add(screen.queryAllByRole('button', { pressed: false }).length > 0 ? 'tanlash' : 'yozish')

      await answerCurrent()
      fireEvent.click(
        await screen.findByRole('button', { name: /davom etish|tushunarli/i }),
      )
    }

    // Ilgari uchala savol ham bir xil edi: yangi so'zning `repetitions` i
    // 0 bo'lgani uchun zinapoyada faqat "tanib olish" ochiq edi
    expect(seen.size).toBeGreaterThan(1)
  })
})

describe('SessionRunner — kombo', () => {
  it('BIRINCHI to‘g‘ri javobdan keyin ko‘rinmaydi', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    render(<SessionRunner cards={[CARDS[0]]} pool={CARDS} onFinish={() => {}} />)

    await screen.findByTestId('session-progress')

    // "🔥 1" har javobdan keyin chiqib, shovqinga aylanardi
    expect(screen.queryByTestId('combo')).not.toBeInTheDocument()
  })
})

describe('SessionRunner — klaviatura', () => {
  it('yangi savolda fokus BODY da qolmaydi', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)

    render(<SessionRunner cards={[CARDS[0]]} pool={CARDS} onFinish={() => {}} />)

    await screen.findByTestId('session-progress')

    /*
     * Fokus <body> da qolsa, klaviatura foydalanuvchisi har savolda
     * sahifa boshidan qaytadan Tab bosishga majbur bo'lardi.
     */
    /*
     * Fokus <body> da qolsa, klaviatura foydalanuvchisi har savolda
     * sahifa boshidan qaytadan Tab bosishga majbur bo'lardi.
     *
     * Animatsiya BOSHQA elementga tegadi: bitta elementda bo'lganda GSAP
     * fokusni yo'qotardi (o'lchandi — ~50 ms dan keyin <body> ga qaytardi).
     */
    const stage = document.querySelector('[tabindex="-1"]')

    await waitFor(() => {
      expect(document.activeElement).toBe(stage)
    })

    // GSAP animatsiyasi ishga tushgandan keyin ham fokus joyida qoladi
    await new Promise((resolve) => setTimeout(resolve, 250))
    expect(document.activeElement).toBe(stage)
  })
})

describe('SessionRunner — yordam', () => {
  // Ko'rsatma "bu tur ko'rilgan" belgisini localStorage'da saqlaydi:
  // avvalgi testdan qolgan belgi keyingisini yopiq boshlatardi
  beforeEach(() => {
    localStorage.clear()
    // 0.1 → pog'onadan `recognition` tanlanadi (variantli mashq).
    // Juft topish o'z oqimida bo'lgani uchun "javob → davom" yo'li yo'q.
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
  })

  it('ko‘rsatma matni birinchi savoldan keyin YOPILADI — ekranni band qilmaydi', async () => {
    render(<SessionRunner cards={[CARDS[0]]} pool={CARDS} onFinish={() => {}} />)

    // Birinchi savolda ko'rsatma o'zi ochiq
    const body = await screen.findByText(/variantlardan tanlang/i)
    expect(body).toBeInTheDocument()

    // Qaysi variant to'g'ri ekani muhim emas — savol almashishi muhim
    fireEvent.click(screen.getAllByRole('button', { name: /^\S/ })[2]!)
    fireEvent.click(await screen.findByRole('button', { name: /davom etish|tushunarli/i }))

    await waitFor(() => {
      expect(screen.queryByText(/variantlardan tanlang/i)).not.toBeInTheDocument()
    })
  })

  it('mashq turi bo‘yicha yordam tugmasi ko‘rsatiladi', async () => {
    render(<SessionRunner cards={[CARDS[0]]} pool={CARDS} onFinish={() => {}} />)

    expect(await screen.findByRole('button', { name: /qanday bajariladi/i })).toBeInTheDocument()
  })
})

describe('SessionRunner — yangi so‘z bilan tanishtirish', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('hech takrorlanmagan so‘z avval KO‘RSATILADI, keyin so‘raladi', async () => {
    // Umumiy fikstura `totalReviews: 1` — bu yerda YANGI so'z kerak
    const fresh = { ...CARDS[0]!, totalReviews: 0, repetitions: 0 }

    render(<SessionRunner cards={[fresh]} pool={CARDS} onFinish={() => {}} />)

    // Tanishtirish: so'z va tarjimasi birga
    expect(await screen.findByText(/yangi so/i)).toBeInTheDocument()
    expect(screen.getByText(fresh.translation)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /tushundim/i }))

    // Endi mashq
    await waitFor(() => {
      expect(screen.queryByText(/yangi so/i)).not.toBeInTheDocument()
    })
  })

  it('allaqachon takrorlangan so‘z tanishtirilmaydi', async () => {
    const seen = { ...CARDS[0]!, totalReviews: 4, repetitions: 2 }

    render(<SessionRunner cards={[seen]} pool={CARDS} onFinish={() => {}} />)

    await waitFor(() => {
      expect(screen.getByTestId('session-progress')).toBeInTheDocument()
    })
    expect(screen.queryByText(/yangi so/i)).not.toBeInTheDocument()
  })

  it('ovozlar KECH yuklansa ham tanishtirish yopilib ketmaydi', async () => {
    /*
     * Haqiqiy xato: mashq yaratuvchi effekt `allowAudio` ga bog'liq va u
     * ovozlar ro'yxati kelgach false→true bo'ladi. Belgi effektda
     * qo'yilganda ikkinchi ishga tushish tanishtirishni darhol yopardi.
     */
    const fresh = { ...CARDS[0]!, totalReviews: 0, repetitions: 0 }

    render(<SessionRunner cards={[fresh]} pool={CARDS} onFinish={() => {}} />)
    expect(await screen.findByText(/yangi so/i)).toBeInTheDocument()

    // Ovozlar ro'yxati keldi
    window.speechSynthesis?.dispatchEvent(new Event('voiceschanged'))

    await waitFor(() => {
      expect(screen.getByText(/yangi so/i)).toBeInTheDocument()
    })
  })
})

describe('SessionRunner — progress ko‘rsatkichi', () => {
  it('XATO javob umumiy sonni OSHIRMAYDI — maqsad joyida qoladi', async () => {
    /*
     * O'lchangan xato: xato javob qadamni navbat oxiriga qaytarardi va
     * maxraj `queue.length` bo'lgani uchun ko'rsatkich 0/12 → 1/13 → 2/14
     * bo'lib o'sardi. Foydalanuvchi har xatoda maqsad undan uzoqlashganini
     * ko'rardi — bu jazolash hissini beradi va yolg'on javob.
     */
    // 0.1 → variantli mashq (juft topish o'z oqimida yuradi)
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    render(<SessionRunner cards={[CARDS[0]]} pool={CARDS} onFinish={() => {}} />)

    const total = (await screen.findByTestId('session-progress')).textContent?.split('/')[1]

    // Xato javob: to'g'ri javob ("suv") dan boshqa variant
    const options = await screen.findAllByRole('listitem')
    const wrong = options
      .map((item) => item.querySelector('button'))
      .find((node) => node && node.textContent?.trim().toLowerCase() !== 'suv')
    fireEvent.click(wrong!)
    fireEvent.click(await screen.findByRole('button', { name: /tushunarli|davom etish/i }))

    await waitFor(() => {
      expect(screen.getByTestId('session-progress').textContent?.split('/')[1]).toBe(total)
    })
  })

  it('xato javob berilgan qadam navbat OXIRIGA qaytariladi', async () => {
    // 0.1 → tanib olish mashqi; tur barqaror bo'lsin
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    render(<SessionRunner cards={[CARDS[0], CARDS[1]]} pool={CARDS} onFinish={() => {}} />)

    const first = (await screen.findByTestId('exercise-prompt')).textContent

    const wrongOption = screen
      .getAllByRole('listitem')
      .map((item) => item.querySelector('button'))
      .find((node) => node && node.textContent?.trim().toLowerCase() !== 'suv')
    fireEvent.click(wrongOption!)
    fireEvent.click(await screen.findByRole('button', { name: /tushunarli/i }))

    // Ikkinchi karta oralab o'tadi, so'ng xato karta QAYTADI
    await waitFor(() => {
      expect(screen.getByTestId('exercise-prompt').textContent).not.toBe(first)
    })

    const correct = screen
      .getAllByRole('listitem')
      .map((item) => item.querySelector('button'))
      .find((node) => node?.textContent?.trim().toLowerCase() === 'non')
    fireEvent.click(correct!)
    fireEvent.click(await screen.findByRole('button', { name: /davom etish|tushunarli/i }))

    await waitFor(() => {
      expect(screen.getByTestId('exercise-prompt').textContent).toBe(first)
    })
  })
})

describe('SessionRunner — o‘zlashtirish rejimi', () => {
  /** Variantli mashq chiqishi uchun tasodifni qotiramiz */
  function renderMastery(cards = [CARDS[0]]) {
    vi.spyOn(Math, 'random').mockReturnValue(0.1)

    return render(
      <SessionRunner cards={cards} pool={CARDS} mode="mastery" onFinish={() => {}} />,
    )
  }

  /**
   * Ko'rsatilgan mashqqa javob beradi — TURIGA BOG'LIQ EMAS.
   *
   * O'zlashtirish rejimida so'z har safar boshqa turdagi mashqda
   * qaytadi (qoida shuni talab qiladi), shuning uchun test aniq turga
   * tayanmasligi kerak.
   */
  async function answerAnything(kind: 'correct' | 'wrong') {
    await answerOnly(kind)

    const next = await screen.findByRole('button', { name: /davom etish|tushunarli/i })
    fireEvent.click(next)
  }

  /** Javob beradi, lekin "Davom etish"ni BOSMAYDI — feedback tekshiriladi */
  async function answerOnly(kind: 'correct' | 'wrong') {
    const options = screen
      .queryAllByRole('listitem')
      .map((item) => item.querySelector('button'))
      .filter((node): node is HTMLButtonElement => node !== null)

    if (options.length > 0) {
      const correctOption = options.find((node) =>
        CARDS.some((card) => card.translation === node.textContent?.trim()
          && card.word === screen.queryByTestId('exercise-prompt')?.textContent?.trim()),
      )
      const target =
        kind === 'correct' ? (correctOption ?? options[0]) : options.find((n) => n !== correctOption)
      fireEvent.click(target!)
    } else {
      // Yozma mashq: to'g'ri javobni bilamiz, xato uchun aniq noto'g'ri matn
      const input = screen.getByLabelText(/javob/i)
      // Yozma mashqda savol — TARJIMA, javob — so'zning o'zi
      const prompt = screen.queryByTestId('exercise-prompt')?.textContent?.trim()
      const want = CARDS.find((card) => card.translation === prompt)?.word ?? 'water'
      fireEvent.change(input, { target: { value: kind === 'correct' ? want : 'zzzz' } })
      fireEvent.click(screen.getByRole('button', { name: /tekshirish/i }))
    }

    await screen.findByRole('button', { name: /davom etish|tushunarli/i })
  }

  /** Seans davom etyaptimi (tugaganda butun ko'rinish yo'qoladi) */
  const stillRunning = () => screen.queryByTestId('session-progress') !== null

  it('ko‘rsatkich SO‘ZLARNI sanaydi, qadamlarni emas', async () => {
    renderMastery()

    expect(await screen.findByTestId('session-progress')).toHaveTextContent('0/1')
  })

  it('qolgan vaqt taxmini ko‘rsatiladi — "yana qancha?" savoliga javob', async () => {
    renderMastery([CARDS[0], CARDS[1], CARDS[2], CARDS[3]])

    // 4 so'z × 2 javob × 15 s ≈ 2 daqiqa
    expect(await screen.findByTestId('session-eta')).toHaveTextContent('≈2 daq')
  })

  it('xato javobdan keyin so‘z QAYTADI va ko‘rsatkich o‘smaydi', async () => {
    renderMastery()
    await screen.findByTestId('session-progress')

    await answerAnything('wrong')

    await waitFor(() => {
      expect(stillRunning()).toBe(true)
    })
    expect(screen.getByTestId('session-progress')).toHaveTextContent('0/1')
  })

  it('haftaning SEHRLI so‘zi to‘g‘ri topilganda kutilmagan bayram va +XP', async () => {
    renderMastery()
    await screen.findByTestId('session-progress')

    await answerOnly('correct')

    expect(screen.getByTestId('secret-word')).toHaveTextContent(/sehrli so‘z/i)
    // Bonus javob XP siga qo'shilib ko'rsatiladi (5 + 30)
    expect(screen.getByTestId('xp-gained')).toHaveTextContent('+35 XP')
  })

  it('so‘z O‘ZLASHTIRILGAN lahzada alohida nishon chiqadi', async () => {
    /*
     * Darsdagi eng katta yutuq — so'z ikki xil mashqda bilindi. Uni
     * ko'rinmas qoldirish eng katta mukofotni yashirish bo'lardi.
     */
    renderMastery()
    await screen.findByTestId('session-progress')

    await answerOnly('correct')
    // Birinchi to'g'ri javob — hali yodlanmadi
    expect(screen.queryByTestId('mastered-ribbon')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /davom etish|tushunarli/i }))

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /davom etish|tushunarli/i })).toBeNull()
    })
    await answerOnly('correct')

    expect(screen.getByTestId('mastered-ribbon')).toBeInTheDocument()
  })

  it('uchinchi ketma-ket to‘g‘ri javobda kombo pog‘onasi nishonlanadi', async () => {
    renderMastery([CARDS[0], CARDS[1]])
    await screen.findByTestId('session-progress')

    for (let i = 0; i < 2; i += 1) {
      await answerOnly('correct')
      expect(screen.queryByTestId('combo-milestone')).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: /davom etish|tushunarli/i }))
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /davom etish|tushunarli/i })).toBeNull()
      })
    }
    await answerOnly('correct')

    expect(screen.getByTestId('combo-milestone')).toHaveTextContent(/×3/)
  })

  it('BIR marta to‘g‘ri javob so‘zni o‘zlashtirilgan qilmaydi', async () => {
    /*
     * To'rt variantdan bittasini ko'r-ko'rona bosish 25% ehtimol bilan
     * to'g'ri chiqadi — qoida ikki XIL turdagi mashqni talab qiladi.
     */
    renderMastery()
    await screen.findByTestId('session-progress')

    await answerAnything('correct')

    await waitFor(() => {
      expect(stillRunning()).toBe(true)
    })
    expect(screen.getByTestId('session-progress')).toHaveTextContent('0/1')
  })
})

describe('SessionRunner — o‘zlashtirish xaritasi chegarasi', () => {
  it('seansdan TASHQARIDAGI karta ko‘rsatkichni buzmaydi', async () => {
    /*
     * Juft topish mashqi juftlarni butun POOL dan oladi. O'lchangan
     * xato: begona kartalar o'zlashtirish xaritasiga tushib, keyingi
     * qadam o'shalarga tanlanardi va seans so'zlar o'zlashtirilmagan
     * holda jimgina tugab qolardi (4 ta so'zdan 3 tasi).
     */
    vi.spyOn(Math, 'random').mockReturnValue(0.1)

    render(<SessionRunner cards={[CARDS[0]]} pool={CARDS} mode="mastery" onFinish={() => {}} />)

    // Maxraj — seansning O'Z so'zlari soni, pool emas
    expect(await screen.findByTestId('session-progress')).toHaveTextContent('0/1')
    expect(CARDS.length).toBeGreaterThan(1)
  })
})

describe('SessionRunner — omadli karta', () => {
  it('omadli karta javobdan OLDIN e‘lon qilinadi', async () => {
    /*
     * Dofaminning asosiy manbai mukofotning o'zi emas, uni KUTISH.
     * Javobdan keyin ko'rsatilsa, bu shunchaki bonus bo'lardi.
     */
    vi.spyOn(Math, 'random').mockReturnValue(0.01)

    render(<SessionRunner cards={[CARDS[0]]} pool={CARDS} onFinish={() => {}} />)

    expect(await screen.findByTestId('lucky-badge')).toBeInTheDocument()
  })

  it('oddiy savolda nishon YO‘Q', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    render(<SessionRunner cards={[CARDS[0]]} pool={CARDS} onFinish={() => {}} />)

    await screen.findByTestId('session-progress')
    expect(screen.queryByTestId('lucky-badge')).not.toBeInTheDocument()
  })
})

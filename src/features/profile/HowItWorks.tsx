import { useState } from 'react'
import { Panel } from '@/components/ui/Panel'
import { cn } from '@/lib/cn'

/** Har atama — bitta qisqa, bola tushunadigan gap */
const TOPICS: Array<{ icon: string; title: string; text: string }> = [
  {
    icon: '🔥',
    title: 'Streak',
    text: 'Har kuni kamida bitta javob bersang, ketma-ketlik o‘sadi. Bir kun o‘tkazib yuborsang — muzlatish qutqaradi.',
  },
  {
    icon: '🧊',
    title: 'Muzlatish',
    text: 'Bir kun mashq qilmasang, muzlatish streakni saqlab qoladi. Har 7 kunlik streak uchun bittasi beriladi (ko‘pi bilan 2).',
  },
  {
    icon: '⭐',
    title: 'XP va daraja',
    text: 'To‘g‘ri javob 10 XP, deyarli to‘g‘ri 7, xato ham 2 — xato uchun jazo yo‘q. XP yig‘ilib daraja oshadi.',
  },
  {
    icon: '🔁',
    title: 'Takrorlash',
    text: 'Ilova har so‘zni unutish arafasida qaytaradi: yaxshi bilsang — kechroq, qiynalsang — tezroq. Shuning uchun so‘z uzoq esda qoladi.',
  },
  {
    icon: '🎯',
    title: 'Kombo',
    text: 'Ketma-ket to‘g‘ri javoblar. 3, 5, 10 da bayram va bonus XP. Xato komboni to‘xtatadi, lekin hech nima olib qo‘ymaydi.',
  },
  {
    icon: '🎁',
    title: 'Sirli sandiq',
    text: 'Dars oxirida (kamida 5 javob) sandiq chiqadi. Ichida XP, muzlatish yoki iliq so‘z — har safar har xil.',
  },
  {
    icon: '🗺️',
    title: 'Haftalik sayohat',
    text: 'Haftada 3, 5 va 7 kun mashq qilsang — sandiqlar ochiladi. Dushanbada xarita yangilanadi.',
  },
  {
    icon: '🐣',
    title: 'Yo‘ldosh',
    text: 'So‘zlar bilan o‘sadigan do‘sting: 4 so‘zda tuxumdan chiqadi, 20 da polapon, 50 da qush… 500 so‘zda ajdar. Har o‘rgangan so‘z — unga don.',
  },
  {
    icon: '🔮',
    title: 'Kunning so‘zi',
    text: 'Har kuni bitta yangi so‘z — ma‘nosi yopiq. Ochib ko‘r, keyin darsda uchraganda “buni bilaman!” deysan.',
  },
  {
    icon: '🌌',
    title: 'So‘z osmoni',
    text: 'Har o‘rgangan so‘zing — yulduz. Takrorlash vaqti kelgan so‘z xiralashadi; takrorlasang yana yonadi.',
  },
]

/**
 * "Qanday ishlaydi?" — NN/g #10 (yordam va hujjatlar).
 *
 * Mashq ichida kontekstli yordam bor, lekin streak, muzlatish, sandiq
 * kabi atamalarni tushuntiradigan joy yo'q edi — ota-ona "Muzlatish
 * (max 2)" ni tushunmasdi. Yopiq accordion: profilni band qilmaydi.
 */
export function HowItWorks() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section aria-labelledby="how-title" className="flex flex-col gap-2">
      <h2 id="how-title" className="font-bold">
        Qanday ishlaydi?
      </h2>
      <Panel padding="sm">
        <ul className="flex flex-col">
          {TOPICS.map((topic, index) => {
            const isOpen = open === index
            return (
              <li key={topic.title} className="border-b border-ink-300/40 last:border-b-0">
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : index)}
                  className="tap-highlight-none flex w-full items-center gap-3 px-2 py-3 text-start"
                >
                  <span aria-hidden="true" className="text-xl">
                    {topic.icon}
                  </span>
                  <span className="flex-1 font-semibold">{topic.title}</span>
                  <span
                    aria-hidden="true"
                    className={cn('text-ink-600 transition-transform', isOpen && 'rotate-180')}
                  >
                    ⌄
                  </span>
                </button>
                {isOpen && (
                  <p data-testid="how-text" className="px-2 pb-3 ps-11 text-sm text-ink-600">
                    {topic.text}
                  </p>
                )}
              </li>
            )
          })}
        </ul>
      </Panel>
    </section>
  )
}

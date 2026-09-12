import { useEffect, useRef, useState } from 'react'
import { Emblem } from '@/components/ui/Emblem'
import { Panel } from '@/components/ui/Panel'
import { applyChestReward, db } from '@/core/db'
import { MAX_STREAK_FREEZES, rollChest, type ChestReward } from '@/core/gamification'
import { particleBurst, withMotion } from '@/lib/motion'
import { playChestSound } from '@/lib/sound'
import { haptic } from '@/lib/haptics'
import { useSettingsStore } from '@/stores/useSettingsStore'

/**
 * SIRLI SANDIQ — seans yakunidagi o'zgaruvchan mukofot.
 *
 * UCH BOSQICH, har biri dofaminning boshqa manbai:
 *  1. YOPIQ — sandiq qimirlaydi. Bola nima ekanini bilmaydi: kutish.
 *  2. BOSISH — mukofot foydalanuvchining O'Z harakati bilan keladi,
 *     o'zi tushmaydi. Harakat → natija bog'i (agentlik hissi).
 *  3. OCHIQ — natija, zarrachalar, ohang. Mukofot BAZAGA yozilgandan
 *     KEYIN ko'rsatiladi: ekrandagi har raqam haqiqiy.
 *
 * Sandiq seansda bir marta. Mukofot ochilish PAYTIDA tashlanadi —
 * oldindan emas, aks holda uni ko'rsatmasdan "yo'qotish" mumkin edi.
 */
export function SessionChest() {
  const soundEnabled = useSettingsStore((s) => s.soundEnabled)
  const [reward, setReward] = useState<ChestReward | null>(null)
  const [isOpening, setIsOpening] = useState(false)
  const boxRef = useRef<HTMLDivElement>(null)

  const handleOpen = async () => {
    if (isOpening || reward) return
    setIsOpening(true)

    try {
      const profile = await db.profile.get('me')
      const canFreeze = (profile?.freezesAvailable ?? 0) < MAX_STREAK_FREEZES
      const rolled = rollChest(canFreeze)

      // Avval yoziladi, keyin ko'rsatiladi
      await applyChestReward(rolled)
      setReward(rolled)
      if (soundEnabled) playChestSound()
      haptic('celebrate')
    } catch (error) {
      console.error('Sandiq mukofotini yozib bo‘lmadi:', error)
      // Yozilmagan mukofotni ko'rsatish yolg'on bo'lardi — sandiq yopiq qoladi
      setIsOpening(false)
    }
  }

  // Ochilganda zarrachalar — sandiqdan otiladi
  useEffect(() => {
    if (!reward) return

    let cancelled = false
    let revert = () => {}

    void withMotion(
      boxRef.current,
      (gsap) => {
        particleBurst(gsap, '[data-spark]')
      },
      ['physics2D'],
    ).then((fn) => {
      if (cancelled) fn()
      else revert = fn
    })

    return () => {
      cancelled = true
      revert()
    }
  }, [reward])

  return (
    <Panel tone="brand" className="relative overflow-hidden text-center">
      <div ref={boxRef}>
        {reward === null ? (
          <button
            type="button"
            data-testid="chest-closed"
            onClick={() => void handleOpen()}
            disabled={isOpening}
            className="tap-highlight-none flex w-full flex-col items-center gap-1 py-1"
          >
            <span aria-hidden="true" className="chest-wobble inline-block text-6xl">
              🎁
            </span>
            <span className="font-extrabold">Mystery box</span>
            <span className="text-sm text-ink-600">
              {isOpening ? 'Ochilmoqda…' : 'Ochish uchun bos'}
            </span>
          </button>
        ) : (
          <div data-testid="chest-open" role="status" className="mastered-pop relative py-1">
            {/* Zarrachalar — mukofot atrofida */}
            <span aria-hidden="true" className="pointer-events-none absolute inset-0">
              {Array.from({ length: 14 }, (_, i) => (
                <span
                  key={i}
                  data-spark
                  className="absolute left-1/2 top-1/2 h-2 w-2 rounded-full bg-flame-500"
                />
              ))}
            </span>
            <RewardView reward={reward} />
          </div>
        )}
      </div>
    </Panel>
  )
}

function RewardView({ reward }: { reward: ChestReward }) {
  switch (reward.kind) {
    case 'xp':
      return (
        <>
          <Emblem kind="coin" size="lg" className="mx-auto mb-1" />
          <p className="text-xl font-extrabold text-brand-700">+{reward.amount} XP</p>
          <p className="text-sm text-ink-600">
            {reward.amount >= 50 ? 'JACKPOT! Katta yutuq!' : 'Bonus XP — hisobga qo‘shildi'}
          </p>
        </>
      )
    case 'freeze':
      return (
        <>
          <span aria-hidden="true" className="block text-5xl">
            🧊
          </span>
          <p className="mt-1 text-xl font-extrabold text-sky-700">+1 Streak freeze</p>
          <p className="text-sm text-ink-600">Bir kun o‘tkazib yuborsang ham ketma-ketlik saqlanadi</p>
        </>
      )
    case 'praise':
      return (
        <>
          <span aria-hidden="true" className="block text-5xl">
            💬
          </span>
          <p className="mt-1 text-base font-extrabold text-brand-700">{reward.text}</p>
        </>
      )
  }
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PATHS } from '@/app/paths'
import type { LevelCode } from '@/core/types'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { GoalStep } from './steps/GoalStep'
import { LanguageStep } from './steps/LanguageStep'
import { PlacementStep } from './steps/PlacementStep'
import { ReadyStep } from './steps/ReadyStep'

type Step = 'language' | 'placement' | 'goal' | 'ready'

/**
 * Onboarding (TZ 6.1): til tanlash → daraja testi → kunlik maqsad →
 * birinchi dars.
 *
 * Qadamlar BITTA marshrut ichida: har qadamga alohida URL berilsa, har
 * biriga "oldingi qadam bajarilganmi" tekshiruvi kerak bo'lardi. Bu bir
 * martalik oqim uchun ortiqcha murakkablik — qadamlarga havola berilmaydi.
 */
export function OnboardingScreen() {
  const navigate = useNavigate()
  const learningLanguage = useSettingsStore((s) => s.learningLanguage)
  const setStartingLevel = useSettingsStore((s) => s.setStartingLevel)
  const completeOnboarding = useSettingsStore((s) => s.completeOnboarding)

  const [step, setStep] = useState<Step>('language')

  function handlePlacementDone(level: LevelCode) {
    setStartingLevel(level)
    setStep('goal')
  }

  function handleFinish(destination: 'lesson' | 'home') {
    completeOnboarding()
    navigate(destination === 'lesson' ? PATHS.lesson : PATHS.home, { replace: true })
  }

  return (
    <div className="flex flex-1 flex-col px-5 py-8">
      {step === 'language' && <LanguageStep onNext={() => setStep('placement')} />}

      {step === 'placement' && learningLanguage && (
        <PlacementStep language={learningLanguage} onDone={handlePlacementDone} />
      )}

      {step === 'goal' && (
        <GoalStep onNext={() => setStep('ready')} onBack={() => setStep('placement')} />
      )}

      {step === 'ready' && <ReadyStep onFinish={handleFinish} />}
    </div>
  )
}

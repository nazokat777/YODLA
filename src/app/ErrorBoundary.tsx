import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'

/**
 * Kutilmagan xatolikni ushlaydigan chegara.
 *
 * NEGA KERAK: React'da render paytidagi xatolik BUTUN daraxtni yechib
 * tashlaydi — foydalanuvchi oq ekran ko'radi, hech qanday xabar yo'q va
 * chiqish yo'li ham yo'q. Bola telefonida bu "ilova buzildi" degani.
 *
 * Eng ehtimolli sabab — deploy'dan keyin brauzerda qolgan ESKI bo'lak:
 * yangi kod eski chunk'ni so'raydi, u endi mavjud emas, dangasa import
 * yiqiladi. Oddiy qayta yuklash buni tuzatadi, shuning uchun tugma shu.
 *
 * MA'LUMOT YO'QOLMAYDI: progress IndexedDB'da, bu yerda hech nima
 * o'chirilmaydi.
 */
interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Ilovada kutilmagan xatolik:', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div
        role="alert"
        className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center"
      >
        <p className="text-5xl" aria-hidden="true">
          🛠️
        </p>
        <h1 className="text-xl font-bold">Nimadir noto‘g‘ri ketdi</h1>
        <p className="max-w-xs text-sm text-ink-600">
          Sahifani qayta yuklang — odatda shu yetarli. Muvaffaqiyatlaringiz
          saqlanib qoladi.
        </p>
        <Button onClick={() => window.location.reload()}>Qayta yuklash</Button>
      </div>
    )
  }
}

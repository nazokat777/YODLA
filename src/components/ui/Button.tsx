import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { buttonStyles, type ButtonSize, type ButtonVariant } from './buttonStyles'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Butun kenglikni egallasinmi (mobil ekranlarda asosiy tugma uchun) */
  block?: boolean
  children: ReactNode
}

/**
 * Ilovaning asosiy tugmasi.
 * Duolingo uslubidagi "qalin" tugma: pastdagi soya bosilganda yo'qoladi.
 */
export function Button({
  variant,
  size,
  block,
  className,
  type = 'button',
  ...rest
}: ButtonProps) {
  return <button type={type} className={buttonStyles({ variant, size, block, className })} {...rest} />
}

import type { ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { buttonStyles, type ButtonSize, type ButtonVariant } from './buttonStyles'

interface LinkButtonProps extends Omit<LinkProps, 'className'> {
  variant?: ButtonVariant
  size?: ButtonSize
  block?: boolean
  className?: string
  children: ReactNode
}

/**
 * Tugma ko'rinishidagi navigatsiya havolasi.
 *
 * Nega alohida komponent: <Link> ichiga <button> joylash noto'g'ri
 * (ichma-ich interaktiv elementlar ekran o'quvchilarni chalg'itadi).
 * Shuning uchun uslub bir xil, semantika esa to'g'ri — havola havolaligicha.
 */
export function LinkButton({
  variant,
  size,
  block,
  className,
  ...rest
}: LinkButtonProps) {
  return <Link className={buttonStyles({ variant, size, block, className })} {...rest} />
}

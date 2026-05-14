import { clsx } from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'cyan' | 'green' | 'orange' | 'purple' | 'red' | 'ghost'
  children: ReactNode
}

export function Button({
  variant = 'primary',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'brutal-button inline-flex min-h-11 items-center justify-center gap-2 px-4 py-2 font-display text-xl uppercase leading-none disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-quantum-yellow text-black shadow-[4px_4px_0_#000]',
        variant === 'cyan' && 'bg-quantum-cyan text-black shadow-[4px_4px_0_#FFD84A]',
        variant === 'green' && 'bg-quantum-green text-black shadow-[4px_4px_0_#B884FF]',
        variant === 'orange' && 'bg-quantum-orange text-black shadow-[4px_4px_0_#32D9FF]',
        variant === 'purple' && 'bg-quantum-purple text-black shadow-[4px_4px_0_#FFD166]',
        variant === 'red' && 'bg-quantum-red text-white shadow-[4px_4px_0_#FFD84A]',
        variant === 'ghost' && 'bg-black text-white shadow-[4px_4px_0_#FFD84A]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

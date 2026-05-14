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
        'brutal-button inline-flex min-h-10 items-center justify-center gap-2 px-3 py-2 font-display text-base uppercase leading-none text-quantum-ink disabled:cursor-not-allowed disabled:opacity-50 md:text-lg',
        variant === 'primary' && 'bg-quantum-yellow',
        variant === 'cyan' && 'bg-quantum-cyan',
        variant === 'green' && 'bg-quantum-green',
        variant === 'orange' && 'bg-quantum-orange',
        variant === 'purple' && 'bg-quantum-purple',
        variant === 'red' && 'bg-quantum-red',
        variant === 'ghost' && 'bg-white',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

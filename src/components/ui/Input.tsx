import { clsx } from 'clsx'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
}

export function Input({ label, hint, className, ...props }: InputProps) {
  return (
    <label className="block">
      {label ? (
        <span className="mb-1.5 block font-display text-sm uppercase leading-none text-quantum-ink md:text-base">
          {label}
        </span>
      ) : null}
      <input
        className={clsx(
          'input-quantum w-full px-3 py-3 font-mono text-sm',
          className
        )}
        {...props}
      />
      {hint ? (
        <span className="mt-2 block font-mono text-[11px] uppercase text-quantum-ink/55">
          {hint}
        </span>
      ) : null}
    </label>
  )
}

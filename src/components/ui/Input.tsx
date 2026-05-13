import { clsx } from 'clsx'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
}

export function Input({ label, hint, className, ...props }: InputProps) {
  return (
    <label className="block">
      <span className="mb-2 block font-display text-xl uppercase leading-none text-white">
        {label}
      </span>
      <input
        className={clsx(
          'input-quantum w-full px-3 py-3 font-mono text-sm',
          className
        )}
        {...props}
      />
      {hint ? (
        <span className="mt-2 block font-mono text-[11px] uppercase text-white/55">
          {hint}
        </span>
      ) : null}
    </label>
  )
}

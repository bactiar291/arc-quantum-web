import { clsx } from 'clsx'
import type { HTMLAttributes, ReactNode } from 'react'

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  shadow?: 'yellow' | 'cyan' | 'red'
}

export function Panel({
  children,
  className,
  shadow = 'yellow',
  ...props
}: PanelProps) {
  return (
    <div
      className={clsx(
        'panel relative overflow-hidden bg-quantum-panel p-4 md:p-5',
        shadow === 'yellow' && 'shadow-brutal',
        shadow === 'cyan' && 'shadow-brutalCyan',
        shadow === 'red' && 'shadow-brutalRed',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

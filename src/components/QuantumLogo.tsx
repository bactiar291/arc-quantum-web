import { clsx } from 'clsx'
import type { CSSProperties } from 'react'

interface QuantumLogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function QuantumLogo({ size = 'md', className }: QuantumLogoProps) {
  const style = {
    '--logo-size': size === 'lg' ? '128px' : size === 'sm' ? '44px' : '58px'
  } as CSSProperties

  return (
    <div
      className={clsx('grid place-items-center', className)}
      style={{ perspective: '700px' }}
    >
      <div className="quantum-logo-3d" style={style} aria-label="Arc Quantum logo">
        <span>AQ</span>
        <span />
        <span />
      </div>
    </div>
  )
}
